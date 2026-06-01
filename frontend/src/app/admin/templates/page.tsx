"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RESUME_TEMPLATES } from "@/lib/constants";

export default function AdminTemplatesPage() {
  const [templates] = useState(RESUME_TEMPLATES);

  return (
    <div className="py-12">
      <div className="container max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Template Management</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge>{template.premium ? "Premium" : "Free"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                {template.features && (
                  <ul className="text-sm space-y-1">
                    {template.features.map((f) => <li key={f} className="text-muted-foreground">• {f}</li>)}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
