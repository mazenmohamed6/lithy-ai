import { RESUME_TEMPLATES } from "@/lib/constants";
import { Check } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="py-24">
      <div className="container max-w-6xl">
        <h1 className="text-4xl font-bold mb-2 text-center">Resume Templates</h1>
        <p className="text-lg text-muted-foreground mb-12 text-center">Choose from professionally designed templates. Switch anytime without losing your content.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESUME_TEMPLATES.map((template) => (
            <div key={template.id} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="h-40 bg-muted rounded-lg mb-4 flex items-center justify-center text-muted-foreground text-sm">
                {template.name} Preview
              </div>
              <h3 className="font-semibold mb-1">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
              <div className="space-y-1">
                {template.features?.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
