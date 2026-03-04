"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { validateCRP } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 1, title: "Bem-vindo", description: "Configure seu perfil clínico" },
  { id: 2, title: "Seus dados", description: "Informações profissionais" },
  { id: 3, title: "Configurar agenda", description: "Horários e valores" },
  { id: 4, title: "IA Clínica", description: "Escolha seu modelo de IA" },
  { id: 5, title: "Telegram Bot", description: "Automação para pacientes" },
  { id: 6, title: "Tudo pronto!", description: "Revisão final" },
];

const AI_MODELS = [
  { value: "anthropic/claude-opus-4-5", label: "Claude Opus 4.5 — Máxima qualidade clínica" },
  { value: "anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5 — Recomendado" },
  { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku — Rápido e econômico" },
  { value: "openai/gpt-4o", label: "GPT-4o — Alta precisão" },
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash — Veloz com visão" },
];

const SPECIALTIES = [
  "Psicanálise", "TCC", "Gestalt", "Humanística", "Sistêmica",
  "Existencial", "ABA", "EMDR", "Mindfulness", "Psicodrama",
];

const SESSION_TYPES = [
  { value: "online", label: "Online (Daily.co)" },
  { value: "presencial", label: "Presencial" },
  { value: "hybrid", label: "Híbrido" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 2 — Profile
  const [name, setName] = useState("");
  const [crp, setCrp] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  // Step 3 — Agenda
  const [sessionPrice, setSessionPrice] = useState("200");
  const [sessionDuration, setSessionDuration] = useState("50");
  const [sessionType, setSessionType] = useState("online");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");

  // Step 4 — AI
  const [aiModel, setAiModel] = useState(AI_MODELS[1].value);

  const toggleSpecialty = (s: string) =>
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const finish = async () => {
    if (!name.trim()) { toast.error("Informe seu nome"); setStep(2); return; }
    if (!validateCRP(crp)) { toast.error("CRP inválido"); setStep(2); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

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

      toast.success("Perfil configurado! Bem-vindo ao Psique.");
      router.push("/dashboard");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;
  const currentStep = STEPS[step - 1];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 540 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 42, color: "var(--mint)", fontFamily: "var(--ff)", fontWeight: 200, lineHeight: 1 }}>Ψ</div>
          <p style={{ fontSize: 11, color: "var(--ivoryDD)", letterSpacing: ".15em", textTransform: "uppercase", marginTop: 4 }}>
            Passo {step} de {STEPS.length}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: "var(--border)", borderRadius: 1, marginBottom: 32, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,var(--mint),var(--mintl))", borderRadius: 1, transition: "width .4s var(--ease-out)" }} />
        </div>

        {/* Card */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 24, padding: "36px 40px" }}>
          <h1 style={{ fontFamily: "var(--ff)", fontSize: 30, fontWeight: 200, color: "var(--ivory)", marginBottom: 6 }}>
            {currentStep.title}
          </h1>
          <p style={{ fontSize: 14, color: "var(--ivoryDD)", marginBottom: 28 }}>{currentStep.description}</p>

          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "var(--bg2)", borderRadius: 16, padding: "20px 22px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>✦ IA Clínica</div>
                <p style={{ fontSize: 14, color: "var(--ivoryD)", lineHeight: 1.6 }}>Resumos automáticos de sessão com Claude, GPT-4o ou Gemini</p>
              </div>
              <div style={{ background: "var(--bg2)", borderRadius: 16, padding: "20px 22px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>✈ Telegram Bot</div>
                <p style={{ fontSize: 14, color: "var(--ivoryD)", lineHeight: 1.6 }}>Lembretes automáticos, agendamento e NPS para seus pacientes</p>
              </div>
              <div style={{ background: "var(--bg2)", borderRadius: 16, padding: "20px 22px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>📋 Prontuário LGPD</div>
                <p style={{ fontSize: 14, color: "var(--ivoryD)", lineHeight: 1.6 }}>Evolução clínica assinada digitalmente e segura</p>
              </div>
            </div>
          )}

          {/* ── Step 2: Dados profissionais ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label="Nome profissional" placeholder="Dr./Dra. Nome Sobrenome" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              <Input label="CRP" placeholder="06/123456" value={crp} onChange={(e) => setCrp(e.target.value)} hint="Formato: UF/número" fullWidth />
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ivoryD)", letterSpacing: ".04em", display: "block", marginBottom: 6 }}>Bio breve</label>
                <textarea
                  rows={3}
                  placeholder="Compartilhe um pouco sobre sua abordagem e experiência..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ width: "100%", background: "var(--card2)", border: "1px solid var(--border2)", color: "var(--text)", borderRadius: 12, padding: "12px 16px", fontFamily: "var(--fs)", fontSize: 14, outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ivoryD)", marginBottom: 10, display: "block" }}>Especialidades (selecione as suas)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SPECIALTIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      style={{
                        padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                        background: selectedSpecialties.includes(s) ? "var(--mint)" : "var(--card2)",
                        color: selectedSpecialties.includes(s) ? "#060E09" : "var(--ivoryD)",
                        border: selectedSpecialties.includes(s) ? "1px solid var(--mint)" : "1px solid var(--border2)",
                        transition: "all .2s",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Agenda ── */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label="Valor por sessão (R$)" type="number" value={sessionPrice} onChange={(e) => setSessionPrice(e.target.value)} prefix="R$" fullWidth />
              <Input label="Duração (minutos)" type="number" value={sessionDuration} onChange={(e) => setSessionDuration(e.target.value)} suffix="min" fullWidth />
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ivoryD)", marginBottom: 8, display: "block" }}>Modalidade</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {SESSION_TYPES.map((t) => (
                    <button key={t.value} type="button" onClick={() => setSessionType(t.value)} style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, cursor: "pointer", background: sessionType === t.value ? "var(--g1)" : "var(--card2)", color: sessionType === t.value ? "var(--mint)" : "var(--ivoryD)", border: sessionType === t.value ? "1px solid rgba(82,183,136,.4)" : "1px solid var(--border2)", transition: "all .2s" }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: IA Model ── */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {AI_MODELS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setAiModel(m.value)}
                  style={{
                    padding: "14px 18px", borderRadius: 14, textAlign: "left", cursor: "pointer",
                    background: aiModel === m.value ? "var(--g1)" : "var(--bg2)",
                    border: aiModel === m.value ? "1px solid rgba(82,183,136,.45)" : "1px solid var(--border)",
                    transition: "all .2s",
                  }}
                >
                  <div style={{ fontSize: 13, color: aiModel === m.value ? "var(--mint)" : "var(--ivory)", fontWeight: aiModel === m.value ? 600 : 400 }}>
                    {aiModel === m.value ? "✦ " : ""}
                    {m.label.split(" — ")[0]}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ivoryDD)", marginTop: 2 }}>{m.label.split(" — ")[1]}</div>
                </button>
              ))}
            </div>
          )}

          {/* ── Step 5: Telegram ── */}
          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "var(--bg2)", borderRadius: 16, padding: "20px 22px", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 14, color: "var(--ivoryD)", lineHeight: 1.7 }}>
                  Para configurar o Telegram Bot:<br />
                  1. Abra o <strong style={{ color: "var(--mint)" }}>@BotFather</strong> no Telegram<br />
                  2. Digite <code style={{ background: "var(--card)", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>/newbot</code><br />
                  3. Copie o <strong>TOKEN</strong> gerado<br />
                  4. Cole nas configurações após o onboarding
                </p>
              </div>
              <div style={{ background: "rgba(82,183,136,.06)", borderRadius: 14, padding: "14px 18px", border: "1px solid rgba(82,183,136,.2)" }}>
                <p style={{ fontSize: 12, color: "var(--mint)" }}>
                  ✦ Esta etapa pode ser configurada depois em <strong>Dashboard → Telegram</strong>
                </p>
              </div>
            </div>
          )}

          {/* ── Step 6: Final review ── */}
          {step === 6 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Nome", value: name || "—" },
                { label: "CRP", value: crp || "—" },
                { label: "Valor", value: `R$ ${sessionPrice}` },
                { label: "Duração", value: `${sessionDuration} min` },
                { label: "IA", value: AI_MODELS.find(m => m.value === aiModel)?.label.split(" — ")[0] ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--ivoryDD)" }}>{label}</span>
                  <span style={{ color: "var(--ivory)", fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, gap: 12 }}>
            <Button variant="ghost" onClick={prevStep} disabled={step === 1}>
              ← Voltar
            </Button>
            {step < STEPS.length ? (
              <Button onClick={nextStep}>
                Próximo →
              </Button>
            ) : (
              <Button onClick={finish} loading={saving}>
                Começar →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
