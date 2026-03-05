"use client";

import { useEffect, useMemo, useState } from "react";
import { planPayloadSchema, type AdminPlanRevision } from "@/lib/contracts/admin/plans";
import {
  createAdminPlanDraft,
  getAdminPlans,
  patchAdminPlanDraft,
  publishAdminPlanDraft,
} from "@/lib/frontend/admin-client";
import { FrontendHttpError } from "@/lib/frontend/http-error";

type DiffEntry = {
  field: string;
  draftValue: string;
  publishedValue: string;
};

function stringifyValue(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function buildDiff(draftPayload: Record<string, unknown>, publishedPayload: Record<string, unknown>) {
  const keys = new Set([...Object.keys(draftPayload), ...Object.keys(publishedPayload)]);
  const entries: DiffEntry[] = [];
  for (const key of keys) {
    const draftValue = draftPayload[key];
    const publishedValue = publishedPayload[key];
    if (JSON.stringify(draftValue) !== JSON.stringify(publishedValue)) {
      entries.push({
        field: key,
        draftValue: stringifyValue(draftValue),
        publishedValue: stringifyValue(publishedValue),
      });
    }
  }
  return entries;
}

function parseFeatures(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function PlansAdminClient() {
  const [plans, setPlans] = useState<AdminPlanRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"" | "draft" | "published" | "archived">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorJson, setEditorJson] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createPlanKey, setCreatePlanKey] = useState("new_plan_key");
  const [createLocale, setCreateLocale] = useState("pt-BR");
  const [formFields, setFormFields] = useState({
    name: "",
    description: "",
    amountCents: "0",
    interval: "month",
    features: "",
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminPlans({
        status: statusFilter || undefined,
      });
      setPlans(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
      if (selectedId && !data.some((item) => item.id === selectedId)) {
        setSelectedId(data[0]?.id ?? null);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "plans_load_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const selectedRevision = useMemo(
    () => plans.find((item) => item.id === selectedId) ?? null,
    [plans, selectedId],
  );

  useEffect(() => {
    if (!selectedRevision) {
      setEditorJson("{}");
      setFormFields({
        name: "",
        description: "",
        amountCents: "0",
        interval: "month",
        features: "",
      });
      return;
    }

    const payload = selectedRevision.payload as Record<string, unknown>;
    setEditorJson(JSON.stringify(payload, null, 2));
    setFormFields({
      name: typeof payload.name === "string" ? payload.name : "",
      description: typeof payload.description === "string" ? payload.description : "",
      amountCents: typeof payload.amountCents === "number" ? String(payload.amountCents) : "0",
      interval: typeof payload.interval === "string" ? payload.interval : "month",
      features: Array.isArray(payload.features) ? payload.features.join("\n") : "",
    });
  }, [selectedRevision]);

  const publishedPeer = useMemo(() => {
    if (!selectedRevision) return null;
    return (
      plans.find(
        (item) =>
          item.planKey === selectedRevision.planKey &&
          item.locale === selectedRevision.locale &&
          item.status === "published",
      ) ?? null
    );
  }, [plans, selectedRevision]);

  const diffEntries = useMemo(() => {
    if (!selectedRevision || !publishedPeer) return [] as DiffEntry[];
    if (selectedRevision.id === publishedPeer.id) return [] as DiffEntry[];

    const draftPayload = selectedRevision.payload as Record<string, unknown>;
    const publishedPayload = publishedPeer.payload as Record<string, unknown>;
    return buildDiff(draftPayload, publishedPayload);
  }, [publishedPeer, selectedRevision]);

  function syncFormToJson(next: typeof formFields) {
    setFormFields(next);
    const parsedJson = (() => {
      try {
        return JSON.parse(editorJson) as Record<string, unknown>;
      } catch {
        return {} as Record<string, unknown>;
      }
    })();

    const nextPayload: Record<string, unknown> = {
      ...parsedJson,
      name: next.name,
      description: next.description,
      amountCents: Number(next.amountCents) || 0,
      interval: next.interval,
      features: parseFeatures(next.features),
    };

    setEditorJson(JSON.stringify(nextPayload, null, 2));
  }

  async function createDraft() {
    setCreating(true);
    setError(null);
    try {
      const created = await createAdminPlanDraft({
        planKey: createPlanKey.trim(),
        locale: createLocale.trim(),
        payload: {
          name: "draft_name",
          description: "draft_description",
          currency: "BRL",
          amountCents: 0,
          interval: "month",
          ctaLabel: "draft_cta",
          ctaHref: "/pricing",
          features: [],
        },
      });
      await load();
      setSelectedId(created.id);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "create_plan_draft_failed");
    } finally {
      setCreating(false);
    }
  }

  async function saveSelectedDraft() {
    if (!selectedRevision) return;
    setSaving(true);
    setError(null);
    try {
      const candidatePayload = JSON.parse(editorJson) as unknown;
      const payloadResult = planPayloadSchema.safeParse(candidatePayload);
      if (!payloadResult.success) {
        setError(payloadResult.error.issues[0]?.message ?? "invalid_plan_payload");
        return;
      }
      const updated = await patchAdminPlanDraft(
        selectedRevision.id,
        {
          payload: payloadResult.data,
          status: selectedRevision.status,
        },
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

  async function publishSelectedDraft() {
    if (!selectedRevision) return;
    setPublishing(true);
    setError(null);
    try {
      const published = await publishAdminPlanDraft(selectedRevision.id, selectedRevision.etag);
      await load();
      setSelectedId(published.id);
    } catch (caughtError) {
      if (caughtError instanceof FrontendHttpError && caughtError.status === 409) {
        setError("Conflito de Versão (ETag). Recarregue a página antes de publicar.");
      } else if (caughtError instanceof FrontendHttpError && caughtError.status === 428) {
        setError("Cabeçalho If-Match está ausente. O Servidor rejeitou a publicação Insegura.");
      } else {
        setError(caughtError instanceof Error ? caughtError.message : "Falha ao Publicar Plano.");
      }
    } finally {
      setPublishing(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
        <h2 className="font-display text-3xl">Revisões</h2>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary"
        >
          <option value="">all_status</option>
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>

        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {loading ? <p className="text-sm text-text-muted">loading_plans</p> : null}
          {plans.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                selectedId === item.id
                  ? "border-brand/40 bg-brand/10 text-text-primary"
                  : "border-border-subtle bg-bg-elevated text-text-secondary"
              }`}
            >
              <p className="font-semibold">{item.planKey}</p>
              <p className="text-xs">v{item.version} · {item.status}</p>
              <p className="text-[11px] text-text-muted">{item.locale}</p>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-elevated p-3">
          <p className="mb-2 text-xs uppercase tracking-wider text-text-muted">Criar draft</p>
          <input
            value={createPlanKey}
            onChange={(event) => setCreatePlanKey(event.target.value)}
            className="mb-2 w-full rounded-md border border-border-subtle bg-bg-base px-2 py-1.5 text-sm"
          />
          <input
            value={createLocale}
            onChange={(event) => setCreateLocale(event.target.value)}
            className="mb-3 w-full rounded-md border border-border-subtle bg-bg-base px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => void createDraft()}
            disabled={creating}
            className="w-full rounded-md bg-brand px-3 py-2 text-sm font-semibold text-bg-base disabled:opacity-60"
          >
            {creating ? "creating..." : "create_draft"}
          </button>
        </div>
      </aside>

      <article className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
        {!selectedRevision ? (
          <p className="text-sm text-text-muted">select_plan_revision_to_edit</p>
        ) : (
          <>
            <header>
              <h3 className="font-display text-3xl">
                {selectedRevision.planKey} · v{selectedRevision.version}
              </h3>
              <p className="text-sm text-text-secondary">
                status={selectedRevision.status} · locale={selectedRevision.locale}
              </p>
            </header>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">name</span>
                <input
                  value={formFields.name}
                  onChange={(event) => syncFormToJson({ ...formFields, name: event.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">amount_cents</span>
                <input
                  value={formFields.amountCents}
                  onChange={(event) => syncFormToJson({ ...formFields, amountCents: event.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2"
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">description</span>
                <textarea
                  value={formFields.description}
                  onChange={(event) => syncFormToJson({ ...formFields, description: event.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">interval</span>
                <select
                  value={formFields.interval}
                  onChange={(event) => syncFormToJson({ ...formFields, interval: event.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2"
                >
                  <option value="month">month</option>
                  <option value="year">year</option>
                  <option value="one_time">one_time</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">features (1/linha)</span>
                <textarea
                  value={formFields.features}
                  onChange={(event) => syncFormToJson({ ...formFields, features: event.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2"
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">raw_json_editor</span>
              <textarea
                value={editorJson}
                onChange={(event) => setEditorJson(event.target.value)}
                rows={16}
                className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 font-mono text-xs"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveSelectedDraft()}
                disabled={saving}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg-base disabled:opacity-60"
              >
                {saving ? "saving..." : "save_draft"}
              </button>
              <button
                type="button"
                onClick={() => void publishSelectedDraft()}
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

            <section className="rounded-lg border border-border-subtle bg-bg-elevated p-3">
              <h4 className="font-display text-2xl">Diff Draft vs Published</h4>
              {!publishedPeer || selectedRevision.id === publishedPeer.id ? (
                <p className="text-sm text-text-muted">no_differences_or_no_published_peer</p>
              ) : diffEntries.length === 0 ? (
                <p className="text-sm text-text-muted">payload_equivalent_to_published</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {diffEntries.map((entry) => (
                    <article key={entry.field} className="rounded-md border border-border-subtle bg-bg-base p-2">
                      <p className="text-xs uppercase tracking-wider text-gold">{entry.field}</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        <pre className="overflow-x-auto rounded bg-bg-elevated p-2 text-[11px] text-text-secondary">
                          draft: {entry.draftValue}
                        </pre>
                        <pre className="overflow-x-auto rounded bg-bg-elevated p-2 text-[11px] text-text-secondary">
                          published: {entry.publishedValue}
                        </pre>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </article>
    </section>
  );
}
