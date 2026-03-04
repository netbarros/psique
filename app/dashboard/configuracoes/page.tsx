import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!therapist) redirect("/auth/login");

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }}>
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
          Configurações
        </h1>
        <p style={{ fontSize: 14, color: "var(--ivoryDD)", marginTop: 4 }}>
          Perfil, integrações e segurança
        </p>
      </div>

      {/* Profile section */}
      <Section title="Perfil Profissional" icon="👤">
        <InfoRow label="Nome" value={therapist.name} />
        <InfoRow label="CRP" value={therapist.crp} />
        <InfoRow label="Bio" value={therapist.bio ?? "Não definida"} />
        <InfoRow label="Slug" value={`/booking/${therapist.slug}`} mono />
        <InfoRow
          label="Especialidades"
          value={
            therapist.specialties && (therapist.specialties as string[]).length > 0
              ? (therapist.specialties as string[]).join(", ")
              : "Nenhuma definida"
          }
        />
        <InfoRow label="Foto" value={therapist.photo_url ?? "Não definida"} />
      </Section>

      {/* Session config */}
      <Section title="Sessão" icon="🕐">
        <InfoRow
          label="Preço"
          value={`R$ ${Number(therapist.session_price).toFixed(2)}`}
          highlight
        />
        <InfoRow label="Duração" value={`${therapist.session_duration} minutos`} />
        <InfoRow label="Timezone" value={therapist.timezone} />
      </Section>

      {/* Integrations */}
      <Section title="Integrações" icon="🔗">
        <IntegrationRow
          name="OpenRouter (IA)"
          connected={!!therapist.openrouter_key_hash}
          detail={therapist.ai_model ?? "Modelo não selecionado"}
        />
        <IntegrationRow
          name="Telegram Bot"
          connected={!!therapist.telegram_bot_token}
          detail={
            therapist.telegram_bot_username
              ? `@${therapist.telegram_bot_username}`
              : undefined
          }
        />
        <IntegrationRow
          name="Stripe"
          connected={!!therapist.stripe_account_id}
          detail={therapist.stripe_account_id ?? undefined}
        />
      </Section>

      {/* Security */}
      <Section title="Segurança" icon="🔒">
        <InfoRow label="Email" value={user.email ?? "—"} />
        <InfoRow
          label="Último login"
          value={
            user.last_sign_in_at
              ? new Date(user.last_sign_in_at).toLocaleString("pt-BR")
              : "—"
          }
        />
        <InfoRow label="Conta ativa" value={therapist.active ? "Sim" : "Não"} />
        <InfoRow
          label="Onboarding"
          value={therapist.onboarding_completed ? "Concluído ✅" : "Pendente"}
        />

        <div style={{ marginTop: 16 }}>
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(184,84,80,.08)",
              border: "1px solid rgba(184,84,80,.2)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--ivoryDD)",
            }}
          >
            🔐 2FA via TOTP será habilitado na Fase 10 (Segurança). Os dados dos
            pacientes são protegidos por Row Level Security (RLS) no Supabase.
          </div>
        </div>
      </Section>

      {/* Timestamps */}
      <div
        style={{
          marginTop: 24,
          padding: "12px 16px",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          display: "flex",
          gap: 24,
          fontSize: 11,
          color: "var(--ivoryDD)",
        }}
      >
        <span>
          Conta criada:{" "}
          {new Date(therapist.created_at).toLocaleDateString("pt-BR")}
        </span>
        <span>
          Última atualização:{" "}
          {new Date(therapist.updated_at).toLocaleDateString("pt-BR")}
        </span>
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: "24px 28px",
        marginBottom: 20,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--ff)",
          fontSize: 22,
          fontWeight: 300,
          color: "var(--ivory)",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>{icon}</span> {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: "var(--ivoryDD)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: highlight ? "var(--gold)" : "var(--ivoryD)",
          fontFamily: mono ? "monospace" : "var(--fs)",
          fontWeight: highlight ? 600 : 400,
          maxWidth: 400,
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function IntegrationRow({
  name,
  connected,
  detail,
}: {
  name: string;
  connected: boolean;
  detail?: string;
}) {
  return (
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
        <div
          style={{ fontSize: 14, color: "var(--ivory)", fontWeight: 500 }}
        >
          {name}
        </div>
        {detail && (
          <div
            style={{
              fontSize: 11,
              color: "var(--ivoryDD)",
              marginTop: 2,
            }}
          >
            {detail}
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: 11,
          padding: "3px 10px",
          borderRadius: 20,
          background: connected
            ? "rgba(82,183,136,.12)"
            : "rgba(184,84,80,.12)",
          color: connected ? "var(--mint)" : "var(--red)",
          border: connected
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
            background: connected ? "var(--mint)" : "var(--red)",
            display: "inline-block",
          }}
        />
        {connected ? "Conectado" : "Desconectado"}
      </span>
    </div>
  );
}
