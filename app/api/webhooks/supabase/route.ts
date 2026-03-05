import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api/request-validation";

const payloadSchema = z.object({
  type: z.enum(["INSERT", "UPDATE", "DELETE"]),
  table: z.string().trim().min(1),
  schema: z.string().trim().min(1),
  record: z.record(z.string(), z.unknown()).optional(),
  old_record: z.record(z.string(), z.unknown()).optional(),
});

type SupabaseWebhookPayload = z.infer<typeof payloadSchema>;

function isAuthorized(request: NextRequest) {
  const configured = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!configured) {
    return true;
  }
  const incoming = request.headers.get("x-webhook-secret");
  return incoming === configured;
}

export async function POST(req: NextRequest) {
  const route = "/api/webhooks/supabase";
  if (!isAuthorized(req)) {
    logger.warn("[Supabase Webhook] Unauthorized webhook", { route });
    return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
  }

  const parsed = await parseJsonBody({
    route,
    request: req,
    schema: payloadSchema,
  });
  if (!parsed.ok) {
    return parsed.response;
  }
  const payload: SupabaseWebhookPayload = parsed.data;

  const admin = createAdminClient();

  try {
    if (payload.table === "appointments" && payload.type === "UPDATE") {
      const status = payload.record?.status as string | undefined;
      const appointmentId = payload.record?.id as string | undefined;
      const therapistId = payload.record?.therapist_id as string | undefined;
      const patientId = payload.record?.patient_id as string | undefined;

      if (
        status === "completed" &&
        appointmentId &&
        therapistId &&
        patientId
      ) {
        const { data: existing } = await admin
          .from("sessions")
          .select("id")
          .eq("appointment_id", appointmentId)
          .maybeSingle();

        if (!existing) {
          const { data: latest } = await admin
            .from("sessions")
            .select("session_number")
            .eq("patient_id", patientId)
            .order("session_number", { ascending: false })
            .limit(1)
            .maybeSingle();

          const nextSessionNumber = (latest?.session_number ?? 0) + 1;

          await admin.from("sessions").insert({
            appointment_id: appointmentId,
            therapist_id: therapistId,
            patient_id: patientId,
            session_number: nextSessionNumber,
          });

          logger.info("[Supabase Webhook] Session auto-created", {
            route,
            requestId: parsed.requestId,
            appointmentId,
            patientId,
            therapistId,
            sessionNumber: nextSessionNumber,
          });
        }
      }
    }

    if (payload.table === "patients" && payload.type === "INSERT") {
      logger.info("[Supabase Webhook] New patient inserted", {
        route,
        requestId: parsed.requestId,
        patientId: payload.record?.id,
        therapistId: payload.record?.therapist_id,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("[Supabase Webhook] Handler failure", {
      route,
      requestId: parsed.requestId,
      error: String(error),
      table: payload.table,
      type: payload.type,
    });
    return NextResponse.json({ error: "Handler failure" }, { status: 500 });
  }
}
