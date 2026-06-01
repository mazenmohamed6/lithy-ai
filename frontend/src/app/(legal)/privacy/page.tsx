export default function PrivacyPage() {
  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">Last updated: January 2026</p>
        <div className="prose prose-gray max-w-none space-y-4">
          <p>LITHY AI ("we," "our," or "us") respects your privacy and is committed to protecting your personal data.</p>
          <h2 className="text-xl font-semibold mt-6">1. Information We Collect</h2>
          <p>We collect information you provide directly: name, email, resume data, payment information, and profile details. We also automatically collect usage data and cookies.</p>
          <h2 className="text-xl font-semibold mt-6">2. How We Use Your Data</h2>
          <p>We use your data to provide resume building services, process payments, send service emails, improve our platform, and comply with legal obligations.</p>
          <h2 className="text-xl font-semibold mt-6">3. Data Sharing</h2>
          <p>We share data with Stripe (payments), OpenAI (AI generation), and Supabase (infrastructure). We never sell your personal data.</p>
          <h2 className="text-xl font-semibold mt-6">4. Data Retention</h2>
          <p>We retain your data for as long as your account is active. Upon deletion, data is removed within 30 days.</p>
          <h2 className="text-xl font-semibold mt-6">5. Your Rights</h2>
          <p>You have the right to access, correct, delete, or export your data at any time through your account settings.</p>
          <h2 className="text-xl font-semibold mt-6">6. Contact</h2>
          <p>For privacy concerns, contact us at privacy@lithyai.com.</p>
        </div>
      </div>
    </div>
  );
}
