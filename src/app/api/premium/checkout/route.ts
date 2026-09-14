import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/paymongo";

export const runtime = "nodejs";

const PREMIUM_PRICE_PHP = 49;

export async function POST(request: Request) {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Premium isn't configured yet." }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const origin = new URL(request.url).origin;

  try {
    const session = await createCheckoutSession({
      secretKey,
      amountPhp: PREMIUM_PRICE_PHP,
      description: "Splitzel Premium (1 month)",
      successUrl: `${origin}/premium/success`,
      cancelUrl: `${origin}/premium`,
      metadata: { user_id: user.id },
    });

    return NextResponse.json({ checkoutUrl: session.checkoutUrl });
  } catch (err) {
    console.error("Failed to create PayMongo checkout session:", err);
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 500 });
  }
}
