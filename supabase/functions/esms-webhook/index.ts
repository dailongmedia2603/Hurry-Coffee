// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tách logic gửi SMS ra một hàm riêng để xử lý trong nền
async function sendSmsInBackground(phone, message) {
  try {
    console.log(`Background task: Processing SMS for ${phone}`);
    
    if (typeof message !== 'string') {
      throw new Error(`Invalid message format: expected a string but got ${typeof message}`);
    }

    const otpMatch = message.match(/\d{6}/);
    if (!otpMatch) {
      throw new Error(`Could not extract OTP from message: "${message}"`);
    }
    const otp = otpMatch[0];

    const apiKey = Deno.env.get('ESMS_API_KEY')
    const secretKey = Deno.env.get('ESMS_SECRET_KEY')
    const brandname = Deno.env.get('ESMS_BRANDNAME')

    if (!apiKey || !secretKey || !brandname) {
      throw new Error("Server configuration error: Missing SMS provider secrets.");
    }

    const userPhone = phone.startsWith('+84') ? '0' + phone.substring(3) : phone;

    const requestBody = {
      ApiKey: apiKey,
      SecretKey: secretKey,
      Phone: userPhone,
      Channels: ["sms"],
      Data: [
        {
          Content: `${otp} la ma xac minh dang ky ${brandname} cua ban`,
          IsUnicode: "0",
          SmsType: "2",
          Brandname: brandname,
          RequestId: crypto.randomUUID(),
          Sandbox: "0"
        }
      ]
    };

    console.log("TEST MODE: Request Body that WOULD BE sent to eSMS:", JSON.stringify(requestBody, null, 2));
    
    // --- MOCK FOR TESTING ---
    // Trong thực tế, bạn sẽ bỏ comment các dòng dưới đây để gửi SMS thật.
    // const esmsUrl = 'https://rest.esms.vn/MainService.svc/json/MultiChannelMessage/'
    // const esmsResponse = await fetch(esmsUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(requestBody),
    // })
    // const esmsResult = await esmsResponse.json()
    // if (esmsResult.CodeResult != 100) {
    //   console.error("eSMS API Error:", esmsResult)
    // } else {
    //   console.log("Background task: SMS sent successfully via eSMS.");
    // }
    // --- END MOCK ---

  } catch (error) {
    console.error("--- Background SMS task failed with error ---", error.message);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    // Sửa lỗi: Lấy `phone` từ `record` và `message` từ `record.data`
    const phone = payload.record?.phone;
    const message = payload.record?.data?.message;

    if (!phone || !message) {
      console.error("Webhook received with missing phone or message in payload:", payload);
      return new Response(JSON.stringify({ error: "Missing phone or message in payload" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`Webhook received for ${phone}. Acknowledging immediately.`);

    // Gọi hàm xử lý nền mà không cần chờ (fire and forget)
    // Điều này cho phép chúng ta trả về phản hồi 200 ngay lập tức.
    sendSmsInBackground(phone, message);

    // Trả về phản hồi thành công ngay lập tức cho Supabase
    return new Response(JSON.stringify({ message: "Webhook accepted for processing." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Lỗi này chỉ xảy ra nếu payload từ Supabase bị lỗi, không phải từ eSMS
    console.error("--- eSMS Webhook failed to parse request ---", error.message);
    return new Response(JSON.stringify({ error: "Invalid request payload" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})