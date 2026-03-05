"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateCRP } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

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

export default function TherapistRegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "solo";
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [crp, setCrp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleSpecialty(specialty: string) {
    setSelectedSpecialties((previous) =>
      previous.includes(specialty)
        ? previous.filter((item) => item !== specialty)
        : [...previous, specialty].slice(0, 3)
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (!email.includes("@")) {
      setError("Email inválido");
      return;
    }

    if (!validateCRP(crp)) {
      setError("CRP inválido. Formato esperado: 06/123456");
      return;
    }

    if (password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "therapist",
            crp,
            specialties: selectedSpecialties,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      router.push(`/checkout/secure?plan=${plan}`);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-base px-4 py-6 text-text-primary sm:py-8">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6 pt-2">
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
              aria-label="Voltar"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div className="font-display text-2xl font-semibold tracking-wider text-text-primary">
              PSIQUE
            </div>
            <ThemeToggle />
          </div>

          <h1 className="font-display text-4xl font-semibold text-text-primary">
            Criar Conta de Terapeuta
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Estruture sua operação clínica desde o primeiro acesso, com onboarding guiado e ativação rápida.
          </p>
          <div className="mt-4 rounded-xl border border-brand/25 bg-brand/10 px-4 py-3 text-left text-xs text-brand">
            Agenda inteligente, IA clínica e automações ativas logo após a configuração inicial.
          </div>
        </header>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-[0_10px_40px_-10px_rgba(82,183,136,0.15)]"
        >
          <div className="space-y-4">
            <FieldWithIcon
              label="Nome completo"
              value={name}
              onChange={setName}
              placeholder="Dr(a). Marina Silva"
              icon={<span className="material-symbols-outlined text-[18px]">person</span>}
              autoComplete="name"
            />

            <FieldWithIcon
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="voce@clinica.com"
              icon={<span className="material-symbols-outlined text-[18px]">mail</span>}
              type="email"
              autoComplete="email"
            />

            <FieldWithIcon
              label="CRP"
              value={crp}
              onChange={setCrp}
              placeholder="06/123456"
              icon={<span className="material-symbols-outlined text-[18px]">verified</span>}
            />

            <FieldWithIcon
              label="Senha"
              value={password}
              onChange={setPassword}
              placeholder="******"
              icon={<span className="material-symbols-outlined text-[18px]">lock</span>}
              type="password"
              autoComplete="new-password"
            />

            <FieldWithIcon
              label="Confirmar senha"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="******"
              icon={<span className="material-symbols-outlined text-[18px]">lock</span>}
              type="password"
              autoComplete="new-password"
            />

            {/* Specialty chips (peer-checked mint pattern) */}
            <div>
              <span className="mb-2 block text-sm font-medium text-text-secondary">
                Especialidades (até 3)
              </span>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((specialty) => (
                  <label key={specialty} className="cursor-pointer select-none">
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
                    <span className="inline-flex rounded-full border border-border-subtle bg-surface px-3.5 py-2 text-xs text-text-secondary transition-colors peer-checked:border-brand peer-checked:bg-brand/10 peer-checked:text-brand peer-disabled:cursor-not-allowed peer-disabled:opacity-40">
                      {specialty}
                    </span>
                  </label>
                ))}
                <span className="inline-flex items-center justify-center gap-1 rounded-full border border-dashed border-border-strong px-3.5 py-2 text-xs text-text-muted cursor-pointer hover:bg-bg-elevated transition-colors">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Outra
                </span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          ) : null}

          {/* Dark CTA (S08 pattern) */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-bg-base border border-border-strong px-4 py-3.5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-60 shadow-md"
          >
            {loading ? "Criando conta..." : "Criar conta e iniciar onboarding"}
          </button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-muted">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Seus dados estão protegidos sob a LGPD
          </p>

          <p className="mt-4 text-center text-sm text-text-secondary">
            Já tem conta?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-brand transition-colors hover:text-brand-hover"
            >
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function FieldWithIcon({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: React.ReactNode;
  type?: "text" | "email" | "password" | "tel";
  autoComplete?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-text-secondary">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-text-muted">
          {icon}
        </span>
        <input
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full rounded-xl border border-border-subtle bg-bg-elevated py-3.5 pl-11 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            isPassword ? "pr-12" : "pr-4"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowPassword(!showPassword);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-text-muted transition-colors hover:text-text-primary"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            tabIndex={-1}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}
      </span>
    </label>
  );
}
