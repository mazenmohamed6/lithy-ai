export default function ContactPage() {
  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold mb-2 text-center">Contact Us</h1>
        <p className="text-muted-foreground mb-12 text-center">Have questions or feedback? We would love to hear from you.</p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">Support</h3>
            <p className="text-sm text-muted-foreground">For account and billing issues</p>
            <p className="text-sm mt-2">support@lithyai.com</p>
          </div>
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">Press</h3>
            <p className="text-sm text-muted-foreground">For media inquiries</p>
            <p className="text-sm mt-2">press@lithyai.com</p>
          </div>
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">Partnerships</h3>
            <p className="text-sm text-muted-foreground">For collaboration opportunities</p>
            <p className="text-sm mt-2">partners@lithyai.com</p>
          </div>
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">Legal</h3>
            <p className="text-sm text-muted-foreground">For legal and compliance matters</p>
            <p className="text-sm mt-2">legal@lithyai.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
