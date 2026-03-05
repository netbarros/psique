"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const REFERRAL_OPTIONS = [
  "Indicação profissional",
  "Indicação de paciente/amigo",
  "Instagram",
  "Google",
  "YouTube",
  "Outro",
];

export default function PatientRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [heardFrom, setHeardFrom] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role: "patient",
            referral_source: heardFrom || null,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (signUpData.session) {
        await fetch("/api/auth/patient/bootstrap", { method: "POST" });
        router.push("/portal");
      } else {
        router.push("/auth/login?message=confirme_seu_email");
      }
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-base px-4 py-8 text-text-primary sm:px-6 lg:flex lg:items-center lg:justify-center">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6 pt-2">
          <div className="absolute left-6 top-6 flex items-center justify-between w-[calc(100%-3rem)]">
            <Link
              href="/auth/login"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
              aria-label="Voltar para Login"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="font-display text-4xl font-semibold text-portal-text-primary">
            Criar Conta de Paciente
          </h1>
          <p className="mt-2 text-sm text-portal-text-muted">
            Entre no seu portal para acompanhar sessões, orientações e próximos passos com clareza.
          </p>
          <div className="mt-4 rounded-xl border border-portal-brand/25 bg-portal-brand/10 px-4 py-3 text-left text-xs text-portal-brand-hover">
            Em poucos minutos você já recebe confirmação de agenda e visão centralizada do seu acompanhamento.
          </div>
        </header>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-portal-border bg-white p-6 shadow-[0_4px_20px_rgba(74,143,168,0.06)]"
        >
          <div className="space-y-4">
            <FieldWithIcon
              label="Nome completo"
              value={name}
              onChange={setName}
              placeholder="Seu nome"
              icon={<span className="material-symbols-outlined text-[16px]">person</span>}
              autoComplete="name"
            />

            <FieldWithIcon
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="voce@email.com"
              icon={<span className="material-symbols-outlined text-[16px]">mail</span>}
              type="email"
              autoComplete="email"
            />

            <FieldWithIcon
              label="Telefone"
              value={phone}
              onChange={setPhone}
              placeholder="(11) 99999-9999"
              icon={<span className="material-symbols-outlined text-[16px]">phone</span>}
              type="tel"
              autoComplete="tel"
            />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-portal-text-secondary">
                Como soube de nós?
              </span>
              <select
                value={heardFrom}
                onChange={(event) => setHeardFrom(event.target.value)}
                className="w-full rounded-xl border border-portal-border bg-white px-4 py-3.5 text-sm text-portal-text-primary outline-none transition-colors focus:border-portal-brand focus:ring-2 focus:ring-portal-brand/20"
              >
                <option value="">Selecione uma opção</option>
                {REFERRAL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <FieldWithIcon
              label="Senha"
              value={password}
              onChange={setPassword}
              placeholder="******"
              icon={<span className="material-symbols-outlined text-[16px]">lock</span>}
              type="password"
              autoComplete="new-password"
            />

            <FieldWithIcon
              label="Confirmar senha"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="******"
              icon={<span className="material-symbols-outlined text-[16px]">lock</span>}
              type="password"
              autoComplete="new-password"
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-portal-brand px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-portal-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Criando conta..." : "Criar conta e acessar portal"}
          </button>

          <p className="mt-3 flex items-center justify-center gap-1 text-xs text-portal-text-muted">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            Seus dados estão protegidos sob a LGPD
          </p>

          <p className="mt-4 text-center text-sm text-portal-text-muted">
            Já tem conta?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-portal-brand transition-colors hover:text-portal-brand-hover"
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
      <span className="mb-2 block text-sm font-medium text-portal-text-secondary">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-portal-text-placeholder">
          {icon}
        </span>
        <input
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full rounded-xl border border-portal-border bg-white py-3.5 pl-11 text-sm text-portal-text-primary outline-none transition-colors placeholder:text-portal-text-placeholder focus:border-portal-brand focus:ring-2 focus:ring-portal-brand/20 ${
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
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-portal-text-placeholder transition-colors hover:text-portal-text-primary"
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
