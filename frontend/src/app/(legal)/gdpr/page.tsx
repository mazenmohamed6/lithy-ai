export default function GDPRPage() {
  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">GDPR Compliance</h1>
        <p className="text-muted-foreground mb-4">Last updated: January 2026</p>
        <div className="prose prose-gray max-w-none space-y-4">
          <h2 className="text-xl font-semibold mt-6">Data Controller</h2>
          <p>LITHY AI is the data controller for your personal information. Our registered address is Cairo, Egypt.</p>
          <h2 className="text-xl font-semibold mt-6">Your Rights Under GDPR</h2>
          <p>You have the right to access, rectify, erase, restrict processing, data portability, object to processing, and withdraw consent at any time.</p>
          <h2 className="text-xl font-semibold mt-6">Legal Basis for Processing</h2>
          <p>We process your data based on: consent (account creation), contract (service delivery), legal obligations (tax records), and legitimate interests (service improvement).</p>
          <h2 className="text-xl font-semibold mt-6">Data Transfers</h2>
          <p>Your data may be transferred to and processed in the United States (Stripe, OpenAI) and the European Economic Area under Standard Contractual Clauses.</p>
          <h2 className="text-xl font-semibold mt-6">Data Protection Officer</h2>
          <p>Contact our DPO at dpo@lithyai.com for any GDPR-related inquiries.</p>
        </div>
      </div>
    </div>
  );
}
