import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Home, Calendar, Activity, MessageCircle, Heart, LogOut } from "lucide-react";

export const metadata: Metadata = {
  title: { default: "Portal do Paciente", template: "%s — Psique" },
  description: "Seu espaço na plataforma Psique.",
};

interface PatientInfo {
  id: string;
  name: string;
  email: string;
  therapist_id: string;
}

interface TherapistInfo {
  name: string;
  photo_url: string | null;
}

// ── Nav items ─────────────────────────────────────────────────────
const NAV = [
  { id: "home", label: "Início", Icon: Home, path: "/portal" },
  { id: "agendar", label: "Agendar", Icon: Calendar, path: "/portal/agendar" },
  { id: "sessoes", label: "Sessões", Icon: Activity, path: "/portal/sessoes" },
  { id: "chat", label: "Concierge AI", Icon: MessageCircle, path: "/portal/chat" },
  { id: "apoio", label: "Apoio Diário", Icon: Heart, path: "/portal/apoio" },
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Find patient record linked to this user.
  // Fallback to service-role read to avoid RLS blind spots for patient-owned profile lookups.
  const { data: patientRls } = await supabase
    .from("patients")
    .select("id, name, email, therapist_id")
    .eq("user_id", user.id)
    .single();

  let patient = patientRls as unknown as PatientInfo | null;
  if (!patient && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data: patientAdmin } = await admin
      .from("patients")
      .select("id, name, email, therapist_id")
      .eq("user_id", user.id)
      .single();

    patient = patientAdmin as unknown as PatientInfo | null;
  }

  if (!patient) {
    // Not a patient — might be a therapist
    redirect("/dashboard");
  }

  const p = patient;

  // Fetch therapist name for sidebar
  const { data: therapist } = await supabase
    .from("therapists")
    .select("name, photo_url")
    .eq("id", p.therapist_id)
    .single();

  const t = therapist as unknown as TherapistInfo | null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-primary)] relative">
      {/* Background Ambience Map */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.85\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }} />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--color-brand)] opacity-[0.03] blur-[140px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-[-200px] w-[500px] h-[500px] bg-[var(--color-brand)] opacity-[0.02] blur-[120px] rounded-full pointer-events-none" />

      {/* Glassmorphic Sidebar */}
      <PatientSidebar patient={p} therapist={t} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative z-10 w-full h-full">
        {children}
      </main>
    </div>
  );
}

function PatientSidebar({
  patient,
  therapist,
}: {
  patient: PatientInfo;
  therapist: TherapistInfo | null;
}) {
  return (
    <aside className="w-[280px] glass-panel border-r border-[var(--color-border-subtle)] flex flex-col shrink-0 overflow-y-auto z-20">
      {/* Logo Area */}
      <div className="px-6 pt-8 pb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]/20 shadow-[0_0_20px_rgba(82,183,136,0.1)] shrink-0">
          <span className="text-[18px] text-[var(--color-brand)] leading-none font-serif font-light">
            Ψ
          </span>
        </div>
        <div className="flex flex-col">
          <div className="font-[family-name:var(--font-display)] text-[22px] font-medium text-[var(--color-text-primary)] tracking-tight leading-tight">
            Psique
          </div>
          <div className="text-[10px] text-[var(--color-brand)] tracking-[0.2em] uppercase mt-0.5 font-semibold opacity-80">
            Portal Paciente
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
        {NAV.map((item) => {
          const Icon = item.Icon;
          return (
            <Link
              key={item.id}
              href={item.path}
              className="group flex items-center gap-4 px-4 py-3 rounded-xl text-[14px] text-[var(--color-text-secondary)] font-medium no-underline border border-transparent transition-all duration-300 hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-subtle)] hover:shadow-sm"
            >
              <Icon size={18} className="shrink-0 opacity-70 group-hover:opacity-100 group-hover:text-[var(--color-brand)] transition-colors duration-300" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="w-full px-6 mb-2">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent" />
      </div>

      {/* Patient info card */}
      <div className="px-5 py-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[13px] font-[family-name:var(--font-display)] text-[var(--color-bg-base)] font-bold bg-[var(--color-brand)] shadow-[0_4px_20px_rgba(82,183,136,0.3)] shrink-0 transition-transform duration-300 hover:scale-105 cursor-default">
          {initials(patient.name)}
        </div>
        <div className="flex flex-col overflow-hidden">
          <div className="text-[14px] text-[var(--color-text-primary)] font-medium truncate w-full" title={patient.name}>
            {patient.name}
          </div>
          <div className="text-[12px] text-[var(--color-text-muted)] truncate w-full" title={patient.email}>
            {patient.email}
          </div>
        </div>
      </div>

      {/* Therapist badge (if exists) */}
      {therapist && (
        <div className="mx-5 mb-5 px-4 py-3 rounded-xl bg-black/40 border border-[var(--color-border-subtle)]">
          <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.08em] mb-1 font-medium">
            Clínica Responsável
          </div>
          <div className="text-[13px] text-[var(--color-text-secondary)] font-medium line-clamp-1 truncate" title={therapist.name}>
            {therapist.name}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="px-5 pb-6">
        <form action="/auth/login">
          <button
            type="submit"
            className="group w-full px-4 py-3 rounded-xl text-[13px] font-semibold text-[var(--color-error)] bg-transparent border border-transparent cursor-pointer text-left transition-all duration-300 hover:bg-[var(--color-error)]/10 hover:border-[var(--color-error)]/20 flex items-center gap-3"
          >
            <LogOut size={16} strokeWidth={2.5} className="transition-transform duration-300 group-hover:-translate-x-1" />
            Encerrar Sessão
          </button>
        </form>
      </div>
    </aside>
  );
}
