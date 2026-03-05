;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="084af5af-882c-626e-778d-341c2d03eb7c")}catch(e){}}();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/dashboard/TwoFactorSetup.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TwoFactorSetup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function TwoFactorSetup({ initialFactors }) {
    _s();
    const hasActive = initialFactors.some((f)=>f.status === "verified");
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(hasActive ? "enabled" : "idle");
    const [qrUrl, setQrUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [secret, setSecret] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [factorId, setFactorId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [code, setCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const codeId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    const startEnroll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TwoFactorSetup.useCallback[startEnroll]": async ()=>{
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/auth/mfa/enroll", {
                    method: "POST"
                });
                if (!res.ok) {
                    const err = await res.json().catch({
                        "TwoFactorSetup.useCallback[startEnroll]": ()=>({})
                    }["TwoFactorSetup.useCallback[startEnroll]"]);
                    throw new Error(err.error ?? `Erro ${res.status}`);
                }
                const json = await res.json();
                setQrUrl(json.data.qrUrl);
                setSecret(json.data.secret);
                setFactorId(json.data.factorId);
                setStep("enrolling");
            } catch (e) {
                setError(e instanceof Error ? e.message : "Erro ao iniciar 2FA");
            } finally{
                setLoading(false);
            }
        }
    }["TwoFactorSetup.useCallback[startEnroll]"], []);
    const verifyCode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TwoFactorSetup.useCallback[verifyCode]": async ()=>{
            if (!factorId || code.length !== 6) {
                setError("Digite o código de 6 dígitos");
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/auth/mfa/verify", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        factorId,
                        code
                    })
                });
                if (!res.ok) {
                    const err = await res.json().catch({
                        "TwoFactorSetup.useCallback[verifyCode]": ()=>({})
                    }["TwoFactorSetup.useCallback[verifyCode]"]);
                    throw new Error(err.error ?? "Código inválido");
                }
                setStep("enabled");
                setQrUrl(null);
                setSecret(null);
                setCode("");
            } catch (e) {
                setError(e instanceof Error ? e.message : "Erro ao verificar código");
            } finally{
                setLoading(false);
            }
        }
    }["TwoFactorSetup.useCallback[verifyCode]"], [
        factorId,
        code
    ]);
    const unenroll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TwoFactorSetup.useCallback[unenroll]": async ()=>{
            const activeId = initialFactors.find({
                "TwoFactorSetup.useCallback[unenroll]": (f)=>f.status === "verified"
            }["TwoFactorSetup.useCallback[unenroll]"])?.id ?? factorId;
            if (!activeId) return;
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/auth/mfa/unenroll", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        factorId: activeId
                    })
                });
                if (!res.ok) {
                    const err = await res.json().catch({
                        "TwoFactorSetup.useCallback[unenroll]": ()=>({})
                    }["TwoFactorSetup.useCallback[unenroll]"]);
                    throw new Error(err.error ?? "Erro ao desativar");
                }
                setStep("idle");
                setFactorId(null);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Erro ao desativar 2FA");
            } finally{
                setLoading(false);
            }
        }
    }["TwoFactorSetup.useCallback[unenroll]"], [
        initialFactors,
        factorId
    ]);
    const isEnabled = step === "enabled";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between border-b border-[var(--color-border-subtle)] py-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[14px] font-medium text-[var(--color-text-primary)]",
                                children: "Autenticação 2FA (TOTP)"
                            }, void 0, false, {
                                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                                lineNumber: 109,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-0.5 text-[11px] text-[var(--color-text-muted)]",
                                children: isEnabled ? "Proteja sua conta com verificação em dois fatores" : "Adicione uma camada extra de segurança"
                            }, void 0, false, {
                                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                                lineNumber: 112,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                        lineNumber: 108,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-medium ${isEnabled ? "border-[rgba(82,183,136,.3)] bg-[rgba(82,183,136,.12)] text-[var(--color-brand)]" : "border-[#f87171]/30 bg-[#f87171]/12 text-[#f87171]"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `h-[5px] w-[5px] rounded-full ${isEnabled ? "bg-[var(--color-brand)]" : "bg-[#f87171]"}`
                            }, void 0, false, {
                                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                                lineNumber: 126,
                                columnNumber: 11
                            }, this),
                            isEnabled ? "Ativo" : "Inativo"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                        lineNumber: 119,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                lineNumber: 107,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-3.5 py-2.5 text-[12px] text-[#f87171]",
                children: [
                    "❌ ",
                    error
                ]
            }, void 0, true, {
                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                lineNumber: 136,
                columnNumber: 9
            }, this),
            step === "idle" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: startEnroll,
                    disabled: loading,
                    className: `rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors ${loading ? "cursor-not-allowed border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-muted)]" : "bg-[var(--color-brand)] text-[#060E09] hover:bg-[var(--color-brand-hover)]"}`,
                    children: loading ? "Gerando..." : "🔐 Ativar 2FA"
                }, void 0, false, {
                    fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                    lineNumber: 143,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                lineNumber: 142,
                columnNumber: 9
            }, this),
            step === "enrolling" && qrUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-3 text-[14px] font-medium text-[var(--color-text-primary)]",
                        children: "1. Escaneie o QR Code no seu app autenticador"
                    }, void 0, false, {
                        fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                        lineNumber: 160,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-4 flex flex-col gap-4 lg:flex-row lg:items-start",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex h-[160px] w-[160px] items-center justify-center rounded-xl bg-white p-1.5",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                    src: `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}`,
                                    alt: "QR Code para 2FA",
                                    width: 148,
                                    height: 148,
                                    className: "rounded-lg"
                                }, void 0, false, {
                                    fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                                    lineNumber: 167,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                                lineNumber: 165,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-1.5 text-[12px] text-[var(--color-text-muted)]",
                                        children: "Ou digite a chave manualmente:"
                                    }, void 0, false, {
                                        fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                                        lineNumber: 179,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "break-all rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-2 font-mono text-[12px] text-[var(--color-gold)]",
                                        children: secret
                                    }, void 0, false, {
                                        fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                                        lineNumber: 182,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-[11px] text-[var(--color-text-muted)]",
                                        children: "Compatível com Google Authenticator, Authy, 1Password, etc."
                                    }, void 0, false, {
                                        fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                                        lineNumber: 185,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                                lineNumber: 178,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                        lineNumber: 164,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-2 text-[14px] font-medium text-[var(--color-text-primary)]",
                        children: "2. Digite o código de 6 dígitos"
                    }, void 0, false, {
                        fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                        lineNumber: 191,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-2.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: codeId,
                                className: "sr-only",
                                children: "Código TOTP"
                            }, void 0, false, {
                                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                                lineNumber: 196,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                id: codeId,
                                type: "text",
                                value: code,
                                onChange: (e)=>setCode(e.target.value.replace(/\D/g, "").slice(0, 6)),
                                placeholder: "000000",
                                maxLength: 6,
                                autoComplete: "one-time-code",
                                inputMode: "numeric",
                                className: "w-[150px] rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-center font-mono text-[18px] tracking-[0.35em] text-[var(--color-text-primary)] outline-none transition-colors placeholder:tracking-normal placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]"
                            }, void 0, false, {
                                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                                lineNumber: 199,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: verifyCode,
                                disabled: loading || code.length !== 6,
                                className: `rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors ${loading || code.length !== 6 ? "cursor-not-allowed border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-muted)]" : "bg-[var(--color-brand)] text-[#060E09] hover:bg-[var(--color-brand-hover)]"}`,
                                children: loading ? "Verificando..." : "Verificar"
                            }, void 0, false, {
                                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                                lineNumber: 212,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                        lineNumber: 195,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                lineNumber: 159,
                columnNumber: 9
            }, this),
            step === "enabled" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-3 rounded-xl border border-[rgba(82,183,136,.2)] bg-[rgba(82,183,136,.06)] px-4 py-3 text-[13px] text-[var(--color-text-secondary)]",
                        children: "✅ Autenticação em dois fatores está ativa. Você precisará do código do app autenticador ao fazer login."
                    }, void 0, false, {
                        fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                        lineNumber: 230,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: unenroll,
                        disabled: loading,
                        className: `rounded-lg border px-4 py-2 text-[12px] font-medium transition-colors ${loading ? "cursor-not-allowed border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-muted)]" : "border-[#f87171]/30 text-[#f87171] hover:bg-[#f87171]/10"}`,
                        children: loading ? "Desativando..." : "Desativar 2FA"
                    }, void 0, false, {
                        fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                        lineNumber: 235,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
                lineNumber: 229,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/dashboard/TwoFactorSetup.tsx",
        lineNumber: 106,
        columnNumber: 5
    }, this);
}
_s(TwoFactorSetup, "FL3Sk+ZW7KCIZYkVhNPQbWUsZsY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c = TwoFactorSetup;
var _c;
__turbopack_context__.k.register(_c, "TwoFactorSetup");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/dashboard/IntegrationsSettings.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>IntegrationsSettings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/client.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui/Toast.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function IntegrationsSettings({ initialOpenRouter, initialTelegram, initialStripe, aiModel }) {
    _s();
    const [openRouterKey, setOpenRouterKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialOpenRouter ?? "");
    const [telegramToken, setTelegramToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialTelegram ?? "");
    const [stripeAccount, setStripeAccount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialStripe ?? "");
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const openRouterConnected = Boolean(openRouterKey);
    const saveIntegrations = async ()=>{
        setSaving(true);
        try {
            if (openRouterKey && openRouterKey !== initialOpenRouter) {
                const orRes = await fetch("https://openrouter.ai/api/v1/auth/key", {
                    headers: {
                        Authorization: `Bearer ${openRouterKey}`
                    }
                });
                if (!orRes.ok) {
                    throw new Error("A chave do OpenRouter (IA) é inválida ou expirou.");
                }
            }
            if (telegramToken && telegramToken !== initialTelegram) {
                const tgRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
                const tgData = await tgRes.json();
                if (!tgData.ok) {
                    throw new Error("O Token do Telegram é inválido.");
                }
            }
            const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createClient"])();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");
            const { error } = await supabase.from("therapists").update({
                openrouter_key_hash: openRouterKey || null,
                telegram_bot_token: telegramToken || null,
                stripe_account_id: stripeAccount || null
            }).eq("user_id", user.id);
            if (error) throw error;
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success("Integrações validadas e atualizadas com sucesso!");
        } catch (e) {
            const err = e;
            __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(err.message ?? "Erro ao salvar integrações");
        } finally{
            setSaving(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(IntegrationItem, {
                name: "OpenRouter (IA / LLM)",
                description: `Modelo ativo: ${aiModel ?? "Não definido"}`,
                connected: openRouterConnected,
                value: openRouterKey,
                onChange: setOpenRouterKey,
                placeholder: "Opcional (usa a chave padrão da plataforma Psique)",
                type: "password"
            }, void 0, false, {
                fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(IntegrationItem, {
                name: "Telegram Bot",
                description: "Token do seu bot gerado via @BotFather",
                connected: Boolean(telegramToken),
                value: telegramToken,
                onChange: setTelegramToken,
                placeholder: "123456789:ABCDefghIJKlmnopQRSTuvwxYZ",
                type: "password"
            }, void 0, false, {
                fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(IntegrationItem, {
                name: "Stripe Connect",
                description: "ID da sua conta Stripe para recebimentos",
                connected: Boolean(stripeAccount),
                value: stripeAccount,
                onChange: setStripeAccount,
                placeholder: "acct_1Ou...",
                type: "text"
            }, void 0, false, {
                fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
                lineNumber: 98,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-2 flex justify-end",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: saveIntegrations,
                    disabled: saving,
                    className: `rounded-xl px-6 py-2.5 text-[13px] font-semibold transition-all ${saving ? "cursor-not-allowed border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-muted)]" : "bg-[var(--color-brand)] text-[#060E09] hover:bg-[var(--color-brand-hover)]"}`,
                    children: saving ? "Salvando..." : "Salvar Integrações"
                }, void 0, false, {
                    fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
                    lineNumber: 109,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
                lineNumber: 108,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
        lineNumber: 77,
        columnNumber: 5
    }, this);
}
_s(IntegrationsSettings, "U8D66bVhIkpvqHpOwBJvLkIpYLk=");
_c = IntegrationsSettings;
function IntegrationItem({ name, description, connected, value, onChange, placeholder, type }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-3 border-b border-[var(--color-border-subtle)] py-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[14px] font-medium text-[var(--color-text-primary)]",
                                children: name
                            }, void 0, false, {
                                fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
                                lineNumber: 147,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-0.5 text-[12px] text-[var(--color-text-muted)]",
                                children: description
                            }, void 0, false, {
                                fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
                                lineNumber: 150,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-medium ${connected ? "border-[rgba(82,183,136,.3)] bg-[rgba(82,183,136,.12)] text-[var(--color-brand)]" : "border-[#f87171]/30 bg-[#f87171]/12 text-[#f87171]"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `h-[5px] w-[5px] rounded-full ${connected ? "bg-[var(--color-brand)]" : "bg-[#f87171]"}`
                            }, void 0, false, {
                                fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
                                lineNumber: 162,
                                columnNumber: 11
                            }, this),
                            connected ? "Conectado" : "Desconectado"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
                        lineNumber: 155,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
                lineNumber: 145,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: type,
                value: value,
                onChange: (e)=>onChange(e.target.value),
                placeholder: placeholder,
                className: "w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-3.5 py-2.5 text-[13px] text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-strong)]"
            }, void 0, false, {
                fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
                lineNumber: 171,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/dashboard/IntegrationsSettings.tsx",
        lineNumber: 144,
        columnNumber: 5
    }, this);
}
_c1 = IntegrationItem;
var _c, _c1;
__turbopack_context__.k.register(_c, "IntegrationsSettings");
__turbopack_context__.k.register(_c1, "IntegrationItem");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# debugId=084af5af-882c-626e-778d-341c2d03eb7c
//# sourceMappingURL=components_dashboard_1315cedb._.js.map