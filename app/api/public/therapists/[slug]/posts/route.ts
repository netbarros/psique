import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const route = "/api/public/therapists/[slug]/posts";
  const { slug } = await params;

  const admin = createAdminClient();
  const { data: therapist, error: therapistError } = await admin
    .from("therapists")
    .select("id, slug")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (therapistError) {
    logger.error("[Public/TherapistPosts] Failed to resolve therapist", {
      route,
      slug,
      error: String(therapistError),
    });
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }

  if (!therapist?.id) {
    return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("therapist_public_posts")
    .select("id, slug, title, excerpt, status, moderation_flags, published_at, updated_at")
    .eq("therapist_id", therapist.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("[Public/TherapistPosts] Failed to fetch posts", {
      route,
      therapistId: therapist.id,
      error: String(error),
    });
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      moderationFlags: post.moderation_flags ?? [],
      publishedAt: post.published_at,
      updatedAt: post.updated_at,
      url: `/terapeuta/${slug}/posts/${post.slug}`,
    })),
  });
}
