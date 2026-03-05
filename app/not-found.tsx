import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada — Psique",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-4 text-center">
      <p className="mb-3 inline-flex rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-gold">
        Página indisponível
      </p>
      <p className="font-display text-[120px] font-bold leading-none text-gold/20">
        404
      </p>
      <h1 className="mt-2 font-display text-4xl text-text-primary">
        Página não encontrada
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
        A rota solicitada não existe ou foi removida. Escolha uma ação abaixo para retomar seu fluxo.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover"
        >
          Ir para início
        </Link>
        <Link
          href="/auth/login"
          className="rounded-xl border border-border-subtle bg-surface px-6 py-3 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
        >
          Fazer login
        </Link>
        <Link
          href="/pricing"
          className="rounded-xl border border-border-subtle bg-surface px-6 py-3 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
        >
          Ver planos
        </Link>
      </div>
    </main>
  );
}
