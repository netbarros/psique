import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

export const MASTER_ADMIN_ROLE: UserRole = "master_admin";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type AuthenticatedContext = {
  supabase: SupabaseServerClient;
  user: {
    id: string;
    email: string | null;
  };
};

export async function getUserRole(supabase: SupabaseServerClient, userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logger.error("[Auth][Role] Failed to fetch user role", {
      userId,
      error: String(error),
    });
    return null;
  }

  return (data?.role as UserRole | undefined) ?? null;
}

export async function requireAuthenticatedContext(): Promise<
  | {
      context: AuthenticatedContext;
      response: null;
    }
  | {
      context: null;
      response: NextResponse;
    }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      context: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    context: {
      supabase,
      user: {
        id: user.id,
        email: user.email ?? null,
      },
    },
    response: null,
  };
}

export async function requireMasterAdminContext(): Promise<
  | {
      context: AuthenticatedContext;
      response: null;
    }
  | {
      context: null;
      response: NextResponse;
    }
> {
  const auth = await requireAuthenticatedContext();
  if (!auth.context) {
    return auth;
  }

  const role = await getUserRole(auth.context.supabase, auth.context.user.id);
  if (role !== MASTER_ADMIN_ROLE) {
    return {
      context: null,
      response: NextResponse.json({ error: "Forbidden", code: "MASTER_ADMIN_REQUIRED" }, { status: 403 }),
    };
  }

  return auth;
}
