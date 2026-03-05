import Link from "next/link";
import { redirect } from "next/navigation";
import type React from "react";
import { createClient } from "@/lib/supabase/server";

const adminNav = [
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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Master Admin</p>
            <h1 className="font-display text-3xl">Painel de Governança</h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-brand"
          >
            Voltar ao Dashboard
          </Link>
        </div>
        <nav className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-4 pb-4">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-brand/40 hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
