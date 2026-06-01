export default function TermsPage() {
  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-4">Last updated: January 2026</p>
        <div className="prose prose-gray max-w-none space-y-4">
          <h2 className="text-xl font-semibold mt-6">1. Acceptance of Terms</h2>
          <p>By using LITHY AI, you agree to these Terms of Service. If you do not agree, do not use our services.</p>
          <h2 className="text-xl font-semibold mt-6">2. Account Registration</h2>
          <p>You must provide accurate information and maintain the security of your account. You are responsible for all activity under your account.</p>
          <h2 className="text-xl font-semibold mt-6">3. Subscriptions & Billing</h2>
          <p>Paid plans are billed monthly or annually. Cancellation takes effect at the end of the current billing period. Refunds follow our Refund Policy.</p>
          <h2 className="text-xl font-semibold mt-6">4. AI Generation Credits</h2>
          <p>AI Generations are consumed per action. Unused monthly credits do not roll over. Additional packs can be purchased.</p>
          <h2 className="text-xl font-semibold mt-6">5. Acceptable Use</h2>
          <p>You may not use LITHY AI for illegal purposes, to generate misleading content, or to violate others' rights.</p>
          <h2 className="text-xl font-semibold mt-6">6. Limitation of Liability</h2>
          <p>LITHY AI is provided "as is." We are not liable for job placement outcomes or indirect damages.</p>
        </div>
      </div>
    </div>
  );
}
