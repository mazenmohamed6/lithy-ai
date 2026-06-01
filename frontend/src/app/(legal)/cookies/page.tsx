export default function CookiesPage() {
  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
        <p className="text-muted-foreground mb-4">Last updated: January 2026</p>
        <div className="prose prose-gray max-w-none space-y-4">
          <h2 className="text-xl font-semibold mt-6">1. What Are Cookies</h2>
          <p>Cookies are small text files stored on your device that help us provide and improve our services.</p>
          <h2 className="text-xl font-semibold mt-6">2. How We Use Cookies</h2>
          <p>We use essential cookies for authentication and security, analytics cookies via PostHog to understand usage, and preference cookies to remember your settings.</p>
          <h2 className="text-xl font-semibold mt-6">3. Third-Party Cookies</h2>
          <p>Stripe uses cookies for payment processing. PostHog uses cookies for analytics. We do not use advertising cookies.</p>
          <h2 className="text-xl font-semibold mt-6">4. Managing Cookies</h2>
          <p>You can control cookies through your browser settings. Disabling certain cookies may affect functionality.</p>
        </div>
      </div>
    </div>
  );
}
