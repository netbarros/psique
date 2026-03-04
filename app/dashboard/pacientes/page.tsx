import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pacientes" };

async function getPatientsData(therapistId: string) {
  const supabase = await createClient();

  const [patientsResult, sessionsCountResult] = await Promise.all([
    supabase
      .from("patients")
      .select("id, name, email, status, tags, mood_score, telegram_username, created_at, updated_at")
      .eq("therapist_id", therapistId)
      .not("status", "eq", "archived")
      .order("updated_at", { ascending: false }),

    supabase
      .from("sessions")
      .select("patient_id")
      .eq("therapist_id", therapistId),
  ]);

  const patients = patientsResult.data ?? [];
  const sessionCounts: Record<string, number> = {};
  for (const s of sessionsCountResult.data ?? []) {
    sessionCounts[s.patient_id] = (sessionCounts[s.patient_id] ?? 0) + 1;
  }

  return { patients, sessionCounts };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  new: { label: "Novo", color: "var(--blue)", dot: "#4A8FA8" },
  active: { label: "Ativo", color: "var(--mint)", dot: "#52B788" },
  inactive: { label: "Inativo", color: "var(--ivoryDD)", dot: "#8A8070" },
  lead: { label: "Lead", color: "var(--gold)", dot: "#C4A35A" },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function PacientesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!therapist) redirect("/auth/login");

  const { patients, sessionCounts } = await getPatientsData(therapist.id);

  const active = patients.filter(p => p.status === "active").length;
  const newPatients = patients.filter(p => p.status === "new").length;
  const leads = patients.filter(p => p.status === "lead").length;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "var(--ff)", fontSize: 34, fontWeight: 200, color: "var(--ivory)" }}>Pacientes</h1>
          <p style={{ fontSize: 14, color: "var(--ivoryDD)", marginTop: 4 }}>{patients.length} total · {active} ativos · {newPatients} novos · {leads} leads</p>
        </div>
        <button type="button" style={{ padding: "10px 20px", background: "var(--mint)", color: "#060E09", borderRadius: 12, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Novo Paciente
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total", count: patients.length, color: "var(--ivoryD)" },
          { label: "Ativos", count: active, color: "var(--mint)" },
          { label: "Novos (30d)", count: newPatients, color: "var(--blue)" },
          { label: "Leads", count: leads, color: "var(--gold)" },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 30, fontWeight: 200, color }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Patients list */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr",
          padding: "12px 20px", borderBottom: "1px solid var(--border)",
          fontSize: 11, color: "var(--ivoryDD)", letterSpacing: ".08em", textTransform: "uppercase",
        }}>
          <span>Paciente</span>
          <span>Status</span>
          <span>Sessões</span>
          <span>Humor</span>
          <span>Atualizado</span>
        </div>

        {patients.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--ivoryDD)", fontSize: 14 }}>
            Nenhum paciente ainda. Adicione seu primeiro paciente!
          </div>
        ) : (
          <div>
            {patients.map((patient, i) => {
              const statusCfg = STATUS_CONFIG[patient.status] ?? STATUS_CONFIG.inactive;
              const sessions = sessionCounts[patient.id] ?? 0;
              const updatedAt = new Date(patient.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
              const mood = patient.mood_score;

              return (
                <Link key={patient.id} href={`/dashboard/pacientes/${patient.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr",
                    padding: "14px 20px", alignItems: "center",
                    borderBottom: i < patients.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background .15s",
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg2)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {/* Patient */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                        background: "radial-gradient(circle at 35% 35%, rgba(82,183,136,.35), rgba(82,183,136,.15))",
                        border: "1.5px solid rgba(82,183,136,.45)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--ff)", fontSize: 12, color: "var(--mint)", fontWeight: 300,
                      }}>
                        {initials(patient.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, color: "var(--ivory)", fontWeight: 500 }}>{patient.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ivoryDD)" }}>
                          {patient.email}
                          {patient.telegram_username && <span style={{ color: "#54C5F8", marginLeft: 6 }}>@{patient.telegram_username}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 20,
                        background: `${statusCfg.dot}1A`, color: statusCfg.color,
                        border: `1px solid ${statusCfg.dot}40`,
                        display: "inline-flex", alignItems: "center", gap: 5,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusCfg.dot, display: "inline-block" }} />
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Sessions */}
                    <div style={{ fontSize: 14, color: "var(--ivoryD)" }}>
                      {sessions} sessões
                    </div>

                    {/* Mood */}
                    <div>
                      {mood !== null && mood !== undefined ? (
                        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} style={{ width: 6, height: 6, borderRadius: "50%", background: n <= mood ? "var(--mint)" : "var(--border2)" }} />
                          ))}
                          <span style={{ fontSize: 11, color: "var(--ivoryDD)", marginLeft: 4 }}>{mood}/5</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--ivoryDD)" }}>—</span>
                      )}
                    </div>

                    {/* Updated */}
                    <div style={{ fontSize: 12, color: "var(--ivoryDD)" }}>{updatedAt}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
