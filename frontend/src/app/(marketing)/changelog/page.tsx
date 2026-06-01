export default function ChangelogPage() {
  const releases = [
    { version: "1.0.0", date: "Jan 2026", changes: ["Initial launch of LITHY AI", "AI Resume Builder with 14 section types", "ATS Score Analyzer", "Cover Letter Generator", "Job Match Analysis", "LinkedIn Profile Optimizer", "3 subscription tiers", "Stripe payment integration", "Supabase authentication"] },
  ];

  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">Changelog</h1>
        <p className="text-muted-foreground mb-12">Latest updates and improvements to LITHY AI.</p>
        <div className="space-y-8">
          {releases.map((release) => (
            <div key={release.version} className="border rounded-xl p-6">
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-xl font-semibold">v{release.version}</h2>
                <span className="text-sm text-muted-foreground">{release.date}</span>
              </div>
              <ul className="space-y-2">
                {release.changes.map((change) => (
                  <li key={change} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">+</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
