import { logger } from "@/lib/logger";
import type { SupabaseServerClient } from "@/lib/auth/master-admin";
import type { Json } from "@/lib/database.types";

type AuditEventInput = {
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  diff?: Json | null;
};

export async function insertAdminAuditEvent(
  supabase: SupabaseServerClient,
  input: AuditEventInput,
): Promise<void> {
  const { error } = await supabase.from("admin_audit_events").insert({
    actor_user_id: input.actorUserId,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId,
    diff_json: input.diff ?? null,
  });

  if (error) {
    logger.error("[Admin][Audit] Failed to insert admin audit event", {
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      error: String(error),
    });
  }
}
