"use client";

import { useState, useCallback, useId } from "react";

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

  return (
    <div>
      {/* Status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 0",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <div style={{ fontSize: 14, color: "var(--ivory)", fontWeight: 500 }}>
            Autenticação 2FA (TOTP)
          </div>
          <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginTop: 2 }}>
            {step === "enabled"
              ? "Proteja sua conta com verificação em dois fatores"
              : "Adicione uma camada extra de segurança"}
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            padding: "3px 10px",
            borderRadius: 20,
            background:
              step === "enabled"
                ? "rgba(82,183,136,.12)"
                : "rgba(184,84,80,.12)",
            color: step === "enabled" ? "var(--mint)" : "var(--red)",
            border:
              step === "enabled"
                ? "1px solid rgba(82,183,136,.3)"
                : "1px solid rgba(184,84,80,.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: step === "enabled" ? "var(--mint)" : "var(--red)",
              display: "inline-block",
            }}
          />
          {step === "enabled" ? "Ativo" : "Inativo"}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            background: "rgba(184,84,80,.1)",
            border: "1px solid rgba(184,84,80,.3)",
            borderRadius: 10,
            color: "var(--red)",
            fontSize: 12,
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Idle: show enable button */}
      {step === "idle" && (
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={startEnroll}
            disabled={loading}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              background: "var(--mint)",
              color: "#060E09",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Gerando..." : "🔐 Ativar 2FA"}
          </button>
        </div>
      )}

      {/* Enrolling: show QR + secret + code input */}
      {step === "enrolling" && qrUrl && (
        <div
          style={{
            marginTop: 14,
            padding: "20px 24px",
            background: "var(--bg2)",
            borderRadius: 14,
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "var(--ivory)",
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            1. Escaneie o QR Code no seu app autenticador
          </div>

          <div
            style={{
              display: "flex",
              gap: 20,
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            {/* QR placeholder — rendered as an img from TOTP URI */}
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 12,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code para 2FA"
                width={148}
                height={148}
                style={{ borderRadius: 8 }}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ivoryDD)",
                  marginBottom: 6,
                }}
              >
                Ou digite a chave manualmente:
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "var(--gold)",
                  background: "var(--card)",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  wordBreak: "break-all",
                }}
              >
                {secret}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ivoryDD)",
                  marginTop: 8,
                }}
              >
                Compatível com Google Authenticator, Authy, 1Password, etc.
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 14,
              color: "var(--ivory)",
              fontWeight: 500,
              marginBottom: 10,
            }}
          >
            2. Digite o código de 6 dígitos
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label htmlFor={codeId} className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
              Código TOTP
            </label>
            <input
              id={codeId}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
              inputMode="numeric"
              style={{
                width: 140,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--card2)",
                border: "1px solid var(--border2)",
                color: "var(--text)",
                fontFamily: "monospace",
                fontSize: 18,
                letterSpacing: 6,
                textAlign: "center",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                background:
                  loading || code.length !== 6 ? "var(--card2)" : "var(--mint)",
                color:
                  loading || code.length !== 6 ? "var(--ivoryDD)" : "#060E09",
                border: "none",
                cursor:
                  loading || code.length !== 6 ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Verificando..." : "Verificar"}
            </button>
          </div>
        </div>
      )}

      {/* Enabled: show disable button */}
      {step === "enabled" && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(82,183,136,.06)",
              border: "1px solid rgba(82,183,136,.2)",
              borderRadius: 12,
              fontSize: 13,
              color: "var(--ivoryD)",
              marginBottom: 12,
            }}
          >
            ✅ Autenticação em dois fatores está ativa. Você precisará do código
            do app autenticador ao fazer login.
          </div>
          <button
            type="button"
            onClick={unenroll}
            disabled={loading}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 12,
              background: "transparent",
              color: "var(--red)",
              border: "1px solid rgba(184,84,80,.3)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Desativando..." : "Desativar 2FA"}
          </button>
        </div>
      )}
    </div>
  );
}
