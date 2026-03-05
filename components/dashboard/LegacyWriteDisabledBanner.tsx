"use client";

import Link from "next/link";
import type { LegacyWriteDisabledPayload } from "@/lib/frontend/legacy-settings";
import { formatLegacySunsetDate, migrationPathFromApi } from "@/lib/frontend/legacy-settings";

export default function LegacyWriteDisabledBanner({
  conflict,
}: {
  conflict: LegacyWriteDisabledPayload;
}) {
  const adminPath = migrationPathFromApi(conflict.migrateTo);
  return (
    <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
      <p className="text-sm font-semibold text-gold">Modo migrado: escrita legada desativada</p>
      <p className="mt-1 text-xs text-text-secondary">
        Esta tela permanece para compatibilidade visual, mas alterações devem ser feitas no painel
        `master_admin`. Corte definitivo em {formatLegacySunsetDate(conflict.sunsetDate)}.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={adminPath}
          className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-bg-base transition-colors hover:bg-brand-hover"
        >
          Abrir {adminPath}
        </Link>
        <code className="rounded-md border border-border-subtle bg-bg-elevated px-2 py-1 text-[11px] text-text-muted">
          {conflict.migrateTo}
        </code>
      </div>
    </div>
  );
}
