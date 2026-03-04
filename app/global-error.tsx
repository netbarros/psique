"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          minHeight: "100vh",
          background: "#0e0e0b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          textAlign: "center",
          fontFamily: "'Instrument Sans', sans-serif",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 35%, rgba(184,84,80,.3), rgba(184,84,80,.08))",
              border: "2px solid rgba(184,84,80,.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              margin: "0 auto 24px",
              fontFamily: "'Cormorant Garant', serif",
              fontWeight: 200,
              color: "#b85450",
            }}
          >
            500
          </div>
          <h1
            style={{
              fontFamily: "'Cormorant Garant', serif",
              fontSize: 32,
              fontWeight: 200,
              color: "#ede7d9",
              marginBottom: 12,
            }}
          >
            Erro interno
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#8a8070",
              lineHeight: 1.7,
              marginBottom: 8,
            }}
          >
            Algo deu errado. Nossa equipe foi notificada e estamos trabalhando
            para resolver.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 11,
                color: "#8a8070",
                fontFamily: "monospace",
                marginBottom: 24,
              }}
            >
              Ref: {error.digest}
            </p>
          )}
          <div
            style={{ display: "flex", gap: 12, justifyContent: "center" }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "12px 28px",
                borderRadius: 12,
                background: "#52b788",
                color: "#060E09",
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Tentar Novamente
            </button>
            <a
              href="/"
              style={{
                padding: "12px 28px",
                borderRadius: 12,
                background: "#1a1a17",
                border: "1px solid #1c2e20",
                color: "#c8bfb0",
                textDecoration: "none",
                fontSize: 14,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Voltar ao Início
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
