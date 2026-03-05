"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/Toast";
import { validateCRP } from "@/lib/utils";
import { EnterpriseCard } from "@/components/ui/EnterpriseCard";

type Step = {
  id: number;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  { id: 1, title: "Bem-vindo", description: "Configure seu perfil clínico" },
  { id: 2, title: "Identidade Profissional", description: "Dados públicos e especialidades" },
  { id: 3, title: "Agenda e Sessão", description: "Valores, duração e modalidade" },
  { id: 4, title: "IA Clínica", description: "Escolha seu modelo de suporte" },
  { id: 5, title: "Telegram Bot", description: "Automação para pacientes" },
  { id: 6, title: "Revisão Final", description: "Valide antes de concluir" },
];

const PROGRESS_WIDTH_CLASSES = [
  "w-1/6",
  "w-2/6",
  "w-3/6",
  "w-4/6",
  "w-5/6",
  "w-full",
] as const;

const AI_MODELS = [
  { value: "anthropic/claude-opus-4-5", label: "Claude Opus 4.5", description: "Máxima qualidade clínica" },
  { value: "anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5", description: "Recomendado para rotina clínica" },
  { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku", description: "Rápido e econômico" },
  { value: "openai/gpt-4o", label: "GPT-4o", description: "Alta precisão para síntese" },
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", description: "Velocidade com multimodal" },
];

const SPECIALTIES = [
  "Psicanálise",
  "TCC",
  "Gestalt",
  "Humanística",
  "Sistêmica",
  "Existencial",
  "ABA",
  "EMDR",
  "Mindfulness",
  "Psicodrama",
];

const SESSION_TYPES = [
  { value: "online", label: "Online (Daily.co)" },
  { value: "presencial", label: "Presencial" },
  { value: "hybrid", label: "Híbrido" },
];

/* ─────────────────────────────────────────────────────────
   Shared form field classes — stitch S08 light_onboard
   ───────────────────────────────────────────────────────── */
const INPUT_BASE =
  "w-full rounded-xl border border-border-subtle bg-surface px-4 py-3.5 text-sm text-text-primary outline-none transition-all duration-300 placeholder:text-text-muted focus:border-brand focus:ring-2 focus:ring-brand/20";

const LABEL_BASE = "mb-2 block text-sm font-medium text-text-secondary";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [crp, setCrp] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const [sessionPrice, setSessionPrice] = useState("200");
  const [sessionDuration, setSessionDuration] = useState("50");
  const [sessionType, setSessionType] = useState("online");
  const [timezone] = useState("America/Sao_Paulo");

  const [aiModel, setAiModel] = useState(AI_MODELS[1].value);

  const currentStep = STEPS[step - 1];
  const progressWidthClass = PROGRESS_WIDTH_CLASSES[step - 1];

  function toggleSpecialty(specialty: string) {
    setSelectedSpecialties((previous) =>
      previous.includes(specialty)
        ? previous.filter((item) => item !== specialty)
        : [...previous, specialty].slice(0, 3)
    );
  }

  function nextStep() {
    setStep((previous) => Math.min(previous + 1, STEPS.length));
  }

  function prevStep() {
    setStep((previous) => Math.max(previous - 1, 1));
  }

  function handleHeaderBack() {
    if (step === 1) {
      router.push("/auth/login");
      return;
    }
    prevStep();
  }

  async function finish() {
    if (!name.trim()) {
      toast.error("Informe seu nome profissional");
      setStep(2);
      return;
    }

    if (!validateCRP(crp)) {
      toast.error("CRP inválido. Exemplo: 06/123456");
      setStep(2);
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { error } = await supabase
        .from("therapists")
        .update({
          name,
          crp,
          bio,
          specialties: selectedSpecialties,
          session_price: Number(sessionPrice),
          session_duration: Number(sessionDuration),
          timezone,
          ai_model: aiModel,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Configuração concluída com sucesso");
      router.push("/dashboard");
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const stepContent = (
    <>
      {/* Step 1 — Welcome */}
      {step === 1 ? (
        <div className="space-y-3">
          <OnboardInfoCard index={0} title="IA Clínica" description="Resumos automáticos e apoio de evolução com modelos premium." />
          <OnboardInfoCard index={1} title="Telegram Bot" description="Lembretes e mensagens automáticas para reduzir faltas." />
          <OnboardInfoCard index={2} title="Prontuário LGPD" description="Estrutura segura para registros clínicos e rastreabilidade." />
        </div>
      ) : null}

      {/* Step 2 — Professional Identity — matches stitch S08 */}
      {step === 2 ? (
        <div className="space-y-4">
          <FieldWithIcon
            label="Nome completo"
            value={name}
            onChange={setName}
            placeholder="Dr(a). Maria Silva"
            icon={<span className="material-symbols-outlined text-[18px]">person</span>}
          />

          <FieldWithIcon
            label="Registro profissional (CRP)"
            value={crp}
            onChange={setCrp}
            placeholder="06/123456"
            icon={<span className="material-symbols-outlined text-[18px]">verified</span>}
          />
          <p className="-mt-2 text-xs text-text-muted">
            Este identificador será usado na assinatura dos prontuários.
          </p>

          <label className="block">
            <span className={LABEL_BASE}>Bio breve</span>
            <textarea
              rows={3}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Descreva sua abordagem e foco clínico."
              className={INPUT_BASE}
            />
          </label>

          {/* Specialty chips — stitch S08 peer-checked pattern */}
          <div>
            <span className={LABEL_BASE}>Especialidades (até 3)</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {SPECIALTIES.map((specialty) => (
                <label key={specialty} className="cursor-pointer">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={selectedSpecialties.includes(specialty)}
                    onChange={() => toggleSpecialty(specialty)}
                    disabled={
                      !selectedSpecialties.includes(specialty) &&
                      selectedSpecialties.length >= 3
                    }
                  />
                  <span className="inline-flex rounded-full border border-border-subtle px-3.5 py-2 text-xs text-text-secondary transition-all peer-checked:border-brand peer-checked:bg-brand/10 peer-checked:text-brand peer-disabled:cursor-not-allowed peer-disabled:opacity-40">
                    {specialty}
                  </span>
                </label>
              ))}
              <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-subtle px-3.5 py-2 text-xs text-text-muted">
                <span className="material-symbols-outlined text-[16px]">add</span>
                Outra
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Step 3 — Schedule */}
      {step === 3 ? (
        <div className="space-y-4">
          <label className="block">
            <span className={LABEL_BASE}>Valor por sessão (R$)</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">R$</span>
              <input
                type="number"
                value={sessionPrice}
                onChange={(event) => setSessionPrice(event.target.value)}
                className={`${INPUT_BASE} pl-10`}
              />
            </div>
          </label>

          <label className="block">
            <span className={LABEL_BASE}>Duração (minutos)</span>
            <input
              type="number"
              value={sessionDuration}
              onChange={(event) => setSessionDuration(event.target.value)}
              className={INPUT_BASE}
            />
          </label>

          <div>
            <span className={LABEL_BASE}>Modalidade</span>
            <div className="flex flex-wrap gap-2">
              {SESSION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSessionType(type.value)}
                  className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
                    sessionType === type.value
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border-subtle bg-surface text-text-secondary hover:border-border-strong"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Step 4 — AI Model */}
      {step === 4 ? (
        <div className="space-y-2.5">
          {AI_MODELS.map((model) => {
            const selected = aiModel === model.value;
            return (
              <button
                key={model.value}
                type="button"
                onClick={() => setAiModel(model.value)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                  selected
                    ? "border-brand/40 bg-brand/8"
                    : "border-border-subtle bg-surface hover:border-border-strong"
                }`}
              >
                <div className={`text-sm ${selected ? "font-semibold text-brand" : "font-medium text-text-primary"}`}>
                  {model.label}
                </div>
                <p className="mt-0.5 text-xs text-text-muted">{model.description}</p>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Step 5 — Telegram */}
      {step === 5 ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border-subtle bg-bg-elevated px-4 py-4 text-sm leading-relaxed text-text-secondary">
            <p className="font-medium text-text-primary">Configuração rápida do Telegram</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Abra o BotFather no Telegram</li>
              <li>Digite <code className="rounded bg-surface px-1.5 py-0.5 text-xs">/newbot</code></li>
              <li>Copie o token e salve em Configurações</li>
            </ol>
          </div>
          <div className="rounded-xl border border-brand/20 bg-brand/8 px-4 py-3 text-xs text-brand">
            Esta etapa pode ser concluída depois em <strong>Dashboard → Telegram</strong>.
          </div>
        </div>
      ) : null}

      {/* Step 6 — Review */}
      {step === 6 ? (
        <div className="space-y-2.5">
          {[
            { label: "Nome", value: name || "—" },
            { label: "CRP", value: crp || "—" },
            { label: "Valor", value: `R$ ${sessionPrice || "—"}` },
            { label: "Duração", value: `${sessionDuration || "—"} min` },
            { label: "Fuso", value: timezone },
            {
              label: "IA",
              value: AI_MODELS.find((model) => model.value === aiModel)?.label ?? "—",
            },
            {
              label: "Especialidades",
              value: selectedSpecialties.length > 0 ? selectedSpecialties.join(", ") : "—",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between border-b border-border-subtle py-2.5 text-sm"
            >
              <span className="text-text-muted">{item.label}</span>
              <span className="font-medium text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );

  return (
    /* Stitch S08: light_onboard theme — bg #fcfcfc, text #1a1a1a */
    <main className="min-h-screen px-4 py-6 sm:py-8" data-theme="onboard">
      <div className="mx-auto w-full max-w-md">
        {/* ── Header ── */}
        <header className="mb-6 pt-2">
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleHeaderBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
              aria-label="Voltar"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div className="font-display text-2xl font-semibold tracking-wider text-text-primary">
              PSIQUE
            </div>
            <span className="h-8 w-8" />
          </div>

          {/* Progress bar — stitch S08 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.15em] text-text-muted">
              <span>Step {step} of {STEPS.length}</span>
              <span>{currentStep.title}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle">
              <div className={`h-full rounded-full bg-brand transition-all duration-500 ${progressWidthClass}`} />
            </div>
          </div>
        </header>

        {/* ── Form card — stitch S08 shadow-mint ── */}
        <EnterpriseCard delay={0.1} className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-[0_10px_40px_-10px_rgba(82,183,136,0.15)]">
          <h1 className="font-display text-3xl font-semibold text-text-primary">
            {currentStep.title}
          </h1>
          <p className="mb-5 mt-2 text-sm text-text-muted">{currentStep.description}</p>

          {stepContent}
        </EnterpriseCard>

        {/* ── Footer navigation ── */}
        <footer className="pb-2 pt-6">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1 || saving}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Voltar
            </button>
            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
              <span className="material-symbols-outlined text-[16px]">stethoscope</span>
              Setup clínico
            </span>
          </div>

          {/* CTA — stitch S08 dark bg, ivory text */}
          <button
            type="button"
            onClick={step < STEPS.length ? nextStep : finish}
            disabled={saving}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-bg-base px-4 py-3.5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando..." : step < STEPS.length ? "Continuar" : "Concluir setup"}
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-0.5 text-[20px]">arrow_forward</span>
          </button>

          <p className="mt-3 flex items-center justify-center gap-1 text-xs text-text-muted">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Seus dados estão protegidos sob a LGPD
          </p>
        </footer>
      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────── */

function OnboardInfoCard({ title, description, index }: { title: string; description: string; index: number }) {
  return (
    <EnterpriseCard delay={0.2 + (index * 0.1)} className="rounded-2xl border border-border-subtle bg-bg-elevated px-4 py-4 p-4">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-muted">{description}</p>
    </EnterpriseCard>
  );
}

function FieldWithIcon({
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-text-secondary">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
          {icon}
        </span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border-subtle bg-surface py-3.5 pl-11 pr-4 text-sm text-text-primary outline-none transition-all duration-300 placeholder:text-text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </span>
    </label>
  );
}
