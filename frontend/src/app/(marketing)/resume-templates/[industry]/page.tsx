import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ArrowLeft, ArrowRight, Sparkles, FileText, BarChart3, Target } from "lucide-react";

const industries: Record<string, { name: string; description: string; keywords: string; tips: string }> = {
  "software-engineering": {
    name: "Software Engineering",
    description: "ATS-optimized resume templates for software engineers, developers, and tech professionals. Highlight your technical skills, projects, and experience.",
    keywords: "software engineer resume template, developer resume, tech resume, ATS-friendly resume for programmers, IT resume builder",
    tips: "Focus on technical skills, GitHub projects, and measurable impact. Use action verbs like 'developed', 'implemented', 'architected'. Quantify your achievements with metrics.",
  },
  "marketing": {
    name: "Marketing",
    description: "Professional resume templates for marketing managers, digital marketers, and content strategists. Showcase your campaigns and results.",
    keywords: "marketing resume template, digital marketing resume, brand manager CV, content strategist resume, marketing professional",
    tips: "Highlight campaign results with metrics (ROI, conversion rates, engagement). Showcase your tool stack (Google Analytics, HubSpot, etc.) and content portfolio.",
  },
  "finance": {
    name: "Finance",
    description: "Clean, professional resume templates for accountants, financial analysts, and banking professionals. Emphasize accuracy and analytical skills.",
    keywords: "finance resume template, accountant CV, financial analyst resume, banking resume, investment professional",
    tips: "Quantify everything — portfolio sizes, budget amounts, percentage improvements. List certifications (CPA, CFA, etc.) prominently. Use clean, traditional formatting.",
  },
  "healthcare": {
    name: "Healthcare",
    description: "Resume templates designed for doctors, nurses, healthcare administrators, and medical staff. Professional and easy to read.",
    keywords: "healthcare resume template, nurse resume, doctor CV, medical resume, healthcare professional",
    tips: "List certifications and licenses first. Highlight patient care metrics and specialized training. Use clear section headers for easy scanning.",
  },
  "education": {
    name: "Education",
    description: "Resume templates for teachers, professors, administrators, and education professionals. Showcase your teaching philosophy and achievements.",
    keywords: "education resume template, teacher resume, professor CV, educator resume, academic professional",
    tips: "Emphasize teaching experience, curriculum development, and student outcomes. List publications and certifications separately.",
  },
  "sales": {
    name: "Sales",
    description: "Results-driven resume templates for sales representatives, account managers, and business development professionals.",
    keywords: "sales resume template, sales representative resume, account manager CV, business development resume",
    tips: "Lead with your quota attainment and revenue numbers. Highlight top performer awards and territory growth. Use a achievements-first format.",
  },
  "retail": {
    name: "Retail",
    description: "Resume templates for retail managers, store associates, and merchandising professionals. Focus on customer service and operations.",
    keywords: "retail resume template, retail manager resume, store associate CV, merchandising resume",
    tips: "Highlight sales performance, inventory management, and team leadership. Include customer satisfaction metrics and loss prevention achievements.",
  },
  "hospitality": {
    name: "Hospitality",
    description: "Resume templates for hotel staff, restaurant managers, and tourism professionals. Emphasize service excellence.",
    keywords: "hospitality resume template, hotel manager resume, restaurant CV, tourism professional",
    tips: "Focus on guest satisfaction scores, team management, and revenue performance. Highlight language skills and cultural competency.",
  },
  "construction": {
    name: "Construction",
    description: "Resume templates for construction managers, engineers, and skilled trades. Showcase project completion and safety records.",
    keywords: "construction resume template, construction manager resume, engineer CV, skilled trades",
    tips: "List project sizes, budgets managed, and safety records. Highlight certifications (OSHA, PMP, etc.). Include specific building types and project phases.",
  },
  "manufacturing": {
    name: "Manufacturing",
    description: "Resume templates for production managers, quality control, and manufacturing engineers. Focus on efficiency and process improvement.",
    keywords: "manufacturing resume template, production manager resume, quality control CV, manufacturing engineer",
    tips: "Quantify production improvements, efficiency gains, and cost savings. Highlight Lean/Six Sigma certifications and process optimization experience.",
  },
};

export function generateStaticParams() {
  return Object.keys(industries).map((industry) => ({ industry }));
}

export function generateMetadata({ params }: { params: { industry: string } }): Metadata {
  const ind = industries[params.industry];
  if (!ind) return {};
  return {
    title: `${ind.name} Resume Templates | LITHY AI`,
    description: ind.description,
    keywords: ind.keywords,
    openGraph: {
      title: `${ind.name} Resume Templates | LITHY AI`,
      description: ind.description,
    },
  };
}

export default function IndustryPage({ params }: { params: { industry: string } }) {
  const ind = industries[params.industry];
  if (!ind) notFound();

  return (
    <div className="py-24">
      <div className="container max-w-4xl">
        <Link href="/resume-templates" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> All Industries
        </Link>

        <h1 className="text-4xl font-bold mb-4">{ind.name} Resume Templates</h1>
        <p className="text-lg text-muted-foreground mb-8">{ind.description}</p>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="p-4 rounded-lg border bg-card">
            <FileText className="h-5 w-5 text-primary mb-2" />
            <h3 className="font-medium text-sm mb-1">ATS-Optimized</h3>
            <p className="text-xs text-muted-foreground">Pass applicant tracking systems with clean, parsable formatting</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <Sparkles className="h-5 w-5 text-primary mb-2" />
            <h3 className="font-medium text-sm mb-1">AI-Powered</h3>
            <p className="text-xs text-muted-foreground">Generate tailored content with our AI resume builder</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <Target className="h-5 w-5 text-primary mb-2" />
            <h3 className="font-medium text-sm mb-1">Industry-Specific</h3>
            <p className="text-xs text-muted-foreground">Templates designed for {ind.name} hiring standards</p>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-muted/50 mb-12">
          <h2 className="text-xl font-semibold mb-3">Tips for {ind.name} Resumes</h2>
          <p className="text-muted-foreground">{ind.tips}</p>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Create Your {ind.name} Resume Now</h2>
          <p className="text-muted-foreground">Use our AI Resume Builder to create a professional, ATS-optimized resume in minutes.</p>
          <Link href="/signup">
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Build Your Resume <Sparkles className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
