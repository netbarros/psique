import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "production",

  // Client-side tracing
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay 1% of sessions, 100% with errors
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask sensitive input values in recordings
      maskAllInputs: true,
      blockAllMedia: false,
    }),
  ],

  // Ignore common noise
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ChunkLoadError",
    "Network request failed",
    "AbortError",
    /Loading chunk \d+ failed/,
  ],
});
