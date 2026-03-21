import { APP_NAME, APP_SUBTITLE, APP_VERSION } from "../../lib/version.ts";
import { HamburgerMenu } from "../Menu/HamburgerMenu.tsx";

export function Header() {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: "1px solid var(--c-border)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm"
          style={{
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
      </div>

      <HamburgerMenu />
    </div>
  );
}
