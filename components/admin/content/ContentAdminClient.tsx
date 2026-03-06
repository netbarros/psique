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

const pageOptions = ["landing", "pricing", "checkout_secure", "booking", "booking_success"] as const;

type NoticeTone = "error" | "success" | "warning";
type NoticeState = { tone: NoticeTone; message: string } | null;

function toUiErrorMessage(caughtError: unknown, fallback: string) {
  if (!(caughtError instanceof Error)) return fallback;
  if (
    caughtError.name === "ZodError" ||
    caughtError.message.includes("invalid_format") ||
    caughtError.message.includes("Invalid ISO datetime") ||
    caughtError.message.includes("Invalid datetime")
  ) {
    return "Resposta da API em formato inesperado. Recarregue a página e tente novamente.";
  }
  return caughtError.message;
}

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

function statusBadgeClass(status: "draft" | "published" | "archived") {
  if (status === "published") return "border-brand/30 bg-brand/10 text-brand";
  if (status === "archived") return "border-border-subtle bg-bg-base text-text-muted";
  return "border-gold/30 bg-gold/10 text-gold";
}

function Notice({ notice }: { notice: NonNullable<NoticeState> }) {
  const toneClass =
    notice.tone === "success"
      ? "border-brand/30 bg-brand/10 text-brand"
      : notice.tone === "warning"
        ? "border-gold/30 bg-gold/10 text-gold"
        : "border-error/30 bg-error/10 text-error";

  return <p className={`rounded-xl border px-3 py-2 text-sm ${toneClass}`}>{notice.message}</p>;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContentAdminClient() {
  const [pageKey, setPageKey] = useState<(typeof pageOptions)[number]>("landing");
  const [locale, setLocale] = useState("pt-BR");
  const [sectionKey, setSectionKey] = useState("main");
  const [statusFilter, setStatusFilter] = useState<"" | "draft" | "published" | "archived">("");
  const [revisions, setRevisions] = useState<AdminContentRevision[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorJson, setEditorJson] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminContent({
        page: pageKey,
        locale,
        status: statusFilter || undefined,
      });
      setRevisions(data);
      setSelectedId((currentSelectedId) => {
        if (!currentSelectedId) return data[0]?.id ?? null;
        if (data.some((item) => item.id === currentSelectedId)) return currentSelectedId;
        return data[0]?.id ?? null;
      });
    } catch (caughtError) {
      setNotice({
        tone: "error",
        message: toUiErrorMessage(caughtError, "Falha ao carregar revisões de conteúdo."),
      });
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
      setSectionKey("main");
      return;
    }

    setEditorJson(JSON.stringify(selectedRevision.payload, null, 2));
    setSectionKey(selectedRevision.sectionKey);
  }, [selectedRevision]);

  const counts = useMemo(() => {
    const next = {
      total: revisions.length,
      draft: 0,
      published: 0,
      archived: 0,
    };
    for (const revision of revisions) {
      next[revision.status] += 1;
    }
    return next;
  }, [revisions]);

  async function createDraft() {
    if (!sectionKey.trim()) {
      setNotice({
        tone: "warning",
        message: "Informe um `sectionKey` válido para criar o draft.",
      });
      return;
    }

    setCreating(true);
    setNotice(null);
    try {
      const created = await createAdminContentDraft({
        pageKey,
        sectionKey: sectionKey.trim(),
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
      setNotice({
        tone: "success",
        message: "Draft de conteúdo criado com sucesso.",
      });
    } catch (caughtError) {
      setNotice({
        tone: "error",
        message: toUiErrorMessage(caughtError, "Falha ao criar draft de conteúdo."),
      });
    } finally {
      setCreating(false);
    }
  }

  async function saveDraft() {
    if (!selectedRevision) return;
    setSaving(true);
    setNotice(null);
    try {
      const candidatePayload = JSON.parse(editorJson) as unknown;
      const payloadResult = contentPayloadSchema.safeParse(candidatePayload);
      if (!payloadResult.success) {
        setNotice({
          tone: "warning",
          message: payloadResult.error.issues[0]?.message ?? "Payload inválido para conteúdo.",
        });
        return;
      }
      const updated = await patchAdminContentDraft(
        selectedRevision.id,
        { payload: payloadResult.data, status: selectedRevision.status },
        selectedRevision.etag,
      );
      await load();
      setSelectedId(updated.id);
      setNotice({
        tone: "success",
        message: "Draft salvo com sucesso.",
      });
    } catch (caughtError) {
      if (caughtError instanceof SyntaxError) {
        setNotice({
          tone: "warning",
          message: "JSON inválido. Corrija o editor antes de salvar.",
        });
      } else if (caughtError instanceof FrontendHttpError && caughtError.status === 409) {
        setNotice({
          tone: "warning",
          message: "Conflito `409` (ETag desatualizada). Recarregue e tente novamente.",
        });
      } else {
        setNotice({
          tone: "error",
          message: toUiErrorMessage(caughtError, "Falha ao salvar conteúdo."),
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function publishDraft() {
    if (!selectedRevision) return;
    setPublishing(true);
    setNotice(null);
    try {
      const published = await publishAdminContentDraft(selectedRevision.id, selectedRevision.etag);
      await load();
      setSelectedId(published.id);
      setNotice({
        tone: "success",
        message: "Conteúdo publicado com sucesso.",
      });
    } catch (caughtError) {
      if (caughtError instanceof FrontendHttpError && caughtError.status === 409) {
        setNotice({
          tone: "warning",
          message: "Conflito `409` no publish. Atualize a revisão e tente novamente.",
        });
      } else if (caughtError instanceof FrontendHttpError && caughtError.status === 428) {
        setNotice({
          tone: "warning",
          message: "Servidor retornou `428` (If-Match ausente). Recarregue os dados e tente novamente.",
        });
      } else {
        setNotice({
          tone: "error",
          message: toUiErrorMessage(caughtError, "Falha ao publicar conteúdo."),
        });
      }
    } finally {
      setPublishing(false);
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[340px_1fr]">
      <aside className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-3xl">Revisões</h3>
          <span className="rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-1 text-xs text-text-secondary">
            {counts.total}
          </span>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">pageKey</span>
          <select
            value={pageKey}
            onChange={(event) => setPageKey(event.target.value as (typeof pageOptions)[number])}
            className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm"
          >
            {pageOptions.map((page) => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">locale</span>
            <input
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2 text-center text-text-secondary">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">draft</p>
            <p className="mt-1 text-sm font-semibold text-gold">{counts.draft}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2 text-center text-text-secondary">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">published</p>
            <p className="mt-1 text-sm font-semibold text-brand">{counts.published}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2 text-center text-text-secondary">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">archived</p>
            <p className="mt-1 text-sm font-semibold text-text-secondary">{counts.archived}</p>
          </div>
        </div>

        <div className="max-h-[410px] space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <p className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-muted">
              Carregando revisões...
            </p>
          ) : null}

          {!loading && revisions.length === 0 ? (
            <p className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-muted">
              Nenhuma revisão encontrada para este filtro.
            </p>
          ) : null}

          {revisions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                selectedId === item.id
                  ? "border-brand/40 bg-brand/10 text-text-primary"
                  : "border-border-subtle bg-bg-elevated text-text-secondary hover:border-brand/30 hover:text-text-primary"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">{item.sectionKey}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusBadgeClass(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-xs">v{item.version} · {item.locale}</p>
              <p className="mt-1 truncate text-[11px] text-text-muted">etag: {item.etag}</p>
            </button>
          ))}
        </div>

        <div className="space-y-3 rounded-xl border border-border-subtle bg-bg-elevated p-3">
          <p className="text-xs uppercase tracking-wider text-text-muted">Criar draft</p>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">sectionKey</span>
            <input
              value={sectionKey}
              onChange={(event) => setSectionKey(event.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-bg-base px-2.5 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => void createDraft()}
            disabled={creating}
            className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {creating ? "Criando..." : "Criar draft"}
          </button>
        </div>
      </aside>

      <article className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
        {notice ? <Notice notice={notice} /> : null}

        {!selectedRevision ? (
          <div className="rounded-xl border border-border-subtle bg-bg-elevated p-4">
            <p className="text-sm text-text-secondary">
              Selecione uma revisão na lateral para editar ou crie um novo draft para a página atual.
            </p>
          </div>
        ) : (
          <>
            <header className="rounded-xl border border-border-subtle bg-bg-elevated p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-3xl leading-none">
                  {selectedRevision.pageKey}/{selectedRevision.sectionKey} · v{selectedRevision.version}
                </h3>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusBadgeClass(selectedRevision.status)}`}
                >
                  {selectedRevision.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-text-secondary">locale={selectedRevision.locale}</p>
              <p className="mt-1 break-all text-xs text-text-muted">etag: {selectedRevision.etag}</p>
              <p className="mt-1 text-xs text-text-muted">publicado em: {formatDate(selectedRevision.publishedAt)}</p>
            </header>

            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">Editor JSON</span>
              <textarea
                value={editorJson}
                onChange={(event) => setEditorJson(event.target.value)}
                rows={18}
                className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 font-mono text-xs"
              />
            </label>

            <section className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
              <h4 className="font-display text-2xl">Preview</h4>
              {!parsedEditorPayload ? (
                <p className="mt-2 text-sm text-error">JSON inválido para preview.</p>
              ) : (
                <div className="mt-2 rounded-lg border border-border-subtle bg-bg-base p-3">
                  <ContentPreview
                    pageKey={selectedRevision.pageKey}
                    section={buildPreviewSection(selectedRevision, parsedEditorPayload)}
                  />
                </div>
              )}
            </section>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveDraft()}
                disabled={saving}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar draft"}
              </button>
              <button
                type="button"
                onClick={() => void publishDraft()}
                disabled={publishing}
                className="rounded-lg border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition-colors hover:border-brand/60 disabled:opacity-60"
              >
                {publishing ? "Publicando..." : "Publicar"}
              </button>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-lg border border-border-subtle bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Recarregar
              </button>
            </div>
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

  return <p className="text-sm text-text-muted">Preview indisponível para esta página.</p>;
}
