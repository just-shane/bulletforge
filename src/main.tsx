import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { init as plausibleInit } from "@plausible-analytics/tracker";
import "./index.css";
import App from "./App.tsx";

// Initialize Sentry (production only)
Sentry.init({
  dsn: "https://placeholder@sentry.io/0",
  enabled: import.meta.env.PROD,
  tracesSampleRate: 0.1,
});

// Initialize Plausible analytics
plausibleInit({
  domain: "bulletforge.io",
});

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
