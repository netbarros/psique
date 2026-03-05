import type { PublicPlan } from "@/lib/contracts/public/plans";
import type { PublicContentItem } from "@/lib/contracts/public/content";

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.filter((item): item is string => typeof item === "string");
}

function asRecordArray(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const candidate = (value as { items?: unknown }).items;
    if (Array.isArray(candidate)) {
      return candidate.map(asObject);
    }
  }
  if (!Array.isArray(value)) return [] as Record<string, unknown>[];
  return value.map(asObject);
}

function getCtaFromArray(
  ctas: Array<Record<string, unknown>>,
  index: number,
): Record<string, unknown> {
  if (!ctas[index]) return {};
  return ctas[index];
}

function getCtaLabel(cta: Record<string, unknown>, fallback: string) {
  return asString(cta.label ?? cta.title ?? cta.text, fallback);
}

function getCtaHref(cta: Record<string, unknown>, fallback: string) {
  return asString(cta.href ?? cta.url ?? cta.link, fallback);
}

const defaultLandingBlocks = [
  {
    title: "Agenda Inteligente",
    description:
      "Página pública de autoagendamento com pagamento integrado e confirmação automática.",
  },
  {
    title: "IA Clínica",
    description:
      "Modelos avançados ajudam na organização de notas e síntese de sessão com guardrails.",
  },
  {
    title: "Automação Telegram",
    description:
      "Lembretes, confirmação de sessão e rotinas operacionais sem fluxo manual.",
  },
];

const defaultPricingFaq = [
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. A assinatura pode ser ajustada conforme o momento da sua operação.",
  },
  {
    q: "Meus dados ficam protegidos?",
    a: "Sim. O fluxo considera criptografia e controles alinhados à LGPD.",
  },
  {
    q: "A IA substitui o terapeuta?",
    a: "Não. A IA atua como copiloto operacional e de apoio à organização clínica.",
  },
];

export function getDefaultPublicPlans() {
  return [
    {
      id: "default-solo",
      planKey: "solo",
      locale: "pt-BR",
      version: 0,
      etag: "default-solo",
      publishedAt: null,
      name: "Plano Analista Solo",
      headline: "Essencial para operação clínica individual",
      description: "Para o profissional independente focado em qualidade de atendimento.",
      ctaLabel: "Assinar Agora",
      ctaHref: "/auth/register?plan=solo",
      amountCents: 29700,
      amountFormatted: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      }).format(29700 / 100),
      intervalLabel: "/mês",
      features: [
        "Agenda inteligente",
        "Videochamadas nativas",
        "Prontuário eletrônico",
      ],
    },
    {
      id: "default-pro",
      planKey: "pro",
      locale: "pt-BR",
      version: 0,
      etag: "default-pro",
      publishedAt: null,
      name: "Plano Clínica Pro",
      headline: "Escala e automação completa",
      description: "Cobertura avançada para operação com mais volume de sessões.",
      ctaLabel: "Assinar Clínica Pro",
      ctaHref: "/auth/register?plan=pro",
      amountCents: 49700,
      amountFormatted: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      }).format(49700 / 100),
      intervalLabel: "/mês",
      features: [
        "Tudo do plano Solo",
        "Mais automações clínicas",
        "Mais capacidade operacional",
      ],
    },
  ];
}

export function mapPublicPlan(raw: PublicPlan) {
  const payload = asObject(raw.payload);
  const amountCentsRaw = payload.amountCents;
  const amountCents = typeof amountCentsRaw === "number" ? amountCentsRaw : 0;
  const currency = asString(payload.currency, "BRL");
  const interval = asString(payload.interval, "month");

  return {
    id: raw.id,
    planKey: raw.planKey,
    locale: raw.locale,
    version: raw.version,
    etag: raw.etag,
    publishedAt: raw.publishedAt,
    name: asString(payload.name, raw.planKey),
    headline: asString(payload.headline, ""),
    description: asString(payload.description, ""),
    ctaLabel: asString(payload.ctaLabel, "Assinar"),
    ctaHref: asString(payload.ctaHref, `/auth/register?plan=${raw.planKey}`),
    amountCents,
    amountFormatted: new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amountCents / 100),
    intervalLabel:
      interval === "year" ? "/ano" : interval === "one_time" ? "pagamento único" : "/mês",
    features: asStringArray(payload.features),
  };
}

