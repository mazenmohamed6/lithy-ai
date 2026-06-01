"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<any[]>([]);

  useEffect(() => {
    api.get("/admin/feature-flags").then(setFlags).catch(console.error);
  }, []);

  const toggleFlag = async (id: string, enabled: boolean) => {
    try {
      await api.put(`/admin/feature-flags/${id}`, { enabled: !enabled });
      setFlags(flags.map((f) => (f.id === id ? { ...f, enabled: !enabled } : f)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-12">
      <div className="container max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Feature Flags</h1>
        <Card>
          <CardHeader><CardTitle>Platform Features ({flags.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {flags.map((flag) => (
                <div key={flag.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{flag.name}</p>
                    <p className="text-sm text-muted-foreground">{flag.key}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={flag.enabled ? "default" : "secondary"}>{flag.enabled ? "ON" : "OFF"}</Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleFlag(flag.id, flag.enabled)}>Toggle</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
