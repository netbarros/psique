"use client";

import { useMemo, useState } from "react";
import { Info, Smartphone } from "lucide-react";
import TwoFactorSetup from "@/components/dashboard/TwoFactorSetup";

export type SecurityMFAFactor = {
  id: string;
  type: string;
  status: string;
};

export default function SecurityTwoFactorCard({
  factors,
}: {
  factors: SecurityMFAFactor[];
}) {
  const [isManaging, setIsManaging] = useState(false);
  const isEnabled = useMemo(
    () => factors.some((factor) => factor.status === "verified"),
    [factors]
  );

  return (
    <div className="px-5 py-6 border-b border-border-subtle">
      <h3 className="text-lg font-semibold text-gold mb-4 flex items-center gap-2 font-display">
        <Smartphone className="w-5 h-5" />
        Autenticação em Duas Etapas (2FA)
      </h3>

      <div className="bg-bg-elevated border border-border-subtle rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-start justify-between gap-4">
        <div>
          <h4 className="font-medium text-text-primary mb-1">Aplicativo Autenticador (TOTP)</h4>
          <p className="text-text-muted text-xs mb-3">Exige um código gerado no seu celular (Google Authenticator, Authy) para fazer login.</p>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border transition-colors ${
              isEnabled
                ? "bg-brand/10 text-brand border-brand/20"
                : "bg-error/10 text-error border-error/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isEnabled ? "bg-brand" : "bg-error"
              }`}
            />
            {isEnabled ? "Ativado" : "Inativo"}
          </div>
        </div>
        
        <button
          onClick={() => setIsManaging((c) => !c)}
          className="px-4 py-2 rounded-lg border border-border-subtle text-text-secondary text-sm font-medium hover:bg-bg-base hover:text-text-primary transition-colors whitespace-nowrap self-start"
        >
          {isManaging ? "Fechar" : "Gerenciar"}
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2 text-text-muted">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <p className="text-xs">Para manter a conformidade máxima, a desativação do 2FA exigirá confirmação por e-mail e SMS.</p>
      </div>

      {isManaging && (
        <div className="mt-4 rounded-xl border border-border-subtle bg-bg-elevated p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <TwoFactorSetup initialFactors={factors} />
        </div>
      )}
    </div>
  );
}
