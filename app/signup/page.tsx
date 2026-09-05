"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme, getColors } from "@/lib/use-theme";
import { readNextParam } from "@/lib/next-redirect";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

export default function SignupPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordStrong = password.length >= 8;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!passwordStrong) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(readNextParam())}`,
      },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setSuccess(true);
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

  if (success) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: c.background, padding: "16px 24px",
        fontFamily: font.headline, transition: "background 0.3s",
      }}>
        <div
          className="fm-scale-in"
          style={{
            textAlign: "center", maxWidth: 400, padding: 40,
            background: c.surfaceLowest, borderRadius: 28,
            boxShadow: "0px 12px 48px rgba(26,28,27,0.08)",
          }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: 9999, margin: "0 auto 24px",
            background: `${c.primary}15`, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="mso mso-fill" style={{ fontSize: 40, color: c.primary }}>check_circle</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: c.onSurface, marginBottom: 12 }}>Check your email!</h2>
          <p style={{ color: c.onSurfaceVariant, fontSize: 14, lineHeight: 1.6 }}>
            We sent a confirmation link to <strong style={{ color: c.onSurface }}>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 28, color: c.primary, fontWeight: 700,
            fontSize: 14, textDecoration: "none",
          }}>
            <span className="mso" style={{ fontSize: 18 }}>arrow_back</span>
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: c.background, padding: "16px 24px",
      fontFamily: font.headline, transition: "background 0.3s",
    }}>
      {/* Logo */}
      <div
        className="fm-fade-down"
        style={{ marginBottom: 40, textAlign: "center" }}
      >
        <div style={{ fontSize: 56, marginBottom: 8 }} aria-hidden="true">🇳🇱</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em", margin: 0 }}>
          DutchPath
        </h1>
        <p style={{ color: c.onSurfaceVariant, marginTop: 6, fontSize: 14, fontWeight: 500 }}>
          Start your Inburgering journey today
        </p>
      </div>

      {/* Card */}
      <div
        className="fm-fade-up-lg"
        style={{
          animationDelay: "0.1s",
          width: "100%", maxWidth: 400, background: c.surfaceLowest,
          borderRadius: 28, padding: 32,
          boxShadow: "0px 12px 48px rgba(26,28,27,0.08)",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: c.onSurface, marginBottom: 28, letterSpacing: "-0.025em" }}>
          Create your account
        </h2>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            gap: 12, padding: "14px 16px", borderRadius: 16,
            border: `1.5px solid ${c.outlineVariant}`, background: "transparent",
            cursor: "pointer", fontSize: 14, fontWeight: 600,
            fontFamily: font.headline, color: c.onSurface,
            opacity: googleLoading ? 0.6 : 1, transition: "all 0.2s",
          }}
          aria-label="Sign up with Google"
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
          <div style={{ flex: 1, height: 1, background: c.outlineVariant }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: c.outline, textTransform: "uppercase", letterSpacing: "0.1em" }}>or</span>
          <div style={{ flex: 1, height: 1, background: c.outlineVariant }} />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label htmlFor="email" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Email address
            </label>
            <div style={{ position: "relative" }}>
              <span className="mso" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: c.outline }}>mail</span>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email"
                placeholder="you@example.com"
                style={{
                  width: "100%", padding: "14px 14px 14px 44px", borderRadius: 14,
                  border: `1.5px solid ${c.outlineVariant}`, background: c.surfaceLow,
                  fontSize: 14, fontFamily: font.headline, color: c.onSurface,
                  outline: "none", transition: "border-color 0.2s",
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 8, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <span className="mso" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: c.outline }}>lock</span>
              <input
                id="password" type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                required autoComplete="new-password"
                placeholder="min. 8 characters"
                style={{
                  width: "100%", padding: "14px 48px 14px 44px", borderRadius: 14,
                  border: `1.5px solid ${c.outlineVariant}`, background: c.surfaceLow,
                  fontSize: 14, fontFamily: font.headline, color: c.onSurface,
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
                <span className="mso" style={{ fontSize: 18, color: c.outline }}>
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {/* Password strength */}
            {password.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <div style={{
                  flex: 1, height: 4, borderRadius: 9999, overflow: "hidden",
                  background: c.surfaceHighest,
                }}>
                  <div style={{
                    height: "100%", borderRadius: 9999, transition: "width 0.3s, background 0.3s",
                    width: passwordStrong ? "100%" : `${Math.min(password.length / 8 * 100, 80)}%`,
                    background: passwordStrong ? "#16a34a" : c.error,
                  }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: passwordStrong ? "#16a34a" : c.error }}>
                  {passwordStrong ? "Strong" : "Too short"}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div
              className="fm-fade-down"
              role="alert"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 16px", borderRadius: 12,
                background: `${c.error}15`, color: c.error,
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
              width: "100%", padding: 16, borderRadius: 9999, border: "none",
              cursor: "pointer", fontSize: 15, fontWeight: 700,
              fontFamily: font.headline, color: "#fff",
              background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
              boxShadow: `0 10px 20px -5px ${c.primary}40`,
              opacity: loading ? 0.6 : 1, transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading && <span className="mso" style={{ fontSize: 18, animation: "spin 1s linear infinite" }}>progress_activity</span>}
            Create account
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 14, color: c.onSurfaceVariant, marginTop: 24, fontWeight: 500 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: c.primary, fontWeight: 700, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
