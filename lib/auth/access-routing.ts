import type { UserRole } from "@/lib/database.types";

export type ProtectedArea = "admin" | "dashboard" | "portal";

const ALLOWED_ROLE_SET = new Set<UserRole>(["master_admin", "therapist", "patient"]);

export function normalizeUserRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;
  return ALLOWED_ROLE_SET.has(value as UserRole) ? (value as UserRole) : null;
}

export function getDefaultHomeByRole(role: UserRole): string {
  if (role === "master_admin") return "/admin";
  if (role === "patient") return "/portal";
  return "/dashboard";
}

export function isSafeRelativePath(path: unknown): path is string {
  if (typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  return true;
}

export function getProtectedArea(path: string): ProtectedArea | null {
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/dashboard")) return "dashboard";
  if (path.startsWith("/portal")) return "portal";
  return null;
}

export function canRoleAccessPath(role: UserRole, path: string): boolean {
  const area = getProtectedArea(path);
  if (!area) return true;
  if (role === "master_admin") return area === "admin";
  if (role === "therapist") return area === "dashboard";
  return area === "portal";
}

export function resolvePostLoginDestination(role: UserRole, nextPath?: string | null): string {
  if (nextPath && isSafeRelativePath(nextPath) && canRoleAccessPath(role, nextPath)) {
    return nextPath;
  }
  return getDefaultHomeByRole(role);
}
