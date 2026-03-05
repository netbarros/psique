import Link from "next/link";

type SettingsTabKey =
  | "perfil"
  | "integracoes"
  | "seguranca"
  | "notificacoes"
  | "plano";

export default function SettingsTabs({ active }: { active: SettingsTabKey }) {
  const tabs: Array<{
    key: SettingsTabKey;
    label: string;
    href?: string;
  }> = [
    { key: "perfil", label: "Perfil", href: "/dashboard/configuracoes/perfil" },
    { key: "integracoes", label: "Integrações", href: "/dashboard/configuracoes/integracoes" },
    { key: "seguranca", label: "Segurança", href: "/dashboard/configuracoes" },
    { key: "notificacoes", label: "Notificações" },
    { key: "plano", label: "Plano", href: "/dashboard/configuracoes/plano" },
  ];

  return (
    <nav className="mb-6 overflow-x-auto pb-1" aria-label="Abas de configurações">
      <ul className="flex min-w-max items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated p-1">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          const baseClass =
            "inline-flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors";
          const activeClass =
            "bg-brand/12 text-brand border border-brand/20";
          const idleClass =
            "border border-transparent text-text-secondary hover:bg-bg-base hover:text-text-primary";

          if (!tab.href) {
            return (
              <li key={tab.key}>
                <span
                  className={`${baseClass} border border-dashed border-border-subtle text-text-muted`}
                  aria-disabled="true"
                >
                  {tab.label} · Em breve
                </span>
              </li>
            );
          }

          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                className={`${baseClass} ${isActive ? activeClass : idleClass}`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
