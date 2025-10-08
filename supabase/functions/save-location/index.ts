// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hàm kiểm tra quyền admin
async function isAdmin(supabaseClient: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabaseClient.rpc('is_admin');
  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
  return data === true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Xác thực người dùng là admin
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const isCallerAdmin = await isAdmin(userSupabaseClient);
    if (!isCallerAdmin) {
      return new Response(JSON.stringify({ error: 'Permission denied: User is not an admin.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Lấy dữ liệu địa điểm từ client
    const locationData = await req.json();
    const { address } = locationData;

    if (!address) {
      return new Response(JSON.stringify({ error: 'Address is required for geocoding.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Geocode địa chỉ để lấy tọa độ
    const trackAsiaApiKey = Deno.env.get("TRACK_ASIA_API_KEY");
    if (!trackAsiaApiKey) {
      throw new Error("TRACK_ASIA_API_KEY is not configured in Supabase secrets.");
    }

    const geocodeUrl = `https://maps.track-asia.com/api/v2/geocode/json?address=${encodeURIComponent(address)}&key=${trackAsiaApiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding API Error: ${geocodeResponse.statusText}`);
    }
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.results || geocodeData.results.length === 0) {
      return new Response(JSON.stringify({ error: `Không thể tìm thấy tọa độ cho địa chỉ: "${address}". Vui lòng kiểm tra lại.` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const customerLocation = geocodeData.results[0].geometry.location;
    locationData.latitude = customerLocation.lat;
    locationData.longitude = customerLocation.lng;

    // 4. Lưu dữ liệu vào database bằng service role key
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await adminSupabaseClient
      .from('locations')
      .upsert(locationData) // upsert sẽ tự động tạo mới hoặc cập nhật nếu có id
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in save-location function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})