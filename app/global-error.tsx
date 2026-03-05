"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="m-0 bg-bg-base">
        <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-gold">
            Falha temporária
          </p>
          <p className="font-display text-[120px] font-bold leading-none text-gold/20">
            500
          </p>
          <h1 className="mt-2 font-display text-4xl text-text-primary">
            Erro interno
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
            Algo inesperado aconteceu. Tente novamente agora ou retome a navegação pela tela inicial.
          </p>

          {error.digest ? (
            <p className="mt-2 font-mono text-xs text-text-muted">Ref: {error.digest}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-[#060E09] transition-colors hover:bg-brand-hover"
            >
              Tentar novamente
            </button>
            <Link
              href="/"
              className="rounded-xl border border-border-subtle bg-surface px-6 py-3 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Voltar ao início
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
