import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? "https://backend-mazens-projects-a577fb62.vercel.app/api/v1" : "http://localhost:4000/api/v1");

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") ? nextParam : `/${nextParam}`;

  // Read fingerprint data from cookie (set by signup page before OAuth redirect)
  let metadata: Record<string, string> = {};
  try {
    const cookieStore = await cookies();
    const fpCookie = cookieStore.get("lithy_fp");
    if (fpCookie?.value) {
      const parsed = JSON.parse(decodeURIComponent(fpCookie.value));
      if (parsed.device) metadata.deviceFingerprint = parsed.device;
      if (parsed.browser) metadata.browserFingerprint = parsed.browser;
    }
  } catch {
    // Fingerprint cookie is optional
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await fetch(`${API_URL}/auth/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              phone: null,
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            }),
          });
        } catch {
          // Non-critical: user already exists in DB
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}?error=auth_callback_error`);
}
