export default function TermsPage() {
  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2026</p>
        <div className="prose prose-gray max-w-none space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold mt-8">1. Acceptance of Terms</h2>
          <p>By accessing or using LITHY AI ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service.</p>

          <h2 className="text-xl font-semibold mt-8">2. Account Registration</h2>
          <p>You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. Notify us immediately of any unauthorized use.</p>

          <h2 className="text-xl font-semibold mt-8">3. Subscriptions & Billing</h2>
          <p><strong>Free Plan:</strong> Limited features at no cost. No payment required.</p>
          <p><strong>Paid Plans:</strong> Billed monthly or annually as selected. Payment is due at the start of each billing period. A valid payment method is required before the free trial begins.</p>
          <p><strong>Cancellation:</strong> You may cancel at any time through your account settings. Cancellation takes effect at the end of your current billing period. No prorated refunds for partial months.</p>
          <p><strong>Free Trial:</strong> New paid plan subscribers receive a 7-day free trial. You will be charged at the end of the trial unless you cancel. You may cancel during the trial with no charge.</p>
          <p><strong>Price Changes:</strong> We may change prices with 30 days notice. Continued use after changes constitutes acceptance.</p>

          <h2 className="text-xl font-semibold mt-8">4. AI Generation Credits</h2>
          <p>AI Generations are consumed per action (resume generation, ATS scan, job match, cover letter). Unused monthly credits do not roll over to the next period. Additional credit packs can be purchased separately. Credits are non-refundable.</p>

          <h2 className="text-xl font-semibold mt-8">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use the Service for any illegal purpose</li>
            <li>Generate misleading, fraudulent, or harmful content</li>
            <li>Violate others' intellectual property or privacy rights</li>
            <li>Attempt to bypass usage limits or security measures</li>
            <li>Use automated tools to scrape or abuse the Service</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8">6. Intellectual Property</h2>
          <p>You retain full ownership of all content you create using LITHY AI. We claim no intellectual property rights over your resumes, cover letters, or other generated content. The Service itself, including its AI models, design, and technology, is owned by LITHY AI.</p>

          <h2 className="text-xl font-semibold mt-8">7. Limitation of Liability</h2>
          <p>LITHY AI is provided "as is" without warranties of any kind. We are not liable for job placement outcomes, interview results, or any indirect, incidental, or consequential damages. Our total liability is limited to the amount you paid for the Service in the 12 months preceding the claim.</p>

          <h2 className="text-xl font-semibold mt-8">8. AI Disclaimer</h2>
          <p>AI-generated content is provided as a starting point and should be reviewed for accuracy. We recommend verifying all facts, dates, and metrics before submitting. The AI may occasionally produce inaccurate or nonsensical content. You are responsible for the final review of all generated materials.</p>

          <h2 className="text-xl font-semibold mt-8">9. Termination</h2>
          <p>We may suspend or terminate your account for violations of these terms. You may terminate at any time by deleting your account. Upon termination, your access ceases and data is deleted per our Privacy Policy.</p>

          <h2 className="text-xl font-semibold mt-8">10. Changes to Terms</h2>
          <p>We may update these terms with notice. Continued use after changes constitutes acceptance. If you disagree, you may cancel your account.</p>

          <h2 className="text-xl font-semibold mt-8">11. Governing Law</h2>
          <p>These terms are governed by the laws of the Arab Republic of Egypt. Any disputes shall be resolved in Cairo courts.</p>

          <h2 className="text-xl font-semibold mt-8">12. Contact</h2>
          <p>For questions about these terms, contact <strong>legal@lithyai.com</strong>.</p>
        </div>
      </div>
    </div>
  );
}
