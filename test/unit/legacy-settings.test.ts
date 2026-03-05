import { describe, expect, it } from "vitest";
import {
  formatLegacySunsetDate,
  migrationPathFromApi,
  parseLegacyWriteDisabledPayload,
} from "@/lib/frontend/legacy-settings";

describe("lib/frontend/legacy-settings", () => {
  it("parses legacy write-disabled payload", () => {
    const parsed = parseLegacyWriteDisabledPayload({
      error: "Legacy endpoint is write-disabled after master_admin migration.",
      code: "LEGACY_ENDPOINT_WRITE_DISABLED",
      migrateTo: "/api/admin/content",
      sunsetDate: "2026-04-30",
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.code).toBe("LEGACY_ENDPOINT_WRITE_DISABLED");
    expect(parsed?.migrateTo).toBe("/api/admin/content");
  });

  it("returns null for non-legacy payloads", () => {
    expect(parseLegacyWriteDisabledPayload({ error: "bad", code: "BAD_REQUEST" })).toBeNull();
    expect(parseLegacyWriteDisabledPayload(null)).toBeNull();
  });

  it("maps admin API targets to admin pages", () => {
    expect(migrationPathFromApi("/api/admin/plans/drafts")).toBe("/admin/plans");
    expect(migrationPathFromApi("/api/admin/content")).toBe("/admin/content");
    expect(migrationPathFromApi("/api/admin/integrations/stripe")).toBe("/admin/integrations");
    expect(migrationPathFromApi("/api/admin/audit/events")).toBe("/admin/audit");
    expect(migrationPathFromApi("/api/admin/unknown")).toBe("/admin");
  });

  it("formats the sunset date to pt-BR", () => {
    const value = formatLegacySunsetDate("2026-04-30");
    expect(value).toContain("2026");
    expect(formatLegacySunsetDate("invalid-date")).toBe("invalid-date");
  });
});
