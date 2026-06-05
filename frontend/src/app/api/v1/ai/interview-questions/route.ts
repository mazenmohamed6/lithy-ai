import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

async function callGroq(systemPrompt: string, userPrompt: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`Groq API error: ${res.status} ${err}`);
  }
  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { message: "AI service not configured: missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
      } else {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { resume, jobTitle, jobDescription, companyName, language = "en" } = body;

    if (!jobTitle) {
      return NextResponse.json(
        { message: "Missing required field: jobTitle" },
        { status: 400 }
      );
    }

    const languageInstruction = language === "ar"
      ? "Respond entirely in Arabic. All questions, answers, and guidance must be in Arabic."
      : "Respond entirely in English.";

    const systemPrompt = `You are an expert interview coach and career advisor. Generate a personalized interview preparation set.

${languageInstruction}

Return JSON with the following structure:
{
  "technicalQuestions": [
    {
      "question": "string",
      "category": "string (e.g. JavaScript, System Design, etc.)",
      "difficulty": "junior | mid | senior",
      "approach": "string (key points to solve, not full solution)",
      "keyPoints": ["string"]
    }
  ],
  "behavioralQuestions": [
    {
      "question": "string (in STAR format context)",
      "category": "leadership | teamwork | problem-solving | conflict | communication",
      "starFramework": {
        "situation": "string (how to set up the scenario)",
        "task": "string (what needed to be done)",
        "action": "string (what they did)",
        "result": "string (the outcome)"
      }
    }
  ],
  "companySpecificQuestions": []
}

For companySpecificQuestions:
- If companyName is provided, generate 3-5 company-specific questions about culture fit, role expectations, and common hiring focus areas for that company
- If no companyName provided, return an empty array

For behavioral questions, use STAR (Situation, Task, Action, Result) framework guidance.
For technical questions, provide the question, difficulty level, and approach guidance (not full solutions).

Keep all content practical, concise, and interview-ready.`;

    const userPrompt = JSON.stringify({
      resume,
      jobTitle,
      jobDescription: jobDescription || "",
      companyName: companyName || "",
    });

    const completion = await callGroq(systemPrompt, userPrompt);
    const result = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Generation failed" },
      { status: 500 }
    );
  }
}
