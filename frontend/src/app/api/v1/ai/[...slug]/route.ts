export const runtime = "edge";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const SYSTEM_PROMPTS: Record<string, string> = {
  "generate-resume":
    "You are an expert resume writer and career coach. Create professional, ATS-optimized resume content. " +
    "Return JSON with improved sections maintaining the same structure but with enhanced content.",

  "improve-resume":
    "You are an expert resume writer. Improve the resume sections based on the user's instructions. " +
    "Return JSON with improved sections.",

  "cover-letter":
    "You are an expert cover letter writer. Create a compelling, professional cover letter. " +
    "Return JSON with a single key 'coverLetter' containing the cover letter text.",

  "analyze-ats":
    "You are an ATS (Applicant Tracking System) expert. Analyze the resume against the job description. " +
    "Return JSON with: score (0-100), breakdown: { keywords, format, sections, content, overall }, " +
    "recommendations: string[], missingKeywords: string[], strongPoints: string[], " +
    "keywordHeatmap: array of { keyword: string, found: boolean, density: number (0-100), relevance: string (high/medium/low), category: string }, " +
    "keywordGaps: array of { keyword: string, importance: string (critical/important/nice-to-have), suggestedSection: string, whyItMatters: string }",

  "analyze-job-match":
    "You are a career match expert. Analyze how well the resume matches the job description. " +
    "Return JSON with: matchPercentage: number, gaps: string[], recommendations: string[], " +
    "matchedSkills: string[], missingSkills: string[]",

  "optimize-linkedin":
    "You are a LinkedIn optimization expert. Analyze the LinkedIn profile and provide optimization suggestions. " +
    "Return JSON with: headline: string, about: string, experience: array of optimized entries, " +
    "suggestions: string[], score: number",

  "resume-tailor":
    "You are an expert resume tailoring specialist. Adapt the resume to match the job description perfectly. " +
    "Return JSON with: tailoredSections: array of optimized resume sections, " +
    "changes: string[], matchScore: number, keywordsAdded: string[], suggestions: string[]",

  "resume-review":
    "You are an expert resume reviewer and career coach. Provide a detailed resume review. " +
    "Return JSON with: overallScore: number, sectionScores: object, strengths: string[], " +
    "weaknesses: string[], actionableImprovements: string[], formatFeedback: string, " +
    "contentFeedback: string, atsReadiness: string",

  "career-advisor":
    "You are an expert career advisor and industry mentor. Provide personalized career guidance. " +
    "Return JSON with: careerPath: string[], " +
    "skillGaps: array of { skill, importance, howToAcquire }, recommendedRoles: string[], " +
    "learningResources: array of { category, suggestions }, timeline: string, marketInsights: string",

  "portfolio-review":
    "You are an expert portfolio reviewer and technical recruiter. Evaluate the candidate's portfolio and GitHub presence. " +
    "Return JSON with: overallScore: number, strengths: string[], improvements: string[], " +
    "codeQuality: string, projectFeedback: array of { project, score, notes }, " +
    "presentationFeedback: string, recommendations: string[], recruiterAppeal: string",
};

async function callGroq(systemPrompt: string, userContent: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      throw new Error(`Groq API error: ${res.status} ${err}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request, { params }: { params: { slug: string[] } }) {
  try {
    if (!GROQ_API_KEY) {
      return Response.json(
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
          return Response.json({ message: "Unauthorized" }, { status: 401 });
        }
      } else {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    const endpoint = params.slug?.join("/") || "";
    const systemPrompt = SYSTEM_PROMPTS[endpoint];
    if (!systemPrompt) {
      return Response.json(
        { message: `Unknown AI endpoint: ${endpoint}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const userContent = JSON.stringify(body);

    const completion = await callGroq(systemPrompt, userContent);
    const result = JSON.parse(completion.choices[0].message.content || "{}");

    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      { message: error.message || "Generation failed" },
      { status: 500 }
    );
  }
}
