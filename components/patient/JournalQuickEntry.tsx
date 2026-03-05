"use client";

import { useState } from "react";
import { Mic, Save, Smile } from "lucide-react";
import { EnterpriseCard } from "@/components/ui/EnterpriseCard";

type JournalQuickEntryProps = {
  initialPreview: string;
  initialCreatedAt: string | null;
};

export function JournalQuickEntry({
  initialPreview,
  initialCreatedAt,
}: JournalQuickEntryProps) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [latestPreview, setLatestPreview] = useState(initialPreview);
  const [latestCreatedAt, setLatestCreatedAt] = useState<string | null>(initialCreatedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if ((!text.trim() && mood === null) || saving) return;

    setSaving(true);
    setError(null);

    try {
      if (text.trim()) {
        const response = await fetch("/api/patient/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryText: text.trim(), moodScore: mood }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Falha ao salvar registro");
        }
      } else if (typeof mood === "number") {
        const response = await fetch("/api/patient/mood", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moodScore: mood, note: null }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Falha ao salvar humor");
        }
      }

      const refresh = await fetch("/api/patient/journal?limit=1", { cache: "no-store" });
      if (refresh.ok) {
        const payload = (await refresh.json()) as {
          data?: Array<{ entryText: string; createdAt: string }>;
        };
        const latest = payload.data?.[0];
        if (latest) {
          setLatestPreview(latest.entryText);
          setLatestCreatedAt(latest.createdAt);
        }
      }

      setText("");
      setMood(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* ─── Textarea card — stitch S10 ─── */}
      <EnterpriseCard delay={0.1} className="overflow-hidden p-0 transition-all focus-within:border-portal-brand focus-within:ring-2 focus-within:ring-portal-brand/20">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-[120px] w-full resize-none border-0 bg-transparent p-4 text-sm text-portal-text-primary placeholder:text-portal-text-placeholder focus:outline-none"
          placeholder="O que está em sua mente hoje?"
        />
        <div className="flex flex-col gap-2 border-t border-portal-border bg-portal-bg-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Mood + mic */}
          <div className="flex items-center gap-1 text-portal-text-muted">
            {[1, 2, 3, 4, 5].map((item) => (
              <button
                key={item}
                className={`rounded-md px-2 py-1 text-xs transition-colors ${
                  mood === item ? "bg-portal-brand text-white" : "hover:bg-portal-border"
                }`}
                type="button"
                onClick={() => setMood(item)}
                aria-label={`Humor ${item}`}
              >
                {item}
              </button>
            ))}
            <button className="rounded-md p-1.5 transition-colors hover:bg-portal-border" type="button" aria-label="Inserir humor">
              <Smile className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1.5 transition-colors hover:bg-portal-border" type="button" aria-label="Adicionar áudio" disabled>
              <Mic className="h-4 w-4" />
            </button>
          </div>

          {/* Save */}
          <button
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-portal-text-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || (!text.trim() && mood === null)}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </EnterpriseCard>

      {/* Error */}
      {error ? (
        <p className="mt-2 rounded-xl border border-portal-danger/25 bg-portal-danger/10 px-3 py-2 text-sm text-portal-danger">
          {error}
        </p>
      ) : null}

      {/* Latest entry preview — stitch S10 */}
      <EnterpriseCard delay={0.2} className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-portal-text-muted">
            {latestCreatedAt
              ? new Date(latestCreatedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "Registro recente"}
          </span>
          <span className="rounded bg-portal-border px-2 py-0.5 text-[10px] font-medium text-portal-text-muted">
            Reflexão
          </span>
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-portal-text-primary">
          {latestPreview}
        </p>
      </EnterpriseCard>
    </>
  );
}
