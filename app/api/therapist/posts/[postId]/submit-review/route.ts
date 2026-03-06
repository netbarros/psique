import { NextResponse } from "next/server";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";
import { getTherapistIdByUserId } from "@/lib/growth/wallet";
import { sanitizePublicMarkdown, moderateSanitizedContent } from "@/lib/content/sanitize";

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(_: Request, { params }: RouteContext) {
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    return auth.response;
  }

  const { postId } = await params;

  try {
    const therapistId = await getTherapistIdByUserId(auth.context.supabase, auth.context.user.id);

    const { data: post, error: postError } = await auth.context.supabase
      .from("therapist_public_posts")
      .select("id, therapist_id, content_markdown")
      .eq("id", postId)
      .eq("therapist_id", therapistId)
      .maybeSingle();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const sanitized = sanitizePublicMarkdown(post.content_markdown);
    const moderation = moderateSanitizedContent(sanitized);

    const nextStatus = moderation.requiresManualReview ? "pending_review" : "published";

    const { data: updated, error: updateError } = await auth.context.supabase
      .from("therapist_public_posts")
      .update({
        content_sanitized: sanitized,
        status: nextStatus,
        moderation_flags: moderation.flags,
        moderation_notes: moderation.requiresManualReview
          ? "Auto checks flagged this content for admin moderation."
          : "Auto checks passed.",
        published_at: moderation.requiresManualReview ? null : new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("therapist_id", therapistId)
      .select("id, status, moderation_flags, moderation_notes, published_at, updated_at")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "Failed to submit post for review" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        post: updated,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
