import { legacyWriteConflict } from "@/lib/admin/http";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";
import { logger } from "@/lib/logger";

export async function PATCH(request: Request) {
  void request;
  const route = "/api/settings/integrations";
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    logger.warn("[Legacy/Settings] Unauthorized integrations write attempt", { route });
    return auth.response;
  }

  logger.warn("[Legacy/Settings] Deprecated integrations write blocked", {
    route,
    userId: auth.context.user.id,
  });
  return legacyWriteConflict("/api/admin/integrations/:provider");
}
