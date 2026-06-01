"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminContentPage() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    api.get("/admin/content").then(setPosts).catch(console.error);
  }, []);

  return (
    <div className="py-12">
      <div className="container max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Content Management</h1>
        <Card>
          <CardHeader><CardTitle>Blog Posts ({posts.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="text-sm text-muted-foreground">{post.slug} — {post.published ? "Published" : "Draft"}</p>
                  </div>
                </div>
              ))}
              {posts.length === 0 && <p className="text-muted-foreground text-sm">No blog posts yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
