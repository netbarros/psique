"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, FileText, SearchCheck, ShieldCheck, Database, ChevronRight, LockKeyhole, Trash2 } from "lucide-react";

type AuditEvent = {
  id: string;
  title: string;
  action: string;
  tableName: string;
  createdAt: string;
  ip: string | null;
};

type SecurityState = {
  encryptRecords: boolean;
  requireLgpdConsent: boolean;
  blurPatientData: boolean;
  cancellationPolicyHours: number;
};

export function SecuritySettingsPanel({
  initial,
  initialEvents,
}: {
  initial: SecurityState;
  initialEvents: AuditEvent[];
}) {
  const [settings, setSettings] = useState<SecurityState>(initial);
  const [events, setEvents] = useState<AuditEvent[]>(initialEvents);
  const [loadingKey, setLoadingKey] = useState<keyof SecurityState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [events]
  );

  async function patchSettings(partial: Partial<SecurityState>, key: keyof SecurityState) {
    setLoadingKey(key);
    setError(null);

    try {
      const response = await fetch("/api/settings/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        data?: SecurityState;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Falha ao atualizar segurança");
      }

      setSettings(payload.data);

      const eventsRes = await fetch("/api/audit/events?limit=20", { cache: "no-store" });
      if (eventsRes.ok) {
        const eventsPayload = (await eventsRes.json()) as { data?: AuditEvent[] };
        setEvents(eventsPayload.data ?? []);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Falha ao atualizar segurança");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border-subtle bg-bg-base overflow-hidden">
      <div className="px-5 pt-6 pb-8 border-b border-border-subtle bg-linear-to-b from-bg-elevated to-bg-base">
        <div className="flex items-center gap-3 mb-3 text-brand">
          <ShieldCheck className="w-8 h-8" />
          <h2 className="text-2xl font-semibold text-text-primary font-display">Conformidade Ativa</h2>
        </div>
        <p className="text-text-secondary text-sm leading-relaxed max-w-3xl">
          Gerencie as configurações de segurança da sua clínica. Todos os dados são criptografados em repouso seguindo diretrizes rigorosas da LGPD e protocolos de saúde.
        </p>
      </div>

      <div className="px-5 py-6 border-b border-border-subtle">
        <h3 className="text-lg font-semibold text-gold mb-4 flex items-center gap-2 font-display">
          <LockKeyhole className="w-5 h-5" />
          Criptografia e Privacidade
        </h3>
        <ul className="space-y-4">
          <ToggleRow
            title="Criptografia de Prontuários"
            description="Notas clínicas cifradas no banco (pgcrypto)."
            checked={settings.encryptRecords}
            disabled={loadingKey === "encryptRecords"}
            onToggle={(checked) =>
              void patchSettings({ encryptRecords: checked }, "encryptRecords")
            }
          />
          <ToggleRow
            title="Consentimento LGPD Automático"
            description="Exigir aceite antes do primeiro agendamento."
            checked={settings.requireLgpdConsent}
            disabled={loadingKey === "requireLgpdConsent"}
            onToggle={(checked) =>
              void patchSettings({ requireLgpdConsent: checked }, "requireLgpdConsent")
            }
          />
          <ToggleRow
            title="Ocultar Dados no App"
            description="Borrar nomes na tela inicial do dashboard."
            checked={settings.blurPatientData}
            disabled={loadingKey === "blurPatientData"}
            onToggle={(checked) =>
              void patchSettings({ blurPatientData: checked }, "blurPatientData")
            }
          />
        </ul>

        {error ? (
          <p className="mt-4 rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </p>
        ) : null}
      </div>

      <div className="px-5 py-6 border-b border-border-subtle">
        <h3 className="text-lg font-semibold text-text-primary mb-4 block">
          Política Operacional
        </h3>
        <label className="block max-w-sm">
          <span className="mb-1 block text-xs font-medium uppercase tracking-widest text-text-muted">
            Política de cancelamento (horas)
          </span>
          <input
            type="number"
            min={1}
            max={168}
            value={settings.cancellationPolicyHours}
            onChange={(event) =>
              setSettings((previous) => ({
                ...previous,
                cancellationPolicyHours: Number(event.target.value) || previous.cancellationPolicyHours,
              }))
            }
            onBlur={() =>
              void patchSettings(
                { cancellationPolicyHours: settings.cancellationPolicyHours },
                "cancellationPolicyHours"
              )
            }
            className="w-full rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand/50"
          />
        </label>
      </div>

      <div className="px-5 py-6 border-b border-border-subtle">
        <h3 className="text-lg font-semibold text-gold mb-4 flex items-center gap-2 font-display">
          <Download className="w-5 h-5" />
          Exportação de Dados
        </h3>
        <p className="text-text-secondary text-sm mb-4">
          De acordo com o Art. 18 da LGPD, você ou seus pacientes têm direito à portabilidade e acesso aos dados estruturados.
        </p>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-surface border border-border-subtle hover:border-brand/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center text-text-primary group-hover:text-brand transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-medium text-text-primary text-sm">Exportar Prontuários (PDF)</span>
                <span className="block text-text-muted text-xs mt-0.5">Relatório clínico completo por paciente.</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-primary transition-colors" />
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-surface border border-border-subtle hover:border-brand/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center text-text-primary group-hover:text-brand transition-colors">
                <Database className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block font-medium text-text-primary text-sm">Backup Completo (JSON/CSV)</span>
                <span className="block text-text-muted text-xs mt-0.5">Exportar toda a base de dados estruturada.</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-primary transition-colors" />
          </button>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gold flex items-center gap-2 font-display">
            <SearchCheck className="w-5 h-5" />
            Logs de Auditoria
          </h3>
          <button className="text-gold text-sm font-medium hover:underline">Ver tudo</button>
        </div>
        <p className="text-text-secondary text-sm mb-5">
          Registro imutável de quem acessou, editou ou exportou informações sensíveis nos últimos 30 dias.
        </p>

        <div className="relative space-y-4 before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border-subtle">
          {sortedEvents.length === 0 ? (
            <p className="relative md:mx-auto text-center rounded-xl border border-dashed border-border-subtle bg-bg-elevated px-3 py-2 text-sm text-text-muted max-w-xs z-10 w-fit">
              Nenhum evento recente.
            </p>
          ) : (
            sortedEvents.map((event, index) => {
              const isExport = event.action === "export" || event.action === "delete";
              const dotColor = isExport ? "bg-gold" : (index === 0 ? "bg-brand" : "bg-border-strong");
              
              return (
                <article key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className={`flex items-center justify-center w-4 h-4 rounded-full border-2 border-bg-base ${dotColor} shrink-0 z-10 ml-0 md:mx-auto`} />
                  
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-4 md:ml-0 p-3 rounded-xl bg-bg-elevated border border-border-subtle/50 relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${isExport ? 'text-gold' : (index === 0 ? 'text-brand' : 'text-text-secondary')}`}>
                        {event.title}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {new Date(event.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="text-xs text-text-primary">
                      {event.tableName} · ação {event.action}
                    </p>
                    <p className="text-[10px] text-text-muted/70 mt-1 font-mono">IP: {event.ip ?? "indisponível"}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      <div className="px-5 py-8 mt-4 border-t border-error/20 bg-linear-to-b from-error/5 to-transparent">
        <h3 className="text-lg font-semibold text-error mb-2 flex items-center gap-2 font-display">
          <AlertTriangle className="w-5 h-5" />
          Zona de Perigo
        </h3>
        <p className="text-text-secondary text-sm mb-4">
          Ações destrutivas relativas à sua conta e dados exigem revisão manual.
        </p>
        <button className="w-full py-3 px-4 rounded-xl border border-error/30 text-error font-medium text-sm hover:bg-error/10 transition-colors flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" />
          Solicitar Exclusão da Conta
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: (nextValue: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4">
      <div>
        <h4 className="font-medium text-text-primary text-sm">{title}</h4>
        <p className="text-text-muted text-xs mt-0.5">{description}</p>
      </div>
      <div className="relative inline-block w-12 align-middle select-none">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onToggle(event.target.checked)}
          className="peer absolute block w-6 h-6 rounded-full bg-text-primary border-4 border-bg-elevated appearance-none cursor-pointer transition-transform duration-200 ease-in-out z-10 checked:translate-x-6 disabled:opacity-50"
        />
        <div className="block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out peer-checked:bg-brand bg-border-strong peer-disabled:opacity-50" />
      </div>
    </li>
  );
}
