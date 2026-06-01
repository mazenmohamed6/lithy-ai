"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSupabase } from "@/providers/supabase-provider";
import { APP_NAME } from "@/lib/constants";

export function Header() {
  const pathname = usePathname();
  const { user, signOut } = useSupabase();
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/resumes");

  if (isAuthPage) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <span className="text-xl font-bold">{APP_NAME}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {isDashboard ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">Dashboard</Link>
                <Link href="/ats-scanner" className="text-sm font-medium text-muted-foreground hover:text-foreground">ATS Scanner</Link>
                <Link href="/cover-letters" className="text-sm font-medium text-muted-foreground hover:text-foreground">Cover Letters</Link>
                <Link href="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground">Blog</Link>
              </>
            ) : (
              <>
                <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground">Features</Link>
                <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">Pricing</Link>
                <Link href="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground">Blog</Link>
                <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">About</Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
