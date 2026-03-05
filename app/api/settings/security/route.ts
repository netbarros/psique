import { legacyWriteConflict } from "@/lib/admin/http";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";

export async function PATCH(request: Request) {
  void request;
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    return auth.response;
  }

  return legacyWriteConflict("/api/admin/content");
}
