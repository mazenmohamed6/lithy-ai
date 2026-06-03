import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/billing", "/resumes", "/settings", "/ats-scanner", "/job-match", "/cover-letters", "/linkedin", "/admin"];
const authPaths = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuth = authPaths.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAuth) {
    return NextResponse.next();
  }

  let session = null;
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = await createServerSupabaseClient();
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase auth timeout")), 5000)
      ),
    ]);
    session = (result as { data: { session: unknown } }).data.session;
  } catch {
    return NextResponse.next();
  }

  if (isProtected && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuth && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/callback).*)"],
};