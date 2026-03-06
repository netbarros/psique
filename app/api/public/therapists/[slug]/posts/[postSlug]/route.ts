import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

type RouteContext = {
  params: Promise<{
    slug: string;
    postSlug: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const route = "/api/public/therapists/[slug]/posts/[postSlug]";
  const { slug, postSlug } = await params;

  const admin = createAdminClient();
  const { data: therapist, error: therapistError } = await admin
    .from("therapists")
    .select("id, slug")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (therapistError) {
    logger.error("[Public/TherapistPost] Failed to resolve therapist", {
      route,
      slug,
      error: String(therapistError),
    });
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }

  if (!therapist?.id) {
    return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("therapist_public_posts")
    .select(
      "id, slug, title, excerpt, content_sanitized, status, moderation_flags, moderation_notes, published_at, updated_at",
    )
    .eq("therapist_id", therapist.id)
    .eq("slug", postSlug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    logger.error("[Public/TherapistPost] Failed to fetch post", {
      route,
      therapistId: therapist.id,
      postSlug,
      error: String(error),
    });
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: data.id,
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      content: data.content_sanitized,
      moderation: {
        reviewed: true,
        flags: data.moderation_flags ?? [],
        notes: data.moderation_notes,
      },
      publishedAt: data.published_at,
      updatedAt: data.updated_at,
    },
  });
}
