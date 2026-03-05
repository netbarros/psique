"use client";

import { useCallback, useId, useState } from "react";

type MFAStep = "idle" | "enrolling" | "verifying" | "enabled";

interface MFAFactor {
  id: string;
  type: string;
  status: string;
}

export default function TwoFactorSetup({
  initialFactors,
}: {
  initialFactors: MFAFactor[];
}) {
  const hasActive = initialFactors.some((f) => f.status === "verified");
  const [step, setStep] = useState<MFAStep>(hasActive ? "enabled" : "idle");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const codeId = useId();

  const startEnroll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/mfa/enroll", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Erro ${res.status}`);
      }
      const json = (await res.json()) as {
        data: { factorId: string; qrUrl: string; secret: string };
      };
      setQrUrl(json.data.qrUrl);
      setSecret(json.data.secret);
      setFactorId(json.data.factorId);
      setStep("enrolling");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar 2FA");
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyCode = useCallback(async () => {
    if (!factorId || code.length !== 6) {
      setError("Digite o código de 6 dígitos");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId, code }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Código inválido");
      }
      setStep("enabled");
      setQrUrl(null);
      setSecret(null);
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao verificar código");
    } finally {
      setLoading(false);
    }
  }, [factorId, code]);

  const unenroll = useCallback(async () => {
    const activeId = initialFactors.find((f) => f.status === "verified")?.id ?? factorId;
    if (!activeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/mfa/unenroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId: activeId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao desativar");
      }
      setStep("idle");
      setFactorId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao desativar 2FA");
    } finally {
      setLoading(false);
    }
  }, [initialFactors, factorId]);

  const isEnabled = step === "enabled";

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border-subtle py-3">
        <div>
          <div className="text-[14px] font-medium text-text-primary">
            Autenticação 2FA (TOTP)
          </div>
          <div className="mt-0.5 text-[11px] text-text-muted">
            {isEnabled
              ? "Proteja sua conta com verificação em dois fatores"
              : "Adicione uma camada extra de segurança"}
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-medium ${
            isEnabled
              ? "border-[rgba(82,183,136,.3)] bg-[rgba(82,183,136,.12)] text-brand"
              : "border-error/30 bg-error/12 text-error"
          }`}
        >
          <span
            className={`h-[5px] w-[5px] rounded-full ${
              isEnabled ? "bg-brand" : "bg-error"
            }`}
          />
          {isEnabled ? "Ativo" : "Inativo"}
        </span>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-error/30 bg-error/10 px-3.5 py-2.5 text-[12px] text-error">
          ❌ {error}
        </div>
      )}

      {step === "idle" && (
        <div className="mt-4">
          <button
            type="button"
            onClick={startEnroll}
            disabled={loading}
            className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors ${
              loading
                ? "cursor-not-allowed border border-border-subtle bg-surface text-text-muted"
                : "bg-brand text-bg-base hover:bg-brand-hover"
            }`}
          >
            {loading ? "Gerando..." : "🔐 Ativar 2FA"}
          </button>
        </div>
      )}

      {step === "enrolling" && qrUrl && (
        <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-elevated p-5">
          <div className="mb-3 text-[14px] font-medium text-text-primary">
            1. Escaneie o QR Code no seu app autenticador
          </div>

          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex h-[160px] w-[160px] items-center justify-center rounded-xl bg-white p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  qrUrl
                )}`}
                alt="QR Code para 2FA"
                width={148}
                height={148}
                className="rounded-lg"
              />
            </div>

            <div className="flex-1">
              <div className="mb-1.5 text-[12px] text-text-muted">
                Ou digite a chave manualmente:
              </div>
              <div className="break-all rounded-lg border border-border-subtle bg-surface px-3 py-2 font-mono text-[12px] text-gold">
                {secret}
              </div>
              <div className="mt-2 text-[11px] text-text-muted">
                Compatível com Google Authenticator, Authy, 1Password, etc.
              </div>
            </div>
          </div>

          <div className="mb-2 text-[14px] font-medium text-text-primary">
            2. Digite o código de 6 dígitos
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label htmlFor={codeId} className="sr-only">
              Código TOTP
            </label>
            <input
              id={codeId}
              type="text"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
              inputMode="numeric"
              className="w-[150px] rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-center font-mono text-[18px] tracking-[0.35em] text-text-primary outline-none transition-colors placeholder:tracking-normal placeholder:text-text-muted focus:border-brand"
            />
            <button
              type="button"
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors ${
                loading || code.length !== 6
                  ? "cursor-not-allowed border border-border-subtle bg-surface text-text-muted"
                  : "bg-brand text-bg-base hover:bg-brand-hover"
              }`}
            >
              {loading ? "Verificando..." : "Verificar"}
            </button>
          </div>
        </div>
      )}

      {step === "enabled" && (
        <div className="mt-4">
          <div className="mb-3 rounded-xl border border-[rgba(82,183,136,.2)] bg-[rgba(82,183,136,.06)] px-4 py-3 text-[13px] text-text-secondary">
            ✅ Autenticação em dois fatores está ativa. Você precisará do código
            do app autenticador ao fazer login.
          </div>

          <button
            type="button"
            onClick={unenroll}
            disabled={loading}
            className={`rounded-lg border px-4 py-2 text-[12px] font-medium transition-colors ${
              loading
                ? "cursor-not-allowed border-border-subtle bg-surface text-text-muted"
                : "border-error/30 text-error hover:bg-error/10"
            }`}
          >
            {loading ? "Desativando..." : "Desativar 2FA"}
          </button>
        </div>
      )}
    </div>
  );
}
