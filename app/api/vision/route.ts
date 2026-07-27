import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Image base64 data required" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an instant, hyper-accurate Handwriting Recognition (OCR) AI. Read the handwritten text drawn in the image. Return ONLY a valid JSON: {\"text\": \"Extracted text\"}. Do not add any punctuation or capitalization changes unless written.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcribe the handwritten text in this image accurately and instantly.",
              },
              {
                type: "image_url",
                image_url: {
                  url: image.startsWith("data:") ? image : `data:image/png;base64,${image}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 35,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Vision API Error]", response.status, errText);
      return NextResponse.json({ error: `Vision API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || "";

    let recognizedText = "";
    try {
      const cleanJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      recognizedText = parsed.text || "";
    } catch {
      recognizedText = rawContent.replace(/^\{\s*"text"\s*:\s*"/, "").replace(/"\s*\}$/, "").trim();
    }

    return NextResponse.json({ text: recognizedText });
  } catch (error: any) {
    console.error("[Vision API Exception]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
