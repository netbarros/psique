"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { normalizeUserRole, resolvePostLoginDestination } from "@/lib/auth/access-routing";

type Role = "therapist" | "patient";

const DEMO_PROFILES = [
  {
    label: "Master Admin",
    role: "therapist" as Role,
    email: "e2e.master_admin@psique.local",
    password: "E2E_Psique_123!",
  },
  {
    label: "Terapeuta",
    role: "therapist" as Role,
    email: "e2e.therapist@psique.local",
    password: "E2E_Psique_123!",
  },
  {
    label: "Paciente",
    role: "patient" as Role,
    email: "e2e.patient@psique.local",
    password: "E2E_Psique_123!",
  },
] as const;

export default function LoginPage() {
  const [role, setRole] = useState<Role>("therapist");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const nextPath = searchParams.get("next");

  useEffect(() => {
    const authError = searchParams.get("error");
    const redirectedPath = searchParams.get("next");

    if (authError === "master_admin_required") {
      setInfo("Seu usuário não tem permissão de Master Admin. Faça login com um usuário autorizado.");
      return;
    }

    if (authError === "patient_profile_missing") {
      setError("Seu perfil de paciente ainda não está vinculado. Entre em contato com seu terapeuta ou suporte.");
      return;
    }

    if (redirectedPath) {
      setInfo(`Faça login para continuar em ${redirectedPath}`);
    }
  }, [searchParams]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("psique_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const submit = async () => {
    setLoading(true);
    setError("");
    setInfo("");

    if (!email.includes("@")) {
      setError("Email inválido");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      if (rememberMe) {
        localStorage.setItem("psique_remembered_email", email);
      } else {
        localStorage.removeItem("psique_remembered_email");
      }

      const resolveResponse = await fetch("/api/auth/resolve-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next: nextPath }),
      });

      if (resolveResponse.ok) {
        const payload = (await resolveResponse.json()) as {
          data?: { destination?: string };
        };
        const destination = payload.data?.destination;
        router.push(destination ?? (role === "patient" ? "/portal" : "/dashboard"));
        return;
      }

      const signedRole = normalizeUserRole(signInData.user?.user_metadata?.role) ?? "therapist";
      router.push(resolvePostLoginDestination(signedRole, nextPath));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setError(translateAuthError(msg));
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const callbackBase = `${window.location.origin}/auth/callback`;
    const redirectTo = nextPath
      ? `${callbackBase}?next=${encodeURIComponent(nextPath)}`
      : callbackBase;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const sendMagicLink = async () => {
    setError("");
    setInfo("");

    if (!email.includes("@")) {
      setError("Informe seu email primeiro");
      return;
    }

    setLoading(true);
    const callbackBase = `${window.location.origin}/auth/callback`;
    const emailRedirectTo = nextPath
      ? `${callbackBase}?next=${encodeURIComponent(nextPath)}`
      : callbackBase;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });

    setLoading(false);
    if (otpError) {
      setError(translateAuthError(otpError.message));
    } else {
      setInfo(`Magic link enviado para ${email}`);
    }
  };

  function translateAuthError(msg: string): string {
    if (msg.includes("Invalid login credentials")) return "Email ou senha incorretos";
    if (msg.includes("Email not confirmed")) return "Confirme seu email antes de entrar";
    if (msg.includes("User already registered")) return "Este email já está cadastrado";
    if (msg.includes("Password should be at least")) return "Senha deve ter pelo menos 6 caracteres";
    return msg;
  }

  const registerHref = role === "patient" ? "/auth/register/patient" : "/auth/register";
  const showDemoProfiles = process.env.NODE_ENV !== "production";

  return (
    <main className="min-h-screen bg-bg-base px-4 py-8 sm:px-6 lg:flex lg:items-center lg:justify-center">
      <section className="glow-card relative mx-auto w-full max-w-sm rounded-2xl border border-border-subtle bg-surface p-8">
        {/* Back Button */}
        <div className="absolute left-6 top-6 flex items-center justify-between w-[calc(100%-3rem)]">
          <Link
            href="/"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
            aria-label="Voltar para Home"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="mb-8 mt-2 text-center">
          <div className="mb-3 text-[28px] font-semibold uppercase tracking-[0.28em] text-text-primary">
            PSIQUE
          </div>

          {/* Role tabs */}
          <div className="mb-6 flex border-b border-border-subtle text-sm">
            {(
              [
                { value: "therapist", label: "Psicanalista" },
                { value: "patient", label: "Paciente" },
              ] as const
            ).map((tab) => {
              const active = role === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setRole(tab.value)}
                  className={`flex-1 border-b-2 px-2 py-2.5 transition-colors font-medium ${
                    active
                      ? "border-brand text-brand"
                      : "border-border-subtle text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <p className="mb-3 inline-flex items-center rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-gold">
            Acesso rápido e seguro
          </p>
          <h1 className="font-display text-5xl font-light leading-none text-text-primary">
            Acessar conta
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {role === "therapist"
              ? "Retome sua operação clínica com agenda, IA e financeiro no mesmo painel."
              : "Acesse seu portal para acompanhar sessões, confirmações e próximos passos."}
          </p>
        </div>

        {/* Alerts */}
        {error ? (
          <div className="mb-3 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs text-error text-center">
            {error}
          </div>
        ) : null}
        {info ? (
          <div className="mb-3 rounded-xl border border-brand/35 bg-brand/10 px-3 py-2 text-xs text-brand">
            {info}
          </div>
        ) : null}

        {/* Form fields */}
        <div className="space-y-3">
          <input
            className="w-full rounded-full border border-bg-elevated bg-bg-elevated/80 px-5 py-3.5 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-brand/50"
            placeholder="e2e.therapist@psique.local"
            type="email"
            aria-label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <div className="relative">
            <input
              className="w-full rounded-full border border-bg-elevated bg-bg-elevated/80 px-5 py-3.5 pr-12 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-brand/50"
              placeholder="••••••••••••"
              type={showPassword ? "text" : "password"}
              aria-label="Senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-text-muted transition-colors hover:text-text-primary"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              tabIndex={-1}
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-1">
          <label className="group flex cursor-pointer items-center gap-2">
            <div className="relative flex h-4 w-4 items-center justify-center rounded border border-border-strong bg-bg-base transition-colors group-hover:border-brand">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={rememberMe}
                onChange={(e) => {
                  setRememberMe(e.target.checked);
                  if (!e.target.checked) localStorage.removeItem("psique_remembered_email");
                }}
              />
              <span className="material-symbols-outlined pointer-events-none absolute text-[12px] text-bg-base opacity-0 transition-opacity peer-checked:opacity-100">
                check
              </span>
              <div className="-z-10 absolute inset-0 scale-0 rounded bg-brand transition-transform peer-checked:scale-100" />
            </div>
            <span className="text-xs text-text-muted transition-colors group-hover:text-text-primary">
              Lembrar-me
            </span>
          </label>

          <Link
            href="/auth/forgot-password"
            className="rounded-full px-2 py-1 text-xs text-brand transition-colors hover:text-brand-hover"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <p className="mt-1 text-center text-xs text-text-muted">
          Continue de onde parou em menos de 30 segundos.
        </p>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          aria-label="Entrar"
          className={`mt-4 w-full rounded-full px-4 py-3 text-base font-semibold transition-all shadow-[0_4px_14px_rgba(82,183,136,0.2)] ${
            loading
              ? "cursor-not-allowed border-none bg-bg-elevated text-text-muted"
              : "bg-brand text-bg-base hover:bg-brand-hover hover:scale-[1.01]"
          }`}
        >
          {loading ? "Entrando..." : "Entrar e continuar"}
        </button>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-xs text-text-muted">ou</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        {/* Alternatives */}
        <button
          type="button"
          onClick={signInWithGoogle}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-full border border-border-strong bg-transparent px-4 py-3 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary hover:border-border-strong"
        >
          <span className="font-semibold text-text-primary">G</span>
          Entrar com Google
        </button>

        <button
          type="button"
          onClick={sendMagicLink}
          disabled={loading}
          className={`w-full rounded-full border px-4 py-3 text-sm transition-colors ${
            loading
              ? "cursor-not-allowed border-border-subtle bg-transparent text-text-muted"
              : "border-border-strong bg-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary hover:border-border-strong"
          }`}
        >
          Link por email
        </button>

        {showDemoProfiles ? (
          <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-elevated/60 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Acesso rápido (dev/e2e)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_PROFILES.map((profile) => (
                <button
                  key={profile.label}
                  type="button"
                  onClick={() => {
                    setRole(profile.role);
                    setEmail(profile.email);
                    setPassword(profile.password);
                    setInfo(`Perfil ${profile.label} carregado. Clique em "Entrar e continuar".`);
                    setError("");
                  }}
                  className="rounded-xl border border-border-strong bg-surface px-2 py-2 text-[11px] font-medium text-text-secondary transition-colors hover:border-brand/40 hover:text-text-primary"
                >
                  {profile.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-5 text-center text-sm text-text-muted">
          Ainda não tem conta?{" "}
          <Link
            href={registerHref}
            className="rounded-full px-1.5 py-0.5 font-medium text-brand transition-colors hover:text-brand-hover"
          >
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}
