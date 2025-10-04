// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts"

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
      throw new Error("Số điện thoại và OTP là bắt buộc.")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('phone_otps')
      .select('*')
      .eq('phone', phone)
      .single()

    if (otpError || !otpData) throw new Error("Số điện thoại không hợp lệ hoặc OTP đã hết hạn.")
    if (otpData.otp !== otp) throw new Error("Mã OTP không hợp lệ.")
    if (new Date(otpData.expires_at) < new Date()) {
      await supabaseAdmin.from('phone_otps').delete().eq('phone', phone)
      throw new Error("Mã OTP đã hết hạn.")
    }

    await supabaseAdmin.from('phone_otps').delete().eq('phone', phone)

    let user
    const sanitizedPhone = `+84${phone.replace(/^0+/, '')}`
    const { data: existingUser, error: findError } = await supabaseAdmin.auth.admin.listUsers({ phone: sanitizedPhone })
    
    if (findError) throw findError
    
    if (existingUser && existingUser.users.length > 0) {
      user = existingUser.users[0]
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        phone: sanitizedPhone,
        phone_confirm: true,
      })
      if (createError) throw createError
      user = newUser.user
    }

    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET')
    if (!jwtSecret) throw new Error("JWT Secret chưa được cấu hình.")

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(jwtSecret),
        { name: "HMAC", hash: "SHA-26" },
        false,
        ["sign", "verify"]
    );

    const accessToken = await create({ alg: "HS256", typ: "JWT" }, {
      sub: user.id,
      phone: user.phone,
      aud: 'authenticated',
      role: 'authenticated',
      exp: getNumericDate(60 * 60), // 1 hour
    }, key)

    return new Response(JSON.stringify({
      access_token: accessToken,
      token_type: 'bearer',
      user: user,
    }), {
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