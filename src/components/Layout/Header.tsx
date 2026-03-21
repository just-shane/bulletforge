import { APP_NAME, APP_SUBTITLE, APP_VERSION } from "../../lib/version.ts";
import { useBallisticsStore } from "../../store/store.ts";
import { HamburgerMenu } from "../Menu/HamburgerMenu.tsx";

export function Header() {
  const user = useBallisticsStore((s) => s.user);
  const setAuthModalOpen = useBallisticsStore((s) => s.setAuthModalOpen);

  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: "1px solid var(--c-border)" }}
    >
      <a
        href="/"
        className="flex items-center gap-3 no-underline"
        style={{ textDecoration: "none" }}
      >
        <div
          className="rounded-md flex items-center justify-center font-bold text-sm shrink-0"
          style={{
            width: 40,
            height: 40,
            background: "linear-gradient(135deg, var(--c-logo-from), var(--c-logo-to))",
            color: "#fff",
          }}
        >
          BF
        </div>
        <div>
          <div className="text-base font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
            {APP_NAME}
          </div>
          <div className="text-[10px] font-mono" style={{ color: "var(--c-text-dim)" }}>
            {APP_SUBTITLE.toUpperCase()} v{APP_VERSION}
          </div>
        </div>
      </a>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setAuthModalOpen(true)}
          className="rounded-md px-3 py-1.5 text-[10px] font-mono tracking-wide cursor-pointer transition-colors"
          style={{
            background: user ? "var(--c-accent-glow)" : "var(--c-panel)",
            border: `1px solid ${user ? "var(--c-accent)" : "var(--c-border)"}`,
            color: user ? "var(--c-accent)" : "var(--c-text-muted)",
          }}
        >
          {user ? user.email?.split("@")[0] : "Sign In"}
        </button>
        <HamburgerMenu />
      </div>
    </div>
  );
}
