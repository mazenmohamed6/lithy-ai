export default function StatusPage() {
  const services = [
    { name: "Website", status: "Operational" as const },
    { name: "API", status: "Operational" as const },
    { name: "AI Generation", status: "Operational" as const },
    { name: "Stripe Payments", status: "Operational" as const },
    { name: "Supabase Auth", status: "Operational" as const },
    { name: "Email Service", status: "Operational" as const },
  ];

  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">System Status</h1>
        <p className="text-muted-foreground mb-12">All systems operational.</p>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between border rounded-lg p-4">
              <span className="font-medium">{service.name}</span>
              <span className="flex items-center gap-2 text-sm text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {service.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
