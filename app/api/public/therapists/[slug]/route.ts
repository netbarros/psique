import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const route = "/api/public/therapists/[slug]";
  const { slug } = await params;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("therapists")
    .select(
      "id, name, slug, crp, bio, photo_url, specialties, session_price, session_duration, timezone, therapist_public_profiles!inner(display_name, profile_photo_url, short_bio, long_bio, city, state, therapeutic_approaches, modality_online, modality_presential, availability_summary, trust_indicators, opt_in_directory, profile_published)",
    )
    .eq("slug", slug)
    .eq("active", true)
    .eq("therapist_public_profiles.opt_in_directory", true)
    .eq("therapist_public_profiles.profile_published", true)
    .maybeSingle();

  if (error) {
    logger.error("[Public/TherapistProfile] Failed to load therapist", {
      route,
      slug,
      error: String(error),
    });
    return NextResponse.json({ error: "Failed to load therapist profile" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
  }

  const profileSource = (data as { therapist_public_profiles?: unknown }).therapist_public_profiles;
  const profile = (Array.isArray(profileSource) ? profileSource[0] : profileSource ?? {}) as Record<
    string,
    unknown
  >;

  return NextResponse.json({
    success: true,
    data: {
      id: data.id,
      slug: data.slug,
      name: (profile.display_name as string | undefined) ?? data.name,
      crp: data.crp,
      photoUrl: (profile.profile_photo_url as string | undefined) ?? data.photo_url,
      shortBio: (profile.short_bio as string | undefined) ?? data.bio,
      longBio: (profile.long_bio as string | undefined) ?? data.bio,
      specialties: data.specialties ?? [],
      approaches: (profile.therapeutic_approaches as string[] | undefined) ?? [],
      city: (profile.city as string | undefined) ?? null,
      state: (profile.state as string | undefined) ?? null,
      modality: {
        online: Boolean(profile.modality_online),
        presencial: Boolean(profile.modality_presential),
      },
      availabilitySummary: (profile.availability_summary as string | undefined) ?? null,
      trustIndicators: (profile.trust_indicators as string[] | undefined) ?? [],
      sessionPrice: data.session_price,
      sessionDuration: data.session_duration,
      timezone: data.timezone,
      bookingUrl: `/booking/${data.slug}`,
      postsUrl: `/api/public/therapists/${data.slug}/posts`,
    },
  });
}
