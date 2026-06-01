import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, BarChart3, Target, Linkedin, Download, Palette, Upload } from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI Resume Builder", description: "Generate professional, ATS-optimized resumes from your experience in seconds. Our AI tailors content to your industry.", color: "text-blue-500" },
  { icon: Upload, title: "Resume Upload & Parse", description: "Upload your existing resume in PDF, DOCX, or even a scanned image. We extract and structure your data.", color: "text-green-500" },
  { icon: BarChart3, title: "ATS Score Analysis", description: "Check your resume against ATS algorithms. Get a detailed score breakdown and actionable improvements.", color: "text-purple-500" },
  { icon: Target, title: "Job Match Analysis", description: "Paste a job description and see exactly how your resume matches. Identify gaps and optimize your application.", color: "text-red-500" },
  { icon: FileText, title: "Cover Letter Generation", description: "Create tailored, professional cover letters that complement your resume and impress employers.", color: "text-orange-500" },
  { icon: Linkedin, title: "LinkedIn Profile Optimizer", description: "Optimize your LinkedIn headline, about section, and experience for maximum recruiter visibility.", color: "text-blue-700" },
  { icon: Palette, title: "Multiple Templates", description: "Choose from professionally designed templates. Switch templates freely without losing your content.", color: "text-pink-500" },
  { icon: Download, title: "PDF Export", description: "Export clean, professional PDFs. Free plans include branding; paid plans get white-label exports.", color: "text-teal-500" },
];

export default function FeaturesPage() {
  return (
    <div className="py-24">
      <div className="container text-center max-w-3xl mb-16">
        <h1 className="text-4xl font-bold mb-4">Everything You Need to Land Your Dream Job</h1>
        <p className="text-lg text-muted-foreground">AI-powered tools that give you an edge in the modern job market.</p>
      </div>
      <div className="container grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
        {features.map((feature) => (
          <div key={feature.title} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
            <feature.icon className={`h-10 w-10 mb-4 ${feature.color}`} />
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
      <div className="container text-center mt-16">
        <Link href="/signup">
          <Button size="lg">Get Started Free</Button>
        </Link>
      </div>
    </div>
  );
}
