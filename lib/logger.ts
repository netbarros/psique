type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production" && level === "debug") return;

  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  const prefix = `[PSIQUE][${level.toUpperCase()}]`;
  const formattedContext = context ? ` ${JSON.stringify(context)}` : "";

  switch (level) {
    case "error":
      console.error(`${prefix} ${message}${formattedContext}`, entry);
      break;
    case "warn":
      console.warn(`${prefix} ${message}${formattedContext}`);
      break;
    default:
      if (process.env.NODE_ENV !== "production") {
        console.log(`${prefix} ${message}${formattedContext}`);
      }
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
  debug: (message: string, context?: Record<string, unknown>) => log("debug", message, context),
};
