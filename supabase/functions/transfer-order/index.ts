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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Xác thực người dùng đã đăng nhập
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized: Yêu cầu đăng nhập.' }, 401);
    }

    // 2. Lấy dữ liệu từ yêu cầu
    const { order_id, new_location_id } = await req.json();
    if (!order_id || !new_location_id) {
      return jsonResponse({ error: 'Thiếu order_id hoặc new_location_id.' }, 400);
    }

    // 3. Sử dụng service role key để cập nhật đơn hàng, bỏ qua RLS
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await adminSupabaseClient
      .from('orders')
      .update({ pickup_location_id: new_location_id })
      .eq('id', order_id)
      .select()
      .single();

    if (error) throw error;

    return jsonResponse({ message: 'Đơn hàng đã được chuyển thành công.', data });

  } catch (error) {
    console.error('Lỗi trong function transfer-order:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
})