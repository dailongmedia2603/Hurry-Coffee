// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { phone, otp } = await req.json()
    if (!phone || !otp) {
      throw new Error("Phone number and OTP are required from the hook.")
    }

    const apiKey = Deno.env.get('ESMS_API_KEY')
    const secretKey = Deno.env.get('ESMS_SECRET_KEY')
    const brandname = Deno.env.get('ESMS_BRANDNAME')
    const content = `Ma xac thuc cua ban la: ${otp}`
    
    // eSMS expects phone number format like 84... without the +
    const sanitizedPhone = phone.startsWith('+84') ? phone.substring(1) : phone;

    const esmsUrl = `http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get?ApiKey=${apiKey}&SecretKey=${secretKey}&Content=${encodeURIComponent(content)}&Phone=${sanitizedPhone}&SmsType=2&Brandname=${brandname}`

    const esmsResponse = await fetch(esmsUrl)
    const esmsResult = await esmsResponse.json()

    if (esmsResult.CodeResult != 100) {
      console.error("eSMS Error:", esmsResult)
      throw new Error(`Failed to send OTP via eSMS. Error: ${esmsResult.ErrorMessage}`)
    }

    // Return an empty object for success, as required by Supabase hooks
    return new Response(JSON.stringify({}), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Return the error in the format required by Supabase hooks
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})