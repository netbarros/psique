import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type ProvisionedTherapist = {
  email: string;
  password: string;
  userId: string;
  therapistId: string;
};

type SupabaseEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

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
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
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
  const anonKey = resolveEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = resolveEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !anonKey || !serviceRoleKey) {
    return null;
  }

  return { url, anonKey, serviceRoleKey };
}

export function hasProvisioningEnv(): boolean {
  return resolveSupabaseEnv() !== null;
}

export async function provisionTherapistForE2E(): Promise<ProvisionedTherapist> {
  const env = resolveSupabaseEnv();
  if (!env) {
    throw new Error("Missing Supabase env for authenticated E2E provisioning");
  }

  const admin = createClient(env.url, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e.master.${unique}@psique.local`;
  const password = `E2E!${unique}Aa1`;
  const slug = `e2e-master-${unique}`;
  const crp = `E2E-${unique.slice(-10).toUpperCase()}`;

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "therapist",
      source: "playwright-e2e",
    },
  });

  if (createUserError || !createdUser.user) {
    throw new Error(createUserError?.message ?? "Unable to create E2E user");
  }

  const userId = createdUser.user.id;

  const { data: therapist, error: therapistError } = await admin
    .from("therapists")
    .insert({
      user_id: userId,
      name: "E2E Master",
      crp,
      slug,
      onboarding_completed: true,
      active: true,
      session_price: 200,
      session_duration: 50,
      specialties: ["e2e"],
    })
    .select("id")
    .single();

  if (therapistError || !therapist?.id) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error(therapistError?.message ?? "Unable to create E2E therapist profile");
  }

  await admin
    .from("user_roles")
    .upsert(
      {
        user_id: userId,
        role: "therapist",
      },
      { onConflict: "user_id" },
    );

  return {
    email,
    password,
    userId,
    therapistId: therapist.id,
  };
}

export async function cleanupProvisionedTherapist(data: ProvisionedTherapist): Promise<void> {
  const env = resolveSupabaseEnv();
  if (!env) return;

  const admin = createClient(env.url, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await admin.auth.admin.deleteUser(data.userId);
}
