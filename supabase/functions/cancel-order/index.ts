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
    const { order_id, anonymous_device_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Thiếu mã đơn hàng (order_id).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Tạo một client với quyền admin để truy vấn dữ liệu
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Lấy thông tin đơn hàng
    const { data: order, error: fetchError } = await adminSupabaseClient
      .from('orders')
      .select('user_id, anonymous_device_id, status')
      .eq('id', order_id)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ error: 'Không tìm thấy đơn hàng.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Kiểm tra trạng thái đơn hàng
    if (order.status !== 'Đang xử lý') {
      return new Response(JSON.stringify({ error: 'Đơn hàng không thể hủy vì đã được xử lý.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Xác thực người dùng
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await userSupabaseClient.auth.getUser();

    let isOwner = false;
    if (user) {
      // Người dùng đã đăng nhập
      if (order.user_id === user.id) {
        isOwner = true;
      }
    } else if (anonymous_device_id) {
      // Khách vãng lai
      if (order.anonymous_device_id === anonymous_device_id) {
        isOwner = true;
      }
    }

    if (!isOwner) {
      return new Response(JSON.stringify({ error: 'Bạn không có quyền hủy đơn hàng này.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Nếu tất cả kiểm tra đều qua, thực hiện cập nhật
    const { error: updateError } = await adminSupabaseClient
      .from('orders')
      .update({ status: 'Đã hủy' })
      .eq('id', order_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ message: 'Đơn hàng đã được hủy thành công.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Lỗi trong Edge Function cancel-order:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})