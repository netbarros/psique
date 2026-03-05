import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clamp,
  cn,
  formatBRL,
  formatCPF,
  formatDate,
  formatDateTime,
  formatDelta,
  formatRelative,
  formatTime,
  initials,
  sleep,
  slugify,
  truncate,
  validateCPF,
  validateCRP,
} from "@/lib/utils";

describe("lib/utils", () => {
  it("validates CPF values", () => {
    expect(validateCPF("390.533.447-05")).toBe(true);
    expect(validateCPF("39053344705")).toBe(true);
    expect(validateCPF("111.111.111-11")).toBe(false);
    expect(validateCPF("123")).toBe(false);
  });

  it("formats BRL and CPF", () => {
    expect(formatBRL(297)).toBe("R$\u00A0297,00");
    expect(formatCPF("39053344705")).toBe("390.533.447-05");
  });

  it("creates stable slug", () => {
    expect(slugify("Clínica São José 2026!")).toBe("clinica-sao-jose-2026");
  });

  it("formats date and time helpers", () => {
    const date = new Date(2026, 2, 4, 14, 30);
    expect(formatDate(date)).toBe("04/03/2026");
    expect(formatTime(date)).toBe("14:30");
    expect(formatDateTime(date)).toBe("04/03/2026 às 14:30");
  });

  it("formats relative time with frozen clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 5, 12, 0, 0));

    const relative = formatRelative(new Date(2026, 2, 5, 11, 0, 0));
    expect(relative).toContain("há");
  });

  it("validates CRP and initials", () => {
    expect(validateCRP("12/12345")).toBe(true);
    expect(validateCRP("12/123456")).toBe(true);
    expect(validateCRP("12-12345")).toBe(false);
    expect(initials("Ana")).toBe("AN");
    expect(initials("Ana Maria")).toBe("AM");
  });

  it("handles helpers for classnames, truncate, clamp and delta", async () => {
    expect(cn("px-2", false && "hidden", "px-4")).toBe("px-4");
    expect(truncate("abc", 10)).toBe("abc");
    expect(truncate("abcdefghij", 6)).toBe("abc...");
    expect(clamp(1, 2, 5)).toBe(2);
    expect(clamp(10, 2, 5)).toBe(5);
    expect(clamp(3, 2, 5)).toBe(3);
    expect(formatDelta(1.2)).toBe("+1.2%");
    expect(formatDelta(-3, " pts")).toBe("-3.0 pts");

    vi.useFakeTimers();
    const sleeping = sleep(50);
    await vi.advanceTimersByTimeAsync(50);
    await sleeping;
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
