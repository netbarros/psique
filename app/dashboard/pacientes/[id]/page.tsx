import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { MedicalRecordRow, PatientRow, PaymentRow, SessionRow } from "@/lib/database.types";
import { formatDate } from "@/lib/utils";
import { PatientProfileTabs } from "@/components/dashboard/PatientProfileTabs";
import { EnterpriseCard, EnterpriseStat } from "@/components/ui/EnterpriseCard";

export const metadata: Metadata = { title: "Perfil Clínico do Paciente" };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "PT";
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function resolvePaymentStatus(payments: PaymentRow[]): { label: string; tone: string } {
  if (payments.some((payment) => payment.status === "pending")) {
    return { label: "Pendente", tone: "text-amber-300" };
  }
  if (payments.some((payment) => payment.status === "paid")) {
    return { label: "Em dia", tone: "text-brand" };
  }
  return { label: "Sem dados", tone: "text-text-muted" };
}

async function getPatientDetail(therapistId: string, patientId: string) {
  const supabase = await createClient();

  const [patientResult, recordsResult, sessionsResult, paymentsResult] = await Promise.all([
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
    patient: (patientResult.data ?? null) as PatientRow | null,
    records: (recordsResult.data ?? []) as MedicalRecordRow[],
    sessions: (sessionsResult.data ?? []) as SessionRow[],
    payments: (paymentsResult.data ?? []) as PaymentRow[],
  };
}

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

  const { patient, records, sessions, payments } = await getPatientDetail(therapist.id, id);
  if (!patient) notFound();

  const age = calculateAge(patient.birth_date);
  const primaryTags = (patient.tags ?? []).slice(0, 2);
  const riskFromTags = (patient.tags ?? []).find((tag) => /risco|risk/i.test(tag));
  const riskFromAi = sessions.find((session) => (session.ai_risk_flags ?? []).length > 0)?.ai_risk_flags?.[0] ?? null;
  const riskBadge = riskFromTags ?? riskFromAi;

  const sessionsCount = sessions.length;
  const lastSessionDate = sessions[0]?.created_at ?? null;
  const paymentStatus = resolvePaymentStatus(payments);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/pacientes"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
            aria-label="Voltar para lista de pacientes"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-medium text-text-primary">
              {patient.name}
            </h1>
            <p className="flex items-center gap-1 text-xs text-text-muted">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Active Patient
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
          aria-label="Mais ações"
        >
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </header>

      <EnterpriseCard className="p-5">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-strong bg-bg-elevated font-display text-xl text-brand">
            {initials(patient.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-medium text-text-primary">
                  {patient.name}
                </h2>
                <p className="mt-0.5 text-sm text-text-muted">
                  {age ? `${age} anos` : "Idade não informada"} {patient.cpf ? `• CPF ${patient.cpf}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-sky-300"
                aria-label="Enviar mensagem"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {primaryTags.length > 0 ? (
                primaryTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border-subtle bg-bg-elevated px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="rounded-md border border-border-subtle bg-bg-elevated px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  Acompanhamento
                </span>
              )}

              {riskBadge ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-error/35 bg-error/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-error">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  {riskBadge}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-border-subtle pt-4">
          <EnterpriseStat
            label="Sessões"
            value={sessionsCount.toString()}
            delay={0.1}
          />
          <EnterpriseStat
            label="Última"
            value={lastSessionDate ? formatDate(lastSessionDate) : "—"}
            delay={0.2}
          />
          <EnterpriseStat
            label="Status Pag."
            value={<span className={paymentStatus.tone}>{paymentStatus.label}</span>}
            delay={0.3}
          />
        </div>
      </EnterpriseCard>

      <section className="grid grid-cols-2 gap-3">
        <EnterpriseCard delay={0.1} interactive className="group p-4 text-center">
          <Link href={`/dashboard/agenda?patient=${patient.id}`} className="block">
            <span className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-secondary transition-colors group-hover:border-brand group-hover:text-brand">
              <span className="material-symbols-outlined text-[20px]">videocam</span>
            </span>
            <p className="text-sm font-medium text-text-secondary">Iniciar Sessão</p>
          </Link>
        </EnterpriseCard>
        
        <EnterpriseCard delay={0.2} interactive className="group p-4 text-center">
          <Link href={`/dashboard/ia?patient=${patient.id}`} className="block">
            <span className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-secondary transition-colors group-hover:border-gold group-hover:text-gold">
              <span className="material-symbols-outlined text-[20px]">edit_document</span>
            </span>
            <p className="text-sm font-medium text-text-secondary">Nova Nota</p>
          </Link>
        </EnterpriseCard>
      </section>

      <PatientProfileTabs
        patientName={patient.name}
        records={records}
        sessions={sessions}
        payments={payments}
        riskBadge={riskBadge ?? null}
      />
    </div>
  );
}
