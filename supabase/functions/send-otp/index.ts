// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()
    if (!phone) {
      throw new Error("Số điện thoại là bắt buộc.")
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const { error: dbError } = await supabase.from('phone_otps').upsert({
      phone: phone,
      otp: otp,
      expires_at: expires_at,
    })

    if (dbError) throw dbError

    const apiKey = Deno.env.get('ESMS_API_KEY')
    const secretKey = Deno.env.get('ESMS_SECRET_KEY')
    const brandname = Deno.env.get('ESMS_BRANDNAME')
    const content = `Ma xac thuc cua ban la: ${otp}`
    const sanitizedPhone = `84${phone.replace(/^0+/, '')}`

    const esmsUrl = `http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get?ApiKey=${apiKey}&SecretKey=${secretKey}&Content=${encodeURIComponent(content)}&Phone=${sanitizedPhone}&SmsType=2&Brandname=${brandname}`

    const esmsResponse = await fetch(esmsUrl)
    const esmsResult = await esmsResponse.json()

    if (esmsResult.CodeResult != 100) {
      console.error("eSMS Error:", esmsResult)
      throw new Error(`Gửi OTP thất bại. Lỗi: ${esmsResult.ErrorMessage}`)
    }

    return new Response(JSON.stringify({ success: true, message: "OTP đã được gửi thành công." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})