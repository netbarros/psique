"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminIntegrations, patchAdminIntegration } from "@/lib/frontend/admin-client";
import { FrontendHttpError } from "@/lib/frontend/http-error";

type IntegrationStatus = "active" | "inactive" | "invalid" | "draft";

type IntegrationRow = Awaited<ReturnType<typeof getAdminIntegrations>>[number];

function safeJsonParse(value: string) {
  return JSON.parse(value) as Record<string, unknown>;
}

function toDatetimeLocal(isoDate: string | null | undefined) {
  if (!isoDate) return "";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 16);
}

function fromDatetimeLocal(input: string) {
  if (!input.trim()) return null;
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export function IntegrationsAdminClient() {
  const [items, setItems] = useState<IntegrationRow[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [status, setStatus] = useState<IntegrationStatus>("inactive");
  const [publicConfigJson, setPublicConfigJson] = useState("{}");
  const [secretRef, setSecretRef] = useState("");
  const [lastValidatedAt, setLastValidatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminIntegrations();
      setItems(data);
      if (!selectedProvider && data.length > 0) {
        setSelectedProvider(data[0].provider);
      }
      if (selectedProvider && !data.some((item) => item.provider === selectedProvider)) {
        setSelectedProvider(data[0]?.provider ?? null);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "integrations_load_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => items.find((item) => item.provider === selectedProvider) ?? null,
    [items, selectedProvider],
  );

  useEffect(() => {
    if (!selected) {
      setStatus("inactive");
      setPublicConfigJson("{}");
      setSecretRef("");
      setLastValidatedAt("");
      return;
    }

    setStatus(selected.status);
    setPublicConfigJson(JSON.stringify(selected.public_config_json ?? {}, null, 2));
    setSecretRef("");
    setLastValidatedAt(toDatetimeLocal(selected.last_validated_at));
    setSuccess(null);
    setError(null);
  }, [selected]);

  async function save() {
    if (!selectedProvider) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const parsedPublicConfig = safeJsonParse(publicConfigJson);
      const updated = await patchAdminIntegration(selectedProvider, {
        status,
        publicConfig: parsedPublicConfig,
        secretRef: secretRef.trim() ? secretRef.trim() : undefined,
        lastValidatedAt: fromDatetimeLocal(lastValidatedAt),
      });

      setItems((previous) =>
        previous.map((item) => (item.provider === updated.provider ? updated : item)),
      );
      setSecretRef("");
      setSuccess("integration_saved");
    } catch (caughtError) {
      if (caughtError instanceof SyntaxError) {
        setError("invalid_public_config_json");
      } else if (caughtError instanceof FrontendHttpError && caughtError.status === 403) {
        setError("forbidden_master_admin_required");
      } else {
        setError(caughtError instanceof Error ? caughtError.message : "integration_save_failed");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-3 rounded-2xl border border-border-subtle bg-surface p-4">
        <h2 className="font-display text-3xl">Provedores</h2>
        {loading ? <p className="text-sm text-text-muted">loading_integrations</p> : null}
        {items.length === 0 && !loading ? (
          <p className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-muted">
            no_integrations_found
          </p>
        ) : null}
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.provider}
              type="button"
              onClick={() => setSelectedProvider(item.provider)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                selectedProvider === item.provider
                  ? "border-brand/40 bg-brand/10 text-text-primary"
                  : "border-border-subtle bg-bg-elevated text-text-secondary"
              }`}
            >
              <p className="font-semibold">{item.provider}</p>
              <p className="text-xs">status={item.status}</p>
            </button>
          ))}
        </div>
      </aside>

      <article className="space-y-4 rounded-2xl border border-border-subtle bg-surface p-4">
        {!selected ? (
          <p className="text-sm text-text-muted">select_provider_to_edit</p>
        ) : (
          <>
            <header>
              <h3 className="font-display text-3xl">{selected.provider}</h3>
              <p className="text-sm text-text-secondary">
                Segredos não são exibidos. Informe apenas novo `secretRef` quando necessário.
              </p>
            </header>

            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as IntegrationStatus)}
                className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="invalid">invalid</option>
                <option value="draft">draft</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">public_config_json</span>
              <textarea
                value={publicConfigJson}
                onChange={(event) => setPublicConfigJson(event.target.value)}
                rows={12}
                className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 font-mono text-xs"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">secret_ref (write only)</span>
                <input
                  value={secretRef}
                  onChange={(event) => setSecretRef(event.target.value)}
                  placeholder="vault://provider/key"
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-text-muted">last_validated_at</span>
                <input
                  type="datetime-local"
                  value={lastValidatedAt}
                  onChange={(event) => setLastValidatedAt(event.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-bg-base disabled:opacity-60"
              >
                {saving ? "saving..." : "save_integration"}
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
            {success ? (
              <p className="rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand">
                {success}
              </p>
            ) : null}
          </>
        )}
      </article>
    </section>
  );
}
