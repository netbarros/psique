import OpenAI from "openai";
import type { SessionSummaryResult } from "@/types/domain";
import { logger } from "@/lib/logger";

export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://psique.app",
    "X-Title": "Psique — Plataforma Terapêutica",
  },
});

export const CLINICAL_SYSTEM_PROMPT = `
Você é um assistente clínico especializado em psicanálise e psicoterapia.

DIRETRIZES ÉTICAS OBRIGATÓRIAS:
- Mantenha absoluta confidencialidade
- Não faça diagnósticos definitivos
- Use linguagem clínica profissional em português brasileiro
- Base análises exclusivamente no material fornecido, sem especulação
- Sempre sugira que material relevante seja explorado em sessão
- Nunca reproduza dados identificáveis do paciente
- Em casos de risco, sinalize de forma clara mas sem alarmismo
`.trim();

export async function generateSessionSummary(params: {
  notes: string;
  patientName: string;
  sessionNumber: number;
  previousSummaries?: string[];
  model?: string;
}): Promise<SessionSummaryResult> {
  const model = params.model ?? "anthropic/claude-3.5-sonnet";

  logger.info("[OpenRouter] Generating session summary", {
    sessionNumber: params.sessionNumber,
    model,
  });

  const response = await openrouter.chat.completions.create({
    model,
    messages: [
      { role: "system", content: CLINICAL_SYSTEM_PROMPT },
      {
        role: "user",
        content: `
Sessão #${params.sessionNumber} — Paciente: ${params.patientName}
${
  params.previousSummaries?.length
    ? `Contexto anterior: ${params.previousSummaries.slice(-3).join(" | ")}`
    : ""
}

NOTAS DA SESSÃO:
${params.notes}

Gere um JSON com:
{
  "summary": "resumo clínico em 3-5 frases",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "nextSteps": ["próximo passo 1", "próximo passo 2"],
  "moodAnalysis": "análise do estado emocional predominante",
  "riskFlags": ["flag 1 se houver"]
}
        `.trim(),
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 800,
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("[OpenRouter] Empty response from model");

  return JSON.parse(content) as SessionSummaryResult;
}

export async function generatePatientInsights(params: {
  patients: Array<{
    name: string;
    sessions: number;
    tags: string[];
    moodScore?: number;
    recentSummaries: string[];
  }>;
  model?: string;
}): Promise<{ insights: string[]; recommendations: string[]; alerts: string[] }> {
  const model = params.model ?? "anthropic/claude-3.5-sonnet";

  logger.info("[OpenRouter] Generating patient insights", { model });

  const patientsText = params.patients
    .map(
      (p) =>
        `- ${p.name}: ${p.sessions} sessões, tags: [${p.tags.join(", ")}], humor: ${p.moodScore ?? "N/A"}/100\n  Resumos recentes: ${p.recentSummaries.slice(-2).join(" | ")}`
    )
    .join("\n");

  const response = await openrouter.chat.completions.create({
    model,
    messages: [
      { role: "system", content: CLINICAL_SYSTEM_PROMPT },
      {
        role: "user",
        content: `
Analise a carteira de pacientes abaixo e gere insights estratégicos para o terapeuta.

CARTEIRA:
${patientsText}

Retorne um JSON com:
{
  "insights": ["insight 1 sobre a carteira", "insight 2"],
  "recommendations": ["recomendação prática 1", "recomendação 2"],
  "alerts": ["alerta urgente se houver"]
}
        `.trim(),
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 600,
    temperature: 0.4,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("[OpenRouter] Empty response");

  return JSON.parse(content);
}

export async function chatWithContext(params: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  patientContext?: string;
  model?: string;
}): Promise<string> {
  const model = params.model ?? "anthropic/claude-3-haiku";

  const systemPrompt = params.patientContext
    ? `${CLINICAL_SYSTEM_PROMPT}\n\nCONTEXTO DO PACIENTE:\n${params.patientContext}`
    : CLINICAL_SYSTEM_PROMPT;

  const response = await openrouter.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...params.messages,
    ],
    max_tokens: 400,
    temperature: 0.5,
  });

  return response.choices[0].message.content ?? "";
}
