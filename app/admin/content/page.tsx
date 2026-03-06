import { ContentAdminClient } from "@/components/admin/content/ContentAdminClient";

export default function AdminContentPage() {
  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-border-subtle bg-surface p-5">
        <p className="text-[11px] uppercase tracking-[0.15em] text-gold">public content ops</p>
        <h2 className="mt-1 font-display text-4xl text-text-primary md:text-5xl">Conteúdo Público</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Revise e publique conteúdo por `pageKey` / `sectionKey` / `locale`, com preview contextual e governança de
          versão via ETag.
        </p>
      </header>
      <ContentAdminClient />
    </section>
  );
}
