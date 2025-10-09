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
  // Xử lý CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Lấy dữ liệu từ yêu cầu của client
    const { order_id, anonymous_device_id } = await req.json();
    if (!order_id) {
      return jsonResponse({ error: 'Thiếu mã đơn hàng (order_id).' }, 400);
    }

    // 2. Tạo Supabase client với quyền admin để bỏ qua RLS và kiểm tra
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Lấy thông tin đơn hàng từ database
    const { data: order, error: fetchError } = await adminSupabaseClient
      .from('orders')
      .select('user_id, anonymous_device_id, status')
      .eq('id', order_id)
      .single();

    if (fetchError || !order) {
      return jsonResponse({ error: 'Không tìm thấy đơn hàng.' }, 404);
    }

    // 4. Kiểm tra điều kiện: Chỉ cho phép hủy khi trạng thái là "Đang xử lý"
    if (order.status !== 'Đang xử lý') {
      return jsonResponse({ error: `Không thể hủy đơn hàng ở trạng thái "${order.status}".` }, 400);
    }

    // 5. Xác thực quyền sở hữu (Bước bảo mật quan trọng nhất)
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await userSupabaseClient.auth.getUser();

    let isOwner = false;
    if (user) {
      // Người dùng đã đăng nhập: so sánh user_id
      if (user.id === order.user_id) {
        isOwner = true;
      }
    } else if (anonymous_device_id) {
      // Khách vãng lai: so sánh anonymous_device_id
      if (anonymous_device_id === order.anonymous_device_id) {
        isOwner = true;
      }
    }

    if (!isOwner) {
      return jsonResponse({ error: 'Bạn không có quyền hủy đơn hàng này.' }, 403);
    }

    // 6. Nếu tất cả kiểm tra đều hợp lệ, cập nhật trạng thái đơn hàng
    const { error: updateError } = await adminSupabaseClient
      .from('orders')
      .update({ status: 'Đã hủy' })
      .eq('id', order_id);

    if (updateError) {
      throw updateError;
    }

    // 7. Trả về thành công
    return jsonResponse({ message: 'Đơn hàng đã được hủy thành công.' });

  } catch (error) {
    console.error('Lỗi trong function cancel-order:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
})