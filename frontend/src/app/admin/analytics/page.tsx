"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    api.get("/admin/analytics").then(setStats).catch(console.error);
  }, []);

  const cards = [
    { title: "Total Users", value: stats.totalUsers ?? "—" },
    { title: "Active Subscriptions", value: stats.activeSubscriptions ?? "—" },
    { title: "AI Generations (30d)", value: stats.aiGenerations30d ?? "—" },
    { title: "Resumes Created (30d)", value: stats.resumesCreated30d ?? "—" },
  ];

  return (
    <div className="py-12">
      <div className="container max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Analytics</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader><CardDescription>{card.title}</CardDescription></CardHeader>
              <CardContent><p className="text-3xl font-bold">{card.value}</p></CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
