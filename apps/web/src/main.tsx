import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { appRouter } from "./routes/appRouter";
import "./index.css";

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
    <RouterProvider router={appRouter} />
    <Analytics />
  </StrictMode>,
);
