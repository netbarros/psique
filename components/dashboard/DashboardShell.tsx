"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type React from "react";

interface TherapistProfile {
  id: string;
  name: string;
  crp: string;
  slug: string;
  onboarding_completed: boolean;
  ai_model: string | null;
  telegram_bot_username: string | null;
}

interface User {
  id: string;
  email?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "▤", path: "/dashboard" },
  { id: "agenda", label: "Agenda", icon: "📅", path: "/dashboard/agenda" },
  { id: "pacientes", label: "Pacientes", icon: "👥", path: "/dashboard/pacientes" },
  { id: "ia", label: "IA Clínica", icon: "✦", path: "/dashboard/ia" },
  { id: "telegram", label: "Telegram", icon: "✈", path: "/dashboard/telegram" },
  { id: "financeiro", label: "Financeiro", icon: "⚡", path: "/dashboard/financeiro" },
  { id: "configuracoes", label: "Config.", icon: "⚙", path: "/dashboard/configuracoes" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DashboardShell({
  therapist,
  user,
  children,
}: {
  therapist: TherapistProfile | null;
  user: User;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [signingOut, setSigningOut] = useState(false);

  // Redirect to onboarding if needed
  useEffect(() => {
    if (therapist && !therapist.onboarding_completed && !pathname.includes("onboarding")) {
      router.push("/dashboard/onboarding");
    }
  }, [therapist, pathname, router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden" }}>
      {/* ── Sidebar ────────────────────────────────────── */}
      <aside style={{
        width: 230,
        background: "var(--bg2)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 28, color: "var(--mint)", lineHeight: 1, fontFamily: "var(--ff)", fontWeight: 200 }}>Ψ</div>
          <div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 20, fontWeight: 200, color: "var(--ivory)" }}>Psique</div>
            <div style={{ fontSize: 9, color: "var(--ivoryDD)", letterSpacing: ".1em", textTransform: "uppercase" }}>Painel Clínico</div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "radial-gradient(circle at 35% 35%, rgba(82,183,136,.44), rgba(82,183,136,.22))",
            border: "1.5px solid rgba(82,183,136,.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontFamily: "var(--ff)", color: "var(--mint)", fontWeight: 300,
          }}>
            {therapist ? initials(therapist.name) : "?"}
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--ivory)", fontFamily: "var(--ff)", fontWeight: 300 }}>
              {therapist?.name ?? user.email}
            </div>
            <div style={{ fontSize: 10, color: "var(--ivoryDD)" }}>
              {therapist?.crp ? `CRP ${therapist.crp}` : "Carregando..."}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              aria-label={item.label}
              aria-current={isActive(item.path) ? "page" : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                fontSize: 13, cursor: "pointer",
                background: isActive(item.path) ? "var(--g1)" : "transparent",
                color: isActive(item.path) ? "var(--mint)" : "var(--ivoryDD)",
                border: isActive(item.path) ? "1px solid rgba(82,183,136,.25)" : "1px solid transparent",
                transition: "all .2s var(--ease-out)",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* AI Status badge */}
        <div style={{ margin: "0 8px 8px", padding: "12px 14px", borderRadius: 12, background: "rgba(74,143,168,.08)", border: "1px solid rgba(74,143,168,.2)" }}>
          <div style={{ fontSize: 11, color: "var(--blue)", fontWeight: 600, marginBottom: 2, display: "flex", alignItems: "center", gap: 5 }}>
            ✦ OpenRouter IA
          </div>
          <div style={{ fontSize: 10, color: "var(--ivoryDD)" }}>
            {therapist?.ai_model?.split("/")[1]?.split("-").slice(0, 2).join(" ") ?? "Claude 3.5"} · Ativo
          </div>
          <div style={{ height: 2, background: "var(--border)", borderRadius: 1, marginTop: 8 }}>
            <div style={{ width: "78%", height: "100%", background: "linear-gradient(90deg,var(--mint),var(--blue))", borderRadius: 1 }} />
          </div>
        </div>

        {/* Telegram badge */}
        {therapist?.telegram_bot_username && (
          <div style={{ margin: "0 8px 8px", padding: "10px 14px", borderRadius: 12, background: "rgba(34,158,217,.07)", border: "1px solid rgba(34,158,217,.2)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#54C5F8", fontSize: 14 }}>✈</span>
            <div>
              <div style={{ fontSize: 10, color: "#54C5F8", fontWeight: 600 }}>@{therapist.telegram_bot_username}</div>
              <div style={{ fontSize: 10, color: "var(--ivoryDD)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mint)", display: "inline-block" }} />
                Ativo
              </div>
            </div>
          </div>
        )}

        {/* Sign out */}
        <div style={{ margin: "0 8px 12px" }}>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 12, color: "var(--ivoryDD)", background: "transparent", border: "1px solid transparent", cursor: "pointer", textAlign: "left" }}
          >
            {signingOut ? "Saindo..." : "↩ Sair"}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}
