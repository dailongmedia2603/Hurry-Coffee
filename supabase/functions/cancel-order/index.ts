// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hàm trả về phản hồi JSON chuẩn
function jsonResponse(data: object, status: number = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

serve(async (req) => {
  console.log("[cancel-order] Function invoked.");
  // Xử lý CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log("[cancel-order] Handling OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[cancel-order] Processing POST request.");
    // 1. Lấy dữ liệu từ yêu cầu của client
    const { order_id, anonymous_device_id } = await req.json();
    console.log(`[cancel-order] Received order_id: ${order_id}, anonymous_device_id: ${anonymous_device_id}`);
    if (!order_id) {
      console.error("[cancel-order] Missing order_id.");
      return jsonResponse({ error: 'Thiếu mã đơn hàng (order_id).' }, 400);
    }

    // 2. Tạo Supabase client với quyền admin để bỏ qua RLS và kiểm tra
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Lấy thông tin đơn hàng từ database
    console.log(`[cancel-order] Fetching order details for ID: ${order_id}`);
    const { data: order, error: fetchError } = await adminSupabaseClient
      .from('orders')
      .select('user_id, anonymous_device_id, status')
      .eq('id', order_id)
      .single();

    if (fetchError || !order) {
      console.error(`[cancel-order] Order not found or fetch error for ID: ${order_id}`, fetchError);
      return jsonResponse({ error: 'Không tìm thấy đơn hàng.' }, 404);
    }
    console.log(`[cancel-order] Order found. Status: ${order.status}`);

    // 4. Kiểm tra điều kiện: Chỉ cho phép hủy khi trạng thái là "Đang xử lý"
    if (order.status !== 'Đang xử lý') {
      console.warn(`[cancel-order] Attempt to cancel order with status "${order.status}". Denied.`);
      return jsonResponse({ error: `Không thể hủy đơn hàng ở trạng thái "${order.status}".` }, 400);
    }

    // 5. Xác thực quyền sở hữu (Bước bảo mật quan trọng nhất)
    console.log("[cancel-order] Verifying ownership...");
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await userSupabaseClient.auth.getUser();

    let isOwner = false;
    if (user) {
      console.log(`[cancel-order] Authenticated user ID: ${user.id}. Order owner ID: ${order.user_id}`);
      // Người dùng đã đăng nhập: so sánh user_id
      if (user.id === order.user_id) {
        isOwner = true;
      }
    } else if (anonymous_device_id) {
      console.log(`[cancel-order] Anonymous user device ID: ${anonymous_device_id}. Order anonymous ID: ${order.anonymous_device_id}`);
      // Khách vãng lai: so sánh anonymous_device_id
      if (anonymous_device_id === order.anonymous_device_id) {
        isOwner = true;
      }
    }

    if (!isOwner) {
      console.error("[cancel-order] Ownership verification failed. Access denied.");
      return jsonResponse({ error: 'Bạn không có quyền hủy đơn hàng này.' }, 403);
    }
    console.log("[cancel-order] Ownership verified.");

    // 6. Nếu tất cả kiểm tra đều hợp lệ, cập nhật trạng thái đơn hàng
    console.log(`[cancel-order] Updating order ${order_id} status to "Đã hủy".`);
    const { error: updateError } = await adminSupabaseClient
      .from('orders')
      .update({ status: 'Đã hủy' })
      .eq('id', order_id);

    if (updateError) {
      throw updateError;
    }

    // 7. Trả về thành công
    console.log(`[cancel-order] Order ${order_id} cancelled successfully.`);
    return jsonResponse({ message: 'Đơn hàng đã được hủy thành công.' });

  } catch (error) {
    console.error('Lỗi trong function cancel-order:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
})