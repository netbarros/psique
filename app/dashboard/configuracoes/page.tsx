import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import SecurityTwoFactorCard, { type SecurityMFAFactor } from "@/components/dashboard/SecurityTwoFactorCard";
import SettingsTabs from "@/components/dashboard/SettingsTabs";
import { SecuritySettingsPanel } from "@/components/dashboard/SecuritySettingsPanel";
import { EnterpriseCard } from "@/components/ui/EnterpriseCard";

export const metadata: Metadata = { title: "Configurações" };

type AuditEvent = {
  id: string;
  title: string;
  action: string;
  tableName: string;
  createdAt: string;
  ip: string | null;
};

function titleFromAction(action: string, tableName: string): string {
  if (tableName === "patient_journal_entries") return "Registro de diário";
  if (tableName === "therapist_settings") return "Atualização de segurança";
  if (tableName === "therapists") return "Atualização de perfil";
  if (tableName === "appointments") return "Mudança em agendamento";
  if (tableName === "sessions") return "Atualização de sessão";

  if (action === "export") return "Exportação de dados";
  if (action === "view") return "Acesso a registro";
  if (action === "create") return "Criação de registro";
  if (action === "delete") return "Remoção de registro";

  return "Atualização de registro";
}

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, name, cancellation_policy_hours")
    .eq("user_id", user.id)
    .single();
  if (!therapist) redirect("/auth/login");

  const [{ data: mfaData }, { data: securitySettings }, { data: auditRows }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase
      .from("therapist_settings")
      .select("encrypt_records, require_lgpd_consent, blur_patient_data")
      .eq("therapist_id", therapist.id)
      .maybeSingle(),
    supabase
      .from("audit_logs")
      .select("id, action, table_name, created_at, ip_address")
      .eq("therapist_id", therapist.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const factors: SecurityMFAFactor[] = (mfaData?.totp ?? []).map((factor) => ({
    id: factor.id,
    type: factor.factor_type,
    status: factor.status,
  }));

  const therapistInitials = therapist.name
    .split(" ")
    .map((part: string) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const initialEvents: AuditEvent[] = (auditRows ?? []).map((row) => ({
    id: row.id,
    title: titleFromAction(row.action, row.table_name),
    action: row.action,
    tableName: row.table_name,
    createdAt: row.created_at,
    ip: row.ip_address,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <header className="mb-6 flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-elevated/70 p-4 backdrop-blur-sm">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary sm:text-4xl">
            Segurança & LGPD
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Gerencie proteção de acesso, privacidade e trilhas de auditoria.
          </p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface text-xs font-semibold tracking-wide text-gold">
          {therapistInitials || "DR"}
        </span>
      </header>

      <SettingsTabs active="seguranca" />

      <EnterpriseCard delay={0.1} className="flex flex-col p-0 border-border-subtle bg-bg-base overflow-hidden">
        <SecurityTwoFactorCard factors={factors} />
        <SecuritySettingsPanel
          initial={{
            encryptRecords: securitySettings?.encrypt_records ?? true,
            requireLgpdConsent: securitySettings?.require_lgpd_consent ?? true,
            blurPatientData: securitySettings?.blur_patient_data ?? false,
            cancellationPolicyHours: therapist.cancellation_policy_hours ?? 24,
          }}
          initialEvents={initialEvents}
        />
      </EnterpriseCard>
    </div>
  );
}
