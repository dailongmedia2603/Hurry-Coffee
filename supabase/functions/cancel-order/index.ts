// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to create a JSON response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  console.log(`[cancel-order] --- Invoked at ${new Date().toISOString()} ---`);
  console.log(`[cancel-order] Request Method: ${req.method}`);

  if (req.method === 'OPTIONS') {
    console.log("[cancel-order] Handling OPTIONS request.");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, anonymous_device_id } = await req.json();
    console.log(`[cancel-order] Parsed body: order_id=${order_id}, anonymous_device_id=${anonymous_device_id}`);

    if (!order_id) {
      console.error("[cancel-order] Error: order_id is missing.");
      return jsonResponse({ error: 'Thiếu mã đơn hàng (order_id).' }, 400);
    }

    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log("[cancel-order] Admin Supabase client created.");

    console.log(`[cancel-order] Fetching order details for ID: ${order_id}`);
    const { data: order, error: fetchError } = await adminSupabaseClient
      .from('orders')
      .select('user_id, anonymous_device_id, status')
      .eq('id', order_id)
      .single();

    if (fetchError) {
      console.error(`[cancel-order] Error fetching order:`, fetchError);
      return jsonResponse({ error: 'Không tìm thấy đơn hàng.' }, 404);
    }
    console.log("[cancel-order] Order fetched successfully:", order);

    if (order.status !== 'Đang xử lý') {
      console.warn(`[cancel-order] Attempt to cancel order with status: ${order.status}`);
      return jsonResponse({ error: 'Đơn hàng không thể hủy vì đã được xử lý.' }, 400);
    }
    console.log("[cancel-order] Order status check passed.");

    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await userSupabaseClient.auth.getUser();
    console.log(`[cancel-order] Authenticating user. User ID: ${user?.id}`);

    let isOwner = false;
    if (user) {
      if (order.user_id === user.id) {
        isOwner = true;
        console.log("[cancel-order] Ownership confirmed for authenticated user.");
      }
    } else if (anonymous_device_id) {
      if (order.anonymous_device_id === anonymous_device_id) {
        isOwner = true;
        console.log("[cancel-order] Ownership confirmed for anonymous user.");
      }
    }

    if (!isOwner) {
      console.error("[cancel-order] Authorization failed. User is not the owner.");
      return jsonResponse({ error: 'Bạn không có quyền hủy đơn hàng này.' }, 403);
    }
    console.log("[cancel-order] Authorization successful.");

    console.log(`[cancel-order] Updating order ${order_id} status to 'Đã hủy'.`);
    const { error: updateError } = await adminSupabaseClient
      .from('orders')
      .update({ status: 'Đã hủy' })
      .eq('id', order_id);

    if (updateError) {
      console.error("[cancel-order] Error updating order:", updateError);
      throw updateError;
    }
    console.log("[cancel-order] Order updated successfully in database.");

    return jsonResponse({ message: 'Đơn hàng đã được hủy thành công.' }, 200);

  } catch (error) {
    console.error('[cancel-order] Unhandled exception:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
})