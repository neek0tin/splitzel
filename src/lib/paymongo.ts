const PAYMONGO_API = "https://api.paymongo.com/v1";

function authHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

export interface CreateCheckoutSessionParams {
  secretKey: string;
  amountPhp: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}

export interface CheckoutSession {
  id: string;
  checkoutUrl: string;
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession> {
  const { secretKey, amountPhp, description, successUrl, cancelUrl, metadata } = params;

  const res = await fetch(`${PAYMONGO_API}/checkout_sessions`, {
    method: "POST",
    headers: {
      Authorization: authHeader(secretKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: "PHP",
              amount: Math.round(amountPhp * 100),
              description,
              name: description,
              quantity: 1,
            },
          ],
          payment_method_types: ["gcash", "card", "paymaya"],
          success_url: successUrl,
          cancel_url: cancelUrl,
          description,
          metadata,
        },
      },
    }),
  });

  const body = await res.json();
  if (!res.ok) {
    const message = body?.errors?.[0]?.detail || `PayMongo request failed (${res.status})`;
    throw new Error(message);
  }

  return { id: body.data.id, checkoutUrl: body.data.attributes.checkout_url };
}
