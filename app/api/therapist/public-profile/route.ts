import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedContext } from "@/lib/auth/master-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTherapistIdByUserId, WalletError } from "@/lib/growth/wallet";
import { isReservedPublicSlug, normalizePublicSlug } from "@/lib/public/slug";
import { logger } from "@/lib/logger";

const patchProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120).optional(),
  profilePhotoUrl: z.string().trim().url().nullable().optional(),
  shortBio: z.string().trim().max(280).optional(),
  longBio: z.string().trim().max(8000).optional(),
  specialties: z.array(z.string().trim().min(2).max(80)).max(20).optional(),
  therapeuticApproaches: z.array(z.string().trim().min(2).max(80)).max(20).optional(),
  city: z.string().trim().max(120).nullable().optional(),
  state: z.string().trim().max(120).nullable().optional(),
  modalityOnline: z.boolean().optional(),
  modalityPresential: z.boolean().optional(),
  availabilitySummary: z.string().trim().max(800).nullable().optional(),
  trustIndicators: z.array(z.string().trim().min(2).max(80)).max(12).optional(),
  optInDirectory: z.boolean().optional(),
  checklistCompleted: z.boolean().optional(),
  profilePublished: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const route = "/api/therapist/public-profile";
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = patchProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 422 });
  }

  const admin = createAdminClient();

  try {
    const therapistId = await getTherapistIdByUserId(auth.context.supabase, auth.context.user.id);

    const { data: therapistRow, error: therapistError } = await auth.context.supabase
      .from("therapists")
      .select("id, slug, name")
      .eq("id", therapistId)
      .single();

    if (therapistError || !therapistRow) {
      return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
    }

    const payload: Record<string, unknown> = {
      therapist_id: therapistId,
    };

    if (parsed.data.displayName !== undefined) payload.display_name = parsed.data.displayName;
    if (parsed.data.profilePhotoUrl !== undefined) payload.profile_photo_url = parsed.data.profilePhotoUrl;
    if (parsed.data.shortBio !== undefined) payload.short_bio = parsed.data.shortBio;
    if (parsed.data.longBio !== undefined) payload.long_bio = parsed.data.longBio;
    if (parsed.data.specialties !== undefined) payload.specialties = parsed.data.specialties;
    if (parsed.data.therapeuticApproaches !== undefined) {
      payload.therapeutic_approaches = parsed.data.therapeuticApproaches;
    }
    if (parsed.data.city !== undefined) payload.city = parsed.data.city;
    if (parsed.data.state !== undefined) payload.state = parsed.data.state;
    if (parsed.data.modalityOnline !== undefined) payload.modality_online = parsed.data.modalityOnline;
    if (parsed.data.modalityPresential !== undefined) payload.modality_presential = parsed.data.modalityPresential;
    if (parsed.data.availabilitySummary !== undefined) payload.availability_summary = parsed.data.availabilitySummary;
    if (parsed.data.trustIndicators !== undefined) payload.trust_indicators = parsed.data.trustIndicators;
    if (parsed.data.optInDirectory !== undefined) payload.opt_in_directory = parsed.data.optInDirectory;
    if (parsed.data.checklistCompleted !== undefined) payload.checklist_completed = parsed.data.checklistCompleted;
    if (parsed.data.profilePublished !== undefined) payload.profile_published = parsed.data.profilePublished;

    const { data: updatedProfile, error: profileError } = await admin
      .from("therapist_public_profiles")
      .upsert(payload, { onConflict: "therapist_id" })
      .select("*")
      .single();

    if (profileError || !updatedProfile) {
      logger.error("[Therapist/PublicProfile] Failed to upsert profile", {
        route,
        therapistId,
        error: String(profileError),
      });
      return NextResponse.json({ error: "Failed to update public profile" }, { status: 500 });
    }

    const shouldPublishSlug = Boolean(updatedProfile.opt_in_directory && updatedProfile.profile_published);
    const normalizedSlug = normalizePublicSlug(therapistRow.slug);

    if (shouldPublishSlug) {
      if (isReservedPublicSlug(normalizedSlug)) {
        return NextResponse.json(
          { error: "Therapist slug is reserved and cannot be published.", code: "RESERVED_SLUG" },
          { status: 409 },
        );
      }

      const { data: slugCollision } = await admin
        .from("public_slugs")
        .select("id, target_id")
        .eq("slug", normalizedSlug)
        .neq("target_id", therapistId)
        .maybeSingle();

      if (slugCollision?.id) {
        return NextResponse.json(
          { error: "Public slug already in use.", code: "SLUG_ALREADY_EXISTS" },
          { status: 409 },
        );
      }

      await admin.from("public_slugs").upsert(
        {
          slug: normalizedSlug,
          target_type: "therapist_profile",
          target_id: therapistId,
          canonical_path: `/terapeuta/${normalizedSlug}`,
          status: "active",
          is_reserved: false,
        },
        { onConflict: "slug" },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: updatedProfile,
        publicUrl: shouldPublishSlug ? `/terapeuta/${normalizedSlug}` : null,
      },
    });
  } catch (error) {
    if (error instanceof WalletError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    logger.error("[Therapist/PublicProfile] Unexpected error", {
      route,
      userId: auth.context.user.id,
      error: String(error),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
