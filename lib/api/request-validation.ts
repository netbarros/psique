import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

export function getRequestId(request: Request): string | undefined {
  return (
    request.headers.get("x-request-id") ??
    request.headers.get("x-correlation-id") ??
    undefined
  );
}

type ValidationContext = {
  route: string;
  request: Request;
  context?: Record<string, unknown>;
};

type ParseResult<T> =
  | {
      ok: true;
      data: T;
      requestId?: string;
    }
  | {
      ok: false;
      response: NextResponse;
      requestId?: string;
    };

export async function parseJsonBody<TSchema extends z.ZodTypeAny>({
  route,
  request,
  schema,
  context,
  allowEmptyBody = false,
}: ValidationContext & {
  schema: TSchema;
  allowEmptyBody?: boolean;
}): Promise<ParseResult<z.infer<TSchema>>> {
  const requestId = getRequestId(request);

  let json: unknown;
  const rawBody = await request.text();
  if (rawBody.trim().length === 0 && allowEmptyBody) {
    json = {};
  } else if (rawBody.trim().length === 0) {
    logger.warn("[API] Empty JSON payload", {
      route,
      requestId,
      ...(context ?? {}),
    });
    return {
      ok: false,
      requestId,
      response: NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }),
    };
  } else {
    try {
      json = JSON.parse(rawBody);
    } catch (error) {
      logger.warn("[API] Invalid JSON payload", {
        route,
        requestId,
        error: String(error),
        ...(context ?? {}),
      });
      return {
        ok: false,
        requestId,
        response: NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }),
      };
    }
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    logger.warn("[API] Invalid payload", {
      route,
      requestId,
      issues,
      ...(context ?? {}),
    });
    return {
      ok: false,
      requestId,
      response: NextResponse.json({ error: "Invalid payload", details: issues }, { status: 400 }),
    };
  }

  return {
    ok: true,
    requestId,
    data: parsed.data,
  };
}
