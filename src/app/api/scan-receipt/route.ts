import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB, generous headroom over the resized client upload

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_receipt",
  description: "Records the establishment name and every purchased line item read from a photo of a receipt.",
  input_schema: {
    type: "object",
    properties: {
      establishment: {
        type: "string",
        description: "The name of the restaurant or store, as printed on the receipt. Empty string if unreadable.",
      },
      items: {
        type: "array",
        description:
          "Every individual purchased item on the receipt. Do not include subtotal, tax, service charge, " +
          "discount, or total lines here — only actual purchased items.",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "The item name/description as printed on the receipt." },
            price: {
              type: "number",
              description:
                "The UNIT price of one of this item, in PHP, as a plain number with no currency symbol. " +
                "If the receipt shows a line total for multiple units, divide by quantity to get the unit price.",
            },
            quantity: {
              type: "integer",
              description: "How many of this item were purchased. Default to 1 if no quantity is shown.",
            },
          },
          required: ["name", "price", "quantity"],
        },
      },
    },
    required: ["establishment", "items"],
  },
};

const SYSTEM_PROMPT = `You are reading a photo of a receipt from a Filipino restaurant, cafe, fast food chain, or store. \
Extract the establishment name and every individual purchased line item using the extract_receipt tool. \
Do not include subtotal, VAT, service charge, discount, or grand total lines as items — only things that were \
actually bought. If handwriting or print is unclear, make your best reasonable guess. If the photo isn't a \
receipt at all, or no items can be read, call the tool with an empty items array and an empty establishment string.`;

interface ExtractedReceipt {
  establishment: string;
  items: { name: string; price: number; quantity: number }[];
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
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
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: "extract_receipt" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/webp",
                data: base64Data,
              },
            },
            { type: "text", text: "Extract this receipt." },
          ],
        },
      ],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json({ error: "Couldn't read the receipt. Please try again." }, { status: 422 });
    }

    const result = toolUse.input as ExtractedReceipt;

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
