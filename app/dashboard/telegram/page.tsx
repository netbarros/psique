import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Telegram Bot" };

export default async function TelegramPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, telegram_bot_token, telegram_bot_username, telegram_chat_id")
    .eq("user_id", user.id)
    .single();
  if (!therapist) redirect("/auth/login");

  // Fetch telegram config
  const { data: config } = await supabase
    .from("telegram_configs")
    .select("*")
    .eq("therapist_id", therapist.id)
    .single();

  const automations = (config?.automations ?? {}) as Record<string, boolean>;

  const isBotConfigured = !!therapist.telegram_bot_token;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--ff)",
            fontSize: 34,
            fontWeight: 200,
            color: "var(--ivory)",
          }}
        >
          Telegram Bot
        </h1>
        <p style={{ fontSize: 14, color: "var(--ivoryDD)", marginTop: 4 }}>
          Configure e monitore o bot de atendimento no Telegram
        </p>
      </div>

      {/* Status card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatusCard
          label="Status"
          value={isBotConfigured ? "Ativo" : "Desconectado"}
          color={isBotConfigured ? "var(--mint)" : "var(--red)"}
          icon={isBotConfigured ? "✅" : "❌"}
        />
        <StatusCard
          label="Bot Username"
          value={
            therapist.telegram_bot_username
              ? `@${therapist.telegram_bot_username}`
              : "—"
          }
          color="var(--blue)"
          icon="🤖"
        />
        <StatusCard
          label="Chat ID"
          value={
            therapist.telegram_chat_id
              ? String(therapist.telegram_chat_id)
              : "—"
          }
          color="var(--ivoryD)"
          icon="💬"
        />
      </div>

      {/* Setup instructions */}
      {!isBotConfigured && (
        <div
          style={{
            background: "rgba(196,163,90,.08)",
            border: "1px solid rgba(196,163,90,.3)",
            borderRadius: 16,
            padding: "24px 28px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: "var(--gold)",
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            ⚙ Configuração Necessária
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--ivoryD)",
              lineHeight: 1.8,
            }}
          >
            <p style={{ marginBottom: 8 }}>
              Para ativar o bot do Telegram, siga os passos:
            </p>
            <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Abra o Telegram e fale com o <span style={{ color: "var(--mint)" }}>@BotFather</span></li>
              <li>Envie <code style={{ background: "var(--card2)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>/newbot</code> e siga as instruções</li>
              <li>Copie o <strong>Token do Bot</strong> fornecido</li>
              <li>Acesse <span style={{ color: "var(--mint)" }}>Configurações → Integrações</span> e cole o token</li>
            </ol>
          </div>
        </div>
      )}

      {/* Automations */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: "24px 28px",
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--ff)",
            fontSize: 22,
            fontWeight: 300,
            color: "var(--ivory)",
            marginBottom: 20,
          }}
        >
          Automações
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {[
            {
              key: "reminder_24h",
              label: "Lembrete 24h",
              desc: "Envia lembrete automático 24 horas antes da sessão",
              icon: "⏰",
            },
            {
              key: "reminder_1h",
              label: "Lembrete 1h",
              desc: "Envia lembrete automático 1 hora antes com link da sala",
              icon: "🔔",
            },
            {
              key: "post_session_billing",
              label: "Cobrança Pós-Sessão",
              desc: "Envia link de pagamento automaticamente após a sessão",
              icon: "💳",
            },
            {
              key: "nps_collection",
              label: "Coleta NPS",
              desc: "Pede avaliação da sessão via teclado inline",
              icon: "⭐",
            },
            {
              key: "lead_nurture",
              label: "Nutrição de Leads",
              desc: "Mensagens automáticas para leads que não agendaram",
              icon: "🌱",
            },
            {
              key: "reengagement",
              label: "Reengajamento",
              desc: "Reativação de pacientes inativos com mensagens personalizadas",
              icon: "♻",
            },
          ].map((item, i, arr) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 0",
                borderBottom:
                  i < arr.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--ivory)",
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ivoryDD)",
                      marginTop: 2,
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: 38,
                  height: 22,
                  borderRadius: 11,
                  background: automations[item.key]
                    ? "var(--mint)"
                    : "var(--border2)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background .2s",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: 3,
                    left: automations[item.key] ? 19 : 3,
                    transition: "left .2s var(--ease-out)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commands reference */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: "24px 28px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--ff)",
            fontSize: 22,
            fontWeight: 300,
            color: "var(--ivory)",
            marginBottom: 16,
          }}
        >
          Comandos do Bot
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8,
          }}
        >
          {[
            { cmd: "/start", desc: "Inicia conversa com paciente" },
            { cmd: "/agendar", desc: "Agendar nova sessão" },
            { cmd: "/sessoes", desc: "Ver próximas sessões" },
            { cmd: "/cancelar", desc: "Cancelar sessão" },
            { cmd: "/pagar", desc: "Link de pagamento" },
            { cmd: "/falar", desc: "Conversar com IA" },
            { cmd: "/ajuda", desc: "Lista de comandos" },
          ].map((c) => (
            <div
              key={c.cmd}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "8px 12px",
                background: "var(--bg2)",
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            >
              <code
                style={{
                  fontSize: 12,
                  color: "var(--mint)",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  minWidth: 80,
                }}
              >
                {c.cmd}
              </code>
              <span style={{ fontSize: 12, color: "var(--ivoryDD)" }}>
                {c.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
function StatusCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span
          style={{
            fontSize: 11,
            color: "var(--ivoryDD)",
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--ff)",
          fontSize: 22,
          fontWeight: 300,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}
