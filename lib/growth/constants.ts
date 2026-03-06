export const CREDIT_ACTION_KEYS = {
  aiSummary: "ai.summary",
  aiDeepAnalysis: "ai.deep_analysis",
  telegramAiReply: "telegram.ai_reply",
  videoExtraMinutes: "video.extra_minutes",
  transcriptionMinute: "transcription.minute",
} as const;

export const LEDGER_ENTRY_KINDS = [
  "credit",
  "debit",
  "expire",
  "reverse",
  "hold",
  "release",
] as const;

export type LedgerEntryKind = (typeof LEDGER_ENTRY_KINDS)[number];
export type CreditBucket = "paid" | "bonus";

export type GrowthRuleRow = {
  id: string;
  inviter_bonus_credits: number;
  invitee_bonus_credits: number;
  qualification_min_amount_brl: number;
  qualification_wait_days: number;
  max_rewards_per_month: number;
  max_rewards_per_therapist: number;
  bonus_expiration_days: number;
  anti_abuse_enabled: boolean;
  active: boolean;
};
