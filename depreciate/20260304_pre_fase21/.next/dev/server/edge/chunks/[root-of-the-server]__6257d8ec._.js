(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__6257d8ec._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[project]/sentry.server.config.ts [instrumentation-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$edge$2f$index$2e$js__$5b$instrumentation$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@sentry/nextjs/build/esm/edge/index.js [instrumentation-edge] (ecmascript) <locals>");
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$edge$2f$index$2e$js__$5b$instrumentation$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__["init"]({
    dsn: process.env.SENTRY_DSN,
    environment: ("TURBOPACK compile-time value", "development") ?? "production",
    // Tracing: capture 10% in production, 100% in development
    tracesSampleRate: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 1.0,
    // Profiling: 10% of traced transactions
    profilesSampleRate: 0.1,
    // Ignore noisy errors
    ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "ChunkLoadError",
        "Network request failed",
        "AbortError"
    ],
    // Add useful context to every event
    beforeSend (event) {
        // Scrub sensitive fields from request bodies
        if (event.request?.data) {
            const data = event.request.data;
            for (const key of [
                "password",
                "cpf",
                "token",
                "secret"
            ]){
                if (key in data) data[key] = "[REDACTED]";
            }
        }
        return event;
    }
});
}),
"[project]/instrumentation.ts [instrumentation-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$sentry$2e$server$2e$config$2e$ts__$5b$instrumentation$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/sentry.server.config.ts [instrumentation-edge] (ecmascript)");
globalThis["__SENTRY_SERVER_MODULES__"] = {
    "@hookform/resolvers": "^5.2.2",
    "@react-pdf/renderer": "^4.3.2",
    "@sentry/nextjs": "^10.42.0",
    "@stripe/stripe-js": "^8.9.0",
    "@supabase/ssr": "^0.9.0",
    "@supabase/supabase-js": "^2.98.0",
    "@upstash/ratelimit": "^2.0.8",
    "@upstash/redis": "^1.36.3",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.2.0",
    "framer-motion": "^12.34.5",
    "lucide-react": "^0.576.0",
    "nanoid": "^5.1.6",
    "next": "16.1.6",
    "openai": "^6.25.0",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-hook-form": "^7.71.2",
    "resend": "^6.9.3",
    "sonner": "^2.0.7",
    "stripe": "^20.4.0",
    "tailwind-merge": "^3.5.0",
    "zod": "^4.3.6",
    "@playwright/test": "^1.58.2",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "babel-plugin-react-compiler": "1.0.0",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "typescript": "^5"
};
globalThis["_sentryNextJsVersion"] = "16.1.6";
;
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__6257d8ec._.js.map