export default function RoadmapPage() {
  const items = [
    { status: "In Progress", title: "Team Collaboration", description: "Share resumes and get feedback from team members." },
    { status: "In Progress", title: "API Access", description: "Integrate LITHY AI capabilities into your own workflow." },
    { status: "Planned", title: "Mobile Apps", description: "Native iOS and Android apps for on-the-go resume editing." },
    { status: "Planned", title: "Interview Copilot", description: "AI-powered interview preparation and practice." },
    { status: "Planned", title: "Multi-language Support", description: "Create resumes in Arabic, French, and more." },
  ];

  return (
    <div className="py-24">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">Roadmap</h1>
        <p className="text-muted-foreground mb-12">What we are building next. Votes and feedback help us prioritize.</p>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.title} className="border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  item.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
                }`}>{item.status}</span>
                <h3 className="font-semibold">{item.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground ml-1">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
