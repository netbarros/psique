import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type {
  PatientRow,
  MedicalRecordRow,
  SessionRow,
  PaymentRow,
} from "@/types/database";
import { PatientDetailTabs } from "@/components/dashboard/PatientDetailTabs";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Detalhe do Paciente" };

// ── Status config ─────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  new: { label: "Novo", color: "var(--blue)", dot: "#4A8FA8" },
  active: { label: "Ativo", color: "var(--mint)", dot: "#52B788" },
  inactive: { label: "Inativo", color: "var(--ivoryDD)", dot: "#8A8070" },
  lead: { label: "Lead", color: "var(--gold)", dot: "#C4A35A" },
  archived: { label: "Arquivado", color: "var(--ivoryDD)", dot: "#6A6060" },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Data fetching ─────────────────────────────────────────────────
async function getPatientDetail(therapistId: string, patientId: string) {
  const supabase = await createClient();

  const [patientResult, recordsResult, sessionsResult, paymentsResult] =
    await Promise.all([
      supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .eq("therapist_id", therapistId)
        .single(),

      supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", patientId)
        .eq("therapist_id", therapistId)
        .order("created_at", { ascending: false }),

      supabase
        .from("sessions")
        .select("*")
        .eq("patient_id", patientId)
        .eq("therapist_id", therapistId)
        .order("created_at", { ascending: false }),

      supabase
        .from("payments")
        .select("*")
        .eq("patient_id", patientId)
        .eq("therapist_id", therapistId)
        .order("created_at", { ascending: false }),
    ]);

  return {
    patient: patientResult.data as unknown as PatientRow | null,
    records: (recordsResult.data ?? []) as unknown as MedicalRecordRow[],
    sessions: (sessionsResult.data ?? []) as unknown as SessionRow[],
    payments: (paymentsResult.data ?? []) as unknown as PaymentRow[],
  };
}

// ── Page ──────────────────────────────────────────────────────────
export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!therapist) redirect("/auth/login");

  const { patient, records, sessions, payments } = await getPatientDetail(
    therapist.id,
    id
  );
  if (!patient) notFound();

  const statusCfg = STATUS_CONFIG[patient.status] ?? STATUS_CONFIG.inactive;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200 }}>
      {/* Back link */}
      <Link
        href="/dashboard/pacientes"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--ivoryDD)",
          marginBottom: 20,
          transition: "color .2s",
        }}
      >
        ← Voltar para pacientes
      </Link>

      {/* Patient header */}
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "flex-start",
          marginBottom: 32,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            flexShrink: 0,
            background:
              "radial-gradient(circle at 35% 35%, rgba(82,183,136,.35), rgba(82,183,136,.15))",
            border: "2px solid rgba(82,183,136,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--ff)",
            fontSize: 24,
            color: "var(--mint)",
            fontWeight: 300,
          }}
        >
          {initials(patient.name)}
        </div>

        {/* Patient info */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 6,
            }}
          >
            <h1
              style={{
                fontFamily: "var(--ff)",
                fontSize: 32,
                fontWeight: 200,
                color: "var(--ivory)",
              }}
            >
              {patient.name}
            </h1>
            <span
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 20,
                background: `${statusCfg.dot}1A`,
                color: statusCfg.color,
                border: `1px solid ${statusCfg.dot}40`,
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
                  background: statusCfg.dot,
                  display: "inline-block",
                }}
              />
              {statusCfg.label}
            </span>
          </div>

          {/* Contact details */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              fontSize: 13,
              color: "var(--ivoryDD)",
              marginBottom: 8,
            }}
          >
            <span>✉ {patient.email}</span>
            {patient.phone && <span>📞 {patient.phone}</span>}
            {patient.telegram_username && (
              <span style={{ color: "#54C5F8" }}>
                @{patient.telegram_username}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              fontSize: 12,
              color: "var(--ivoryDD)",
            }}
          >
            {patient.birth_date && (
              <span>🎂 {formatDate(patient.birth_date)}</span>
            )}
            {patient.cpf && <span>CPF: {patient.cpf}</span>}
            <span>Desde {formatDate(patient.created_at)}</span>
            {patient.gdpr_consent && (
              <span style={{ color: "var(--mint)" }}>✓ LGPD consentido</span>
            )}
          </div>

          {/* Tags */}
          {patient.tags && patient.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              {patient.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11,
                    padding: "2px 10px",
                    borderRadius: 20,
                    background: "var(--card2)",
                    color: "var(--ivoryD)",
                    border: "1px solid var(--border2)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Mood */}
          {patient.mood_score !== null && patient.mood_score !== undefined && (
            <div
              style={{
                display: "flex",
                gap: 4,
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <span
                style={{ fontSize: 12, color: "var(--ivoryDD)", marginRight: 4 }}
              >
                Humor:
              </span>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background:
                      n <= (patient.mood_score ?? 0)
                        ? "var(--mint)"
                        : "var(--border2)",
                  }}
                />
              ))}
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ivoryDD)",
                  marginLeft: 4,
                }}
              >
                {patient.mood_score}/5
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            style={{
              padding: "10px 20px",
              background: "var(--card2)",
              color: "var(--ivoryD)",
              borderRadius: 12,
              border: "1px solid var(--border2)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all .2s var(--ease-out)",
            }}
          >
            ✏ Editar
          </button>
          <Link
            href={`/dashboard/agenda?patient=${id}`}
            style={{
              padding: "10px 20px",
              background: "var(--mint)",
              color: "#060E09",
              borderRadius: 12,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            + Agendar Sessão
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Sessões"
          value={String(sessions.length)}
          color="var(--mint)"
        />
        <StatCard
          label="Registros"
          value={String(records.length)}
          color="var(--blue)"
        />
        <StatCard
          label="Pagamentos"
          value={String(payments.length)}
          color="var(--gold)"
        />
        <StatCard
          label="NPS Médio"
          value={calcAvgNPS(sessions)}
          color="var(--purple)"
        />
      </div>

      {/* Tabs */}
      <PatientDetailTabs
        patientId={id}
        records={records}
        sessions={sessions}
        payments={payments}
      />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "16px 20px",
      }}
    >
      <div
        style={{ fontSize: 11, color: "var(--ivoryDD)", marginBottom: 6 }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--ff)",
          fontSize: 28,
          fontWeight: 200,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function calcAvgNPS(sessions: SessionRow[]): string {
  const scored = sessions.filter(
    (s) => s.nps_score !== null && s.nps_score !== undefined
  );
  if (scored.length === 0) return "—";
  const avg =
    scored.reduce((a, s) => a + (s.nps_score ?? 0), 0) / scored.length;
  return `${avg.toFixed(1)}/5`;
}
