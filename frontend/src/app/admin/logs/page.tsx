"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.get("/admin/logs").then(setLogs).catch(console.error);
  }, []);

  return (
    <div className="py-12">
      <div className="container max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Audit Logs</h1>
        <Card>
          <CardContent>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 border-b pb-2 last:border-0 text-sm">
                  <span className="text-muted-foreground shrink-0 w-32">{new Date(log.createdAt).toLocaleString()}</span>
                  <span className="font-medium shrink-0 w-24">{log.action}</span>
                  <span className="text-muted-foreground truncate">{log.details}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-muted-foreground text-sm py-4">No audit logs yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
