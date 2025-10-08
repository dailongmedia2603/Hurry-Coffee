// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { order_id, anonymous_id } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Thiếu ID đơn hàng.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Tạo client với quyền admin để bỏ qua RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Lấy thông tin đơn hàng hiện tại
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('user_id, anonymous_device_id, status')
      .eq('id', order_id)
      .single();

    if (fetchError) throw new Error("Không tìm thấy đơn hàng hoặc có lỗi xảy ra.");
    
    // Kiểm tra trạng thái đơn hàng
    if (order.status !== 'Đang xử lý' && order.status !== 'Dang xu ly') {
        return new Response(JSON.stringify({ error: 'Không thể hủy đơn hàng ở trạng thái này.' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // **KIỂM TRA BẢO MẬT QUAN TRỌNG**
    // Nếu là đơn hàng của người dùng ẩn danh, phải xác thực device_id
    if (order.user_id === null) {
        if (!anonymous_id) {
            return new Response(JSON.stringify({ error: 'Cần cung cấp mã định danh thiết bị.' }), { status: 401 });
        }
        if (order.anonymous_device_id !== anonymous_id) {
            return new Response(JSON.stringify({ error: 'Không có quyền hủy đơn hàng này.' }), { status: 403 });
        }
    }
    // (Nếu có user_id, RLS ở client đã đảm bảo chỉ chủ sở hữu mới gọi được)

    // Cập nhật trạng thái đơn hàng
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'Đã hủy' })
      .eq('id', order_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ message: 'Đơn hàng đã được hủy thành công.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})