"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { planPayloadSchema, type AdminPlanRevision, type PlanPayload } from "@/lib/contracts/admin/plans";
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

type EditorMode = "form" | "json" | "split" | "diff";
type SortMode = "updated_desc" | "updated_asc" | "version_desc" | "plan_key_asc";
type StatusFilter = "" | "draft" | "published" | "archived";
type NoticeTone = "error" | "success" | "warning";
type NoticeState = { tone: NoticeTone; message: string } | null;

const DEFAULT_DRAFT_PAYLOAD = {
  name: "Novo plano",
  headline: "Headline do plano",
  description: "Descreva o posicionamento e o valor percebido deste plano.",
  currency: "BRL",
  amountCents: 0,
  interval: "month",
  ctaLabel: "Quero este plano",
  ctaHref: "/pricing",
  features: [],
} as const;

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

function stringifyValue(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        value: null as Record<string, unknown> | null,
        error: "O editor JSON precisa conter um objeto no nível raiz.",
      };
    }
    return {
      value: parsed as Record<string, unknown>,
      error: null as string | null,
    };
  } catch {
    return {
      value: null as Record<string, unknown> | null,
      error: "JSON inválido no editor.",
    };
  }
}

function normalizePayloadValue(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
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

function statusBadgeClass(status: "draft" | "published" | "archived") {
  if (status === "published") return "border-brand/30 bg-brand/10 text-brand";
  if (status === "archived") return "border-border-subtle bg-bg-base text-text-muted";
  return "border-gold/30 bg-gold/10 text-gold";
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

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    return `R$ ${(amountCents / 100).toFixed(2)}`;
  }
}

