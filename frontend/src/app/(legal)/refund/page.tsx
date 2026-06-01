export default function RefundPage() {
  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Refund Policy</h1>
        <p className="text-muted-foreground mb-4">Last updated: January 2026</p>
        <div className="prose prose-gray max-w-none space-y-4">
          <h2 className="text-xl font-semibold mt-6">7-Day Trial</h2>
          <p>All paid plans include a 7-day free trial. You will not be charged until the trial period ends.</p>
          <h2 className="text-xl font-semibold mt-6">Subscription Refunds</h2>
          <p>If you cancel within the first 7 days of a paid subscription, you are eligible for a full refund. After 7 days, no refunds are issued for the current billing period.</p>
          <h2 className="text-xl font-semibold mt-6">Add-On Packs</h2>
          <p>AI Generation Pack purchases are non-refundable as they are consumed immediately upon use.</p>
          <h2 className="text-xl font-semibold mt-6">How to Request a Refund</h2>
          <p>Contact our support team at support@lithyai.com with your account email and reason for refund. We process refunds within 5-10 business days.</p>
        </div>
      </div>
    </div>
  );
}
