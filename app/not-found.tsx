import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada — Psique",
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, rgba(196,163,90,.3), rgba(196,163,90,.08))",
            border: "2px solid rgba(196,163,90,.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 38,
            margin: "0 auto 24px",
            fontFamily: "var(--ff)",
            fontWeight: 200,
            color: "var(--gold)",
          }}
        >
          404
        </div>
        <h1
          style={{
            fontFamily: "var(--ff)",
            fontSize: 32,
            fontWeight: 200,
            color: "var(--ivory)",
            marginBottom: 12,
          }}
        >
          Página não encontrada
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--ivoryDD)",
            lineHeight: 1.7,
            marginBottom: 28,
          }}
        >
          A página que você procura não existe ou foi movida. Verifique o
          endereço ou volte à página inicial.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link
            href="/"
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              background: "var(--mint)",
              color: "#060E09",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Página Inicial
          </Link>
          <Link
            href="/auth/login"
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--ivoryD)",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Fazer Login
          </Link>
        </div>
      </div>
    </div>
  );
}
