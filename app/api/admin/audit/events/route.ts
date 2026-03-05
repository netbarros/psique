import { NextResponse } from "next/server";
import { parsePositiveLimit } from "@/lib/admin/http";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";

export async function GET(request: Request) {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const limit = parsePositiveLimit(searchParams.get("limit"), 50, 300);

  const { data, error } = await auth.context.supabase
    .from("admin_audit_events")
    .select("id, actor_user_id, action, resource_type, resource_id, diff_json, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Failed to load admin audit events" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data ?? [] });
}
