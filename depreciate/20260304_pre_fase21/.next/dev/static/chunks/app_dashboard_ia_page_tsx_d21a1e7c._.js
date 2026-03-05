;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="119f458f-8710-c8d4-50fb-1aad30560ff4")}catch(e){}}();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/dashboard/ia/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>IAPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function IAPage() {
    _s();
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const fetchInsights = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "IAPage.useCallback[fetchInsights]": async ()=>{
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/ai/insights", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({})
                });
                if (!res.ok) {
                    const err = await res.json().catch({
                        "IAPage.useCallback[fetchInsights]": ()=>({})
                    }["IAPage.useCallback[fetchInsights]"]);
                    throw new Error(err.error ?? `Erro ${res.status}`);
                }
                const json = await res.json();
                setResult(json.data);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Erro desconhecido");
            } finally{
                setLoading(false);
            }
        }
    }["IAPage.useCallback[fetchInsights]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-8 max-w-6xl mx-auto w-full animate-[fadeUp_.4s_ease-out_both]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "font-[family-name:var(--font-display)] text-4xl font-light text-[var(--color-text-primary)] tracking-tight",
                        children: "IA Clínica"
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[14px] text-[var(--color-text-muted)] mt-1 font-light",
                        children: "Análise inteligente da sua carteira de pacientes usando IA avançada"
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 47,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/dashboard/ia/page.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-7 mb-6 glass-panel relative overflow-hidden group",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4 relative z-10",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[16px] text-[var(--color-text-primary)] font-medium mb-1",
                                        children: "🧠 Análise de Carteira"
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/ia/page.tsx",
                                        lineNumber: 56,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[13px] text-[var(--color-text-muted)] font-light leading-relaxed max-w-2xl",
                                        children: "Gera insights, recomendações e alertas baseados nos dados das sessões recentes."
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/ia/page.tsx",
                                        lineNumber: 59,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/dashboard/ia/page.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: fetchInsights,
                                disabled: loading,
                                className: `px-7 py-3 rounded-xl font-medium text-[14px] flex items-center justify-center gap-2 transition-all duration-300 ${loading ? "bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] cursor-not-allowed" : "bg-[var(--color-brand)] text-[#060E09] hover:bg-[var(--color-brand)]/90 hover:shadow-[0_0_20px_rgba(var(--color-brand-rgb),0.3)] cursor-pointer"}`,
                                children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "inline-block w-4 h-4 border-2 border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/ia/page.tsx",
                                            lineNumber: 75,
                                            columnNumber: 17
                                        }, this),
                                        "Analisando..."
                                    ]
                                }, void 0, true) : "Gerar Análise"
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/ia/page.tsx",
                                lineNumber: 63,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[11px] text-[var(--color-text-muted)] px-3 py-2 bg-[var(--color-surface-hover)] rounded-lg border border-[var(--color-border-subtle)] w-fit flex items-center gap-2 relative z-10",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[#fbbf24]",
                                children: "💡"
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/ia/page.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            " Limite: 10 requisições/min · Modelo configurado no onboarding"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute -bottom-24 -right-24 w-64 h-64 bg-[var(--color-brand)] opacity-[0.03] blur-3xl rounded-full group-hover:opacity-[0.06] transition-opacity duration-700 pointer-events-none"
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/dashboard/ia/page.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-5 py-4 bg-[#f87171]/10 border border-[#f87171]/30 rounded-xl text-[#f87171] text-[14px] mb-5 animate-[fadeUp_.3s_ease-out_both] flex items-center gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[18px]",
                        children: "❌"
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 95,
                        columnNumber: 11
                    }, this),
                    " ",
                    error
                ]
            }, void 0, true, {
                fileName: "[project]/app/dashboard/ia/page.tsx",
                lineNumber: 94,
                columnNumber: 9
            }, this),
            result && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 lg:grid-cols-2 gap-4 animate-[fadeUp_.4s_ease-out_both]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(InsightCard, {
                        title: "💡 Insights",
                        items: result.insights,
                        tone: "brand",
                        fullWidth: false
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 103,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(InsightCard, {
                        title: "📌 Recomendações",
                        items: result.recommendations,
                        tone: "amber",
                        fullWidth: false
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 111,
                        columnNumber: 11
                    }, this),
                    result.alerts.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lg:col-span-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(InsightCard, {
                            title: "⚠️ Alertas",
                            items: result.alerts,
                            tone: "danger",
                            fullWidth: true
                        }, void 0, false, {
                            fileName: "[project]/app/dashboard/ia/page.tsx",
                            lineNumber: 121,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 120,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/dashboard/ia/page.tsx",
                lineNumber: 101,
                columnNumber: 9
            }, this),
            !result && !error && !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center py-20 px-5 glass-panel rounded-2xl border border-[var(--color-border-subtle)] mt-8 animate-[fadeUp_.5s_ease-out_both]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[56px] mb-4 opacity-80",
                        children: "🧠"
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 135,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-[family-name:var(--font-display)] text-[24px] text-[var(--color-text-secondary)] font-light mb-2",
                        children: "Inteligência Artificial Clínica"
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 136,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[14px] text-[var(--color-text-muted)] max-w-md mx-auto font-light leading-relaxed",
                        children: "Analise sua carteira de pacientes com IA. Receba insights sobre tendências, recomendações clínicas e alertas de risco."
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 139,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/dashboard/ia/page.tsx",
                lineNumber: 134,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/dashboard/ia/page.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
_s(IAPage, "u8uABSddAnVQ1+ASU/8xNblPvAI=");
_c = IAPage;
function InsightCard({ title, items, tone }) {
    if (items.length === 0) return null;
    const toneClasses = {
        brand: {
            glow: "bg-[var(--color-brand)]",
            heading: "text-[var(--color-brand)]",
            bar: "border-[var(--color-brand)]/60"
        },
        amber: {
            glow: "bg-[#fbbf24]",
            heading: "text-[#fbbf24]",
            bar: "border-[#fbbf24]/70"
        },
        danger: {
            glow: "bg-[#f87171]",
            heading: "text-[#f87171]",
            bar: "border-[#f87171]/70"
        }
    };
    const toneCfg = toneClasses[tone];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 glass-panel relative overflow-hidden group hover:border-[var(--color-border-strong)] transition-all duration-300",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `absolute top-0 right-0 w-32 h-32 opacity-[0.03] rounded-bl-full group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none ${toneCfg.glow}`
            }, void 0, false, {
                fileName: "[project]/app/dashboard/ia/page.tsx",
                lineNumber: 186,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `text-[14px] font-medium mb-4 flex items-center gap-2 relative z-10 ${toneCfg.heading}`,
                children: title
            }, void 0, false, {
                fileName: "[project]/app/dashboard/ia/page.tsx",
                lineNumber: 189,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "list-none flex flex-col gap-3 relative z-10 m-0 p-0",
                children: items.map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: `text-[13px] text-[var(--color-text-secondary)] border-l-2 pl-3.5 leading-relaxed ${toneCfg.bar}`,
                        children: item
                    }, i, false, {
                        fileName: "[project]/app/dashboard/ia/page.tsx",
                        lineNumber: 194,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/dashboard/ia/page.tsx",
                lineNumber: 192,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/dashboard/ia/page.tsx",
        lineNumber: 185,
        columnNumber: 5
    }, this);
}
_c1 = InsightCard;
var _c, _c1;
__turbopack_context__.k.register(_c, "IAPage");
__turbopack_context__.k.register(_c1, "InsightCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# debugId=119f458f-8710-c8d4-50fb-1aad30560ff4
//# sourceMappingURL=app_dashboard_ia_page_tsx_d21a1e7c._.js.map