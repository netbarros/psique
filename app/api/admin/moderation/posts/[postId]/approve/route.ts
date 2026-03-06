import { NextResponse } from "next/server";
import { requireMasterAdminContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { insertAdminAuditEvent } from "@/lib/admin/audit";

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(_: Request, { params }: RouteContext) {
  const auth = await requireMasterAdminContext();
  if (!auth.context) {
    return auth.response;
  }

  const { postId } = await params;
  const admin = createAdminClient();

  const nowIso = new Date().toISOString();

  const { data, error } = await admin
    .from("therapist_public_posts")
    .update({
      status: "published",
      moderation_notes: "Approved by admin moderation flow.",
      reviewed_by: auth.context.user.id,
      reviewed_at: nowIso,
      published_at: nowIso,
    })
    .eq("id", postId)
    .select("id, therapist_id, status, moderation_flags, moderation_notes, reviewed_at, published_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to approve post" }, { status: 500 });
  }

  await insertAdminAuditEvent(auth.context.supabase, {
    actorUserId: auth.context.user.id,
    action: "public_post_approved",
    resourceType: "therapist_public_posts",
    resourceId: postId,
    diff: {
      status: "published",
      reviewedAt: nowIso,
    },
  });

  return NextResponse.json({ success: true, data });
}
