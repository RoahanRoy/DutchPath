import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Cap how long the proxy will wait on Supabase Auth before giving up.
// Session refresh is best-effort: if Auth is slow, we must NOT block the
// whole request (that causes MIDDLEWARE_INVOCATION_TIMEOUT / 504). Route
// protection is enforced separately at the page/layout level via getUser().
const AUTH_REFRESH_TIMEOUT_MS = 2000;

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — best-effort, time-boxed. A slow or unreachable Auth
  // server must never take the site down; proceed with the existing cookies.
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((resolve) => setTimeout(resolve, AUTH_REFRESH_TIMEOUT_MS)),
    ]);
  } catch {
    // Swallow auth errors here; the page/layout getUser() handles real auth.
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    {
      // Run on page navigations only — skip static assets and, crucially,
      // skip router prefetch requests so hover-prefetching doesn't trigger a
      // getUser() round-trip on every link.
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
