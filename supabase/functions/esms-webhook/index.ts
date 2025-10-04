// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("--- eSMS Webhook invoked ---");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { phone, otp } = await req.json()
    console.log(`Received request for phone: ${phone}, otp: ${otp}`);
    if (!phone || !otp) {
      throw new Error("Phone and OTP are required from the hook.")
    }

    const apiKey = Deno.env.get('ESMS_API_KEY')
    const secretKey = Deno.env.get('ESMS_SECRET_KEY')
    const brandname = Deno.env.get('ESMS_BRANDNAME')

    if (!apiKey || !secretKey || !brandname) {
      console.error("CRITICAL: Missing one or more environment secrets (ESMS_API_KEY, ESMS_SECRET_KEY, ESMS_BRANDNAME).");
      throw new Error("Server configuration error: Missing SMS provider secrets.");
    }
    console.log("Successfully loaded secrets.");

    const esmsUrl = 'https://rest.esms.vn/MainService.svc/json/MultiChannelMessage/'
    const userPhone = phone.startsWith('+84') ? '0' + phone.substring(3) : phone;

    const requestBody = {
      ApiKey: apiKey,
      SecretKey: secretKey,
      Phone: userPhone,
      Channels: ["sms"], // Chỉ tập trung vào kênh SMS cho OTP
      Data: [
        {
          Content: `${otp} la ma xac minh dang ky ${brandname} cua ban`,
          IsUnicode: "0",
          SmsType: "2", // Theo mẫu của nhà cung cấp
          Brandname: brandname,
          RequestId: crypto.randomUUID(),
          Sandbox: "0" // Thêm tham số Sandbox theo mẫu
        }
      ]
    };

    console.log("Request Body sent to eSMS:", JSON.stringify(requestBody, null, 2));

    const esmsResponse = await fetch(esmsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const esmsResult = await esmsResponse.json()
    console.log("Response from eSMS:", JSON.stringify(esmsResult, null, 2));

    if (esmsResult.CodeResult != 100) {
      console.error("eSMS API Error:", esmsResult)
      throw new Error(`Failed to send OTP. Error: ${esmsResult.ErrorMessage || 'Unknown error'}`)
    }

    console.log("--- eSMS Webhook finished successfully ---");
    return new Response(JSON.stringify({}), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("--- eSMS Webhook failed with error ---", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})