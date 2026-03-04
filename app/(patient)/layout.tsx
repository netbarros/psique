import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

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
  { id: "home", label: "Início", icon: "🏠", path: "/portal" },
  { id: "agendar", label: "Agendar", icon: "📅", path: "/portal/agendar" },
  { id: "sessoes", label: "Sessões", icon: "🎙", path: "/portal/sessoes" },
  { id: "chat", label: "Chat IA", icon: "🧠", path: "/portal/chat" },
  { id: "apoio", label: "Apoio", icon: "💚", path: "/portal/apoio" },
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

  // Find patient record linked to this user
  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, email, therapist_id")
    .eq("user_id", user.id)
    .single();

  if (!patient) {
    // Not a patient — might be a therapist
    redirect("/dashboard");
  }

  const p = patient as unknown as PatientInfo;

  // Fetch therapist name for sidebar
  const { data: therapist } = await supabase
    .from("therapists")
    .select("name, photo_url")
    .eq("id", p.therapist_id)
    .single();

  const t = therapist as unknown as TherapistInfo | null;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <PatientSidebar patient={p} therapist={t} />

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
    <aside
      style={{
        width: 220,
        background: "var(--bg2)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "22px 18px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: "var(--mint)",
            lineHeight: 1,
            fontFamily: "var(--ff)",
            fontWeight: 200,
          }}
        >
          Ψ
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--ff)",
              fontSize: 20,
              fontWeight: 200,
              color: "var(--ivory)",
            }}
          >
            Psique
          </div>
          <div
            style={{
              fontSize: 9,
              color: "var(--ivoryDD)",
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            Portal Paciente
          </div>
        </div>
      </div>

      {/* Patient info */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            flexShrink: 0,
            background:
              "radial-gradient(circle at 35% 35%, rgba(82,183,136,.44), rgba(82,183,136,.22))",
            border: "1.5px solid rgba(82,183,136,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontFamily: "var(--ff)",
            color: "var(--mint)",
            fontWeight: 300,
          }}
        >
          {initials(patient.name)}
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--ivory)",
              fontFamily: "var(--ff)",
              fontWeight: 300,
            }}
          >
            {patient.name}
          </div>
          <div style={{ fontSize: 10, color: "var(--ivoryDD)" }}>
            {patient.email}
          </div>
        </div>
      </div>

      {/* Therapist badge */}
      {therapist && (
        <div
          style={{
            margin: "10px 8px 0",
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(74,143,168,.08)",
            border: "1px solid rgba(74,143,168,.2)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--ivoryDD)",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              marginBottom: 4,
            }}
          >
            Seu terapeuta
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--blue)",
              fontWeight: 500,
            }}
          >
            {therapist.name}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {NAV.map((item) => (
          <Link
            key={item.id}
            href={item.path}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 13,
              color: "var(--ivoryDD)",
              textDecoration: "none",
              border: "1px solid transparent",
              transition: "all .2s var(--ease-out)",
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div style={{ margin: "0 8px 12px" }}>
        <form action="/auth/login">
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 12,
              color: "var(--ivoryDD)",
              background: "transparent",
              border: "1px solid transparent",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            ↩ Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
