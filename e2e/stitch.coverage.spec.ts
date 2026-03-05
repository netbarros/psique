import { expect, test, type Page } from "@playwright/test";

type RouteCase = {
  id: string;
  route: string;
  heading: RegExp;
};

const publicScreens: RouteCase[] = [
  { id: "S11/S12", route: "/", heading: /A única plataforma que cuida de|Transforme agenda lotada em/i },
  {
    id: "S13",
    route: "/pricing",
    heading: /investimento na sua excelência clínica|Escolha o plano para operar sua clínica com previsibilidade/i,
  },
  { id: "S14", route: "/checkout/secure", heading: /Plano (Clínica Pro|Analista Solo)/i },
];

const protectedScreens = [
  { id: "S01", route: "/dashboard" },
  { id: "S03", route: "/dashboard/consulta/room-stitch-check" },
  { id: "S04", route: "/dashboard/pacientes/11111111-1111-1111-1111-111111111111" },
  { id: "S05", route: "/dashboard/ia" },
  { id: "S06", route: "/dashboard/financeiro" },
  { id: "S07", route: "/dashboard/telegram" },
  { id: "S08", route: "/dashboard/onboarding" },
  { id: "S09", route: "/dashboard/configuracoes" },
  { id: "S10", route: "/portal" },
  { id: "S10b", route: "/portal/apoio" },
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  expect(overflow).toBe(false);
}

function attachClientIssueCollectors(page: Page) {
  const issues: string[] = [];

  page.on("pageerror", (error) => {
    issues.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }
    const text = message.text();
    if (text.includes("Failed to load resource") && text.includes("net::ERR_CONNECTION_FAILED")) {
      return;
    }
    if (text.includes("Failed to load resource") && text.includes("404")) {
      return;
    }
    issues.push(`console.error: ${text}`);
  });

  return issues;
}

test.describe("Stitch Route Contract", () => {
  for (const routeCase of publicScreens) {
    test(`${routeCase.id} public route ${routeCase.route} renders with micro-gates`, async ({ page }) => {
      const issues = attachClientIssueCollectors(page);
      const response = await page.goto(routeCase.route);

      expect(response?.status()).toBeDefined();
      expect(response?.status()).toBeLessThan(500);

      await expect(page.getByRole("heading", { name: routeCase.heading }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      expect(issues, `critical client errors on ${routeCase.route}`).toEqual([]);
    });
  }

  test("S02 booking route responds without 5xx", async ({ page }) => {
    const issues = attachClientIssueCollectors(page);
    const response = await page.goto("/booking/test-terapeuta");
    expect(response?.status()).toBeDefined();
    expect(response?.status()).toBeLessThan(500);
    await expectNoHorizontalOverflow(page);
    expect(issues, "critical client errors on /booking/test-terapeuta").toEqual([]);
  });

  for (const routeCase of protectedScreens) {
    test(`${routeCase.id} protected route ${routeCase.route} redirects unauthenticated`, async ({ page }) => {
      const issues = attachClientIssueCollectors(page);
      const response = await page.goto(routeCase.route);

      expect(response?.status()).toBeDefined();
      expect(response?.status()).toBeLessThan(500);

      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(page.getByRole("heading", { name: /Acessar conta/i })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      expect(issues, `critical client errors on ${routeCase.route}`).toEqual([]);
    });
  }
});
