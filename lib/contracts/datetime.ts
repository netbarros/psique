import { z } from "zod";

function normalizeDatetimeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withTimeSeparator = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  return withTimeSeparator.replace(/([+-]\d{2})$/, "$1:00");
}

export const flexibleDatetimeSchema = z.string().trim().min(1).refine((value) => {
  const normalized = normalizeDatetimeInput(value);
  if (!normalized) return false;
  return !Number.isNaN(new Date(normalized).getTime());
}, "Invalid datetime");
