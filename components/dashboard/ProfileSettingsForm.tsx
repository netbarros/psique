"use client";

import { useState } from "react";
import CopyBookingLinkButton from "@/components/dashboard/CopyBookingLinkButton";
import LegacyWriteDisabledBanner from "@/components/dashboard/LegacyWriteDisabledBanner";
import { parseLegacyWriteDisabledPayload, type LegacyWriteDisabledPayload } from "@/lib/frontend/legacy-settings";

type ProfileData = {
  name: string;
  crp: string;
  bio: string | null;
  slug: string;
  sessionPrice: number;
  sessionDuration: number;
  timezone: string;
  photoUrl: string | null;
  updatedAt: string;
};

export function ProfileSettingsForm({
  initial,
  bookingLink,
}: {
  initial: ProfileData;
  bookingLink: string;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [legacyConflict, setLegacyConflict] = useState<LegacyWriteDisabledPayload | null>(null);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    setLegacyConflict(null);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          crp: form.crp,
          bio: form.bio,
          sessionPrice: form.sessionPrice,
          sessionDuration: form.sessionDuration,
          timezone: form.timezone,
          photoUrl: form.photoUrl,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        data?: {
          name: string;
          crp: string;
          bio: string | null;
          slug: string;
          sessionPrice: number;
          sessionDuration: number;
          timezone: string;
          photoUrl: string | null;
          updatedAt: string;
        };
      };

      if (!response.ok || !payload.data) {
        const conflict = parseLegacyWriteDisabledPayload(payload);
        if (conflict) {
          setLegacyConflict(conflict);
          return;
        }
        throw new Error(payload.error ?? "Falha ao salvar perfil");
      }

      setForm((previous) => ({
        ...previous,
        ...payload.data,
      }));
      setSuccess("Perfil salvo com sucesso.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Falha ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  const initials = form.name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      <article className="rounded-2xl border border-border-subtle bg-surface p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-2xl text-gold">
          <span className="material-symbols-outlined text-[20px]">person</span>
          Dados profissionais
        </h2>

        {legacyConflict ? <div className="mb-4"><LegacyWriteDisabledBanner conflict={legacyConflict} /></div> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <Field label="CRP" value={form.crp} onChange={(value) => setForm((prev) => ({ ...prev, crp: value }))} />
          <Field label="Valor da sessão (R$)" type="number" value={String(form.sessionPrice)} onChange={(value) => setForm((prev) => ({ ...prev, sessionPrice: Number(value) || 0 }))} />
          <Field label="Duração (min)" type="number" value={String(form.sessionDuration)} onChange={(value) => setForm((prev) => ({ ...prev, sessionDuration: Number(value) || 50 }))} />
          <Field label="Timezone" value={form.timezone} onChange={(value) => setForm((prev) => ({ ...prev, timezone: value }))} />
          <Field label="Foto (URL)" value={form.photoUrl ?? ""} onChange={(value) => setForm((prev) => ({ ...prev, photoUrl: value || null }))} />
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-widest text-text-muted">Bio</span>
          <textarea
            value={form.bio ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
            rows={5}
            className="scheme-dark w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand/50"
            data-theme="dark"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-bg-base transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? "Salvando..." : "Salvar perfil"}
          </button>
          <span className="text-xs text-text-muted">
            Última atualização: {new Date(form.updatedAt).toLocaleString("pt-BR")}
          </span>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-3 rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand">
            {success}
          </p>
        ) : null}
      </article>

      <aside className="space-y-6">
        <article className="rounded-2xl border border-border-subtle bg-surface p-6">
          <h2 className="mb-4 font-display text-2xl text-gold">Foto de perfil</h2>
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-lg font-semibold text-text-primary">
            {initials}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary">
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            Atualizar URL da foto
          </label>
        </article>

        <article className="rounded-2xl border border-border-subtle bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-2xl text-gold">
            <span className="material-symbols-outlined text-[20px]">language</span>
            Link público
          </h2>
          <p className="mb-3 text-xs text-text-muted">Compartilhe este URL para agendamento direto.</p>
          <code className="mb-3 block rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-[11px] text-text-secondary">
            {bookingLink}
          </code>
          <CopyBookingLinkButton value={bookingLink} />
        </article>
      </aside>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-widest text-text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="scheme-dark w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand/50"
        data-theme="dark"
      />
    </label>
  );
}
