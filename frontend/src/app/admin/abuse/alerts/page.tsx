"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminAbuseAlertsPage() {
  const [alerts, setAlerts] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      const [a, s] = await Promise.all([
        api.get(`/admin/abuse/alerts?${params}`),
        api.get("/admin/abuse/alerts/stats"),
      ]);
      setAlerts(a);
      setStats(s);
    } catch {
      toast.error("Failed to load alerts");
    }
  }, [page, statusFilter, severityFilter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleResolve = async (alertId: string, status: string) => {
    try {
      await api.put(`/admin/abuse/alerts/${alertId}/resolve`, { resolvedBy: "admin", status });
      toast.success(`Alert ${status.toLowerCase()}`);
      fetchAlerts();
    } catch {
      toast.error("Failed to resolve alert");
    }
  };

  return (
    <div className="py-12">
      <div className="container max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Fraud Alerts</h1>
            <p className="text-muted-foreground mt-1">Review and manage fraud detection alerts</p>
          </div>
          <Link href="/admin/abuse"><Button variant="outline">Back to Overview</Button></Link>
        </div>

        {stats && (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-6">
            {Object.entries(stats.byStatus).map(([key, val]: any) => (
              <Card key={key} className={statusFilter === key.toUpperCase() ? "ring-2 ring-primary" : ""} onClick={() => { setStatusFilter(key.toUpperCase()); setPage(1); }}>
                <CardContent className="p-3 text-center cursor-pointer">
                  <p className="text-lg font-bold">{val}</p>
                  <p className="text-xs text-muted-foreground capitalize">{key}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="OPEN">Open</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
            <option value="ALL">All Statuses</option>
          </select>
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}>
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {alerts?.alerts?.map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.severity === "CRITICAL" || alert.severity === "HIGH" ? "destructive" : "secondary"}>{alert.severity}</Badge>
                      <span className="font-medium">{alert.type.replace(/_/g, " ")}</span>
                      <Badge variant={alert.status === "OPEN" ? "default" : "outline"}>{alert.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ledger risk: {alert.ledger?.riskScore}/100 · {alert.ledger?.riskLevel}
                      <span className="ml-3">{new Date(alert.createdAt).toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {JSON.stringify(alert.details).slice(0, 150)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <Link href={`/admin/abuse/ledgers/${alert.ledgerId}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                    {alert.status === "OPEN" && (
                      <>
                        <Button size="sm" variant="default" onClick={() => handleResolve(alert.id, "RESOLVED")}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleResolve(alert.id, "DISMISSED")}>
                          <XCircle className="h-4 w-4 mr-1" /> Dismiss
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {(!alerts?.alerts || alerts.alerts.length === 0) && (
                <div className="px-6 py-12 text-center text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No alerts found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {alerts && alerts.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {alerts.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= alerts.totalPages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
