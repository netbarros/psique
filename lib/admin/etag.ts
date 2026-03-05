export function generateEtag(): string {
  return crypto.randomUUID();
}
