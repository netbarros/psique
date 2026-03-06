import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function PublicSlugResolverPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const normalizedSlug = slug.trim().toLowerCase();
  const admin = createAdminClient();

  const { data: slugRow } = await admin
    .from("public_slugs")
    .select("slug, target_type, target_id, canonical_path, status, is_reserved")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (slugRow?.status === "active" && slugRow.canonical_path) {
    redirect(slugRow.canonical_path);
  }

  if (slugRow?.is_reserved || slugRow?.status === "reserved") {
    notFound();
  }

  const { data: therapistFallback } = await admin
    .from("therapists")
    .select("slug, active")
    .eq("slug", normalizedSlug)
    .eq("active", true)
    .maybeSingle();

  if (therapistFallback?.slug) {
    redirect(`/terapeuta/${therapistFallback.slug}`);
  }

  notFound();
}
