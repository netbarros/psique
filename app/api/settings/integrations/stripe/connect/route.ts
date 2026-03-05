import { legacyWriteConflict } from "@/lib/admin/http";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  void request;
  const route = "/api/settings/integrations/stripe/connect";
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    logger.warn("[Legacy/Settings] Unauthorized stripe connect write attempt", { route });
    return auth.response;
  }

  logger.warn("[Legacy/Settings] Deprecated stripe connect write blocked", {
    route,
    userId: auth.context.user.id,
  });
  return legacyWriteConflict("/api/admin/integrations/stripe");
}