export function mapLandingContent(section: PublicContentItem | null) {
  const payload = asObject(section?.payload);
  const ctas = asRecordArray(payload.ctas);
  const primaryCta = asObject(payload.primaryCta);
  const secondaryCta = asObject(payload.secondaryCta);
  const primaryCtaCandidate =
    Object.keys(primaryCta).length > 0
      ? primaryCta
      : getCtaFromArray(ctas, 0);
  const secondaryCtaCandidate =
    Object.keys(secondaryCta).length > 0
      ? secondaryCta
      : getCtaFromArray(ctas, 1);
  const blocks = asRecordArray(payload.blocks);

  return {
    title: asString(payload.heroTitle ?? payload.title, "A única plataforma que cuida de quem cuida."),
    subtitle: asString(
      payload.heroSubtitle ?? payload.subtitle,
      "Automação clínica, IA e operação da prática em uma plataforma única.",
    ),
    primaryCtaLabel: getCtaLabel(primaryCtaCandidate, "Começar Teste Grátis"),
    primaryCtaHref: getCtaHref(primaryCtaCandidate, "/pricing"),
    secondaryCtaLabel: getCtaLabel(secondaryCtaCandidate, "Descobrir Planos"),
    secondaryCtaHref: getCtaHref(secondaryCtaCandidate, "/pricing"),
    blocks: blocks.length > 0 ? blocks : defaultLandingBlocks,
  };
}

export function mapPricingContent(section: PublicContentItem | null) {
  const payload = asObject(section?.payload);
  const faq = asRecordArray(payload.faq);
  return {
    title: asString(payload.title, "O investimento na sua excelência clínica"),
    subtitle: asString(
      payload.subtitle,
      "Escolha o plano para operar sua clínica com previsibilidade e qualidade.",
    ),
    faq: (faq.length > 0 ? faq : defaultPricingFaq).map((item, index) => ({
      id: `faq-${index}`,
      q: asString(item.q, "Pergunta frequente"),
      a: asString(item.a, "Resposta em atualização"),
    })),
  };
}

export function mapCheckoutContent(section: PublicContentItem | null) {
  const payload = asObject(section?.payload);
  const badges = asStringArray(payload.trustBadges);
  return {
    title: asString(payload.title, "Checkout seguro"),
    subtitle: asString(payload.subtitle, "Finalize seu agendamento com segurança."),
    trustBadges: badges.length > 0 ? badges : ["LGPD", "Criptografado", "Pagamento Seguro"],
  };
}

export function mapBookingContent(section: PublicContentItem | null) {
  const payload = asObject(section?.payload);
  return {
    title: asString(payload.title, "Agendamento público"),
    subtitle: asString(payload.subtitle, "Escolha o melhor horário para sua sessão."),
    footerNote: asString(payload.footerNote, "Seus dados são protegidos por criptografia e LGPD."),
    stepSelectLabel: asString(payload.stepSelectLabel, "Horário"),
    stepFormLabel: asString(payload.stepFormLabel, "Dados"),
    stepCheckoutLabel: asString(payload.stepCheckoutLabel, "Pagamento"),
    noSlotsLabel: asString(payload.noSlotsLabel, "Nenhum horário disponível nos próximos dias."),
    formTitle: asString(payload.formTitle, "Seus dados para confirmação"),
    submitLabel: asString(payload.submitLabel, "Confirmar e ir para pagamento"),
    processingTitle: asString(payload.processingTitle, "Preparando checkout seguro"),
    processingSubtitle: asString(
      payload.processingSubtitle,
      "Aguarde alguns segundos enquanto redirecionamos você.",
    ),
    formValidationError: asString(
      payload.formValidationError,
      "Preencha nome e email válidos para continuar.",
    ),
    invalidCpfError: asString(payload.invalidCpfError, "CPF inválido."),
    checkoutError: asString(payload.checkoutError, "Não foi possível iniciar checkout."),
  };
}

export function mapBookingSuccessContent(section: PublicContentItem | null) {
  const payload = asObject(section?.payload);
  return {
    title: asString(payload.title, "Agendamento confirmado"),
    subtitle: asString(payload.subtitle, "Sua sessão foi registrada com sucesso."),
    badge: asString(payload.badge, "Confirmação concluída"),
    nextStepsTitle: asString(payload.nextStepsTitle, "Próximos passos"),
    nextSteps: asStringArray(payload.nextSteps).length
      ? asStringArray(payload.nextSteps)
      : [
          "Verifique o email de confirmação.",
          "Salve o horário no seu calendário.",
          "Acesse o link da sessão no horário agendado.",
        ],
    detailsTitle: asString(payload.detailsTitle, "Detalhes do agendamento"),
    detailsDateLabel: asString(payload.detailsDateLabel, "Data"),
    detailsTimeLabel: asString(payload.detailsTimeLabel, "Hora"),
    detailsTherapistLabel: asString(payload.detailsTherapistLabel, "Terapeuta"),
    detailsAccessLabel: asString(payload.detailsAccessLabel, "Link de acesso"),
    detailsAccessValue: asString(payload.detailsAccessValue, "Enviado 1h antes da sessão"),
    primaryCtaLabel: asString(payload.primaryCtaLabel, "Ver meu Portal"),
    secondaryCtaLabel: asString(payload.secondaryCtaLabel, "Adicionar ao Calendário"),
    secondaryCtaUnavailableLabel: asString(
      payload.secondaryCtaUnavailableLabel,
      "Calendário disponível após confirmação de data",
    ),
    confirmationEmailPrefix: asString(
      payload.confirmationEmailPrefix,
      "Email de confirmação enviado para",
    ),
  };
}
