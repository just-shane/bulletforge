import { useState } from "react";
import { useBallisticsStore } from "../../store/store.ts";
import { signUp, signIn, signInWithMagicLink, signOut } from "../../lib/supabase.ts";

type AuthMode = "signin" | "signup" | "magic";

export function AuthModal() {
  const authModalOpen = useBallisticsStore((s) => s.authModalOpen);
  const setAuthModalOpen = useBallisticsStore((s) => s.setAuthModalOpen);
  const user = useBallisticsStore((s) => s.user);

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "magic") {
        await signInWithMagicLink(email);
        setMagicLinkSent(true);
      } else if (mode === "signup") {
        await signUp(email, password);
        setAuthModalOpen(false);
      } else {
        await signIn(email, password);
        setAuthModalOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setAuthModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed");
    }
  };

  const close = () => {
    setAuthModalOpen(false);
    setError("");
    setMagicLinkSent(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className="w-full max-w-sm rounded-lg shadow-2xl"
        style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--c-border)" }}
        >
          <div className="text-sm font-bold font-mono" style={{ color: "var(--c-text)" }}>
            {user ? "Account" : mode === "signup" ? "Create Account" : "Sign In"}
          </div>
          <button
            onClick={close}
            className="text-lg cursor-pointer"
            style={{ color: "var(--c-text-dim)", background: "none", border: "none" }}
          >
            &times;
          </button>
        </div>

        <div className="p-5">
          {user ? (
            /* ─── Signed-in view ─── */
            <div className="space-y-4">
              <div
                className="rounded-md px-3 py-2 text-[11px] font-mono"
                style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
              >
                <div style={{ color: "var(--c-text-dim)" }}>Signed in as</div>
                <div style={{ color: "var(--c-accent)" }}>{user.email}</div>
              </div>
              <p className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}>
                Your rifle profiles, performance records, and load calibrations sync to the cloud automatically.
              </p>
              <button
                onClick={handleSignOut}
                className="w-full rounded-md px-3 py-2 text-[11px] font-mono tracking-wide cursor-pointer transition-colors"
                style={{
                  background: "var(--c-panel)",
                  border: "1px solid var(--c-border)",
                  color: "var(--c-text-muted)",
                }}
              >
                Sign Out
              </button>
            </div>
          ) : magicLinkSent ? (
            /* ─── Magic link confirmation ─── */
            <div className="space-y-4">
              <div
                className="rounded-md px-3 py-3 text-[11px] font-mono"
                style={{ background: "var(--c-accent-glow)", border: "1px solid var(--c-accent)", color: "var(--c-text)" }}
              >
                Check your email for a sign-in link. You can close this dialog.
              </div>
              <button
                onClick={close}
                className="w-full rounded-md px-3 py-2 text-[11px] font-mono tracking-wide cursor-pointer"
                style={{ background: "var(--c-accent)", border: "none", color: "#fff" }}
              >
                Done
              </button>
            </div>
          ) : (
            /* ─── Sign-in / Sign-up form ─── */
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div
                  className="rounded-md px-3 py-2 text-[10px] font-mono"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
                >
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono mb-1" style={{ color: "var(--c-text-dim)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md px-3 py-2 text-[11px] font-mono outline-none"
                  style={{
                    background: "var(--c-surface)",
                    border: "1px solid var(--c-border)",
                    color: "var(--c-text)",
                  }}
                  placeholder="you@example.com"
                />
              </div>

              {mode !== "magic" && (
                <div>
                  <label className="block text-[10px] font-mono mb-1" style={{ color: "var(--c-text-dim)" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-md px-3 py-2 text-[11px] font-mono outline-none"
                    style={{
                      background: "var(--c-surface)",
                      border: "1px solid var(--c-border)",
                      color: "var(--c-text)",
                    }}
                    placeholder={mode === "signup" ? "Min 6 characters" : "Password"}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md px-3 py-2.5 text-[11px] font-mono font-bold tracking-wide cursor-pointer transition-colors"
                style={{
                  background: "var(--c-accent)",
                  border: "none",
                  color: "#fff",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading
                  ? "..."
                  : mode === "magic"
                    ? "Send Magic Link"
                    : mode === "signup"
                      ? "Create Account"
                      : "Sign In"}
              </button>

              {/* Mode switchers */}
              <div className="flex flex-col gap-1.5 pt-2" style={{ borderTop: "1px solid var(--c-border)" }}>
                {mode === "signin" && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setMode("signup"); setError(""); }}
                      className="text-[10px] font-mono cursor-pointer"
                      style={{ color: "var(--c-accent)", background: "none", border: "none" }}
                    >
                      Don't have an account? Sign up
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode("magic"); setError(""); }}
                      className="text-[10px] font-mono cursor-pointer"
                      style={{ color: "var(--c-text-dim)", background: "none", border: "none" }}
                    >
                      Sign in with magic link instead
                    </button>
                  </>
                )}
                {mode === "signup" && (
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(""); }}
                    className="text-[10px] font-mono cursor-pointer"
                    style={{ color: "var(--c-accent)", background: "none", border: "none" }}
                  >
                    Already have an account? Sign in
                  </button>
                )}
                {mode === "magic" && (
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(""); }}
                    className="text-[10px] font-mono cursor-pointer"
                    style={{ color: "var(--c-accent)", background: "none", border: "none" }}
                  >
                    Sign in with password instead
                  </button>
                )}
              </div>

              <p className="text-[9px] font-mono pt-1" style={{ color: "var(--c-text-faint)" }}>
                Sign in to sync your data across devices. No account required for the calculator.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
