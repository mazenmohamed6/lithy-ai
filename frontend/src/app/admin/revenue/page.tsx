"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminRevenuePage() {
  const [revenue, setRevenue] = useState<any>({});

  useEffect(() => {
    api.get("/admin/revenue").then(setRevenue).catch(console.error);
  }, []);

  return (
    <div className="py-12">
      <div className="container max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Revenue</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <Card><CardHeader><CardDescription>Monthly Recurring Revenue</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{revenue.mrr ? `${revenue.mrr} EGP` : "—"}</p></CardContent></Card>
          <Card><CardHeader><CardDescription>Active Paid Users</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{revenue.activePaidUsers ?? "—"}</p></CardContent></Card>
          <Card><CardHeader><CardDescription>Total Revenue (All Time)</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{revenue.totalRevenue ? `${revenue.totalRevenue} EGP` : "—"}</p></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
