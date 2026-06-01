import Link from "next/link";

const posts = [
  { slug: "how-to-ace-ats", title: "How to Ace ATS Screening in 2026", excerpt: "Learn how modern ATS systems work and how to optimize your resume to pass automated screening.", date: "Jan 15, 2026", author: "LITHY Team" },
  { slug: "ai-resume-tips", title: "5 AI Resume Tips That Actually Work", excerpt: "AI-generated resumes can be powerful. Here's how to use them effectively without losing your personal touch.", date: "Jan 8, 2026", author: "LITHY Team" },
  { slug: "linkedin-optimization", title: "LinkedIn Profile Optimization Guide", excerpt: "Your LinkedIn profile is your digital first impression. Optimize every section for maximum recruiter visibility.", date: "Dec 20, 2025", author: "LITHY Team" },
];

export default function BlogPage() {
  return (
    <div className="py-24">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Blog</h1>
        <p className="text-muted-foreground mb-12">Tips, guides, and insights for your job search.</p>
        <div className="space-y-8">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block border rounded-xl p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-muted-foreground mb-3">{post.excerpt}</p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{post.date}</span>
                <span>{post.author}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
