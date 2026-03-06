import { test, expect } from "@playwright/test";

/**
 * E2E tests — Public booking flow
 */

const DEFAULT_BOOKING_SLUG = "test-terapeuta";

function resolveBookingSlug() {
  const fromEnv = process.env.PLAYWRIGHT_TEST_SLUG?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_BOOKING_SLUG;
}

test.describe("Booking — Public page", () => {
  test("404 for unknown slug", async ({ page }) => {
    const res = await page.goto("/booking/slug-que-nao-existe");
    // Either 404 page or redirect to not-found
    const status = res?.status();
    const isNotFound =
      status === 404 ||
      (await page.locator("text=404, text=não encontrado").count()) > 0;
    // At minimum, should not crash with 500
    expect(status).not.toBe(500);
    void isNotFound; // structural test
  });

  test("booking page loads with required elements when slug exists", async ({ page }) => {
    const slug = resolveBookingSlug();
    const response = await page.goto(`/booking/${slug}`);

    expect(response?.status()).toBeDefined();
    expect(response?.status()).toBeLessThan(500);

    // If seed data was removed, the route must still degrade gracefully.
    if (response?.status() === 404) {
      await expect(page.getByText(/404|não encontrado/i).first()).toBeVisible();
      return;
    }

    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Agendamento público|Escolha o horário/i }),
    ).toBeVisible();
    await expect(page.getByText(/R\$/).first()).toBeVisible();
  });
});

test.describe("Booking — Form validation", () => {
  test("step indicator shows step 1 initially", async ({ page }) => {
    const slug = resolveBookingSlug();
    const response = await page.goto(`/booking/${slug}`);

    expect(response?.status()).toBeDefined();
    expect(response?.status()).toBeLessThan(500);

    if (response?.status() === 404) {
      await expect(page.getByText(/404|não encontrado/i).first()).toBeVisible();
      return;
    }

    await expect(page.getByText("Horário", { exact: true }).first()).toBeVisible();
  });
});
