import { ContentAdminClient } from "@/components/admin/content/ContentAdminClient";

export default function AdminContentPage() {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-display text-4xl text-text-primary">Conteúdo Público</h2>
        <p className="text-sm text-text-secondary">
          Gerencie revisões por `pageKey/sectionKey/locale` e publique sem deploy.
        </p>
      </header>
      <ContentAdminClient />
    </section>
  );
}
