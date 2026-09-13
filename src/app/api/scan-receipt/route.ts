import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB, generous headroom over the resized client upload

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    establishment: {
      type: Type.STRING,
      description: "The name of the restaurant or store, as printed on the receipt. Empty string if unreadable.",
    },
    items: {
      type: Type.ARRAY,
      description:
        "Every individual purchased item on the receipt. Do not include subtotal, tax, service charge, " +
        "discount, or total lines here — only actual purchased items.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The item name/description as printed on the receipt." },
          price: {
            type: Type.NUMBER,
            description:
              "The UNIT price of one of this item, in PHP, as a plain number with no currency symbol. " +
              "If the receipt shows a line total for multiple units, divide by quantity to get the unit price.",
          },
          quantity: {
            type: Type.INTEGER,
            description: "How many of this item were purchased. Default to 1 if no quantity is shown.",
          },
        },
        required: ["name", "price", "quantity"],
      },
    },
  },
  required: ["establishment", "items"],
};

const PROMPT = `You are reading a photo of a receipt from a Filipino restaurant, cafe, fast food chain, or store. \
Extract the establishment name and every individual purchased line item. \
Do not include subtotal, VAT, service charge, discount, or grand total lines as items — only things that were \
actually bought. If handwriting or print is unclear, make your best reasonable guess. If the photo isn't a \
receipt at all, or no items can be read, return an empty items array and an empty establishment string.`;

interface ExtractedReceipt {
  establishment: string;
  items: { name: string; price: number; quantity: number }[];
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Receipt scanning isn't configured yet." }, { status: 500 });
  }

  let body: { image?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const dataUrl = body.image;
  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "No image provided." }, { status: 400 });
  }

  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "Invalid image data." }, { status: 400 });
  }
  const [, mediaType, base64Data] = match;

  if (base64Data.length * 0.75 > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image is too large." }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [{ inlineData: { mimeType: mediaType, data: base64Data } }, { text: PROMPT }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: "Couldn't read the receipt. Please try again." }, { status: 422 });
    }

    const result = JSON.parse(text) as ExtractedReceipt;

    if (!result.items || result.items.length === 0) {
      return NextResponse.json(
        { error: "No items detected. Try a clearer photo, or add items manually." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      establishment: result.establishment?.trim() || "Receipt",
      items: result.items
        .filter((i) => i && i.name && typeof i.price === "number" && i.price > 0)
        .map((i) => ({
          name: i.name.trim(),
          price: i.price,
          quantity: Math.max(1, Math.round(i.quantity || 1)),
        })),
    });
  } catch (err) {
    console.error("Receipt scan failed:", err);
    return NextResponse.json({ error: "Couldn't process the receipt. Please try again." }, { status: 500 });
  }
}
