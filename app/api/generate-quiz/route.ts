import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const prompt = `You are an expert educational AI tutor. Generate a high-quality 5-question multiple-choice practice quiz about "${topic}".
Output MUST be raw JSON with no markdown formatting or backticks.
JSON Schema:
{
  "title": "${topic} AI Practice Quiz",
  "subject": "Physics | Chemistry | Math",
  "difficulty": "medium",
  "questions": [
    {
      "id": "q1",
      "question": "Clear, specific question text relating accurately to ${topic}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of why Option A is correct."
    }
  ]
}
Make sure all 5 questions are accurate, directly related to "${topic}", with 4 distinct options and one clear correct answer.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", errText);
      return NextResponse.json({ error: "Failed to generate quiz from OpenAI API" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 500 });
    }

    // Clean JSON response if enclosed in markdown code fences
    const jsonStr = content.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    const quizData = JSON.parse(jsonStr);

    return NextResponse.json(quizData);
  } catch (error: any) {
    console.error("Error in generate-quiz route:", error);
    return NextResponse.json({ error: error.message || "Failed to generate quiz" }, { status: 500 });
  }
}
