"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSent(false);

    if (!email.includes("@")) {
      setError("Email inválido");
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      if (resetError) {
        throw resetError;
      }
      setSent(true);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-base px-4 py-8">
      <section className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface p-6 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
        <div className="absolute left-6 top-6 flex items-center justify-between w-[calc(100%-3rem)]">
          <Link
            href="/auth/login"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
            aria-label="Voltar para Login"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="font-display text-3xl font-medium text-text-primary">
          Recuperar Acesso
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Informe seu email para receber o link seguro de redefinição.
        </p>
        <p className="mt-2 text-xs text-text-muted">
          Enviamos em instantes e você redefine sua senha em poucos passos.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
              Email
            </span>
            <span className="relative block">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <span className="material-symbols-outlined text-[18px]">mail</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
                className="w-full rounded-xl border border-border-subtle bg-bg-elevated py-3.5 pl-11 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </span>
          </label>

          {error ? (
            <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          ) : null}

          {sent ? (
            <div className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
              Link enviado com sucesso.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand px-4 py-3.5 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar link seguro"}
          </button>
        </form>

        <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-text-muted">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          Verifique também a pasta de spam
        </p>
      </section>
    </main>
  );
}
