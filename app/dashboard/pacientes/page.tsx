import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { EnterpriseCard } from "@/components/ui/EnterpriseCard";

export const metadata: Metadata = { title: "Pacientes" };

type PatientStatus = "active" | "new" | "lead" | "inactive" | "archived";

type PatientRow = {
  id: string;
  name: string;
  email: string;
  status: PatientStatus;
  tags: string[] | null;
  mood_score: number | null;
  telegram_username: string | null;
  updated_at: string;
};

type SearchParams = {
  q?: string | string[];
  status?: string | string[];
};

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Ativos" },
  { key: "new", label: "Novos" },
  { key: "lead", label: "Leads" },
] as const;

const STATUS_STYLE: Record<string, string> = {
  active: "border-brand/35 bg-brand/10 text-brand",
  new: "border-sky-400/35 bg-sky-400/10 text-sky-300",
  lead: "border-amber-400/35 bg-amber-400/10 text-amber-300",
  inactive: "border-border-strong bg-surface text-text-muted",
};

const MOOD_WIDTH: Record<number, string> = {
  0: "w-0",
  1: "w-1/5",
  2: "w-2/5",
  3: "w-3/5",
  4: "w-4/5",
  5: "w-full",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "PT";
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function normalizeParam(value?: string | string[]): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

async function getPatientsData(therapistId: string) {
  const supabase = await createClient();
  const [patientsResult, sessionsResult] = await Promise.all([
    supabase
      .from("patients")
      .select("id, name, email, status, tags, mood_score, telegram_username, updated_at")
      .eq("therapist_id", therapistId)
      .not("status", "eq", "archived")
      .order("updated_at", { ascending: false }),
    supabase.from("sessions").select("id, patient_id").eq("therapist_id", therapistId),
  ]);

  const counts = new Map<string, number>();
  (sessionsResult.data ?? []).forEach((session) => {
    counts.set(session.patient_id, (counts.get(session.patient_id) ?? 0) + 1);
  });

  return {
    patients: (patientsResult.data ?? []) as PatientRow[],
    sessionsCountByPatient: counts,
  };
}

export default async function PacientesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const search = normalizeParam(params.q).trim().toLowerCase();
  const filter = normalizeParam(params.status) || "all";

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

  const { patients, sessionsCountByPatient } = await getPatientsData(therapist.id);

  const filtered = patients.filter((patient) => {
    const matchFilter = filter === "all" ? true : patient.status === filter;
    if (!matchFilter) return false;
    if (!search) return true;

    const haystack = `${patient.name} ${patient.email} ${patient.telegram_username ?? ""}`.toLowerCase();
    return haystack.includes(search);
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          Pacientes
        </h1>
        <p className="text-sm text-text-muted">
          {filtered.length} de {patients.length} pacientes exibidos
        </p>
      </header>

      <form action="/dashboard/pacientes" className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-text-muted">search</span>
            <input
          className="w-full rounded-xl border border-border-subtle bg-surface py-3 pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand/40"
          defaultValue={search}
          name="q"
          placeholder="Buscar por nome, email ou telegram..."
          type="search"
        />
        <input name="status" type="hidden" value={filter} />
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((item) => {
          const active = filter === item.key;
          const href = `/dashboard/pacientes?status=${item.key}${search ? `&q=${encodeURIComponent(search)}` : ""}`;
          return (
            <Link
              key={item.key}
              href={href}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-brand/35 bg-brand/10 text-brand"
                  : "border-border-subtle bg-surface text-text-secondary hover:border-border-strong"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface/40 p-8 text-center text-sm text-text-secondary">
          Nenhum paciente encontrado com os filtros atuais.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((patient, index) => {
            const moodValue = Math.max(0, Math.min(5, Math.round(patient.mood_score ?? 0)));
            const sessions = sessionsCountByPatient.get(patient.id) ?? 0;
            const statusLabel = FILTERS.find((filterItem) => filterItem.key === patient.status)?.label ?? patient.status;
            const updatedAt = new Date(patient.updated_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            });

            return (
              <EnterpriseCard delay={index * 0.05} interactive key={patient.id} className="p-0">
                <Link
                  href={`/dashboard/pacientes/${patient.id}`}
                  className="group block h-full w-full p-4"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-bg-elevated text-xs font-semibold text-brand transition-colors group-hover:border-brand/50">
                      {initials(patient.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-text-primary transition-colors group-hover:text-brand">
                          {patient.name}
                        </p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[patient.status] ?? STATUS_STYLE.inactive}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-text-muted">{patient.email}</p>
                      {patient.telegram_username ? (
                        <p className="mt-0.5 truncate text-xs text-sky-400">@{patient.telegram_username}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="h-1 w-full overflow-hidden rounded-full bg-border-subtle">
                    <div className={`h-full rounded-full bg-brand transition-all duration-500 ease-out group-hover:bg-brand-highlight ${MOOD_WIDTH[moodValue]}`} />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
                    <span>{sessions} sessões</span>
                    <span>Atualizado em {updatedAt}</span>
                  </div>

                  {patient.tags && patient.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {patient.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border-subtle bg-bg-elevated px-2 py-0.5 text-[10px] text-text-secondary transition-colors group-hover:border-border-strong group-hover:text-text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              </EnterpriseCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
