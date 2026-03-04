import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agendamento Confirmado — Psique",
  description: "Sua sessão foi agendada com sucesso!",
};

export default async function BookingSuccessPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Success animation */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, rgba(82,183,136,.4), rgba(82,183,136,.15))",
            border: "2px solid rgba(82,183,136,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            margin: "0 auto 24px",
            animation: "fadeUp .5s var(--ease-out)",
          }}
        >
          ✓
        </div>

        <h1
          style={{
            fontFamily: "var(--ff)",
            fontSize: 38,
            fontWeight: 200,
            color: "var(--ivory)",
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          Sessão Agendada!
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "var(--ivoryD)",
            lineHeight: 1.7,
            marginBottom: 32,
          }}
        >
          Pagamento confirmado com sucesso. Você receberá um email com os
          detalhes da sessão e o link de acesso será enviado 1 hora antes.
        </p>

        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            padding: "24px 28px",
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--ff)",
              fontSize: 20,
              fontWeight: 300,
              color: "var(--ivory)",
              marginBottom: 14,
            }}
          >
            Próximos passos
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {[
              {
                icon: "📧",
                text: "Confira seu email para detalhes do agendamento",
              },
              {
                icon: "🔗",
                text: "O link da videochamada será enviado 1h antes",
              },
              {
                icon: "📱",
                text: "Se tiver Telegram, conecte para lembretes automáticos",
              },
              {
                icon: "🔐",
                text: "Crie sua conta para acessar o Portal do Paciente",
              },
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  fontSize: 14,
                  color: "var(--ivoryD)",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ flexShrink: 0, fontSize: 16 }}>
                  {step.icon}
                </span>
                {step.text}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <Link
            href="/auth/login"
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              background: "var(--mint)",
              color: "#060E09",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "0 4px 24px rgba(82,183,136,.25)",
            }}
          >
            Criar Conta
          </Link>
          <Link
            href="/"
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
            Voltar ao Início
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          fontSize: 11,
          color: "var(--ivoryDD)",
        }}
      >
        <span
          style={{
            color: "var(--mint)",
            fontFamily: "var(--ff)",
            fontSize: 14,
            marginRight: 6,
          }}
        >
          Ψ
        </span>
        Psique — Plataforma Terapêutica
      </div>
    </div>
  );
}
