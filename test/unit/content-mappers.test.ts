import { describe, expect, it } from "vitest";
import {
  getDefaultPublicPlans,
  mapBookingContent,
  mapBookingSuccessContent,
  mapCheckoutContent,
  mapLandingContent,
  mapPricingContent,
  mapPublicPlan,
} from "@/lib/frontend/content-mappers";
import type { PublicPlan } from "@/lib/contracts/public/plans";

describe("lib/frontend/content-mappers", () => {
  it("maps public plan payload with formatted amount", () => {
    const mapped = mapPublicPlan({
      id: "00000000-0000-0000-0000-000000000001",
      planKey: "solo",
      locale: "pt-BR",
      version: 1,
      etag: "etag",
      payload: {
        name: "Solo",
        description: "Plano individual",
        amountCents: 19900,
        interval: "month",
        currency: "BRL",
        ctaLabel: "Assinar",
        ctaHref: "/checkout/secure?plan=solo",
        features: ["A", "B"],
      },
      publishedAt: null,
    } as PublicPlan);

    expect(mapped.name).toBe("Solo");
    expect(mapped.amountFormatted).toContain("199,00");
    expect(mapped.features).toEqual(["A", "B"]);
  });

  it("returns deterministic fallbacks when section is missing", () => {
    const landing = mapLandingContent(null);
    expect(landing.title).toBe("A única plataforma que cuida de quem cuida.");
    expect(landing.blocks.length).toBeGreaterThan(0);
    expect(mapPricingContent(null).title).toBe("O investimento na sua excelência clínica");
    expect(mapCheckoutContent(null).title).toBe("Checkout seguro");
    expect(mapBookingContent(null).title).toBe("Agendamento público");
    expect(mapBookingSuccessContent(null).title).toBe("Agendamento confirmado");
  });

  it("maps content payload values when available", () => {
    const section = {
      id: "content-1",
      sectionKey: "main",
      version: 1,
      etag: "etag",
      publishedAt: null,
      payload: {
        heroTitle: "Hero",
        heroSubtitle: "Sub",
        primaryCta: { label: "A", href: "/a" },
        secondaryCta: { label: "B", href: "/b" },
        blocks: [{ title: "T", description: "D" }],
      },
    };

    const landing = mapLandingContent(section);
    expect(landing.title).toBe("Hero");
    expect(landing.primaryCtaLabel).toBe("A");
    expect(landing.blocks).toHaveLength(1);
  });

  it("maps landing payload in legacy title/subtitle/ctas shape", () => {
    const section = {
      id: "content-2",
      sectionKey: "main",
      version: 1,
      etag: "etag",
      publishedAt: null,
      payload: {
        title: "Landing legada",
        subtitle: "Sub legada",
        ctas: [
          { label: "CTA 1", href: "/cta-1" },
          { label: "CTA 2", href: "/cta-2" },
        ],
      },
    };

    const landing = mapLandingContent(section);
    expect(landing.title).toBe("Landing legada");
    expect(landing.subtitle).toBe("Sub legada");
    expect(landing.primaryCtaLabel).toBe("CTA 1");
    expect(landing.primaryCtaHref).toBe("/cta-1");
    expect(landing.secondaryCtaLabel).toBe("CTA 2");
    expect(landing.secondaryCtaHref).toBe("/cta-2");
  });

  it("returns default public plans when catalog is unavailable", () => {
    const defaults = getDefaultPublicPlans();
    expect(defaults.length).toBeGreaterThanOrEqual(2);
    expect(defaults.some((plan) => plan.planKey === "solo")).toBe(true);
    expect(defaults.some((plan) => plan.planKey === "pro")).toBe(true);
  });
});
