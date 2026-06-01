export default function AcceptableUsePage() {
  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Acceptable Use Policy</h1>
        <p className="text-muted-foreground mb-4">Last updated: January 2026</p>
        <div className="prose prose-gray max-w-none space-y-4">
          <h2 className="text-xl font-semibold mt-6">Prohibited Activities</h2>
          <p>You may not use LITHY AI to: generate false or misleading resumes, impersonate others, violate applicable laws, distribute malware, or attempt to bypass our security measures.</p>
          <h2 className="text-xl font-semibold mt-6">AI Generation Limits</h2>
          <p>Automated or programmatic access to our AI features without explicit permission is prohibited.</p>
          <h2 className="text-xl font-semibold mt-6">Content Standards</h2>
          <p>All content generated or uploaded must not contain hate speech, discriminatory material, or violate intellectual property rights.</p>
          <h2 className="text-xl font-semibold mt-6">Enforcement</h2>
          <p>Violations may result in account suspension or termination without refund.</p>
        </div>
      </div>
    </div>
  );
}
