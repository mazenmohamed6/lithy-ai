"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/admin/users").then(setUsers).catch(console.error);
  }, []);

  const filtered = users.filter((u) => u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="py-12">
      <div className="container max-w-6xl">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground mb-6">View and manage platform users.</p>
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Card>
          <CardHeader><CardTitle>Users ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filtered.map((user) => (
                <div key={user.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge>{user.role || "user"}</Badge>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-muted-foreground text-sm">No users found.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
