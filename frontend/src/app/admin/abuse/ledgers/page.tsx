"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const RISK_COLORS: Record<string, string> = {
  NORMAL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MONITOR: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  SUSPICIOUS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  HIGH_RISK: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AdminAbuseLedgersPage() {
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState(searchParams?.get("riskLevel") || "ALL");
  const [sort, setSort] = useState(searchParams?.get("sort") || "updated");

  const fetchLedgers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", sort });
      if (riskFilter !== "ALL") params.set("riskLevel", riskFilter);
      if (search) params.set("search", search);
      const data = await api.get(`/admin/abuse/ledgers?${params}`);
      setLedgers(data.ledgers);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load ledgers");
    }
  }, [page, search, riskFilter, sort]);

  useEffect(() => { fetchLedgers(); }, [fetchLedgers]);

  return (
    <div className="py-12">
      <div className="container max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Identity Ledgers</h1>
            <p className="text-muted-foreground mt-1">{total} tracked identities</p>
          </div>
          <Link href="/admin/abuse"><Button variant="outline">Back to Overview</Button></Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by email, phone, or user ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}>
            <option value="ALL">All Risk Levels</option>
            <option value="NORMAL">Normal</option>
            <option value="MONITOR">Monitor</option>
            <option value="SUSPICIOUS">Suspicious</option>
            <option value="HIGH_RISK">High Risk</option>
          </select>
          <select className="border rounded-md px-3 py-2 text-sm bg-background" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="updated">Last Updated</option>
            <option value="risk">Risk Score</option>
            <option value="created">Created</option>
            <option value="usage">Usage</option>
          </select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {ledgers.map((ledger: any) => {
                const firstAccount = ledger.linkedAccounts?.[0];
                const openAlerts = ledger.fraudAlerts?.length || 0;
                const accountCount = ledger._count?.linkedAccounts ?? ledger.linkedAccounts?.length ?? 0;
                const eventCount = ledger._count?.riskEvents ?? 0;

                return (
                  <Link key={ledger.id} href={`/admin/abuse/ledgers/${ledger.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${RISK_COLORS[ledger.riskLevel] || ""}`}>{ledger.riskLevel}</span>
                        <span className="font-medium truncate">{firstAccount?.email || ledger.phone || "No email"}</span>
                        {openAlerts > 0 && <Badge variant="destructive" className="text-xs">{openAlerts} alert{openAlerts > 1 ? "s" : ""}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Risk: {ledger.riskScore}/100 · {accountCount} account{accountCount !== 1 ? "s" : ""} · {eventCount} events
                        {ledger.freePlanExhausted && " · Free plan exhausted"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground shrink-0 ml-4">
                      <p>AI: {ledger.totalAiGenerations}</p>
                      <p>ATS: {ledger.totalAtsScans}</p>
                    </div>
                  </Link>
                );
              })}
              {ledgers.length === 0 && (
                <div className="px-6 py-12 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No identities found matching your criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
