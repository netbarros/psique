import { PlansAdminClient } from "@/components/admin/plans/PlansAdminClient";

export default function AdminPlansPage() {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-display text-4xl text-text-primary">Gestão de Planos</h2>
        <p className="text-sm text-text-secondary">
          Fluxo editorial completo: draft, edição, diff e publish com `If-Match`.
        </p>
      </header>
      <PlansAdminClient />
    </section>
  );
}
