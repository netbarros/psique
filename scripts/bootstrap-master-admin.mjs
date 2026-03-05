#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

function readArg(flag) {
  const idx = process.argv.findIndex((arg) => arg === flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function randomPassword() {
  return `Psique!${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}Aa1`;
}

async function findUserByEmail(admin, email) {
  let page = 1;
  const perPage = 200;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users ?? [];
    const found = users.find((user) => String(user.email || "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < perPage) return null;
    page += 1;
  }

  return null;
}

async function ensureUser(admin, { userId, email, password, displayName }) {
  if (userId) {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user) {
      throw new Error(`User not found for user_id=${userId}`);
    }
    return data.user;
  }

  if (!email) {
    throw new Error("Provide --user-id or --email");
  }

  const existing = await findUserByEmail(admin, email);
  if (existing) return existing;

  const generatedPassword = password || randomPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: generatedPassword,
    email_confirm: true,
    user_metadata: {
      role: "master_admin",
      name: displayName || "Master Admin",
      source: "bootstrap-master-admin",
    },
  });

  if (error || !data?.user) {
    throw new Error(error?.message ?? "Unable to create master admin user");
  }

  console.log(
    `[bootstrap-master-admin] created user ${data.user.id} for ${email} (password: ${generatedPassword})`,
  );
  return data.user;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const userId = readArg("--user-id");
  const email = readArg("--email");
  const displayName = readArg("--display-name") || "Master Admin";
  const password = readArg("--password");

  const admin = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const user = await ensureUser(admin, { userId, email, password, displayName });

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
    throw new Error(`Failed to upsert user_roles: ${roleError.message}`);
  }

  const { error: profileError } = await admin
    .from("master_admin_profiles")
    .upsert(
      {
        user_id: user.id,
        display_name: displayName,
        status: "active",
      },
      { onConflict: "user_id" },
    );

  if (profileError) {
    throw new Error(`Failed to upsert master_admin_profiles: ${profileError.message}`);
  }

  console.log(
    `[bootstrap-master-admin] success: user_id=${user.id}, email=${user.email ?? "n/a"}, role=master_admin`,
  );
}

main().catch((error) => {
  console.error(`[bootstrap-master-admin] failed: ${String(error)}`);
  process.exit(1);
});
