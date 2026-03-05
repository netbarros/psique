;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="e6c25201-08e5-6d9e-ce03-a08f3a5a415d")}catch(e){}}();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
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
"[project]/app/booking/[slug]/BookingClient.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BookingClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const DAYS = [
    "Dom",
    "Seg",
    "Ter",
    "Qua",
    "Qui",
    "Sex",
    "Sáb"
];
function BookingClient({ therapistId, therapistName, sessionPrice, sessionDuration, availabilitySlots, bookedTimes, slug }) {
    _s();
    const [selectedSlot, setSelectedSlot] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("select");
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        name: "",
        email: "",
        phone: "",
        cpf: ""
    });
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const formId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    // Generate next 21 days with available slots
    const daysWithSlots = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "BookingClient.useMemo[daysWithSlots]": ()=>{
            const slotsByDay = {};
            for (const slot of availabilitySlots){
                if (!slotsByDay[slot.day_of_week]) slotsByDay[slot.day_of_week] = [];
                slotsByDay[slot.day_of_week].push(slot);
            }
            const result = [];
            for(let i = 1; i <= 21; i++){
                const d = new Date();
                d.setDate(d.getDate() + i);
                d.setHours(0, 0, 0, 0);
                const dow = d.getDay();
                if (!slotsByDay[dow]) continue;
                const times = [];
                for (const slot of slotsByDay[dow]){
                    const generated = generateTimeSlots(slot.start_time, slot.end_time, sessionDuration);
                    for (const t of generated){
                        const [h, m] = t.split(":").map(Number);
                        const slotDate = new Date(d);
                        slotDate.setHours(h, m, 0, 0);
                        const iso = slotDate.toISOString();
                        const isBooked = bookedTimes.some({
                            "BookingClient.useMemo[daysWithSlots].isBooked": (b)=>Math.abs(new Date(b).getTime() - slotDate.getTime()) < 3600000
                        }["BookingClient.useMemo[daysWithSlots].isBooked"]);
                        times.push({
                            time: t,
                            iso,
                            booked: isBooked
                        });
                    }
                }
                if (times.length > 0) {
                    result.push({
                        date: d,
                        dayOfWeek: dow,
                        label: d.toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit"
                        }),
                        times
                    });
                }
            }
            return result;
        }
    }["BookingClient.useMemo[daysWithSlots]"], [
        availabilitySlots,
        bookedTimes,
        sessionDuration
    ]);
    const handleSlotClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BookingClient.useCallback[handleSlotClick]": (iso, booked)=>{
            if (booked) return;
            setSelectedSlot(iso);
            setStep("form");
            setError(null);
        }
    }["BookingClient.useCallback[handleSlotClick]"], []);
    const handleSubmit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BookingClient.useCallback[handleSubmit]": async ()=>{
            if (!selectedSlot || !form.name.trim() || !form.email.includes("@")) {
                setError("Preencha todos os campos corretamente.");
                return;
            }
            if (form.cpf && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateCPF"])(form.cpf)) {
                setError("CPF inválido. Verifique e tente novamente.");
                return;
            }
            setStep("processing");
            setError(null);
            try {
                const res = await fetch("/api/booking/checkout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        therapistId,
                        scheduledAt: selectedSlot,
                        patientName: form.name,
                        patientEmail: form.email,
                        patientPhone: form.phone,
                        patientCpf: form.cpf || undefined,
                        slug
                    })
                });
                if (!res.ok) {
                    const err = await res.json().catch({
                        "BookingClient.useCallback[handleSubmit]": ()=>({})
                    }["BookingClient.useCallback[handleSubmit]"]);
                    throw new Error(err.error ?? `Erro ${res.status}`);
                }
                const json = await res.json();
                // Redirect to Stripe checkout
                window.location.href = json.data.checkoutUrl;
            } catch (e) {
                setError(e instanceof Error ? e.message : "Erro ao processar agendamento");
                setStep("form");
            }
        }
    }["BookingClient.useCallback[handleSubmit]"], [
        selectedSlot,
        form,
        therapistId,
        slug
    ]);
    const selectedDate = selectedSlot ? new Date(selectedSlot).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long"
    }) : "";
    const selectedTime = selectedSlot ? new Date(selectedSlot).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    }) : "";
    const inputStyle = {
        width: "100%",
        padding: "12px 16px",
        borderRadius: 12,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-subtle)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        outline: "none"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2 mb-6 items-center",
                children: [
                    {
                        n: 1,
                        label: "Horário"
                    },
                    {
                        n: 2,
                        label: "Dados"
                    },
                    {
                        n: 3,
                        label: "Pagamento"
                    }
                ].map((s, i, arr)=>{
                    const isActive = s.n === 1 && step === "select" || s.n === 2 && step === "form" || s.n === 3 && step === "processing";
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold border ${isActive ? "bg-[var(--color-brand)] text-black border-[var(--color-brand)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border-subtle)]"} transition-colors duration-300`,
                                children: s.n
                            }, void 0, false, {
                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                lineNumber: 207,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `text-[13px] ${isActive ? "text-[var(--color-text-primary)] font-medium" : "text-[var(--color-text-muted)]"}`,
                                children: s.label
                            }, void 0, false, {
                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                lineNumber: 216,
                                columnNumber: 15
                            }, this),
                            i < arr.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-8 h-[1px] bg-[var(--color-border-subtle)]"
                            }, void 0, false, {
                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                lineNumber: 224,
                                columnNumber: 17
                            }, this)
                        ]
                    }, s.n, true, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 206,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                lineNumber: 195,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[13px] mb-4 flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "❌"
                    }, void 0, false, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 234,
                        columnNumber: 11
                    }, this),
                    " ",
                    error
                ]
            }, void 0, true, {
                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                lineNumber: 233,
                columnNumber: 9
            }, this),
            (step === "select" || step === "form") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[var(--color-surface)]/40 border border-[var(--color-border-subtle)] rounded-2xl p-7 mb-5 backdrop-blur-md",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "font-[family-name:var(--font-display)] text-[24px] font-light text-[var(--color-text-primary)] mb-5",
                        children: "Escolha o horário"
                    }, void 0, false, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 241,
                        columnNumber: 11
                    }, this),
                    daysWithSlots.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-8 text-[var(--color-text-muted)]",
                        children: "Não há horários disponíveis no momento."
                    }, void 0, false, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 246,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `flex flex-col gap-5 ${step === "form" ? "max-h-[320px] overflow-y-auto pr-2 custom-scrollbar" : ""}`,
                        children: daysWithSlots.map((day)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[13px] text-[var(--color-text-secondary)] font-medium mb-2.5",
                                        children: [
                                            DAYS[day.dayOfWeek],
                                            " ·",
                                            " ",
                                            day.date.toLocaleDateString("pt-BR", {
                                                day: "2-digit",
                                                month: "2-digit"
                                            })
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                        lineNumber: 257,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-wrap gap-2.5",
                                        children: day.times.map((t)=>{
                                            const isSelected = selectedSlot === t.iso;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                disabled: t.booked,
                                                onClick: ()=>handleSlotClick(t.iso, t.booked),
                                                className: `px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${isSelected ? "bg-[var(--color-brand)] text-black border-2 border-[var(--color-brand)] shadow-[0_0_15px_rgba(var(--color-brand-rgb),0.3)]" : t.booked ? "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)] cursor-not-allowed opacity-40 line-through" : "bg-[var(--color-brand)]/5 text-[var(--color-brand)] border border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)]/10 hover:border-[var(--color-brand)]/50 cursor-pointer"}`,
                                                children: t.time
                                            }, t.iso, false, {
                                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                                lineNumber: 268,
                                                columnNumber: 25
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                        lineNumber: 264,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, day.label, true, {
                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                lineNumber: 256,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 250,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                lineNumber: 240,
                columnNumber: 9
            }, this),
            step === "form" && selectedSlot && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[var(--color-surface)]/50 border border-[var(--color-border-subtle)] rounded-2xl p-7 animate-[fadeUp_.25s_ease-out_both] backdrop-blur-md",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "font-[family-name:var(--font-display)] text-[24px] font-light text-[var(--color-text-primary)] mb-1.5",
                        children: "Seus dados"
                    }, void 0, false, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 296,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[13px] text-[var(--color-text-muted)] mb-5",
                        children: [
                            "Sessão com",
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[#3b82f6]",
                                children: therapistName
                            }, void 0, false, {
                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                lineNumber: 301,
                                columnNumber: 13
                            }, this),
                            " em",
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[#fbbf24]",
                                children: [
                                    selectedDate,
                                    " às ",
                                    selectedTime
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                lineNumber: 302,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 299,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: `${formId}-name`,
                                        className: "text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.08em] block mb-1.5",
                                        children: "Nome completo *"
                                    }, void 0, false, {
                                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                        lineNumber: 309,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        id: `${formId}-name`,
                                        style: inputStyle,
                                        className: "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] bg-[var(--color-background)]",
                                        placeholder: "Seu nome",
                                        value: form.name,
                                        onChange: (e)=>setForm((f)=>({
                                                    ...f,
                                                    name: e.target.value
                                                })),
                                        "aria-label": "Nome completo"
                                    }, void 0, false, {
                                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                        lineNumber: 315,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                lineNumber: 308,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: `${formId}-email`,
                                        className: "text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.08em] block mb-1.5",
                                        children: "Email *"
                                    }, void 0, false, {
                                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                        lineNumber: 329,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        id: `${formId}-email`,
                                        style: inputStyle,
                                        className: "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] bg-[var(--color-background)]",
                                        placeholder: "seu@email.com",
                                        type: "email",
                                        value: form.email,
                                        onChange: (e)=>setForm((f)=>({
                                                    ...f,
                                                    email: e.target.value
                                                })),
                                        "aria-label": "Email"
                                    }, void 0, false, {
                                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                        lineNumber: 335,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                lineNumber: 328,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: `${formId}-phone`,
                                        className: "text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.08em] block mb-1.5",
                                        children: "Telefone (opcional)"
                                    }, void 0, false, {
                                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                        lineNumber: 350,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        id: `${formId}-phone`,
                                        style: inputStyle,
                                        className: "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] bg-[var(--color-background)]",
                                        placeholder: "(11) 99999-0000",
                                        value: form.phone,
                                        onChange: (e)=>setForm((f)=>({
                                                    ...f,
                                                    phone: e.target.value
                                                })),
                                        "aria-label": "Telefone"
                                    }, void 0, false, {
                                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                        lineNumber: 356,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                lineNumber: 349,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: `${formId}-cpf`,
                                        className: "text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.08em] block mb-1.5",
                                        children: "CPF (opcional)"
                                    }, void 0, false, {
                                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                        lineNumber: 370,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        id: `${formId}-cpf`,
                                        style: inputStyle,
                                        className: "focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] bg-[var(--color-background)]",
                                        placeholder: "000.000.000-00",
                                        value: form.cpf ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCPF"])(form.cpf) : "",
                                        onChange: (e)=>{
                                            const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                                            setForm((f)=>({
                                                    ...f,
                                                    cpf: raw
                                                }));
                                        },
                                        inputMode: "numeric",
                                        "aria-label": "CPF"
                                    }, void 0, false, {
                                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                        lineNumber: 376,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                lineNumber: 369,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 307,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-5 p-4 bg-[var(--color-surface-hover)]/30 rounded-xl border border-[var(--color-border-subtle)] flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center sm:text-left",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[11px] text-[var(--color-text-muted)] mb-1",
                                        children: "Valor da sessão"
                                    }, void 0, false, {
                                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                        lineNumber: 395,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "font-[family-name:var(--font-display)] text-[28px] font-light text-[#fbbf24]",
                                        children: [
                                            "R$ ",
                                            sessionPrice.toFixed(2)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                        lineNumber: 398,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                lineNumber: 394,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: handleSubmit,
                                className: "w-full sm:w-auto px-8 py-3.5 bg-[var(--color-brand)] text-black rounded-xl border-none text-[15px] font-semibold cursor-pointer shadow-[0_4px_24px_rgba(var(--color-brand-rgb),0.25)] hover:shadow-[0_4px_32px_rgba(var(--color-brand-rgb),0.4)] hover:scale-[1.02] transition-all duration-300",
                                children: "Ir para Pagamento →"
                            }, void 0, false, {
                                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                                lineNumber: 402,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 393,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3 text-[11px] text-[var(--color-text-muted)] text-center tracking-wide font-light",
                        children: "🔒 Pagamento seguro via Stripe · Dados protegidos por LGPD"
                    }, void 0, false, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 411,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                lineNumber: 295,
                columnNumber: 9
            }, this),
            step === "processing" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[var(--color-surface)]/50 border border-[var(--color-border-subtle)] rounded-2xl p-[60px_28px] text-center backdrop-blur-md",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-12 h-12 border-4 border-[var(--color-border-subtle)] border-t-[var(--color-brand)] rounded-full mx-auto mb-5 animate-spin"
                    }, void 0, false, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 420,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-[family-name:var(--font-display)] text-[22px] font-light text-[var(--color-text-primary)] mb-2",
                        children: "Redirecionando para pagamento..."
                    }, void 0, false, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 421,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[13px] text-[var(--color-text-muted)]",
                        children: "Você será redirecionado ao Stripe em instantes."
                    }, void 0, false, {
                        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                        lineNumber: 424,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
                lineNumber: 419,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/booking/[slug]/BookingClient.tsx",
        lineNumber: 193,
        columnNumber: 5
    }, this);
}
_s(BookingClient, "QehvDB36psfeYvRN5Kt4ryAZB/c=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c = BookingClient;
function generateTimeSlots(start, end, durationMin) {
    const slots = [];
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let current = sh * 60 + sm;
    const endMin = eh * 60 + em;
    while(current + durationMin <= endMin){
        const h = Math.floor(current / 60);
        const m = current % 60;
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        current += durationMin;
    }
    return slots;
}
var _c;
__turbopack_context__.k.register(_c, "BookingClient");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# debugId=e6c25201-08e5-6d9e-ce03-a08f3a5a415d
//# sourceMappingURL=_77b5a18b._.js.map