"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type React from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BrainCircuit,
  Send,
  Wallet,
  Settings2,
  Menu,
  X,
  LogOut,
  Bell,
} from "lucide-react";

interface TherapistProfile {
  id: string;
  name: string;
  crp: string;
  slug: string;
  onboarding_completed: boolean;
  ai_model: string | null;
  telegram_bot_username: string | null;
  openrouter_key_hash?: string | null;
}

interface User {
  id: string;
  email?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

const NAV: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    id: "agenda",
    label: "Agenda",
    icon: CalendarDays,
    path: "/dashboard/agenda",
  },
  {
    id: "pacientes",
    label: "Pacientes",
    icon: Users,
    path: "/dashboard/pacientes",
  },
  { id: "ia", label: "IA Clínica", icon: BrainCircuit, path: "/dashboard/ia" },
  {
    id: "telegram",
    label: "Telegram",
    icon: Send,
    path: "/dashboard/telegram",
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: Wallet,
    path: "/dashboard/financeiro",
  },
  {
    id: "configuracoes",
    label: "Configurações",
    icon: Settings2,
    path: "/dashboard/configuracoes",
  },
];

/* Bottom nav — 4 items per Stitch S01 */
const BOTTOM_NAV: NavItem[] = [
  NAV[0], // Dashboard (Home)
  NAV[1], // Agenda
  NAV[2], // Pacientes
  NAV[4], // Telegram (Messages)
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (
      therapist &&
      !therapist.onboarding_completed &&
      !pathname.includes("onboarding")
    ) {
      router.push("/dashboard/onboarding");
    }
  }, [therapist, pathname, router]);


  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === path : pathname.startsWith(path);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-bg-base">
      {/* ═══════ Ambient background glow ═══════ */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[20%] h-[50%] w-[50%] rounded-full bg-brand/6 blur-[140px]" />
        <div className="absolute -bottom-[22%] -right-[12%] h-[62%] w-[62%] rounded-full bg-info/4 blur-[170px]" />
        <div className="noise-overlay absolute inset-0 opacity-[0.018] mix-blend-overlay" />
      </div>

      {/* ═══════ MOBILE HEADER (< md) ═══════ */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border-subtle bg-bg-elevated/85 px-4 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface text-text-primary transition-colors hover:border-border-strong"
          aria-label="Abrir menu"
        >
          {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
        <div className="flex items-center gap-1.5">
          <span className="font-display text-xl font-light text-brand">Ψ</span>
          <span className="font-display text-lg font-light tracking-wide text-text-primary">
            Psique
          </span>
        </div>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface text-text-muted transition-colors hover:border-border-strong hover:text-text-primary"
          aria-label="Notificações"
        >
          <Bell size={16} />
        </button>
      </header>

      {/* ═══════ SIDEBAR ═══════
          Mobile: hidden (overlay), Tablet md: icon-only 64px, Desktop lg: full 240px
      */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-60 shrink-0 flex-col border-r border-border-subtle bg-bg-elevated/95 backdrop-blur-xl transition-transform duration-300",
          /* Mobile: overlay slide */
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          /* Tablet: always visible, collapsed */
          "md:relative md:w-16 md:translate-x-0",
          /* Desktop: expanded */
          "lg:w-60",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border-subtle px-4 lg:h-16 lg:px-5">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-3xl font-light leading-none text-brand">
              Ψ
            </span>
            <div className="hidden lg:block">
              <div className="font-display text-xl font-light text-text-primary">
                Psique
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
                Painel Clínico
              </div>
            </div>
          </div>
        </div>

        {/* Therapist profile (desktop only) */}
        <div className="hidden border-b border-border-subtle px-4 py-3 lg:block">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-strong bg-surface-hover text-xs font-semibold text-brand">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-brand/20 to-transparent" />
              <span className="relative z-10">
                {therapist ? initials(therapist.name) : "?"}
              </span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-text-primary">
                {therapist?.name ?? user.email}
              </div>
              <div className="truncate text-xs text-text-muted">
                {therapist?.crp ? `CRP ${therapist.crp}` : "Carregando..."}
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="custom-scrollbar flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSidebarOpen(false);
                  router.push(item.path);
                }}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
                  /* Collapsed: center-align icon */
                  "md:justify-center md:px-0 lg:justify-start lg:px-3",
                  active
                    ? "border border-brand/30 bg-brand/10 text-brand glow-mint"
                    : "border border-transparent text-text-secondary hover:border-border-subtle hover:bg-surface-hover hover:text-text-primary",
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    "shrink-0 transition-colors",
                    active
                      ? "text-brand"
                      : "text-text-muted group-hover:text-text-primary",
                  )}
                />
                {/* Label: hidden on tablet, visible on mobile overlay + desktop */}
                <span className="md:hidden lg:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* AI Model Card (desktop only) */}
        <div className="hidden px-3 pb-2 lg:block">
          <div className="rounded-xl border border-border-strong bg-surface p-2.5">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-info">
              <BrainCircuit size={13} /> OpenRouter IA
            </div>
            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span className="max-w-[110px] truncate">
                {therapist?.ai_model
                  ?.split("/")[1]
                  ?.split("-")
                  .slice(0, 2)
                  .join(" ") ?? "Claude Sonnet"}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-semibold",
                  therapist?.openrouter_key_hash
                    ? "text-brand"
                    : "text-text-muted",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full",
                    therapist?.openrouter_key_hash
                      ? "bg-brand shadow-[0_0_8px_var(--color-brand)]"
                      : "bg-text-muted",
                  )}
                />
                {therapist?.openrouter_key_hash ? "Próprio" : "Plataforma"}
              </span>
            </div>
          </div>
        </div>

        {/* Telegram badge (desktop only) */}
        {therapist?.telegram_bot_username && (
          <div className="hidden px-3 pb-2 lg:block">
            <div className="rounded-xl border border-[#2AABEE]/20 bg-[#2AABEE]/10 p-2.5">
              <div className="mb-0.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2AABEE]">
                <Send size={12} /> Telegram
              </div>
              <div className="truncate text-[11px] text-[#2AABEE]/70">
                @{therapist.telegram_bot_username}
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="border-t border-border-subtle px-3 py-3">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-text-muted transition-all hover:bg-surface-hover hover:text-text-primary md:justify-center md:px-0 lg:justify-start lg:px-3"
            title="Sair da conta"
          >
            {signingOut ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <LogOut size={15} />
            )}
            <span className="md:hidden lg:inline">
              {signingOut ? "Saindo..." : "Sair"}
            </span>
          </button>
        </div>
      </div>

      {/* ═══════ MOBILE SIDEBAR OVERLAY ═══════ */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className="custom-scrollbar relative z-10 flex min-w-0 flex-1 flex-col overflow-y-auto pb-20 pt-14 md:pb-0 md:pt-0">
        {children}
      </main>

      {/* ═══════ MOBILE BOTTOM NAV (< md) — AGENTS §5.17 ═══════ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-border-subtle bg-bg-elevated/95 px-6 pb-safe pt-2 backdrop-blur-xl md:hidden">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-0.5 py-1"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={20}
                className={cn(
                  "transition-colors",
                  active ? "text-brand" : "text-text-muted",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-brand" : "text-text-muted",
                )}
              >
                {item.label.length > 6
                  ? item.label.slice(0, 6) + "."
                  : item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
