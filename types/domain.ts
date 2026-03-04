// Domain types for PSIQUE — used throughout the application

export interface TherapistProfile {
  id: string;
  userId: string;
  name: string;
  crp: string;
  bio?: string;
  photoUrl?: string;
  slug: string;
  specialties: string[];
  sessionPrice: number;
  sessionDuration: number;
  timezone: string;
  aiModel: string;
  telegramBotUsername?: string;
  onboardingCompleted: boolean;
  active: boolean;
}

export interface PatientSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  telegramChatId?: number;
  telegramUsername?: string;
  tags: string[];
  status: "lead" | "new" | "active" | "inactive" | "archived";
  moodScore?: number;
  gdprConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentWithRelations {
  id: string;
  therapistId: string;
  patient: PatientSummary;
  scheduledAt: string;
  durationMinutes: number;
  type: "online" | "presencial" | "hybrid";
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  videoRoomUrl?: string;
  patientAccessToken?: string;
  paymentStatus: "pending" | "paid" | "refunded" | "exempt" | "free";
  priceCharged?: number;
  reminder24hSent: boolean;
  reminder1hSent: boolean;
  npsSent: boolean;
  createdAt: string;
}

export interface SessionSummaryResult {
  summary: string;
  insights: string[];
  nextSteps: string[];
  moodAnalysis: string;
  riskFlags: string[];
}

export interface SessionWithSummary {
  id: string;
  appointmentId: string;
  therapistId: string;
  patientId: string;
  sessionNumber: number;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  therapistNotes?: string;
  aiSummary?: string;
  aiInsights?: string[];
  aiNextSteps?: string[];
  aiRiskFlags?: string[];
  transcript?: string;
  moodBefore?: number;
  moodAfter?: number;
  npsScore?: number;
  isSigned: boolean;
  signedAt?: string;
  createdAt: string;
}

export interface TelegramAutomations {
  reminder24h: boolean;
  reminder1h: boolean;
  postSessionBilling: boolean;
  npsCollection: boolean;
  leadNurture: boolean;
  reengagement: boolean;
}

export interface DashboardKPIs {
  mrr: number;
  mrrDelta: number;
  sessionsThisMonth: number;
  sessionsDelta: number;
  activePatients: number;
  patientsDelta: number;
  npsAverage: number;
  npsDelta: number;
  attendanceRate: number;
  attendanceDelta: number;
  openLeads: number;
  leadsDelta: number;
  conversionRate: number;
  conversionDelta: number;
  cancellationRate: number;
  cancellationDelta: number;
}

export type AIModel =
  | "anthropic/claude-3.5-sonnet"
  | "openai/gpt-4o"
  | "google/gemini-pro-1.5"
  | "anthropic/claude-3-haiku"
  | "meta-llama/llama-3.1-70b-instruct:free"
  | "mistralai/mistral-large";

export const AI_MODELS: { id: AIModel; label: string; tier: string; ctx: string }[] = [
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", tier: "top", ctx: "200k" },
  { id: "openai/gpt-4o", label: "GPT-4o", tier: "top", ctx: "128k" },
  { id: "google/gemini-pro-1.5", label: "Gemini 1.5 Pro", tier: "top", ctx: "1M" },
  { id: "anthropic/claude-3-haiku", label: "Claude 3 Haiku (Fast)", tier: "fast", ctx: "200k" },
  { id: "meta-llama/llama-3.1-70b-instruct:free", label: "Llama 3.1 70B (Free)", tier: "free", ctx: "128k" },
  { id: "mistralai/mistral-large", label: "Mistral Large", tier: "mid", ctx: "32k" },
];
