;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="6c2ea9f6-1ee2-51f0-c727-4d5e5052c9c2")}catch(e){}}();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/supabase/client.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-client] (ecmascript)");
;
function createClient() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createBrowserClient"])(("TURBOPACK compile-time value", "https://ojccqjjphunmidfkicml.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qY2NxampwaHVubWlkZmtpY21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODcxMDcsImV4cCI6MjA4ODE2MzEwN30.77Tp5rgBHzIvqTMjOmwPknpNoEdqrkNc9DvRYa7n2DE"));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clamp",
    ()=>clamp,
    "cn",
    ()=>cn,
    "formatBRL",
    ()=>formatBRL,
    "formatCPF",
    ()=>formatCPF,
    "formatDate",
    ()=>formatDate,
    "formatDateTime",
    ()=>formatDateTime,
    "formatDelta",
    ()=>formatDelta,
    "formatRelative",
    ()=>formatRelative,
    "formatTime",
    ()=>formatTime,
    "initials",
    ()=>initials,
    "sleep",
    ()=>sleep,
    "slugify",
    ()=>slugify,
    "truncate",
    ()=>truncate,
    "validateCPF",
    ()=>validateCPF,
    "validateCRP",
    ()=>validateCRP
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/date-fns/format.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$formatDistanceToNow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/formatDistanceToNow.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/parseISO.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$pt$2d$BR$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/locale/pt-BR.js [app-client] (ecmascript)");
;
;
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function formatBRL(value) {
    return `R$\u00A0${value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}
function formatDate(date, fmt = "dd/MM/yyyy") {
    const d = typeof date === "string" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseISO"])(date) : date;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(d, fmt, {
        locale: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$pt$2d$BR$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ptBR"]
    });
}
function formatTime(date) {
    const d = typeof date === "string" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseISO"])(date) : date;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(d, "HH:mm", {
        locale: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$pt$2d$BR$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ptBR"]
    });
}
function formatDateTime(date) {
    const d = typeof date === "string" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseISO"])(date) : date;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(d, "dd/MM/yyyy 'às' HH:mm", {
        locale: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$pt$2d$BR$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ptBR"]
    });
}
function formatRelative(date) {
    const d = typeof date === "string" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseISO"])(date) : date;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$formatDistanceToNow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDistanceToNow"])(d, {
        addSuffix: true,
        locale: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$locale$2f$pt$2d$BR$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ptBR"]
    });
}
function slugify(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}
function initials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function validateCRP(crp) {
    return /^\d{2}\/\d{5,6}$/.test(crp.trim());
}
function validateCPF(cpf) {
    const cleaned = cpf.replace(/\D/g, "");
    if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) return false;
    let sum = 0;
    for(let i = 0; i < 9; i++)sum += parseInt(cleaned[i]) * (10 - i);
    let rem = sum * 10 % 11;
    if (rem === 10 || rem === 11) rem = 0;
    if (rem !== parseInt(cleaned[9])) return false;
    sum = 0;
    for(let i = 0; i < 10; i++)sum += parseInt(cleaned[i]) * (11 - i);
    rem = sum * 10 % 11;
    if (rem === 10 || rem === 11) rem = 0;
    return rem === parseInt(cleaned[10]);
}
function formatCPF(cpf) {
    const c = cpf.replace(/\D/g, "");
    return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
function sleep(ms) {
    return new Promise((r)=>setTimeout(r, ms));
}
function truncate(str, maxLen) {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 3) + "...";
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function formatDelta(delta, suffix = "%") {
    const sign = delta >= 0 ? "+" : "";
    return `${sign}${delta.toFixed(1)}${suffix}`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/auth/login/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LoginPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/client.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function LoginPage() {
    _s();
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("login");
    const [role, setRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("therapist");
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        name: "",
        email: "",
        pass: "",
        crp: ""
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [err, setErr] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createClient"])();
    const upd = (k)=>(e)=>setForm((f)=>({
                    ...f,
                    [k]: e.target.value
                }));
    const submit = async ()=>{
        setLoading(true);
        setErr("");
        if (!form.email.includes("@")) {
            setErr("Email inválido");
            setLoading(false);
            return;
        }
        if (mode === "register" && role === "therapist" && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateCRP"])(form.crp)) {
            setErr("CRP inválido. Formato esperado: 06/98421");
            setLoading(false);
            return;
        }
        try {
            if (mode === "login") {
                const { error } = await supabase.auth.signInWithPassword({
                    email: form.email,
                    password: form.pass
                });
                if (error) throw error;
                router.push(role === "patient" ? "/portal" : "/dashboard");
                return;
            }
            if (mode === "register") {
                const { data, error } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.pass,
                    options: {
                        data: {
                            name: form.name,
                            role,
                            crp: form.crp
                        }
                    }
                });
                if (error) throw error;
                if (data.user) {
                    router.push("/dashboard/onboarding");
                }
                return;
            }
            const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
                redirectTo: `${window.location.origin}/auth/callback?type=recovery`
            });
            if (error) throw error;
            setErr("");
            alert("Email de recuperação enviado!");
            setMode("login");
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Erro desconhecido";
            setErr(translateAuthError(msg));
        } finally{
            setLoading(false);
        }
    };
    const signInWithGoogle = async ()=>{
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
    };
    const sendMagicLink = async ()=>{
        if (!form.email.includes("@")) {
            setErr("Informe seu email primeiro");
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email: form.email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });
        setLoading(false);
        if (error) setErr(error.message);
        else alert(`Magic link enviado para ${form.email}!`);
    };
    function translateAuthError(msg) {
        if (msg.includes("Invalid login credentials")) return "Email ou senha incorretos";
        if (msg.includes("Email not confirmed")) return "Confirme seu email antes de entrar";
        if (msg.includes("User already registered")) return "Este email já está cadastrado";
        if (msg.includes("Password should be at least")) return "Senha deve ter pelo menos 6 caracteres";
        return msg;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-[var(--color-bg-base)] lg:grid lg:grid-cols-[1.3fr_1fr]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "hidden border-r border-[var(--color-border-subtle)] px-12 py-16 lg:flex lg:flex-col lg:justify-center xl:px-20",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-4 text-[52px] leading-none text-[var(--color-brand)]",
                        children: "Ψ"
                    }, void 0, false, {
                        fileName: "[project]/app/auth/login/page.tsx",
                        lineNumber: 116,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "mb-5 whitespace-pre-line font-[family-name:var(--font-display)] text-[64px] font-light leading-[1.03] tracking-tight text-[var(--color-text-primary)]",
                        children: mode === "login" ? "Bem-vindo\nde volta." : "Comece\nhoje mesmo."
                    }, void 0, false, {
                        fileName: "[project]/app/auth/login/page.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "max-w-[520px] text-[17px] leading-8 text-[var(--color-text-secondary)]",
                        children: "A plataforma que cuida de quem cuida: IA clínica, Telegram bot e prontuário LGPD em um só lugar."
                    }, void 0, false, {
                        fileName: "[project]/app/auth/login/page.tsx",
                        lineNumber: 120,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-10 flex flex-col gap-4",
                        children: [
                            {
                                icon: "✦",
                                text: "IA com Claude, GPT-4o, Gemini"
                            },
                            {
                                icon: "✦",
                                text: "Telegram Bot automático"
                            },
                            {
                                icon: "✦",
                                text: "KPIs e prontuário LGPD"
                            }
                        ].map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 text-[15px] text-[var(--color-text-secondary)]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[var(--color-brand)]",
                                        children: item.icon
                                    }, void 0, false, {
                                        fileName: "[project]/app/auth/login/page.tsx",
                                        lineNumber: 131,
                                        columnNumber: 15
                                    }, this),
                                    item.text
                                ]
                            }, item.text, true, {
                                fileName: "[project]/app/auth/login/page.tsx",
                                lineNumber: 130,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/auth/login/page.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/auth/login/page.tsx",
                lineNumber: 115,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "flex w-full flex-col justify-center bg-[var(--color-bg-elevated)] px-5 py-8 sm:px-8 lg:px-12 xl:px-16",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-auto w-full max-w-[620px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6 flex gap-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-1",
                            children: [
                                {
                                    v: "therapist",
                                    l: "Psicanalista"
                                },
                                {
                                    v: "patient",
                                    l: "Paciente"
                                }
                            ].map((item)=>{
                                const active = role === item.v;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setRole(item.v),
                                    className: `flex-1 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${active ? "border border-[rgba(82,183,136,.3)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"}`,
                                    children: item.l
                                }, item.v, false, {
                                    fileName: "[project]/app/auth/login/page.tsx",
                                    lineNumber: 149,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/app/auth/login/page.tsx",
                            lineNumber: 140,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "mb-1 font-[family-name:var(--font-display)] text-[42px] font-light leading-none text-[var(--color-text-primary)]",
                            children: mode === "login" ? "Acessar conta" : mode === "register" ? "Criar conta grátis" : "Recuperar senha"
                        }, void 0, false, {
                            fileName: "[project]/app/auth/login/page.tsx",
                            lineNumber: 165,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mb-6 text-[14px] text-[var(--color-text-muted)]",
                            children: role === "therapist" ? "Painel clínico completo" : "Sua jornada terapêutica começa aqui"
                        }, void 0, false, {
                            fileName: "[project]/app/auth/login/page.tsx",
                            lineNumber: 172,
                            columnNumber: 11
                        }, this),
                        err && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4 rounded-xl border border-[#f87171]/35 bg-[#f87171]/12 px-4 py-3 text-[13px] text-[#f87171]",
                            children: err
                        }, void 0, false, {
                            fileName: "[project]/app/auth/login/page.tsx",
                            lineNumber: 177,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-3.5",
                            children: [
                                mode === "register" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    name: "name",
                                    className: "w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-[14px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]",
                                    placeholder: role === "therapist" ? "Nome (Dr./Dra.)" : "Seu nome completo",
                                    value: form.name,
                                    onChange: upd("name"),
                                    "aria-label": "Nome"
                                }, void 0, false, {
                                    fileName: "[project]/app/auth/login/page.tsx",
                                    lineNumber: 184,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-[14px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]",
                                    placeholder: "Email",
                                    type: "email",
                                    value: form.email,
                                    onChange: upd("email"),
                                    "aria-label": "Email",
                                    autoComplete: "email"
                                }, void 0, false, {
                                    fileName: "[project]/app/auth/login/page.tsx",
                                    lineNumber: 194,
                                    columnNumber: 13
                                }, this),
                                mode !== "forgot" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-[14px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]",
                                    placeholder: "Senha",
                                    type: "password",
                                    value: form.pass,
                                    onChange: upd("pass"),
                                    "aria-label": "Senha",
                                    autoComplete: mode === "login" ? "current-password" : "new-password"
                                }, void 0, false, {
                                    fileName: "[project]/app/auth/login/page.tsx",
                                    lineNumber: 205,
                                    columnNumber: 15
                                }, this),
                                mode === "register" && role === "therapist" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-[14px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]",
                                    placeholder: "CRP (ex: 06/98421)",
                                    value: form.crp,
                                    onChange: upd("crp"),
                                    "aria-label": "Número CRP"
                                }, void 0, false, {
                                    fileName: "[project]/app/auth/login/page.tsx",
                                    lineNumber: 217,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/auth/login/page.tsx",
                            lineNumber: 182,
                            columnNumber: 11
                        }, this),
                        mode === "login" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>setMode("forgot"),
                            className: "mt-2 self-end text-[12px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]",
                            children: "Esqueci a senha"
                        }, void 0, false, {
                            fileName: "[project]/app/auth/login/page.tsx",
                            lineNumber: 228,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: submit,
                            disabled: loading,
                            "aria-label": mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Enviar link",
                            className: `mt-5 flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[20px] font-semibold transition-colors ${loading ? "cursor-not-allowed border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-muted)]" : "bg-[var(--color-brand)] text-[#060E09] hover:bg-[var(--color-brand-hover)]"}`,
                            children: loading ? "..." : mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Enviar link"
                        }, void 0, false, {
                            fileName: "[project]/app/auth/login/page.tsx",
                            lineNumber: 237,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "my-4 flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-px flex-1 bg-[var(--color-border-subtle)]"
                                }, void 0, false, {
                                    fileName: "[project]/app/auth/login/page.tsx",
                                    lineNumber: 258,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-[11px] text-[var(--color-text-muted)]",
                                    children: "ou continue com"
                                }, void 0, false, {
                                    fileName: "[project]/app/auth/login/page.tsx",
                                    lineNumber: 259,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-px flex-1 bg-[var(--color-border-subtle)]"
                                }, void 0, false, {
                                    fileName: "[project]/app/auth/login/page.tsx",
                                    lineNumber: 260,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/auth/login/page.tsx",
                            lineNumber: 257,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: signInWithGoogle,
                            className: "mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2.5 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-bold",
                                    children: "G"
                                }, void 0, false, {
                                    fileName: "[project]/app/auth/login/page.tsx",
                                    lineNumber: 268,
                                    columnNumber: 13
                                }, this),
                                " Continuar com Google"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/auth/login/page.tsx",
                            lineNumber: 263,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: sendMagicLink,
                            disabled: loading,
                            className: `w-full rounded-xl border px-4 py-2.5 text-[13px] transition-colors ${loading ? "cursor-not-allowed border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-muted)]" : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"}`,
                            children: "Enviar magic link"
                        }, void 0, false, {
                            fileName: "[project]/app/auth/login/page.tsx",
                            lineNumber: 271,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-5 text-center text-[13px] text-[var(--color-text-muted)]",
                            children: [
                                mode === "login" ? "Ainda não tem conta?" : "Já possui conta?",
                                " ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setMode(mode === "login" ? "register" : "login"),
                                    className: "font-medium text-[var(--color-brand)] transition-colors hover:text-[var(--color-brand-hover)]",
                                    children: mode === "login" ? "Criar conta" : "Entrar"
                                }, void 0, false, {
                                    fileName: "[project]/app/auth/login/page.tsx",
                                    lineNumber: 286,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/auth/login/page.tsx",
                            lineNumber: 284,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/auth/login/page.tsx",
                    lineNumber: 139,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/auth/login/page.tsx",
                lineNumber: 138,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/auth/login/page.tsx",
        lineNumber: 114,
        columnNumber: 5
    }, this);
}
_s(LoginPage, "HaS/fTxLJ2Nt4halUzUq4vvfhNs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = LoginPage;
var _c;
__turbopack_context__.k.register(_c, "LoginPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# debugId=6c2ea9f6-1ee2-51f0-c727-4d5e5052c9c2
//# sourceMappingURL=_07c6bd37._.js.map