import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type SupabaseEnv = {
  url: string;
  serviceRoleKey: string;
};

type AdminAuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type AdminAuthClient = {
  auth: {
    admin: {
      listUsers(input: { page: number; perPage: number }): Promise<{
        data?: { users?: AdminAuthUser[] };
        error?: { message?: string } | null;
      }>;
    };
  };
};

export type MasterAdminAuth = {
  email: string;
  password: string;
};

const DEFAULT_EMAIL = "e2e.master_admin@psique.local";
const DEFAULT_PASSWORD = "E2E_Psique_123!";

let cachedEnv: Record<string, string> | null = null;

function parseEnvLocalFile(): Record<string, string> {
  if (cachedEnv) return cachedEnv;
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    cachedEnv = {};
    return cachedEnv;
  }

  const parsed: Record<string, string> = {};
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }

  cachedEnv = parsed;
  return cachedEnv;
}

function resolveEnv(key: string): string | undefined {
  return process.env[key] ?? parseEnvLocalFile()[key];
}

function resolveSupabaseEnv(): SupabaseEnv | null {
  const url = resolveEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = resolveEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

function resolveMasterAdminAuth(): MasterAdminAuth {
  return {
    email: resolveEnv("E2E_MASTER_ADMIN_EMAIL") ?? DEFAULT_EMAIL,
    password: resolveEnv("E2E_MASTER_ADMIN_PASSWORD") ?? DEFAULT_PASSWORD,
  };
}

async function findUserByEmail(admin: AdminAuthClient, email: string) {
  let page = 1;
  const perPage = 200;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const found = users.find((user) => String(user.email ?? "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < perPage) return null;
    page += 1;
  }
  return null;
}

export function hasMasterAdminProvisioningEnv(): boolean {
  return resolveSupabaseEnv() !== null;
}

export async function ensureMasterAdminForE2E(): Promise<MasterAdminAuth> {
  const supabaseEnv = resolveSupabaseEnv();
  if (!supabaseEnv) {
    throw new Error("Missing Supabase env for master_admin provisioning");
  }

  const auth = resolveMasterAdminAuth();
  const admin = createClient(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let user = await findUserByEmail(admin, auth.email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: auth.email,
      password: auth.password,
      email_confirm: true,
      user_metadata: {
        role: "master_admin",
        source: "playwright-e2e",
      },
    });
    if (error || !data.user) {
      throw new Error(error?.message ?? "Unable to create master_admin user");
    }
    user = data.user;
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      password: auth.password,
      user_metadata: {
        ...(user.user_metadata ?? {}),
        role: "master_admin",
        source: "playwright-e2e",
      },
    });
    if (error) {
      throw new Error(`Unable to update master_admin user: ${error.message}`);
    }
  }

  const { error: roleError } = await admin
    .from("user_roles")
    .upsert(
      {
        user_id: user.id,
        role: "master_admin",
      },
      { onConflict: "user_id" },
    );
  if (roleError) {
    throw new Error(`Unable to upsert user_roles: ${roleError.message}`);
  }

  const { error: profileError } = await admin
    .from("master_admin_profiles")
    .upsert(
      {
        user_id: user.id,
        display_name: "E2E Master Admin",
        status: "active",
      },
      { onConflict: "user_id" },
    );
  if (profileError) {
    throw new Error(`Unable to upsert master_admin_profiles: ${profileError.message}`);
  }

  return auth;
}
