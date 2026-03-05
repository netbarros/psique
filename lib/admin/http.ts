import { NextResponse } from "next/server";
import type { z, ZodSchema } from "zod";

export function badRequest(message: string, code = "BAD_REQUEST") {
  return NextResponse.json({ error: message, code }, { status: 400 });
}

export function unprocessable(message: string, code = "UNPROCESSABLE_ENTITY") {
  return NextResponse.json({ error: message, code }, { status: 422 });
}

export function conflict(message: string, code = "CONFLICT") {
  return NextResponse.json({ error: message, code }, { status: 409 });
}

export async function parseJsonBody<TSchema extends ZodSchema>(request: Request, schema: TSchema) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      data: null,
      response: unprocessable(parsed.error.issues[0]?.message ?? "Invalid payload"),
    };
  }

  return {
    data: parsed.data as z.infer<TSchema>,
    response: null,
  };
}

export function readIfMatch(request: Request): string | null {
  const value = request.headers.get("if-match")?.trim();
  if (!value) return null;
  return value;
}

export function parsePositiveLimit(input: string | null, fallback = 20, max = 200): number {
  const value = Number(input ?? String(fallback));
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value), 1), max);
}

export function legacyWriteConflict(migrateTo: string) {
  return NextResponse.json(
    {
      error: "Legacy endpoint is write-disabled after master_admin migration.",
      code: "LEGACY_ENDPOINT_WRITE_DISABLED",
      migrateTo,
      sunsetDate: "2026-04-30",
    },
    { status: 409 },
  );
}
