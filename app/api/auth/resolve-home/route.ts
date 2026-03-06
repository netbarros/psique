import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { normalizeUserRole, resolvePostLoginDestination, isSafeRelativePath } from "@/lib/auth/access-routing";
import type { UserRole } from "@/lib/database.types";

type ResolveHomeRequest = {
  next?: unknown;
};

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

function makeTherapistSeedName(email?: string | null, fullName?: string | null): string {
  if (fullName && fullName.trim().length > 0) return fullName.trim();
  if (email && email.includes("@")) return email.split("@")[0] ?? "Terapeuta";
  return "Terapeuta";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsedBody: ResolveHomeRequest = {};
  try {
    parsedBody = (await request.json()) as ResolveHomeRequest;
  } catch {
    parsedBody = {};
  }

  const safeNext = isSafeRelativePath(parsedBody.next) ? parsedBody.next : null;
  let role = normalizeUserRole(user.user_metadata?.role);
  let onboardingRequired = false;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const roleFromTable = normalizeUserRole(roleRow?.role);
    if (roleFromTable) {
      role = roleFromTable;
    }

    if (!role && roleFromTable === null) {
      const therapistProbe = await admin
        .from("therapists")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      const patientProbe = await admin
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (therapistProbe.data?.id) role = "therapist";
      if (!role && patientProbe.data?.id) role = "patient";
    }

    const finalRole: UserRole = role ?? "therapist";

    await admin
      .from("user_roles")
      .upsert(
        {
          user_id: user.id,
          role: finalRole,
        },
        { onConflict: "user_id" },
      );

    role = finalRole;

    if (role === "therapist") {
      const { data: therapist } = await admin
        .from("therapists")
        .select("id, onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!therapist) {
        const displayName =
          (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ??
          (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null);
        const seedName = makeTherapistSeedName(user.email, displayName);
        const slugBase = slugify(seedName) || "terapeuta";

        await admin.from("therapists").insert({
          user_id: user.id,
          name: seedName,
          crp: "00/00000",
          slug: `${slugBase}-${randomSuffix()}`,
        });

        onboardingRequired = true;
      } else {
        onboardingRequired = !therapist.onboarding_completed;
      }
    }

    if (role === "patient" && user.email) {
      const { data: patientByUser } = await admin
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!patientByUser) {
        const { data: patientByEmail } = await admin
          .from("patients")
          .select("id")
          .eq("email", user.email)
          .is("user_id", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (patientByEmail) {
          await admin
            .from("patients")
            .update({
              user_id: user.id,
              name:
                (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ??
                (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ??
                undefined,
            })
            .eq("id", patientByEmail.id);
        }
      }
    }
  }

  if (!role) {
    return NextResponse.json(
      { error: "ROLE_NOT_FOUND", code: "ROLE_NOT_FOUND" },
      { status: 409 },
    );
  }

  const destination =
    role === "therapist" && onboardingRequired
      ? "/dashboard/onboarding"
      : resolvePostLoginDestination(role, safeNext);

  return NextResponse.json({
    success: true,
    data: {
      role,
      destination,
      onboardingRequired,
      usedNext: Boolean(safeNext && destination === safeNext),
    },
  });
}
