import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { APP_VERSION } from "./lib/version.ts";
import "./lib/analytics.ts";
import "./index.css";
import App from "./App.tsx";

// Initialize Sentry (production only)
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD,
  tracesSampleRate: 0.1,
  release: `bulletforge@${APP_VERSION}`,
});

// Register service worker for offline support
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration failed — app still works fine without it
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-400 font-mono text-sm">
          Something went wrong. Please refresh the page.
        </div>
      }
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
