"use client";

import { useEffect, useMemo, useState } from "react";
import { contentPayloadSchema, type AdminContentRevision } from "@/lib/contracts/admin/content";
import type { PublicContentItem } from "@/lib/contracts/public/content";
import {
  createAdminContentDraft,
  getAdminContent,
  patchAdminContentDraft,
  publishAdminContentDraft,
} from "@/lib/frontend/admin-client";
import { FrontendHttpError } from "@/lib/frontend/http-error";
import {
  mapBookingContent,
  mapBookingSuccessContent,
  mapCheckoutContent,
  mapLandingContent,
  mapPricingContent,
} from "@/lib/frontend/content-mappers";

const pageOptions = ["landing", "pricing", "checkout_secure", "booking", "booking_success"];

function buildPreviewSection(
  revision: AdminContentRevision,
  payload: Record<string, unknown>,
): PublicContentItem {
  return {
    id: revision.id,
    sectionKey: revision.sectionKey,
    version: revision.version,
    etag: revision.etag,
    payload,
    publishedAt: revision.publishedAt,
  };
}

export function ContentAdminClient() {
  const [pageKey, setPageKey] = useState("landing");
  const [locale, setLocale] = useState("pt-BR");
  const [statusFilter, setStatusFilter] = useState<"" | "draft" | "published" | "archived">("");
  const [revisions, setRevisions] = useState<AdminContentRevision[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorJson, setEditorJson] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminContent({
        page: pageKey,
        locale,
        status: statusFilter || undefined,
      });
      setRevisions(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
      if (selectedId && !data.some((item) => item.id === selectedId)) {
        setSelectedId(data[0]?.id ?? null);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "content_load_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey, locale, statusFilter]);

  const selectedRevision = useMemo(
    () => revisions.find((item) => item.id === selectedId) ?? null,
    [revisions, selectedId],
  );

  const parsedEditorPayload = useMemo(() => {
    try {
      return JSON.parse(editorJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [editorJson]);

  useEffect(() => {
    if (!selectedRevision) {
      setEditorJson("{}");
      return;
    }
    setEditorJson(JSON.stringify(selectedRevision.payload, null, 2));
  }, [selectedRevision]);

  async function createDraft() {
    setCreating(true);
    setError(null);
    try {
      const created = await createAdminContentDraft({
        pageKey,
        sectionKey: "main",
        locale,
        payload: {
          title: "draft_title",
          subtitle: "draft_subtitle",
          body: "draft_body",
          blocks: [],
          ctas: [],
        },
      });
      await load();
      setSelectedId(created.id);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "content_create_failed");
    } finally {
      setCreating(false);
    }
  }

  async function saveDraft() {
    if (!selectedRevision) return;
    setSaving(true);
    setError(null);
    try {
      const candidatePayload = JSON.parse(editorJson) as unknown;
      const payloadResult = contentPayloadSchema.safeParse(candidatePayload);
      if (!payloadResult.success) {
        setError(payloadResult.error.issues[0]?.message ?? "invalid_content_payload");
        return;
      }
      const updated = await patchAdminContentDraft(
        selectedRevision.id,
        { payload: payloadResult.data, status: selectedRevision.status },
        selectedRevision.etag,
      );
      await load();
      setSelectedId(updated.id);
    } catch (caughtError) {
      if (caughtError instanceof SyntaxError) {
        setError("O JSON inserido é inválido. Corrija-o antes de salvar.");
      } else if (caughtError instanceof FrontendHttpError && caughtError.status === 409) {
        setError("Conflito: A versão do painel caducou. Dê Refresh na página para ver os dados recentes de outros Admins.");
      } else {
        setError(caughtError instanceof Error ? caughtError.message : "Falha drástica ao Salvar Draft.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function publishDraft() {
    if (!selectedRevision) return;
    setPublishing(true);
    setError(null);
    try {
      const published = await publishAdminContentDraft(selectedRevision.id, selectedRevision.etag);
      await load();
      setSelectedId(published.id);
    } catch (caughtError) {
      if (caughtError instanceof FrontendHttpError && caughtError.status === 409) {
        setError("Conflito de Versão (ETag). Recarregue a página antes de publicar.");
      } else if (caughtError instanceof FrontendHttpError && caughtError.status === 428) {
        setError("Cabeçalho If-Match está ausente. O Servidor rejeitou a publicação Insegura.");
      } else {
        setError(caughtError instanceof Error ? caughtError.message : "Falha ao Publicar Conteúdo.");
      }
    } finally {
      setPublishing(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
        <h2 className="font-display text-3xl">Conteúdo</h2>

        <select
          value={pageKey}
          onChange={(event) => setPageKey(event.target.value)}
          className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm"
        >
          {pageOptions.map((page) => (
            <option key={page} value={page}>
              {page}
            </option>
          ))}
        </select>

        <input
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
          className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm"
        >
          <option value="">all_status</option>
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>

        <button
          type="button"
          onClick={() => void createDraft()}
          disabled={creating}
          className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-bg-base disabled:opacity-60"
        >
          {creating ? "creating..." : "create_draft"}
        </button>

        <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
          {loading ? <p className="text-sm text-text-muted">loading_content</p> : null}
          {revisions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                selectedId === item.id
                  ? "border-brand/40 bg-brand/10 text-text-primary"
                  : "border-border-subtle bg-bg-elevated text-text-secondary"
              }`}
            >
              <p className="font-semibold">{item.sectionKey}</p>
              <p className="text-xs">v{item.version} · {item.status}</p>
            </button>
          ))}
        </div>
      </aside>

      <article className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
        {!selectedRevision ? (
          <p className="text-sm text-text-muted">select_content_revision_to_edit</p>
        ) : (
          <>
            <header>
              <h3 className="font-display text-3xl">
                {selectedRevision.pageKey}/{selectedRevision.sectionKey} · v{selectedRevision.version}
              </h3>
              <p className="text-sm text-text-secondary">
                status={selectedRevision.status} · locale={selectedRevision.locale}
              </p>
            </header>

            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">raw_json_editor</span>
              <textarea
                value={editorJson}
                onChange={(event) => setEditorJson(event.target.value)}
                rows={20}
                className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 font-mono text-xs"
              />
            </label>

            <section className="rounded-lg border border-border-subtle bg-bg-elevated p-3">
              <h4 className="font-display text-2xl">Preview</h4>
              {!parsedEditorPayload ? (
                <p className="text-sm text-error">invalid_json_payload</p>
              ) : (
                <ContentPreview pageKey={selectedRevision.pageKey} section={buildPreviewSection(selectedRevision, parsedEditorPayload)} />
              )}
            </section>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveDraft()}
                disabled={saving}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg-base disabled:opacity-60"
              >
                {saving ? "saving..." : "save_draft"}
              </button>
              <button
                type="button"
                onClick={() => void publishDraft()}
                disabled={publishing}
                className="rounded-lg border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand disabled:opacity-60"
              >
                {publishing ? "publishing..." : "publish"}
              </button>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-lg border border-border-subtle bg-bg-elevated px-4 py-2 text-sm text-text-secondary"
              >
                reload
              </button>
            </div>

            {error ? (
              <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                {error}
              </p>
            ) : null}
          </>
        )}
      </article>
    </section>
  );
}

function ContentPreview({ pageKey, section }: { pageKey: string; section: PublicContentItem }) {
  if (pageKey === "landing") {
    const landing = mapLandingContent(section);
    return (
      <div className="space-y-2">
        <p className="font-display text-2xl text-text-primary">{landing.title}</p>
        <p className="text-sm text-text-secondary">{landing.subtitle}</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-1 text-xs text-brand">
            {landing.primaryCtaLabel}
          </span>
          <span className="rounded-full border border-border-subtle bg-bg-base px-2 py-1 text-xs text-text-secondary">
            {landing.secondaryCtaLabel}
          </span>
        </div>
      </div>
    );
  }

  if (pageKey === "pricing") {
    const pricing = mapPricingContent(section);
    return (
      <div className="space-y-2">
        <p className="font-display text-2xl text-text-primary">{pricing.title}</p>
        <p className="text-sm text-text-secondary">{pricing.subtitle}</p>
        <p className="text-xs text-text-muted">faq_items={pricing.faq.length}</p>
      </div>
    );
  }

  if (pageKey === "checkout_secure") {
    const checkout = mapCheckoutContent(section);
    return (
      <div className="space-y-2">
        <p className="font-display text-2xl text-text-primary">{checkout.title}</p>
        <p className="text-sm text-text-secondary">{checkout.subtitle}</p>
        <div className="flex flex-wrap gap-2">
          {checkout.trustBadges.map((badge) => (
            <span key={badge} className="rounded-lg border border-border-subtle bg-bg-base px-2 py-1 text-xs text-text-secondary">
              {badge}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (pageKey === "booking") {
    const booking = mapBookingContent(section);
    return (
      <div className="space-y-2">
        <p className="font-display text-2xl text-text-primary">{booking.title}</p>
        <p className="text-sm text-text-secondary">{booking.subtitle}</p>
        <p className="text-xs text-text-muted">{booking.footerNote}</p>
      </div>
    );
  }

  if (pageKey === "booking_success") {
    const success = mapBookingSuccessContent(section);
    return (
      <div className="space-y-2">
        <p className="font-display text-2xl text-text-primary">{success.title}</p>
        <p className="text-sm text-text-secondary">{success.subtitle}</p>
      </div>
    );
  }

  return <p className="text-sm text-text-muted">preview_not_available_for_page</p>;
}
