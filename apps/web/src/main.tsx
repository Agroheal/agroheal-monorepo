import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { appRouter } from "./routes/appRouter";
import { AutoUpdateWatcher } from "./components/common/AutoUpdateWatcher";
import "./index.css";

// Auto-recover from stale chunks after new deployments
window.addEventListener("vite:preloadError", (event) => {
  console.warn("[AgroHeal] Preload error detected. Reloading page to fetch latest deployment...", event);
  window.location.reload();
});

Sentry.init({
  dsn: "https://b74e0d2a3ed4c6b73902514350956ee3@o4511001958416384.ingest.de.sentry.io/4511001967722576",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  release: "agroheal@0.0.0",
  tracePropagationTargets: ["localhost", /^https:\/\/agroheal\.solutions/],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: true,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AutoUpdateWatcher />
    <RouterProvider router={appRouter} />
    <Analytics />
  </StrictMode>,
);
