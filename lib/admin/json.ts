import type { Json } from "@/lib/database.types";

export function toDatabaseJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}
