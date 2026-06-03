"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, ShieldOff, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const RISK_COLORS: Record<string, string> = {
  NORMAL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MONITOR: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  SUSPICIOUS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  HIGH_RISK: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AdminAbuseLedgerDetailPage() {
  const { id } = useParams();
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/abuse/ledgers/${id}`)
      .then(setLedger)
      .catch(() => toast.error("Failed to load identity details"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFlag = async (flag: string, value: boolean) => {
    try {
      await api.put(`/admin/abuse/ledgers/${id}/flag`, { flag, value });
      toast.success(value ? `Marked as ${flag}` : `Removed ${flag} flag`);
      setLedger({ ...ledger, flags: value ? [...(ledger.flags || []), flag] : (ledger.flags || []).filter((f: string) => f !== flag) });
    } catch {
      toast.error("Failed to update flag");
    }
  };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  if (!ledger) return <div className="py-12 text-center text-muted-foreground">Identity not found</div>;

  const flags: string[] = ledger.flags || [];

  return (
    <div className="py-12">
      <div className="container max-w-7xl">
        <Link href="/admin/abuse/ledgers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Ledgers
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">Identity Ledger</h1>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${RISK_COLORS[ledger.riskLevel] || ""}`}>{ledger.riskLevel}</span>
            </div>
            <p className="text-muted-foreground">ID: {ledger.id}</p>
          </div>
          <div className="flex gap-2">
            <Button variant={flags.includes("trusted") ? "default" : "outline"} size="sm" onClick={() => handleFlag("trusted", !flags.includes("trusted"))}>
              {flags.includes("trusted") ? <Shield className="h-4 w-4 mr-1" /> : <ShieldOff className="h-4 w-4 mr-1" />}
              {flags.includes("trusted") ? "Trusted" : "Mark Trusted"}
            </Button>
            <Button variant={flags.includes("suspicious") ? "destructive" : "outline"} size="sm" onClick={() => handleFlag("suspicious", !flags.includes("suspicious"))}>
              <AlertTriangle className="h-4 w-4 mr-1" />
              {flags.includes("suspicious") ? "Flagged" : "Flag Suspicious"}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader><CardDescription>Risk Score</CardDescription></CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{ledger.riskScore}<span className="text-lg text-muted-foreground">/100</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardDescription>Free Plan Status</CardDescription></CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{ledger.freePlanExhausted ? "Exhausted" : ledger.freePlanActivated ? "Active" : "Never Activated"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardDescription>Flags</CardDescription></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {flags.length > 0 ? flags.map((f: string) => <Badge key={f} variant={f === "suspicious" ? "destructive" : "default"}>{f}</Badge>) : <span className="text-sm text-muted-foreground">None</span>}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle>Cumulative Usage</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">AI Generations</span><span className="font-bold">{ledger.totalAiGenerations}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">ATS Scans</span><span className="font-bold">{ledger.totalAtsScans}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cover Letters</span><span className="font-bold">{ledger.totalCoverLetters}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Resume Exports</span><span className="font-bold">{ledger.totalResumeExports}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Signals</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-mono text-sm">{ledger.phone || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Device Fingerprint</span><span className="font-mono text-sm text-ellipsis overflow-hidden max-w-[200px]">{ledger.deviceFingerprint || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Browser Fingerprint</span><span className="font-mono text-sm text-ellipsis overflow-hidden max-w-[200px]">{ledger.browserFingerprint || "—"}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {ledger.accountDetails?.length > 0 && (
          <Card className="mb-8">
            <CardHeader><CardTitle>Linked Accounts ({ledger.accountDetails.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ledger.accountDetails.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{a.email || a.userId}</span>
                        <Badge variant={a.status === "ACTIVE" ? "default" : "secondary"}>{a.status}</Badge>
                        {a.oauthProvider && <Badge variant="outline">{a.oauthProvider}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {a.userId && <span className="font-mono text-xs">{a.userId}</span>}
                        {a.createdAt && <span> · Created {new Date(a.createdAt).toLocaleDateString()}</span>}
                      </p>
                    </div>
                    {a.usage && (
                      <div className="text-sm text-muted-foreground text-right">
                        <p>{a.usage.aiGenerations} AI · {a.usage.atsScans} ATS · {a.usage.resumes} resumes</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {ledger.fraudAlerts?.length > 0 && (
          <Card className="mb-8">
            <CardHeader><CardTitle>Fraud Alerts ({ledger.fraudAlerts.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ledger.fraudAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.severity === "CRITICAL" || alert.severity === "HIGH" ? "destructive" : "secondary"}>{alert.severity}</Badge>
                      <span className="font-medium">{alert.type.replace(/_/g, " ")}</span>
                      <Badge variant={alert.status === "OPEN" ? "default" : "outline"}>{alert.status}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {ledger.riskEvents?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Risk Event History ({ledger.riskEvents.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ledger.riskEvents.map((event: any) => (
                  <div key={event.id} className="flex items-start gap-4 border-b pb-2 last:border-0 text-sm">
                    <span className="text-muted-foreground shrink-0 w-32">{new Date(event.createdAt).toLocaleString()}</span>
                    <span className="font-medium shrink-0 w-36">{event.eventType.replace(/_/g, " ")}</span>
                    {event.riskDelta !== 0 && (
                      <span className={`shrink-0 w-20 ${event.riskDelta > 0 ? "text-red-500" : "text-green-500"}`}>
                        {event.riskDelta > 0 ? "+" : ""}{event.riskDelta}
                      </span>
                    )}
                    <span className="text-muted-foreground truncate">{JSON.stringify(event.details).slice(0, 100)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
