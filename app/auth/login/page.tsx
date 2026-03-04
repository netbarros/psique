"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateCRP } from "@/lib/utils";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [role, setRole] = useState<"therapist" | "patient">("therapist");
  const [form, setForm] = useState({ name: "", email: "", pass: "", crp: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true);
    setErr("");

    if (!form.email.includes("@")) {
      setErr("Email inválido");
      setLoading(false);
      return;
    }

    if (mode === "register" && role === "therapist" && !validateCRP(form.crp)) {
      setErr("CRP inválido. Formato esperado: 06/98421");
      setLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.pass,
        });
        if (error) throw error;
        router.push(role === "patient" ? "/portal" : "/dashboard");
        return;
      }

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.pass,
          options: {
            data: { name: form.name, role, crp: form.crp },
          },
        });
        if (error) throw error;

        if (data.user) {
          router.push("/dashboard/onboarding");
        }
        return;
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        if (error) throw error;
        setErr(""); // clear
        alert("Email de recuperação enviado!");
        setMode("login");
        return;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setErr(translateAuthError(msg));
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const sendMagicLink = async () => {
    if (!form.email.includes("@")) { setErr("Informe seu email primeiro"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setErr(error.message);
    else alert(`Magic link enviado para ${form.email}!`);
  };

  function translateAuthError(msg: string): string {
    if (msg.includes("Invalid login credentials")) return "Email ou senha incorretos";
    if (msg.includes("Email not confirmed")) return "Confirme seu email antes de entrar";
    if (msg.includes("User already registered")) return "Este email já está cadastrado";
    if (msg.includes("Password should be at least")) return "Senha deve ter pelo menos 6 caracteres";
    return msg;
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--card2)",
    border: "1px solid var(--border2)",
    color: "var(--text)",
    borderRadius: 12,
    padding: "12px 16px",
    fontFamily: "var(--fs)",
    fontSize: 14,
    outline: "none",
    width: "100%",
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      position: "relative",
      overflow: "hidden",
      background: "var(--bg)",
    }}>
      {/* Left — branding */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        position: "relative",
      }}>
        <div style={{ fontSize: 52, color: "var(--mint)", marginBottom: 16, lineHeight: 1 }}>Ψ</div>
        <h1 style={{
          fontFamily: "var(--ff)",
          fontSize: 56,
          fontWeight: 200,
          color: "var(--ivory)",
          lineHeight: 1.08,
          marginBottom: 16,
        }}>
          {mode === "login" ? "Bem-vindo\nde volta." : "Comece\nhoje mesmo."}
        </h1>
        <p style={{ fontSize: 15, color: "var(--ivoryDD)", lineHeight: 1.7, maxWidth: 380 }}>
          A plataforma que cuida de quem cuida — IA clínica, Telegram bot e prontuário LGPD em um só lugar.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40 }}>
          {[
            { icon: "✦", t: "IA com Claude, GPT-4o, Gemini" },
            { icon: "✦", t: "Telegram Bot automático" },
            { icon: "✦", t: "KPIs e prontuário LGPD" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", color: "var(--ivoryD)", fontSize: 14 }}>
              <span style={{ color: "var(--mint)" }}>{f.icon}</span>
              {f.t}
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div style={{
        width: 480,
        background: "var(--bg2)",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "52px 48px",
      }}>
        {/* Role toggle */}
        <div style={{
          display: "flex",
          background: "var(--card)",
          borderRadius: 14,
          padding: 4,
          border: "1px solid var(--border)",
          marginBottom: 28,
          gap: 4,
        }}>
          {([
            { v: "therapist", l: "Psicanalista" },
            { v: "patient", l: "Paciente" },
          ] as const).map((r) => (
            <button
              key={r.v}
              type="button"
              onClick={() => setRole(r.v)}
              style={{
                flex: 1,
                padding: "10px 8px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                background: role === r.v ? "var(--g1)" : "transparent",
                color: role === r.v ? "var(--mint)" : "var(--ivoryDD)",
                border: role === r.v ? "1px solid rgba(82,183,136,.3)" : "1px solid transparent",
                cursor: "pointer",
              }}
            >
              {r.l}
            </button>
          ))}
        </div>

        <h2 style={{ fontFamily: "var(--ff)", fontSize: 26, fontWeight: 300, color: "var(--ivory)", marginBottom: 6 }}>
          {mode === "login" ? "Acessar conta" : mode === "register" ? "Criar conta grátis" : "Recuperar senha"}
        </h2>
        <p style={{ fontSize: 13, color: "var(--ivoryDD)", marginBottom: 24 }}>
          {role === "therapist" ? "Painel clínico completo" : "Sua jornada terapêutica começa aqui"}
        </p>

        {err && (
          <div style={{
            background: "rgba(184,84,80,.12)",
            border: "1px solid rgba(184,84,80,.35)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            color: "var(--red)",
            marginBottom: 14,
          }}>
            {err}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <input
              style={inputStyle}
              placeholder={role === "therapist" ? "Nome (Dr./Dra.)" : "Seu nome completo"}
              value={form.name}
              onChange={upd("name")}
              aria-label="Nome"
            />
          )}
          <input
            style={inputStyle}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={upd("email")}
            aria-label="Email"
            autoComplete="email"
          />
          {mode !== "forgot" && (
            <input
              style={inputStyle}
              placeholder="Senha"
              type="password"
              value={form.pass}
              onChange={upd("pass")}
              aria-label="Senha"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          )}
          {mode === "register" && role === "therapist" && (
            <input
              style={inputStyle}
              placeholder="CRP (ex: 06/98421)"
              value={form.crp}
              onChange={upd("crp")}
              aria-label="Número CRP"
            />
          )}
        </div>

        {mode === "login" && (
          <button
            type="button"
            onClick={() => setMode("forgot")}
            style={{ background: "none", border: "none", color: "var(--ivoryDD)", fontSize: 12, textAlign: "right", marginTop: 8, cursor: "pointer" }}
          >
            Esqueci a senha
          </button>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          aria-label={mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Enviar link"}
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 15,
            background: "var(--mint)",
            color: "#060E09",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 4px 24px rgba(82,183,136,.25)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "..." : mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Enviar link"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 11, color: "var(--ivoryDD)" }}>ou continue com</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          style={{ width: "100%", padding: 11, borderRadius: 10, marginBottom: 8, fontSize: 13, background: "var(--card)", border: "1px solid var(--border2)", color: "var(--ivoryD)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}
        >
          <span style={{ fontWeight: 700 }}>G</span> Continuar com Google
        </button>

        <button
          type="button"
          onClick={sendMagicLink}
          style={{ width: "100%", padding: 11, borderRadius: 10, fontSize: 13, background: "var(--card)", border: "1px solid var(--border2)", color: "var(--ivoryD)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}
        >
          <span>✉</span> Magic Link por Email
        </button>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--ivoryDD)" }}>
          {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            style={{ background: "none", border: "none", color: "var(--mint)", fontWeight: 500, fontSize: 13, cursor: "pointer" }}
          >
            {mode === "login" ? "Criar conta grátis" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}
