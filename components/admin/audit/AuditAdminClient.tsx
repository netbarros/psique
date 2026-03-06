"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminAuditEvents } from "@/lib/frontend/admin-client";
import { FrontendHttpError } from "@/lib/frontend/http-error";

type AuditEvent = Awaited<ReturnType<typeof getAdminAuditEvents>>[number];
type NoticeTone = "error" | "warning";
type NoticeState = { tone: NoticeTone; message: string } | null;

function toJsonString(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

function Notice({ notice }: { notice: NonNullable<NoticeState> }) {
  const toneClass =
    notice.tone === "warning"
      ? "border-gold/30 bg-gold/10 text-gold"
      : "border-error/30 bg-error/10 text-error";

  return <p className={`rounded-xl border px-3 py-2 text-sm ${toneClass}`}>{notice.message}</p>;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditAdminClient() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [limit, setLimit] = useState(100);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<NoticeState>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminAuditEvents(limit);
      setEvents(data);
    } catch (caughtError) {
      if (caughtError instanceof FrontendHttpError && caughtError.status === 403) {
        setNotice({
          tone: "warning",
          message: "Acesso negado (`403`). Esta trilha é exclusiva de `master_admin`.",
        });
      } else {
        setNotice({
          tone: "error",
          message: caughtError instanceof Error ? caughtError.message : "Falha ao carregar eventos de auditoria.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return events;
    return events.filter((event) => {
      return (
        event.action.toLowerCase().includes(normalized) ||
        event.resource_type.toLowerCase().includes(normalized) ||
        event.resource_id.toLowerCase().includes(normalized) ||
        event.actor_user_id.toLowerCase().includes(normalized)
      );
    });
  }, [events, query]);

  const uniqueActors = useMemo(() => new Set(filtered.map((event) => event.actor_user_id)).size, [filtered]);

  return (
    <section className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
      <header className="rounded-xl border border-border-subtle bg-bg-elevated p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <h3 className="font-display text-3xl">Timeline de Auditoria</h3>
            <p className="text-sm text-text-secondary">
              Eventos append-only com ator, ação, recurso e diff serializado.
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtrar ação, recurso ou actor"
              className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-sm"
            />
            <select
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-sm"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={300}>300</option>
            </select>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              Recarregar
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg border border-border-subtle bg-bg-base px-2 py-2 text-center text-text-secondary">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">eventos</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{events.length}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-base px-2 py-2 text-center text-text-secondary">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">após filtro</p>
            <p className="mt-1 text-sm font-semibold text-brand">{filtered.length}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-base px-2 py-2 text-center text-text-secondary">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">atores</p>
            <p className="mt-1 text-sm font-semibold text-gold">{uniqueActors}</p>
          </div>
        </div>
      </header>

      {notice ? <Notice notice={notice} /> : null}

      {loading ? (
        <p className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-muted">
          Carregando eventos...
        </p>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <p className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-muted">
          Nenhum evento encontrado para este filtro.
        </p>
      ) : null}

      <div className="space-y-3">
        {filtered.map((event) => (
          <article key={event.id} className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                {event.action}
              </span>
              <span className="text-xs text-text-muted">{event.resource_type}</span>
              <span className="text-xs text-text-muted">·</span>
              <span className="break-all text-xs text-text-secondary">{event.resource_id}</span>
            </div>
            <p className="mt-2 break-all text-xs text-text-muted">
              actor={event.actor_user_id} · {formatDate(event.created_at)}
            </p>
            <details className="mt-2 rounded-lg border border-border-subtle bg-bg-base">
              <summary className="cursor-pointer select-none px-3 py-2 text-xs text-text-secondary">
                Ver diff_json
              </summary>
              <pre className="overflow-x-auto border-t border-border-subtle p-3 text-[11px] text-text-secondary">
                {toJsonString(event.diff_json)}
              </pre>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
