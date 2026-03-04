import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "production",

  // Tracing: capture 10% in production, 100% in development
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Profiling: 10% of traced transactions
  profilesSampleRate: 0.1,

  // Ignore noisy errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ChunkLoadError",
    "Network request failed",
    "AbortError",
  ],

  // Add useful context to every event
  beforeSend(event) {
    // Scrub sensitive fields from request bodies
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      for (const key of ["password", "cpf", "token", "secret"]) {
        if (key in data) data[key] = "[REDACTED]";
      }
    }
    return event;
  },
});
