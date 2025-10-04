// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // --- CHẾ ĐỘ GỠ LỖI ---
  // Hàm này sẽ tạm thời trả về thành công ngay lập tức để kiểm tra kết nối.
  // Toàn bộ logic gửi SMS đã được vô hiệu hóa.
  
  console.log("--- eSMS Webhook invoked (DEBUG MODE) ---");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Cố gắng đọc và ghi lại payload để kiểm tra
    const payload = await req.json();
    console.log("Received payload:", JSON.stringify(payload, null, 2));
  } catch (e) {
    console.error("Error reading request body:", e.message);
    // Nếu không đọc được payload, trả về lỗi
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  console.log("Returning immediate success response to Supabase.");
  
  // Trả về phản hồi thành công ngay lập tức cho Supabase.
  return new Response(JSON.stringify({ message: "Webhook acknowledged successfully (DEBUG MODE)." }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
})