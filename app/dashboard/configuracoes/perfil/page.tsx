import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import SettingsTabs from "@/components/dashboard/SettingsTabs";
import { ProfileSettingsForm } from "@/components/dashboard/ProfileSettingsForm";

export const metadata: Metadata = { title: "Configurações — Perfil" };

export default async function PerfilSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, name, crp, bio, slug, session_price, session_duration, timezone, photo_url, updated_at")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    redirect("/auth/login");
  }

  const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/booking/${therapist.slug}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-text-primary sm:text-4xl">
          Configurações de perfil
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Atualize presença pública, identidade profissional e vínculo do booking.
        </p>
      </header>

      <SettingsTabs active="perfil" />

      <ProfileSettingsForm
        initial={{
          name: therapist.name,
          crp: therapist.crp,
          bio: therapist.bio,
          slug: therapist.slug,
          sessionPrice: Number(therapist.session_price),
          sessionDuration: therapist.session_duration,
          timezone: therapist.timezone,
          photoUrl: therapist.photo_url,
          updatedAt: therapist.updated_at,
        }}
        bookingLink={bookingLink}
      />
    </div>
  );
}
