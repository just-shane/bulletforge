import { useBallisticsStore } from "../../store/store.ts";
import { APP_VERSION, APP_NAME, APP_SUBTITLE } from "../../lib/version.ts";

export function Header() {
  const setGlossaryOpen = useBallisticsStore((s) => s.setGlossaryOpen);
  const setDocsOpen = useBallisticsStore((s) => s.setDocsOpen);

  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: "1px solid #2a2a2a" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm"
          style={{
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
            color: "#fff",
          }}
        >
          BF
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-neutral-200">
            {APP_NAME}
          </div>
          <div className="text-[10px] font-mono text-neutral-500">
            {APP_SUBTITLE.toUpperCase()} v{APP_VERSION}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setGlossaryOpen(true)}
          className="px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-all"
          style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            color: "#737373",
          }}
        >
          Glossary
        </button>
        <button
          onClick={() => setDocsOpen(true)}
          className="px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-all"
          style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            color: "#737373",
          }}
        >
          Docs
        </button>
        <div className="text-[9px] font-mono text-right leading-relaxed text-neutral-600 max-sm:hidden">
          BULLETFORGE.IO
          <br />
          EST. 2026
        </div>
      </div>
    </div>
  );
}
