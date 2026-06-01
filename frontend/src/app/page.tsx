import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <section className="py-24 md:py-32">
        <div className="container text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Build Job-Winning Resumes with{" "}
            <span className="text-primary">AI</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {APP_NAME} uses AI to create professional, ATS-optimized resumes and cover letters. Get hired faster.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">Get Started Free</Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" size="lg" className="text-lg px-8">See Features</Button>
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">10K+</div>
              <div className="text-muted-foreground">Resumes Created</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">95%</div>
              <div className="text-muted-foreground">ATS Pass Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">3x</div>
              <div className="text-muted-foreground">More Interviews</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-background rounded-xl p-6 shadow-sm border">
                <div className="text-2xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-6">Ready to Land Your Dream Job?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of professionals who built their careers with {APP_NAME}.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">Start Building Free</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

const features = [
  { title: "AI Resume Builder", description: "Generate professional resumes from your experience in seconds.", icon: "📝" },
  { title: "ATS Score Analysis", description: "Check your resume against ATS algorithms and improve your score.", icon: "📊" },
  { title: "Cover Letters", description: "Create tailored cover letters that complement your resume.", icon: "✉️" },
  { title: "Job Match Analysis", description: "See how your resume matches job descriptions and fill gaps.", icon: "🎯" },
  { title: "LinkedIn Optimizer", description: "Optimize your LinkedIn profile for recruiter searches.", icon: "💼" },
  { title: "Multiple Templates", description: "Choose from professional templates for any industry.", icon: "🎨" },
];
