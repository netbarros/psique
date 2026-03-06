import Link from "next/link";
import { redirect } from "next/navigation";
import type React from "react";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { createClient } from "@/lib/supabase/server";

const adminNav = [
  { href: "/admin", label: "Resumo" },
  { href: "/admin/plans", label: "Planos" },
  { href: "/admin/content", label: "Conteúdo Público" },
  { href: "/admin/integrations", label: "Integrações" },
  { href: "/admin/audit", label: "Auditoria" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/admin");
  }

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleRow?.role !== "master_admin") {
    redirect("/dashboard?error=master_admin_required");
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-base/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-end justify-between gap-3 px-4 py-4">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-gold">
              <span className="material-symbols-outlined text-[12px]">verified_user</span>
              Master Admin
            </p>
            <h1 className="font-display text-3xl leading-none md:text-4xl">Painel de Governança</h1>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:border-brand/30 hover:text-brand"
          >
            <span className="material-symbols-outlined text-[16px]">dashboard</span>
            Home do Admin
          </Link>
        </div>
        <AdminTopNav items={adminNav} />
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
