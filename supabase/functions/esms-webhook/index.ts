// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Dữ liệu được gửi từ Supabase Auth Hook
    const { phone, otp } = await req.json()
    if (!phone || !otp) {
      throw new Error("Số điện thoại và OTP là bắt buộc từ hook.")
    }

    // Lấy các secret đã lưu
    const apiKey = Deno.env.get('ESMS_API_KEY')
    const secretKey = Deno.env.get('ESMS_SECRET_KEY')
    const brandname = Deno.env.get('ESMS_BRANDNAME')

    // API endpoint mới
    const esmsUrl = 'https://rest.esms.vn/MainService.svc/json/MultiChannelMessage/'

    // Chuyển đổi định dạng SĐT từ +84... (Supabase) sang 0... (eSMS yêu cầu)
    const userPhone = phone.startsWith('+84') ? '0' + phone.substring(3) : phone;

    // Xây dựng body cho request POST theo đúng cấu trúc bạn cung cấp
    const requestBody = {
      ApiKey: apiKey,
      SecretKey: secretKey,
      Phone: userPhone,
      Channels: ["sms"], // Chỉ gửi qua kênh SMS cho OTP
      Data: [
        // Dữ liệu cho kênh SMS
        {
          Content: `${otp} la ma xac minh cua ban`,
          IsUnicode: "0",
          SmsType: "2", // Tin nhắn quảng cáo hoặc OTP, thường là type 2
          Brandname: brandname,
          RequestId: crypto.randomUUID(), // Tạo một ID duy nhất cho mỗi request
        }
      ]
    };

    // Thực hiện gọi API bằng phương thức POST
    const esmsResponse = await fetch(esmsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const esmsResult = await esmsResponse.json()

    // Kiểm tra kết quả trả về từ eSMS
    if (esmsResult.CodeResult != 100) {
      console.error("eSMS Error:", esmsResult)
      throw new Error(`Gửi OTP thất bại. Lỗi: ${esmsResult.ErrorMessage}`)
    }

    // Trả về response thành công cho Supabase
    return new Response(JSON.stringify({}), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Trả về response lỗi cho Supabase
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})