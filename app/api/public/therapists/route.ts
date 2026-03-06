import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const route = "/api/public/therapists";
  const { searchParams } = new URL(request.url);

  const specialty = searchParams.get("specialty")?.trim();
  const approach = searchParams.get("approach")?.trim();
  const city = searchParams.get("city")?.trim();
  const modality = searchParams.get("modality")?.trim();
  const search = searchParams.get("q")?.trim();
  const limitParam = Number(searchParams.get("limit") ?? "24");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.trunc(limitParam), 1), 100) : 24;

  const admin = createAdminClient();

  let query = admin
    .from("therapists")
    .select(
      "id, name, slug, bio, photo_url, specialties, session_price, session_duration, therapist_public_profiles!inner(display_name, profile_photo_url, short_bio, city, state, therapeutic_approaches, modality_online, modality_presential, trust_indicators, opt_in_directory, profile_published)",
    )
    .eq("active", true)
    .eq("therapist_public_profiles.opt_in_directory", true)
    .eq("therapist_public_profiles.profile_published", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (specialty) {
    query = query.contains("specialties", [specialty]);
  }

  if (approach) {
    query = query.contains("therapist_public_profiles.therapeutic_approaches", [approach]);
  }

  if (city) {
    query = query.ilike("therapist_public_profiles.city", `%${city}%`);
  }

  if (modality === "online") {
    query = query.eq("therapist_public_profiles.modality_online", true);
  }

  if (modality === "presencial") {
    query = query.eq("therapist_public_profiles.modality_presential", true);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("[Public/Therapists] Failed to load directory", {
      route,
      error: String(error),
    });
    return NextResponse.json({ error: "Failed to load directory" }, { status: 500 });
  }

  const therapists = (data ?? []).map((row) => {
    const profileSource = (row as { therapist_public_profiles?: unknown }).therapist_public_profiles;
    const profile = (Array.isArray(profileSource) ? profileSource[0] : profileSource ?? {}) as Record<
      string,
      unknown
    >;

    return {
      id: row.id,
      name: (profile.display_name as string | undefined) ?? row.name,
      slug: row.slug,
      photoUrl: (profile.profile_photo_url as string | undefined) ?? row.photo_url,
      summary: (profile.short_bio as string | undefined) ?? row.bio ?? "",
      specialties: row.specialties ?? [],
      approaches: (profile.therapeutic_approaches as string[] | undefined) ?? [],
      city: (profile.city as string | undefined) ?? null,
      state: (profile.state as string | undefined) ?? null,
      modality: {
        online: Boolean(profile.modality_online),
        presencial: Boolean(profile.modality_presential),
      },
      trustIndicators: (profile.trust_indicators as string[] | undefined) ?? [],
      profileUrl: `/terapeuta/${row.slug}`,
      bookingUrl: `/booking/${row.slug}`,
    };
  });

  return NextResponse.json({
    success: true,
    data: therapists,
  });
}
