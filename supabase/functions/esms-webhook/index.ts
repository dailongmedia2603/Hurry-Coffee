// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Cập nhật URL endpoint mới
const ESMS_URL = "https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/";

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function badRequest(msg: string) { return json({ error: msg }, 400); }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return badRequest("Only POST is supported.");

  // ==== ENV / SECRETS ====
  const ApiKey = Deno.env.get("ESMS_API_KEY");
  const SecretKey = Deno.env.get("ESMS_SECRET_KEY");
  const DefaultBrand = Deno.env.get("ESMS_BRANDNAME");
  const CallbackUrl = Deno.env.get("ESMS_CALLBACK_URL") ?? "https://esms.vn/webhook/";

  if (!ApiKey || !SecretKey) {
    console.error("Missing ESMS secrets");
    return json({ error: "Server not configured: missing ESMS secrets" }, 500);
  }

  // ==== PAYLOAD ====
  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    console.error("Invalid JSON:", e);
    return badRequest("Invalid JSON payload");
  }

  // ==== EXTRACT & SANITIZE DATA FROM SUPABASE AUTH HOOK PAYLOAD ====
  const phoneInput = body?.user?.phone;
  const otp = body?.sms?.otp;

  const Phone = String((typeof phoneInput === "string" ? phoneInput.trim() : phoneInput) ?? "");
  if (!Phone || !otp) {
    return badRequest("Invalid payload from Supabase Auth Hook. Missing phone or OTP.");
  }

  const EffectiveBrand = String(DefaultBrand || "").trim();
  if (!EffectiveBrand) {
    return json({ error: "Server not configured: ESMS_BRANDNAME secret is missing or empty." }, 500);
  }

  console.log("[eSMS] Using Brandname:", EffectiveBrand);

  // Tạo nội dung theo mẫu mới
  const content = `${otp} la ma xac minh dang ky ${EffectiveBrand} cua ban`;

  // ==== Cấu trúc payload phẳng mới ====
  const esmsPayload = {
    ApiKey,
    SecretKey,
    Phone,
    Content: content,
    Brandname: EffectiveBrand,
    SmsType: "2", // Đặt thành "2" theo yêu cầu
    IsUnicode: "0",
    RequestId: crypto.randomUUID(),
    CallbackUrl,
    campaignid: "OTP Verification", // Thêm campaignid mặc định
  };

  // ==== CALL E-SMS WITH TIMEOUT ====
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort("timeout"), 15000); // 15s
  let esmsRes: Response;
  try {
    esmsRes = await fetch(ESMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(esmsPayload),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(t);
    console.error("eSMS fetch error:", e);
    return json({ error: "Failed to reach eSMS", detail: String(e?.message ?? e) }, 502);
  }
  clearTimeout(t);

  let esmsJson: any = null;
  try {
    esmsJson = await esmsRes.json();
  } catch {
    const rawText = await esmsRes.text();
    esmsJson = { raw: rawText };
  }

  if (!esmsRes.ok) {
    console.error("eSMS non-200 response:", esmsRes.status, esmsJson);
    return json({ error: "eSMS error", status: esmsRes.status, response: esmsJson }, 502);
  }

  // Return success response
  return json({ ok: true, esms: esmsJson }, 200);
});