function intervalLabel(value: string | undefined) {
  if (value === "year") return "/ano";
  if (value === "one_time") return "pagamento único";
  return "/mês";
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

export function PlansAdminClient() {
  const [plans, setPlans] = useState<AdminPlanRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [localeFilter, setLocaleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updated_desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>("split");
  const [editorJson, setEditorJson] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [cloneFromSelected, setCloneFromSelected] = useState(true);
  const [createPlanKey, setCreatePlanKey] = useState("new_plan_key");
  const [createLocale, setCreateLocale] = useState("pt-BR");
  const [notice, setNotice] = useState<NoticeState>(null);
  const [formFields, setFormFields] = useState({
    name: "",
    headline: "",
    description: "",
    amountCents: "0",
    currency: "BRL",
    interval: "month",
    ctaLabel: "",
    ctaHref: "",
    features: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminPlans({});
      setPlans(data);
      setSelectedId((currentSelectedId) => {
        if (!currentSelectedId) return data[0]?.id ?? null;
        if (data.some((item) => item.id === currentSelectedId)) return currentSelectedId;
        return data[0]?.id ?? null;
      });
    } catch (caughtError) {
      setNotice({
        tone: "error",
        message: toUiErrorMessage(caughtError, "Falha ao carregar revisões de planos."),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const localeOptions = useMemo(() => {
    return Array.from(new Set(plans.map((item) => item.locale))).sort((a, b) => a.localeCompare(b));
  }, [plans]);

  const counts = useMemo(() => {
    const next = {
      total: plans.length,
      draft: 0,
      published: 0,
      archived: 0,
    };
    for (const plan of plans) {
      next[plan.status] += 1;
    }
    return next;
  }, [plans]);

  const filteredPlans = useMemo(() => {
    return plans.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (localeFilter && item.locale !== localeFilter) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.trim().toLowerCase();
      const payload = normalizePayloadValue(item.payload);
      const planName = typeof payload.name === "string" ? payload.name : "";
      const planHeadline = typeof payload.headline === "string" ? payload.headline : "";
      return [item.planKey, item.locale, item.status, planName, planHeadline]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [plans, statusFilter, localeFilter, searchQuery]);

  const sortedPlans = useMemo(() => {
    const next = [...filteredPlans];
    next.sort((a, b) => {
      if (sortMode === "updated_asc") {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      if (sortMode === "version_desc") {
        return b.version - a.version;
      }
      if (sortMode === "plan_key_asc") {
        const byPlan = a.planKey.localeCompare(b.planKey);
        if (byPlan !== 0) return byPlan;
        return b.version - a.version;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return next;
  }, [filteredPlans, sortMode]);

  useEffect(() => {
    if (sortedPlans.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !sortedPlans.some((item) => item.id === selectedId)) {
      setSelectedId(sortedPlans[0]?.id ?? null);
    }
  }, [sortedPlans, selectedId]);

  const selectedRevision = useMemo(
    () => sortedPlans.find((item) => item.id === selectedId) ?? null,
    [sortedPlans, selectedId],
  );

  useEffect(() => {
    if (!selectedRevision) {
      setEditorJson("{}");
      setFormFields({
        name: "",
        headline: "",
        description: "",
        amountCents: "0",
        currency: "BRL",
        interval: "month",
        ctaLabel: "",
        ctaHref: "",
        features: "",
      });
      return;
    }

    const payload = normalizePayloadValue(selectedRevision.payload);
    setEditorJson(JSON.stringify(payload, null, 2));
    setFormFields({
      name: typeof payload.name === "string" ? payload.name : "",
      headline: typeof payload.headline === "string" ? payload.headline : "",
      description: typeof payload.description === "string" ? payload.description : "",
      amountCents: typeof payload.amountCents === "number" ? String(payload.amountCents) : "0",
      currency: typeof payload.currency === "string" ? payload.currency.toUpperCase() : "BRL",
      interval: typeof payload.interval === "string" ? payload.interval : "month",
      ctaLabel: typeof payload.ctaLabel === "string" ? payload.ctaLabel : "",
      ctaHref: typeof payload.ctaHref === "string" ? payload.ctaHref : "",
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

  const editorPayloadResult = useMemo(() => parseJsonRecord(editorJson), [editorJson]);

  const payloadValidation = useMemo(() => {
    if (!editorPayloadResult.value) {
      return {
        valid: false,
        message: editorPayloadResult.error ?? "Payload inválido.",
        payload: null as PlanPayload | null,
      };
    }
    const parsed = planPayloadSchema.safeParse(editorPayloadResult.value);
    if (!parsed.success) {
      return {
        valid: false,
        message: parsed.error.issues[0]?.message ?? "Payload inválido para plano.",
        payload: null as PlanPayload | null,
      };
    }
    return {
      valid: true,
      message: null as string | null,
      payload: parsed.data,
    };
  }, [editorPayloadResult]);

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedRevision || !editorPayloadResult.value) return false;
    const selectedPayload = normalizePayloadValue(selectedRevision.payload);
    return JSON.stringify(editorPayloadResult.value) !== JSON.stringify(selectedPayload);
  }, [selectedRevision, editorPayloadResult]);

  const diffEntries = useMemo(() => {
    if (!selectedRevision || !publishedPeer) return [] as DiffEntry[];
    if (!editorPayloadResult.value) return [] as DiffEntry[];
    if (selectedRevision.id === publishedPeer.id) return [] as DiffEntry[];
    const publishedPayload = normalizePayloadValue(publishedPeer.payload);
    return buildDiff(editorPayloadResult.value, publishedPayload);
  }, [publishedPeer, selectedRevision, editorPayloadResult]);

  function syncFormToJson(next: typeof formFields) {
    setFormFields(next);

    const currentPayload = editorPayloadResult.value ?? {};
    const nextPayload: Record<string, unknown> = {
      ...currentPayload,
      name: next.name,
      headline: next.headline.trim() ? next.headline.trim() : undefined,
      description: next.description,
      currency: next.currency.trim().toUpperCase() || "BRL",
      amountCents: Number(next.amountCents) || 0,
      interval: next.interval,
      ctaLabel: next.ctaLabel.trim() ? next.ctaLabel.trim() : undefined,
      ctaHref: next.ctaHref.trim() ? next.ctaHref.trim() : undefined,
      features: parseFeatures(next.features),
    };

    setEditorJson(JSON.stringify(nextPayload, null, 2));
  }

  async function createDraft() {
    if (!createPlanKey.trim() || !createLocale.trim()) {
      setNotice({
        tone: "warning",
        message: "Informe `planKey` e `locale` antes de criar um draft.",
      });
      return;
    }

    const sourcePayload = cloneFromSelected && selectedRevision
      ? normalizePayloadValue(selectedRevision.payload)
      : DEFAULT_DRAFT_PAYLOAD;

    const payloadResult = planPayloadSchema.safeParse(sourcePayload);
    if (!payloadResult.success) {
      setNotice({
        tone: "warning",
        message: "Payload base inválido para criar draft. Revise o plano de origem.",
      });
      return;
    }

    setCreating(true);
    setNotice(null);
    try {
      const created = await createAdminPlanDraft({
        planKey: createPlanKey.trim(),
        locale: createLocale.trim(),
        payload: payloadResult.data,
      });
      await load();
      setSelectedId(created.id);
      setNotice({
        tone: "success",
        message: "Draft criado com sucesso. Ajuste o conteúdo e publique quando estiver pronto.",
      });
    } catch (caughtError) {
      setNotice({
        tone: "error",
        message: toUiErrorMessage(caughtError, "Falha ao criar draft de plano."),
      });
    } finally {
      setCreating(false);
    }
  }

  const saveSelectedDraft = useCallback(async () => {
    if (!selectedRevision) return;
    setSaving(true);
    setNotice(null);
    try {
      if (!payloadValidation.valid || !payloadValidation.payload) {
        setNotice({
          tone: "warning",
          message: payloadValidation.message ?? "Payload inválido para salvar.",
        });
        return;
      }

      const updated = await patchAdminPlanDraft(
        selectedRevision.id,
        {
          payload: payloadValidation.payload,
          status: selectedRevision.status,
        },
        selectedRevision.etag,
      );

      await load();
      setSelectedId(updated.id);
      setNotice({
        tone: "success",
        message: "Draft salvo com sucesso.",
      });
    } catch (caughtError) {
      if (caughtError instanceof FrontendHttpError && caughtError.status === 409) {
        setNotice({
          tone: "warning",
          message: "Conflito `409` (ETag desatualizada). Recarregue a revisão e salve novamente.",
        });
      } else {
        setNotice({
          tone: "error",
          message: toUiErrorMessage(caughtError, "Falha ao salvar draft."),
        });
      }
    } finally {
      setSaving(false);
    }
  }, [load, payloadValidation.message, payloadValidation.payload, payloadValidation.valid, selectedRevision]);

  async function publishSelectedDraft() {
    if (!selectedRevision) return;
    if (selectedRevision.status !== "draft") {
      setNotice({
        tone: "warning",
        message: "Apenas revisões em `draft` podem ser publicadas.",
      });
      return;
    }
    if (!payloadValidation.valid) {
      setNotice({
        tone: "warning",
        message: "Payload inválido. Corrija antes de publicar.",
      });
      return;
    }

    setPublishing(true);
    setNotice(null);
    try {
      const published = await publishAdminPlanDraft(selectedRevision.id, selectedRevision.etag);
      await load();
      setSelectedId(published.id);
      setNotice({
        tone: "success",
        message: "Plano publicado com sucesso.",
      });
    } catch (caughtError) {
      if (caughtError instanceof FrontendHttpError && caughtError.status === 409) {
        setNotice({
          tone: "warning",
          message: "Conflito `409` no publish. Atualize os dados e confirme novamente.",
        });
      } else if (caughtError instanceof FrontendHttpError && caughtError.status === 428) {
        setNotice({
          tone: "warning",
          message: "Servidor retornou `428` (If-Match ausente). Recarregue e tente publicar novamente.",
        });
      } else {
        setNotice({
          tone: "error",
          message: toUiErrorMessage(caughtError, "Falha ao publicar plano."),
        });
      }
    } finally {
      setPublishing(false);
    }
  }

  useEffect(() => {
    if (!selectedRevision) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!saving && !publishing) {
          void saveSelectedDraft();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedRevision, saving, publishing, saveSelectedDraft]);

  const selectedPayload = normalizePayloadValue(selectedRevision?.payload);
  const selectedAmountCents = typeof selectedPayload.amountCents === "number" ? selectedPayload.amountCents : 0;
  const selectedCurrency = typeof selectedPayload.currency === "string" ? selectedPayload.currency : "BRL";
  const selectedInterval = typeof selectedPayload.interval === "string" ? selectedPayload.interval : "month";
  const selectedName = typeof selectedPayload.name === "string" ? selectedPayload.name : selectedRevision?.planKey ?? "Plano";
  const selectedDescription =
    typeof selectedPayload.description === "string" ? selectedPayload.description : "Descrição indisponível.";
  const selectedFeatures = Array.isArray(selectedPayload.features)
    ? (selectedPayload.features as unknown[]).filter((value): value is string => typeof value === "string")
    : [];

  return (
    <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
        <div className="relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 via-bg-elevated to-bg-base p-4">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/20 blur-2xl" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">plan command center</p>
          <h3 className="mt-1 font-display text-3xl text-text-primary">Revisões</h3>
          <p className="mt-1 text-xs text-text-secondary">
            Controle editorial com validação, diffs e publish seguro por ETag.
          </p>

          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">total</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">{counts.total}</p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">draft</p>
              <p className="mt-1 text-sm font-semibold text-gold">{counts.draft}</p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">pub</p>
              <p className="mt-1 text-sm font-semibold text-brand">{counts.published}</p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-2">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">arch</p>
              <p className="mt-1 text-sm font-semibold text-text-secondary">{counts.archived}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border-subtle bg-bg-elevated p-3">
          <p className="text-xs uppercase tracking-wider text-text-muted">Filtros rápidos</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: "", label: "Todos" },
              { value: "draft", label: "Draft" },
              { value: "published", label: "Publicados" },
              { value: "archived", label: "Arquivados" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setStatusFilter(item.value as StatusFilter)}
                className={`rounded-lg border px-2 py-2 text-[11px] transition-colors ${
                  statusFilter === item.value
                    ? "border-brand/40 bg-brand/10 text-brand"
                    : "border-border-subtle bg-bg-base text-text-secondary hover:border-brand/30 hover:text-text-primary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">Buscar plano</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="planKey, nome, locale..."
              className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">Locale</span>
              <select
                value={localeFilter}
                onChange={(event) => setLocaleFilter(event.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary"
              >
                <option value="">Todos</option>
                {localeOptions.map((locale) => (
                  <option key={locale} value={locale}>
                    {locale}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">Ordenação</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary"
              >
                <option value="updated_desc">Atualizado (recente)</option>
                <option value="updated_asc">Atualizado (antigo)</option>
                <option value="version_desc">Versão (desc)</option>
                <option value="plan_key_asc">planKey (A-Z)</option>
              </select>
            </label>
          </div>
        </div>

        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <p className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-muted">
              Carregando revisões...
            </p>
          ) : null}

          {!loading && sortedPlans.length === 0 ? (
            <p className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-muted">
              Nenhuma revisão encontrada para os filtros atuais.
            </p>
          ) : null}

          {sortedPlans.map((item) => {
            const payload = normalizePayloadValue(item.payload);
            const amountCents = typeof payload.amountCents === "number" ? payload.amountCents : 0;
            const currency = typeof payload.currency === "string" ? payload.currency : "BRL";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                  selectedId === item.id
                    ? "border-brand/40 bg-brand/10 text-text-primary shadow-[0_0_20px_rgba(82,183,136,0.08)]"
                    : "border-border-subtle bg-bg-elevated text-text-secondary hover:border-brand/30 hover:text-text-primary"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.planKey}</p>
                    <p className="mt-0.5 truncate text-[11px] text-text-muted">v{item.version} · {item.locale}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-brand">{formatMoney(amountCents, currency)}</span>
                  <span className="text-text-muted">{formatDate(item.updatedAt)}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-3 rounded-xl border border-border-subtle bg-bg-elevated p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-text-muted">Criar draft</p>
            <label className="inline-flex items-center gap-2 text-[11px] text-text-secondary">
              <input
                type="checkbox"
                checked={cloneFromSelected}
                onChange={(event) => setCloneFromSelected(event.target.checked)}
                className="accent-brand"
              />
              clonar revisão selecionada
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">planKey</span>
              <input
                value={createPlanKey}
                onChange={(event) => setCreatePlanKey(event.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">locale</span>
              <input
                value={createLocale}
                onChange={(event) => setCreateLocale(event.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-primary"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void createDraft()}
            disabled={creating}
            className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {creating ? "Criando..." : "Criar novo draft"}
          </button>
        </div>
      </aside>

      <article className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
        {notice ? <Notice notice={notice} /> : null}

        {!selectedRevision ? (
          <div className="rounded-xl border border-border-subtle bg-bg-elevated p-4">
            <p className="text-sm text-text-secondary">
              Selecione uma revisão na lateral para editar, validar e publicar.
            </p>
          </div>
        ) : (
          <>
            <header className="relative overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-elevated via-surface to-bg-base p-4">
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gold/10 blur-3xl" />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-4xl leading-none text-text-primary">{selectedName}</h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${statusBadgeClass(selectedRevision.status)}`}
                    >
                      {selectedRevision.status}
                    </span>
                    {hasUnsavedChanges ? (
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                        unsaved
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    {selectedRevision.planKey} · locale {selectedRevision.locale} · v{selectedRevision.version}
                  </p>
                  <p className="mt-1 break-all text-xs text-text-muted">etag: {selectedRevision.etag}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    atualizado em {formatDate(selectedRevision.updatedAt)} · publicado em {formatDate(selectedRevision.publishedAt)}
                  </p>
                </div>
                <div className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Preço atual</p>
                  <p className="font-display text-3xl text-text-primary">{formatMoney(selectedAmountCents, selectedCurrency)}</p>
                  <p className="text-xs text-text-secondary">{intervalLabel(selectedInterval)}</p>
                </div>
              </div>
            </header>

            <section className="sticky top-4 z-10 rounded-2xl border border-border-subtle bg-surface/95 p-3 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void saveSelectedDraft()}
                    disabled={saving || !hasUnsavedChanges}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : hasUnsavedChanges ? "Salvar draft" : "Sem mudanças"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void publishSelectedDraft()}
                    disabled={publishing || selectedRevision.status !== "draft" || !payloadValidation.valid}
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

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full border px-2 py-1 ${
                      payloadValidation.valid
                        ? "border-brand/30 bg-brand/10 text-brand"
                        : "border-error/30 bg-error/10 text-error"
                    }`}
                  >
                    {payloadValidation.valid ? "Payload válido" : payloadValidation.message}
                  </span>
                  <span className="rounded-full border border-border-subtle bg-bg-elevated px-2 py-1 text-text-muted">
                    Diff: {diffEntries.length} campos
                  </span>
                  <span className="rounded-full border border-border-subtle bg-bg-elevated px-2 py-1 text-text-muted">
                    Ctrl/Cmd + S
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { key: "split", label: "Split" },
                  { key: "form", label: "Form" },
                  { key: "json", label: "JSON" },
                  { key: "diff", label: "Diff" },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setEditorMode(mode.key as EditorMode)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      editorMode === mode.key
                        ? "border-brand/40 bg-brand/10 text-brand"
                        : "border-border-subtle bg-bg-elevated text-text-secondary hover:border-brand/30 hover:text-text-primary"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </section>

            {(editorMode === "form" || editorMode === "split") ? (
              <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4 rounded-2xl border border-border-subtle bg-bg-elevated p-4">
                  <h4 className="font-display text-2xl text-text-primary">Editor estruturado</h4>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm md:col-span-2">
                      <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">Nome</span>
                      <input
                        value={formFields.name}
                        onChange={(event) => syncFormToJson({ ...formFields, name: event.target.value })}
                        className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-text-primary"
                      />
                    </label>

                    <label className="text-sm md:col-span-2">
                      <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">Headline</span>
                      <input
                        value={formFields.headline}
                        onChange={(event) => syncFormToJson({ ...formFields, headline: event.target.value })}
                        className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-text-primary"
                      />
                    </label>

                    <label className="text-sm md:col-span-2">
                      <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">Descrição</span>
                      <textarea
                        value={formFields.description}
                        onChange={(event) => syncFormToJson({ ...formFields, description: event.target.value })}
                        rows={3}
                        className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-text-primary"
                      />
                    </label>

                    <label className="text-sm">
                      <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">amount_cents</span>
                      <input
                        type="number"
                        min={0}
                        value={formFields.amountCents}
                        onChange={(event) => syncFormToJson({ ...formFields, amountCents: event.target.value })}
                        className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-text-primary"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">currency</span>
                      <input
                        value={formFields.currency}
                        onChange={(event) => syncFormToJson({ ...formFields, currency: event.target.value })}
                        className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 uppercase text-text-primary"
                      />
                    </label>

                    <label className="text-sm">
                      <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">interval</span>
                      <select
                        value={formFields.interval}
                        onChange={(event) => syncFormToJson({ ...formFields, interval: event.target.value })}
                        className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-text-primary"
                      >
                        <option value="month">month</option>
                        <option value="year">year</option>
                        <option value="one_time">one_time</option>
                      </select>
                    </label>

                    <label className="text-sm">
                      <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">CTA label</span>
                      <input
                        value={formFields.ctaLabel}
                        onChange={(event) => syncFormToJson({ ...formFields, ctaLabel: event.target.value })}
                        className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-text-primary"
                      />
                    </label>

                    <label className="text-sm md:col-span-2">
                      <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">CTA href</span>
                      <input
                        value={formFields.ctaHref}
                        onChange={(event) => syncFormToJson({ ...formFields, ctaHref: event.target.value })}
                        className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-text-primary"
                      />
                    </label>

                    <label className="text-sm md:col-span-2">
                      <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">
                        Features (1 por linha)
                      </span>
                      <textarea
                        value={formFields.features}
                        onChange={(event) => syncFormToJson({ ...formFields, features: event.target.value })}
                        rows={5}
                        className="w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-text-primary"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <section className="rounded-2xl border border-brand/30 bg-brand/10 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">Preview comercial</p>
                    <h5 className="mt-1 font-display text-3xl text-text-primary">{selectedName}</h5>
                    <p className="mt-1 text-sm text-text-secondary">{selectedDescription}</p>
                    <p className="mt-3 font-display text-4xl text-text-primary">
                      {formatMoney(selectedAmountCents, selectedCurrency)}
                    </p>
                    <p className="text-xs text-text-secondary">{intervalLabel(selectedInterval)}</p>
                    <ul className="mt-3 space-y-1.5">
                      {selectedFeatures.length === 0 ? (
                        <li className="text-xs text-text-muted">Sem features listadas.</li>
                      ) : (
                        selectedFeatures.slice(0, 6).map((feature, index) => (
                          <li key={`${feature}-${index}`} className="text-sm text-text-secondary">
                            • {feature}
                          </li>
                        ))
                      )}
                    </ul>
                  </section>

                  <section className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">Publicação segura</p>
                    <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                      <li>• Publish exige ETag atual (`If-Match`).</li>
                      <li>• Payload inválido bloqueia publicação.</li>
                      <li>• Ao publicar, revisão anterior vira `archived`.</li>
                    </ul>
                  </section>
                </div>
              </section>
            ) : null}

            {(editorMode === "json" || editorMode === "split") ? (
              <section className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
                <h4 className="font-display text-2xl text-text-primary">Editor JSON</h4>
                <p className="mt-1 text-xs text-text-muted">
                  Use para ajustes avançados e flags de rollout. O schema é validado antes de salvar/publicar.
                </p>
                <textarea
                  value={editorJson}
                  onChange={(event) => setEditorJson(event.target.value)}
                  rows={editorMode === "split" ? 12 : 18}
                  className="mt-3 w-full rounded-xl border border-border-subtle bg-bg-base px-3 py-2 font-mono text-xs text-text-primary"
                />
              </section>
            ) : null}

            {(editorMode === "diff" || editorMode === "split") ? (
              <section className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
                <h4 className="font-display text-2xl text-text-primary">Diff draft vs published</h4>
                {!publishedPeer || selectedRevision.id === publishedPeer.id ? (
                  <p className="mt-2 text-sm text-text-muted">
                    Nenhuma referência publicada para comparar (ou você está na revisão publicada).
                  </p>
                ) : diffEntries.length === 0 ? (
                  <p className="mt-2 text-sm text-text-muted">Payload equivalente ao publicado.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {diffEntries.map((entry) => (
                      <article key={entry.field} className="rounded-lg border border-border-subtle bg-bg-base p-3">
                        <p className="text-xs uppercase tracking-wider text-gold">{entry.field}</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                          <pre className="overflow-x-auto rounded-md border border-border-subtle bg-bg-elevated p-2 text-[11px] text-text-secondary">
                            draft: {entry.draftValue}
                          </pre>
                          <pre className="overflow-x-auto rounded-md border border-border-subtle bg-bg-elevated p-2 text-[11px] text-text-secondary">
                            published: {entry.publishedValue}
                          </pre>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ) : null}
          </>
        )}
      </article>
    </section>
  );
}
