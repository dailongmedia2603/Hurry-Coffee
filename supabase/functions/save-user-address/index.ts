// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Xác thực người dùng
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Bạn phải đăng nhập.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Lấy dữ liệu địa chỉ từ client
    const addressPayload = await req.json();
    const { id: existingId, name, address } = addressPayload;

    if (!name || !address) {
      return new Response(JSON.stringify({ error: 'Tên và địa chỉ là bắt buộc.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Geocode địa chỉ để lấy tọa độ
    const trackAsiaApiKey = Deno.env.get("TRACK_ASIA_API_KEY");
    if (!trackAsiaApiKey) {
      throw new Error("TRACK_ASIA_API_KEY chưa được cấu hình trong Supabase secrets.");
    }

    const geocodeUrl = `https://maps.track-asia.com/api/v2/geocode/json?address=${encodeURIComponent(address)}&key=${trackAsiaApiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) {
      throw new Error(`Lỗi API Geocoding: ${geocodeResponse.statusText}`);
    }
    const geocodeData = await geocodeResponse.json();

    let latitude = null;
    let longitude = null;

    if (geocodeData.results && geocodeData.results.length > 0) {
      const location = geocodeData.results[0].geometry.location;
      latitude = location.lat;
      longitude = location.lng;
    } else {
      console.warn(`Không thể tìm thấy tọa độ cho địa chỉ: "${address}"`);
    }

    // 4. Chuẩn bị dữ liệu để lưu
    const addressData = {
      id: existingId,
      user_id: user.id,
      name,
      address,
      latitude,
      longitude,
    };

    // 5. Lưu dữ liệu vào database bằng service role key
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await adminSupabaseClient
      .from('user_addresses')
      .upsert(addressData)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[save-user-address] Lỗi không xác định:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})