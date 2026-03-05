"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminAuditEvents } from "@/lib/frontend/admin-client";
import { FrontendHttpError } from "@/lib/frontend/http-error";

type AuditEvent = Awaited<ReturnType<typeof getAdminAuditEvents>>[number];

function toJsonString(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

export function AuditAdminClient() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [limit, setLimit] = useState(100);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminAuditEvents(limit);
      setEvents(data);
    } catch (caughtError) {
      if (caughtError instanceof FrontendHttpError && caughtError.status === 403) {
        setError("forbidden_master_admin_required");
      } else {
        setError(caughtError instanceof Error ? caughtError.message : "audit_load_failed");
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
        event.resource_id.toLowerCase().includes(normalized)
      );
    });
  }, [events, query]);

  return (
    <section className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
      <header className="flex flex-wrap items-end gap-3">
        <div>
          <h2 className="font-display text-3xl">Timeline de Auditoria</h2>
          <p className="text-sm text-text-secondary">
            Eventos append-only com ator, ação, recurso e diff serializado.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="filtrar por ação/recurso"
            className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm"
          />
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={300}>300</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-secondary"
          >
            reload
          </button>
        </div>
      </header>

      {loading ? <p className="text-sm text-text-muted">loading_audit_events</p> : null}
      {error ? (
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <p className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-muted">
          no_audit_events_found
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
              <span className="text-xs text-text-secondary">{event.resource_id}</span>
            </div>
            <p className="mt-2 text-xs text-text-muted">
              actor={event.actor_user_id} · {new Date(event.created_at).toLocaleString("pt-BR")}
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-bg-base p-2 text-[11px] text-text-secondary">
              {toJsonString(event.diff_json)}
            </pre>
          </article>
        ))}
      </div>
    </section>
  );
}
