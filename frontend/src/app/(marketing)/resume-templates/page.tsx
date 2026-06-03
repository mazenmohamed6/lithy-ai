import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight } from "lucide-react";

const industries = [
  { slug: "software-engineering", name: "Software Engineering", description: "ATS-optimized resume templates for software engineers, developers, and tech professionals." },
  { slug: "marketing", name: "Marketing", description: "Professional resume templates for marketing managers, digital marketers, and content strategists." },
  { slug: "finance", name: "Finance", description: "Clean, professional resume templates for accountants, financial analysts, and banking professionals." },
  { slug: "healthcare", name: "Healthcare", description: "Resume templates designed for doctors, nurses, healthcare administrators, and medical staff." },
  { slug: "education", name: "Education", description: "Resume templates for teachers, professors, administrators, and education professionals." },
  { slug: "sales", name: "Sales", description: "Results-driven resume templates for sales representatives, account managers, and business development." },
  { slug: "retail", name: "Retail", description: "Resume templates for retail managers, store associates, and merchandising professionals." },
  { slug: "hospitality", name: "Hospitality", description: "Resume templates for hotel staff, restaurant managers, and tourism professionals." },
  { slug: "construction", name: "Construction", description: "Resume templates for construction managers, engineers, and skilled trades." },
  { slug: "manufacturing", name: "Manufacturing", description: "Resume templates for production managers, quality control, and manufacturing engineers." },
];

export const metadata: Metadata = {
  title: "Resume Templates by Industry | LITHY AI",
  description: "Browse ATS-optimized resume templates for every industry. Software engineering, marketing, finance, healthcare, and more. Free AI-powered templates.",
  openGraph: {
    title: "Resume Templates by Industry | LITHY AI",
    description: "Browse ATS-optimized resume templates for every industry.",
  },
};

export default function ResumeTemplatesPage() {
  return (
    <div className="py-24">
      <div className="container max-6xl">
        <h1 className="text-4xl font-bold mb-4">Resume Templates by Industry</h1>
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
          ATS-optimized resume templates tailored to your industry. Each template is designed to pass applicant tracking systems while impressing hiring managers.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((ind) => (
            <Link key={ind.slug} href={`/resume-templates/${ind.slug}`} className="group block p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{ind.name}</h2>
              <p className="text-sm text-muted-foreground">{ind.description}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4">
                View Templates <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
