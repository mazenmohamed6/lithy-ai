import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const posts: Record<string, { title: string; content: string; date: string; author: string }> = {
  "how-to-ace-ats": {
    title: "How to Ace ATS Screening in 2026",
    date: "Jan 15, 2026",
    author: "LITHY Team",
    content: "Applicant Tracking Systems (ATS) are used by over 95% of Fortune 500 companies. To pass ATS screening, use standard section headings, include relevant keywords from the job description, avoid tables and columns, and save your resume as a clean PDF or DOCX. Our ATS Scanner tool analyzes your resume against these criteria and provides a detailed score with actionable recommendations.",
  },
  "ai-resume-tips": {
    title: "5 AI Resume Tips That Actually Work",
    date: "Jan 8, 2026",
    author: "LITHY Team",
    content: "1. Start with a strong summary tailored to your target role. 2. Use bullet points that quantify achievements. 3. Match keywords from job descriptions. 4. Keep formatting clean and ATS-friendly. 5. Proofread everything — AI is a tool, not a replacement for your judgment. LITHY AI helps with each of these steps through our AI Resume Builder.",
  },
  "linkedin-optimization": {
    title: "LinkedIn Profile Optimization Guide",
    date: "Dec 20, 2025",
    author: "LITHY Team",
    content: "Your LinkedIn profile should tell a compelling professional story. Start with a professional headshot, write a keyword-rich headline, craft an engaging 'About' section, detail your experience with measurable accomplishments, collect recommendations, and post regularly. Use our LinkedIn Optimizer to get AI-powered suggestions for every section.",
  },
};

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts[params.slug];
  if (!post) notFound();

  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <div className="flex gap-4 text-sm text-muted-foreground mb-8">
          <span>{post.date}</span>
          <span>{post.author}</span>
        </div>
        <p className="text-lg leading-relaxed">{post.content}</p>
      </div>
    </div>
  );
}
