const HASH_PATTERNS = [
  /^\$2[aby]\$\d{2}\$.+/i, // bcrypt
  /^sha(256|384|512):.+/i, // prefixed digest
  /^[a-f0-9]{64}$/i, // sha256 hex
  /^[a-f0-9]{96}$/i, // sha384 hex
  /^[a-f0-9]{128}$/i, // sha512 hex
];

export function sanitizeOpenRouterApiKeyCandidate(raw?: string | null): string | undefined {
  if (!raw) return undefined;

  const candidate = raw.trim();
  if (!candidate) return undefined;

  // Masked placeholders or hash digests are not usable provider secrets.
  if (candidate.includes("*")) return undefined;
  if (HASH_PATTERNS.some((pattern) => pattern.test(candidate))) return undefined;

  return candidate;
}

