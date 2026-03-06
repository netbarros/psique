import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function TherapistPostPage({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}) {
  const { slug, postSlug } = await params;
  const admin = createAdminClient();

  const { data: therapist } = await admin
    .from("therapists")
    .select("id, slug, name")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!therapist) {
    notFound();
  }

  const { data: post } = await admin
    .from("therapist_public_posts")
    .select("id, title, excerpt, content_sanitized, moderation_flags, published_at")
    .eq("therapist_id", therapist.id)
    .eq("slug", postSlug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-bg-base px-4 py-8 text-text-primary sm:px-6">
      <article className="mx-auto max-w-3xl rounded-3xl border border-border-subtle bg-surface p-6 sm:p-8">
        <Link
          href={`/terapeuta/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-brand transition hover:text-brand-hover"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Voltar para perfil
        </Link>

        <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-brand">Conteúdo revisado</p>
        <h1 className="mt-2 font-display text-4xl text-text-primary sm:text-5xl">{post.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{post.excerpt}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(post.moderation_flags ?? []).length === 0 ? (
            <span className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-brand">
              Revisão automática aprovada
            </span>
          ) : (
            (post.moderation_flags ?? []).map((flag) => (
              <span key={flag} className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-gold">
                {flag}
              </span>
            ))
          )}
        </div>

        <div className="prose prose-invert mt-8 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
          {post.content_sanitized}
        </div>

        <p className="mt-8 text-xs text-text-muted">
          Publicado em {post.published_at ? new Date(post.published_at).toLocaleDateString("pt-BR") : "data indisponível"}
        </p>
      </article>
    </main>
  );
}
