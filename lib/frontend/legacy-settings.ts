export type LegacyWriteDisabledPayload = {
  error: string;
  code: "LEGACY_ENDPOINT_WRITE_DISABLED";
  migrateTo: string;
  sunsetDate: string;
};

export function parseLegacyWriteDisabledPayload(payload: unknown): LegacyWriteDisabledPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Partial<LegacyWriteDisabledPayload>;
  if (value.code !== "LEGACY_ENDPOINT_WRITE_DISABLED") {
    return null;
  }

  if (
    typeof value.error !== "string" ||
    typeof value.migrateTo !== "string" ||
    typeof value.sunsetDate !== "string"
  ) {
    return null;
  }

  return {
    error: value.error,
    code: value.code,
    migrateTo: value.migrateTo,
    sunsetDate: value.sunsetDate,
  };
}

export function migrationPathFromApi(migrateTo: string) {
  if (migrateTo.startsWith("/api/admin/plans")) {
    return "/admin/plans";
  }
  if (migrateTo.startsWith("/api/admin/content")) {
    return "/admin/content";
  }
  if (migrateTo.startsWith("/api/admin/integrations")) {
    return "/admin/integrations";
  }
  if (migrateTo.startsWith("/api/admin/audit")) {
    return "/admin/audit";
  }
  return "/admin";
}

export function formatLegacySunsetDate(dateValue: string) {
  const parsed = new Date(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
