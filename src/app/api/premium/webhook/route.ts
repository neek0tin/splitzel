import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const PREMIUM_PERIOD_DAYS = 30;

/**
 * PayMongo signs each webhook request with a header of the form
 * "t=<unix ts>,te=<test-mode hex hmac>,li=<live-mode hex hmac>" over the
 * string "<t>.<raw body>", HMAC-SHA256 with the endpoint's signing secret.
 * Accepts a match against either the te or li field -- our webhook secret is
 * scoped to one mode at a time, and this sidesteps needing to know exactly
 * which field name corresponds to it without weakening the check (a match
 * against either field still requires the same secret to produce).
 */
function isValidSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    })
  );
  const timestamp = parts.t;
  if (!timestamp) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");

  for (const candidate of [parts.te, parts.li]) {
    if (!candidate) continue;
    const candidateBuf = Buffer.from(candidate, "hex");
    if (candidateBuf.length === expectedBuf.length && timingSafeEqual(candidateBuf, expectedBuf)) {
      return true;
    }
  }
  return false;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Premium webhook is missing required env vars; rejecting webhook.");
    return NextResponse.json({ error: "Not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("paymongo-signature");

  if (!isValidSignature(rawBody, signatureHeader, webhookSecret)) {
    console.error("PayMongo webhook signature verification failed.", {
      signatureHeader,
      bodyPreview: rawBody.slice(0, 200),
    });
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventType: string | undefined = event?.data?.attributes?.type;
  const checkoutSession = event?.data?.attributes?.data;

  if (eventType !== "checkout_session.payment.paid") {
    // Not an event we care about (e.g. checkout_session.payment.failed) -- 200 so
    // PayMongo doesn't keep retrying delivery for something we're intentionally ignoring.
    return NextResponse.json({ received: true });
  }

  const userId: string | undefined = checkoutSession?.attributes?.metadata?.user_id;
  const checkoutId: string | undefined = checkoutSession?.id;
  const amountCentavos: number | undefined = checkoutSession?.attributes?.line_items?.[0]?.amount;

  if (!userId || !checkoutId || !amountCentavos) {
    console.error("PayMongo webhook missing expected fields.", { userId, checkoutId, amountCentavos });
    return NextResponse.json({ error: "Malformed event." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("premium_until")
    .eq("id", userId)
    .single();
  if (profileErr) {
    console.error("Failed to load profile for premium activation:", profileErr);
    return NextResponse.json({ error: "Profile lookup failed." }, { status: 500 });
  }

  // Extends from the current expiry if still active (an early renewal doesn't lose
  // remaining days); otherwise starts fresh from now.
  const currentExpiry = profile.premium_until ? new Date(profile.premium_until) : null;
  const periodStart = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
  const periodEnd = new Date(periodStart.getTime() + PREMIUM_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  // provider_checkout_id is unique, so a retried webhook delivery for an event we've
  // already recorded fails this insert harmlessly instead of double-extending premium.
  const { error: insertErr } = await admin.from("payments").insert({
    user_id: userId,
    provider: "paymongo",
    provider_checkout_id: checkoutId,
    amount: amountCentavos / 100,
    currency: "PHP",
    status: "paid",
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      // Duplicate delivery for an already-processed checkout — already credited.
      return NextResponse.json({ received: true });
    }
    console.error("Failed to record payment:", insertErr);
    return NextResponse.json({ error: "Failed to record payment." }, { status: 500 });
  }

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ premium_until: periodEnd.toISOString() })
    .eq("id", userId);
  if (updateErr) {
    console.error("Failed to update premium_until:", updateErr);
    return NextResponse.json({ error: "Failed to activate premium." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
