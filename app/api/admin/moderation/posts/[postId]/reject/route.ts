import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertAdminAuditEvent } from "@/lib/admin/audit";

const rejectSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    return auth.response;
  }

  const parsed = rejectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 422 });
  }

  const { postId } = await params;
  const admin = createAdminClient();

  const nowIso = new Date().toISOString();

  const { data, error } = await admin
    .from("therapist_public_posts")
    .update({
      status: "rejected",
      moderation_notes: parsed.data.reason,
      reviewed_by: auth.context.user.id,
      reviewed_at: nowIso,
      published_at: null,
    })
    .eq("id", postId)
    .select("id, therapist_id, status, moderation_flags, moderation_notes, reviewed_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to reject post" }, { status: 500 });
  }

  await insertAdminAuditEvent(auth.context.supabase, {
    actorUserId: auth.context.user.id,
    action: "public_post_rejected",
    resourceType: "therapist_public_posts",
    resourceId: postId,
    diff: {
      status: "rejected",
      reason: parsed.data.reason,
    },
  });

  return NextResponse.json({ success: true, data });
}
