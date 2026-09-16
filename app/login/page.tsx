"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme, getColors, font } from "@/lib/use-theme";
import { Kicker, Display, primaryButton } from "@/components/ui/screen";
import { readNextParam } from "@/lib/next-redirect";

export default function LoginPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      // Defaults to /dashboard when there is no ?next=, so the plain sign-in
      // path is unchanged.
      router.push(readNextParam());
      router.refresh();
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(readNextParam())}`,
      },
    });
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center",
      background: c.background, fontFamily: font.headline, transition: "background 0.3s",
      padding: "calc(env(safe-area-inset-top, 0px) + 32px) 28px 32px",
    }}>
      <div className="dp-rise" style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: 15, background: c.co,
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22,
            boxShadow: "0 10px 30px rgba(43,74,226,.28)",
          }}
        >
          <span className="mso mso-fill" style={{ fontSize: 24, color: "#fff" }}>route</span>
        </div>

        <Kicker c={c} style={{ letterSpacing: "0.2em" }}>DutchPath</Kicker>
        <Display c={c} style={{ fontSize: 36, margin: "10px 0 8px" }}>Welkom terug</Display>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: c.ink70, margin: "0 0 26px" }}>
          Your streak is exactly where you left it.
        </p>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            gap: 10, padding: "15px 16px", borderRadius: 14,
            border: `1px solid ${c.line}`, background: c.card,
            cursor: "pointer", fontSize: 14.5, fontWeight: 600,
            fontFamily: font.headline, color: c.ink,
            opacity: googleLoading ? 0.6 : 1, transition: "all 0.2s",
          }}
          aria-label="Sign in with Google"
        >
          {googleLoading ? (
            <span className="mso" style={{ fontSize: 18, color: c.onSurfaceVariant, animation: "spin 1s linear infinite" }}>progress_activity</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: c.line }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: c.ink45, textTransform: "uppercase", letterSpacing: "0.16em" }}>or email</span>
          <div style={{ flex: 1, height: 1, background: c.line }} />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label htmlFor="email" style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 8, color: c.ink45, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Email address
            </label>
            <div style={{ position: "relative" }}>
              <span className="mso" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: c.ink25 }}>mail</span>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email"
                placeholder="you@example.com"
                style={{
                  width: "100%", boxSizing: "border-box", padding: "15px 16px 15px 44px", borderRadius: 14,
                  border: `1.5px solid ${c.line}`, background: c.card,
                  fontSize: 15, fontFamily: font.headline, color: c.ink,
                  outline: "none", transition: "border-color 0.2s",
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 8, color: c.ink45, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <span className="mso" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: c.ink25 }}>lock</span>
              <input
                id="password" type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: "100%", boxSizing: "border-box", padding: "15px 48px 15px 44px", borderRadius: 14,
                  border: `1.5px solid ${c.line}`, background: c.card,
                  fontSize: 15, fontFamily: font.headline, color: c.ink,
                  outline: "none", transition: "border-color 0.2s",
                }}
              />
              <button
                type="button" onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                  width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "transparent", border: "none", cursor: "pointer",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="mso" style={{ fontSize: 18, color: c.ink25 }}>
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div
              className="fm-fade-down"
              role="alert"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 14px", borderRadius: 14,
                background: c.rdSoft, color: c.rd,
                fontSize: 13, fontWeight: 600,
              }}
            >
              <span className="mso" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              ...primaryButton(c),
              opacity: loading ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading && <span className="mso" style={{ fontSize: 18, animation: "spin 1s linear infinite" }}>progress_activity</span>}
            Sign in
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: c.ink45, marginTop: 22 }}>
          No account yet?{" "}
          <Link href="/signup" style={{ color: c.co, fontWeight: 600, textDecoration: "none" }}>
            Sign up free
          </Link>
        </p>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
