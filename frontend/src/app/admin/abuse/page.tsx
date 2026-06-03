"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Users, AlertTriangle, Eye, Search, Activity, Flag, Ban } from "lucide-react";
import { toast } from "sonner";

export default function AdminAbusePage() {
  const [overview, setOverview] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get("/admin/abuse/overview"),
      api.get("/admin/abuse/alerts?limit=5&status=OPEN"),
    ]).then(([o, a]) => {
      setOverview(o);
      setAlerts(a);
    }).catch(() => toast.error("Failed to load abuse data"));
  }, []);

  const metrics = [
    { label: "Total Identities", value: overview?.totalLedgers ?? "—", icon: Users, color: "text-blue-500" },
    { label: "High Risk", value: overview?.highRiskLedgers ?? "—", icon: AlertTriangle, color: "text-red-500" },
    { label: "Suspicious", value: overview?.suspiciousLedgers ?? "—", icon: Eye, color: "text-orange-500" },
    { label: "Open Alerts", value: overview?.openAlerts ?? "—", icon: Flag, color: "text-yellow-500" },
    { label: "Critical Alerts", value: overview?.criticalAlerts ?? "—", icon: Ban, color: "text-red-600" },
    { label: "Linked Accounts", value: overview?.totalLinkedAccounts ?? "—", icon: Activity, color: "text-green-500" },
    { label: "Deleted Accounts", value: overview?.deletedAccounts ?? "—", icon: Users, color: "text-gray-500" },
  ];

  return (
    <div className="py-12">
      <div className="container max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Abuse Monitoring</h1>
            <p className="text-muted-foreground mt-1">Anti-abuse and fraud detection dashboard</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/abuse/ledgers">
              <Button variant="outline"><Search className="h-4 w-4 mr-2" /> Browse Identities</Button>
            </Link>
            <Link href="/admin/abuse/alerts">
              <Button variant="default"><Flag className="h-4 w-4 mr-2" /> Alert Queue ({overview?.openAlerts ?? 0})</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m) => (
            <Card key={m.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>{m.label}</CardDescription>
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle>Alerts by Severity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overview && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
                  <div key={sev} className="flex items-center justify-between">
                    <Badge variant={sev === "CRITICAL" ? "destructive" : sev === "HIGH" ? "default" : "secondary"}>{sev}</Badge>
                    <span className="font-bold">{overview[`${sev.toLowerCase()}Alerts`] ?? 0}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Risk Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">High Risk</span>
                  <span className="font-bold text-red-500">{overview?.highRiskLedgers ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Suspicious</span>
                  <span className="font-bold text-orange-500">{overview?.suspiciousLedgers ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monitor</span>
                  <span className="font-bold text-yellow-500">{overview ? (overview.totalLedgers - overview.highRiskLedgers - overview.suspiciousLedgers - (overview.monitorLedgers ?? 0)) : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Normal</span>
                  <span className="font-bold text-green-500">{overview ? (overview.totalLedgers - overview.highRiskLedgers - overview.suspiciousLedgers) : "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/abuse/alerts"><Button variant="outline" className="w-full justify-start"><Flag className="h-4 w-4 mr-2" /> Review Open Alerts</Button></Link>
              <Link href="/admin/abuse/ledgers?riskLevel=HIGH_RISK"><Button variant="outline" className="w-full justify-start"><AlertTriangle className="h-4 w-4 mr-2" /> View High-Risk Identities</Button></Link>
              <Link href="/admin/abuse/ledgers?sort=usage"><Button variant="outline" className="w-full justify-start"><Activity className="h-4 w-4 mr-2" /> Top Usage Identities</Button></Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Open Alerts</CardTitle>
            <CardDescription>Latest fraud alerts requiring review</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts?.alerts?.length > 0 ? (
              <div className="space-y-3">
                {alerts.alerts.slice(0, 5).map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.severity === "CRITICAL" || alert.severity === "HIGH" ? "destructive" : "secondary"}>{alert.severity}</Badge>
                        <span className="font-medium">{alert.type.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                    <Link href={`/admin/abuse/ledgers/${alert.ledgerId}`}>
                      <Button size="sm" variant="ghost">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4">No open alerts. Everything looks good.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
