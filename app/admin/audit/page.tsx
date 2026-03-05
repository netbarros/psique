import { AuditAdminClient } from "@/components/admin/audit/AuditAdminClient";

export default function AdminAuditPage() {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-display text-4xl text-text-primary">Auditoria Administrativa</h2>
        <p className="text-sm text-text-secondary">
          Histórico imutável de ações do domínio `master_admin`.
        </p>
      </header>
      <AuditAdminClient />
    </section>
  );
}
