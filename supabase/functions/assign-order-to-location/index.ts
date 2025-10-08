// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hàm tính khoảng cách Haversine bằng JavaScript (dự phòng)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { order_id, delivery_address } = await req.json();
    if (!order_id || !delivery_address) {
      return new Response(JSON.stringify({ error: 'Thiếu order_id hoặc delivery_address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Lấy API key từ secrets
    const trackAsiaApiKey = Deno.env.get("TRACK_ASIA_API_KEY");
    if (!trackAsiaApiKey) {
      throw new Error("TRACK_ASIA_API_KEY chưa được cấu hình trong Supabase secrets.");
    }

    // 2. Geocode địa chỉ của khách hàng để lấy tọa độ
    const geocodeUrl = `https://maps.track-asia.com/api/v2/geocode/json?address=${encodeURIComponent(delivery_address)}&key=${trackAsiaApiKey}`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) {
      throw new Error(`Lỗi Geocoding API: ${geocodeResponse.statusText}`);
    }
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.results || geocodeData.results.length === 0) {
      // Nếu không tìm thấy, vẫn trả về thành công để không chặn luồng, đơn hàng sẽ được xử lý thủ công
      console.warn(`Không thể geocode địa chỉ: ${delivery_address}`);
      return new Response(JSON.stringify({ message: "Không tìm thấy tọa độ cho địa chỉ, cần xử lý thủ công." }), { status: 200 });
    }

    const customerLocation = geocodeData.results[0].geometry.location;
    const customerLat = customerLocation.lat;
    const customerLng = customerLocation.lng;

    // 3. Tìm cửa hàng gần nhất
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: locations, error: locationsError } = await supabaseAdmin
      .from('locations')
      .select('id, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (locationsError) throw locationsError;
    if (!locations || locations.length === 0) {
      throw new Error("Không có cửa hàng nào có tọa độ hợp lệ trong cơ sở dữ liệu.");
    }

    let closestLocation = null;
    let minDistance = Infinity;

    for (const location of locations) {
      const distance = haversineDistance(customerLat, customerLng, location.latitude, location.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        closestLocation = location;
      }
    }

    if (!closestLocation) {
       console.warn(`Không tìm thấy cửa hàng gần nhất cho địa chỉ: ${delivery_address}`);
       return new Response(JSON.stringify({ message: "Không tìm thấy cửa hàng gần nhất, cần xử lý thủ công." }), { status: 200 });
    }

    // 4. Cập nhật đơn hàng với ID của cửa hàng gần nhất
    // Chúng ta sẽ dùng pickup_location_id để lưu cửa hàng phụ trách đơn giao đi
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ pickup_location_id: closestLocation.id })
      .eq('id', order_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, assigned_location_id: closestLocation.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})