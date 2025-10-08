// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    console.log("[assign-order] Function invoked.");
    const { order_id, delivery_address } = await req.json();
    console.log(`[assign-order] Received order_id: ${order_id}, address: "${delivery_address}"`);

    if (!order_id || !delivery_address) {
      return new Response(JSON.stringify({ error: 'Thiếu order_id hoặc delivery_address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trackAsiaApiKey = Deno.env.get("TRACK_ASIA_API_KEY");
    if (!trackAsiaApiKey) throw new Error("TRACK_ASIA_API_KEY chưa được cấu hình.");

    console.log("[assign-order] Geocoding customer address...");
    const geocodeUrl = `https://maps.track-asia.com/api/v2/geocode/json?address=${encodeURIComponent(delivery_address)}&key=${trackAsiaApiKey}`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) throw new Error(`Lỗi Geocoding API: ${geocodeResponse.statusText}`);
    
    const geocodeData = await geocodeResponse.json();
    if (!geocodeData.results || geocodeData.results.length === 0) {
      console.warn(`[assign-order] Không thể geocode địa chỉ: ${delivery_address}`);
      return new Response(JSON.stringify({ message: "Không tìm thấy tọa độ, cần xử lý thủ công." }), { status: 200 });
    }

    const customerLocation = geocodeData.results[0].geometry.location;
    const customerLat = customerLocation.lat;
    const customerLng = customerLocation.lng;
    console.log(`[assign-order] Geocoding successful. Lat: ${customerLat}, Lng: ${customerLng}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("[assign-order] Fetching locations from DB...");
    const { data: locations, error: locationsError } = await supabaseAdmin
      .from('locations')
      .select('id, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (locationsError) throw locationsError;
    if (!locations || locations.length === 0) throw new Error("Không có cửa hàng nào có tọa độ hợp lệ.");

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
       console.warn(`[assign-order] Không tìm thấy cửa hàng gần nhất cho địa chỉ: ${delivery_address}`);
       return new Response(JSON.stringify({ message: "Không tìm thấy cửa hàng gần nhất, cần xử lý thủ công." }), { status: 200 });
    }
    console.log(`[assign-order] Closest location found: ID ${closestLocation.id} at ${minDistance.toFixed(2)} meters.`);

    console.log(`[assign-order] Updating order ${order_id} with location ${closestLocation.id}...`);
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ pickup_location_id: closestLocation.id })
      .eq('id', order_id);

    if (updateError) throw updateError;
    console.log("[assign-order] Order updated successfully.");

    return new Response(JSON.stringify({ success: true, assigned_location_id: closestLocation.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[assign-order] Unhandled error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})