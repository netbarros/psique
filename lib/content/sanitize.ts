const BLOCKED_TERMS = ["casino", "aposta", "adult", "hack", "pirata", "fraude"];

function stripDangerousHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>[\s\S]*?<\/embed>/gi, "")
    .replace(/<[^>]+>/g, "");
}

function normalizeMarkdownLinks(input: string): string {
  return input.replace(/\]\(([^)]+)\)/g, (full, rawHref: string) => {
    const href = String(rawHref || "").trim();
    const lowered = href.toLowerCase();
    if (!href) return "]( # )";
    if (lowered.startsWith("javascript:") || lowered.startsWith("data:")) {
      return "](#)";
    }
    return `](${href})`;
  });
}

export function sanitizePublicMarkdown(input: string): string {
  const cleaned = normalizeMarkdownLinks(stripDangerousHtml(input));
  return cleaned.replace(/\r\n/g, "\n").trim();
}

export function moderateSanitizedContent(input: string) {
  const normalized = input.toLowerCase();
  const flags: string[] = [];

  for (const term of BLOCKED_TERMS) {
    if (normalized.includes(term)) {
      flags.push(`blocked_term:${term}`);
    }
  }

  const links = (input.match(/https?:\/\//g) ?? []).length;
  if (links >= 6) {
    flags.push("high_link_density");
  }

  if (input.length > 20000) {
    flags.push("content_too_long");
  }

  return {
    flags,
    requiresManualReview: flags.length > 0,
  };
}
