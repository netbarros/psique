"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 1200);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao redefinir senha";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-base text-(--tw-text-primary) px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/auth/login"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-muted transition-colors hover:bg-bg-elevated hover:text-(--tw-text-primary)"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>

        <section className="rounded-2xl border border-border-subtle bg-surface p-6">
          <p className="mb-3 inline-flex rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-gold">
            Etapa final
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight">
            Redefinir Senha
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Defina uma nova senha para recuperar seu acesso com segurança.
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
                Nova senha
              </span>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-3 pr-12 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="******"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-text-muted transition-colors hover:text-text-primary"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
                Confirmar senha
              </span>
              <div className="relative">
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-3 pr-12 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="******"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-text-muted transition-colors hover:text-text-primary"
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </label>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
                Senha atualizada com sucesso. Redirecionando para login...
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-[#060E09] hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Atualizando..." : "Atualizar senha"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-text-muted">
            Use uma senha forte para proteger seus dados e sessões.
          </p>
        </section>
      </div>
    </main>
  );
}
