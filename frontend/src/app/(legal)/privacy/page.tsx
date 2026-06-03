export default function PrivacyPage() {
  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2026</p>
        <div className="prose prose-gray max-w-none space-y-4 text-sm leading-relaxed">
          <p>LITHY AI ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information.</p>

          <h2 className="text-xl font-semibold mt-8">1. Information We Collect</h2>
          <p><strong>Information you provide:</strong> Name, email address, phone number, resume content, work history, education details, skills, profile photo, LinkedIn URL, and payment information (processed securely by Stripe).</p>
          <p><strong>Information collected automatically:</strong> Usage data, device information, browser type, IP address, pages visited, time spent, and cookies for analytics and functionality.</p>

          <h2 className="text-xl font-semibold mt-8">2. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide and improve our resume building and AI generation services</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send service-related emails (not marketing without consent)</li>
            <li>Analyze usage patterns to improve user experience</li>
            <li>Comply with legal obligations and enforce our terms</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">3. Data Sharing & Third Parties</h2>
          <p>We share data only with essential service providers:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Stripe</strong> — Payment processing (we never store credit card details)</li>
            <li><strong>OpenAI</strong> — AI resume generation and analysis</li>
            <li><strong>Supabase</strong> — Database and authentication infrastructure</li>
            <li><strong>Vercel</strong> — Application hosting</li>
          </ul>
          <p>We never sell your personal data to third parties.</p>

          <h2 className="text-xl font-semibold mt-8">4. Data Security</h2>
          <p>We implement industry-standard security measures including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Encryption at rest (AES-256) and in transit (TLS 1.3)</li>
            <li>Regular security audits and penetration testing</li>
            <li>Access controls and authentication mechanisms</li>
            <li>GDPR-compliant data handling procedures</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">5. Data Retention</h2>
          <p>We retain your personal data for as long as your account is active. If you delete your account, all associated data is permanently removed within 30 days. Backup copies are purged within 90 days.</p>

          <h2 className="text-xl font-semibold mt-8">6. Your Rights</h2>
          <p>Under GDPR and applicable laws, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your data and account</li>
            <li>Export your data in a portable format</li>
            <li>Object to processing for specific purposes</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p>Exercise these rights through your account settings or by contacting us.</p>

          <h2 className="text-xl font-semibold mt-8">7. Cookies</h2>
          <p>We use essential cookies for authentication and functionality. Analytics cookies are used only with your consent. You can manage cookie preferences in your browser settings.</p>

          <h2 className="text-xl font-semibold mt-8">8. International Transfers</h2>
          <p>Your data may be processed in countries where our service providers operate. We ensure appropriate safeguards are in place through Standard Contractual Clauses.</p>

          <h2 className="text-xl font-semibold mt-8">9. Contact</h2>
          <p>For privacy-related inquiries, contact our Data Protection Officer at <strong>privacy@lithyai.com</strong> or through our contact page.</p>
        </div>
      </div>
    </div>
  );
}
