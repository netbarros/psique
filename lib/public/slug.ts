export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "booking",
  "checkout",
  "dashboard",
  "portal",
  "pricing",
  "terapeutas",
  "terapeuta",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function normalizePublicSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isReservedPublicSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(normalizePublicSlug(slug));
}
