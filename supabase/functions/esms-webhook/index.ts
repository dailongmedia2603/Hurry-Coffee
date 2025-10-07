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

  const {
    phone,
    content,          // cho SMS thường
    templateId,       // cho kênh Zalo (TempID)
    params,           // mảng tham số template (Zalo)
    oaid,             // OAID Zalo
    campaignId,
    requestId,
    sandbox,          // "0" production, "1" sandbox
    brandname,        // override brand
    smsType,          // "2" = brandname care, "8" = OTP brandname (tuỳ account)
    isUnicode,        // "0" hoặc "1"
    sendSms = true,   // bật/tắt SMS
    sendZalo = false, // bật/tắt Zalo
  } = body ?? {};

  if (!phone) return badRequest("Missing 'phone'");

  // dựng Channels tuỳ theo flag / dữ liệu
  const Channels: string[] = [];
  if (sendZalo || (templateId && oaid)) Channels.push("zalo");
  if (sendSms !== false) Channels.push("sms");
  if (Channels.length === 0) return badRequest("No channel selected (sms/zalo).");

  // ==== DATA ====
  const Data: any[] = [];

  // ZALO TEMPLATE (nếu có)
  if (Channels.includes("zalo")) {
    if (!templateId || !oaid) {
      return badRequest("Zalo requires 'templateId' and 'oaid'.");
    }
    Data.push({
      TempID: String(templateId),
      Params: Array.isArray(params) ? params : [],
      OAID: String(oaid),
      campaignid: campaignId ?? "Webhook Zalo Campaign",
      CallbackUrl,
      RequestId: requestId ?? crypto.randomUUID(),
      Sandbox: sandbox ?? "0",
      SendingMode: "1",
    });
  }

  // SMS THUỜNG
  if (Channels.includes("sms")) {
    if (!content && !templateId) {
      // Cho SMS cần 'content' (nếu bạn không dùng template SMS của eSMS).
      return badRequest("SMS requires 'content'.");
    }
    Data.push({
      Content: String(content ?? ""),
      IsUnicode: String(isUnicode ?? "0"),
      SmsType: String(smsType ?? "2"),
      Brandname: String(brandname ?? DefaultBrand),
      CallbackUrl,
      RequestId: requestId ?? crypto.randomUUID(),
      Sandbox: sandbox ?? "0",
    });
  }

  const esmsPayload = {
    ApiKey,
    SecretKey,
    Phone: String(phone),
    Channels,
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

  if (!esmsRes.ok) {
    console.error("eSMS non-200:", esmsRes.status, esmsJson);
    return json({ error: "eSMS error", status: esmsRes.status, response: esmsJson }, 502);
  }

  // Trả về kết quả từ eSMS (để debug thuận tiện)
  return json({ ok: true, esms: esmsJson }, 200);
});