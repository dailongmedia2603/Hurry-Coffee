// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ESMS_URL = "https://rest.esms.vn/MainService.svc/json/MultiChannelMessage/";

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
  const DefaultBrand = Deno.env.get("ESMS_BRANDNAME") ?? "Brand";
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

  // ==== EXTRACT DATA FROM SUPABASE AUTH HOOK PAYLOAD ====
  const phone = body?.user?.phone;
  const otp = body?.sms?.otp;

  if (!phone || !otp) {
    return badRequest("Invalid payload from Supabase Auth Hook. Missing phone or OTP.");
  }

  // Construct the SMS content from the OTP
  const content = `Ma xac thuc cua ban la: ${otp}`;

  // ==== DATA ====
  const Data = [{
    Content: content,
    IsUnicode: "0",
    SmsType: "8", // "8" is typically for OTP brandname
    Brandname: DefaultBrand,
    CallbackUrl,
    RequestId: crypto.randomUUID(),
    Sandbox: "0",
  }];

  const esmsPayload = {
    ApiKey,
    SecretKey,
    Phone: String(phone),
    Channels: ["sms"],
    Data,
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
    esmsJson = { raw: await esmsRes.text() };
  }

  if (!esmsRes.ok || esmsJson?.CodeResponse !== '100') {
    console.error("eSMS non-200 or error response:", esmsRes.status, esmsJson);
    return json({ error: "eSMS error", status: esmsRes.status, response: esmsJson }, 502);
  }

  // Trả về kết quả từ eSMS (để debug thuận tiện)
  return json({ ok: true, esms: esmsJson }, 200);
});