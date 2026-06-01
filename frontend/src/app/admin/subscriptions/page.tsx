"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    api.get("/admin/subscriptions").then(setSubscriptions).catch(console.error);
  }, []);

  return (
    <div className="py-12">
      <div className="container max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Subscriptions</h1>
        <Card>
          <CardHeader><CardTitle>All Subscriptions ({subscriptions.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{sub.user?.email || sub.id}</p>
                    <p className="text-sm text-muted-foreground">{sub.plan?.name} — {sub.status}</p>
                  </div>
                  <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
                </div>
              ))}
              {subscriptions.length === 0 && <p className="text-muted-foreground text-sm">No subscriptions yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
