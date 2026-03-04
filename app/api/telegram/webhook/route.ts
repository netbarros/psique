import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage, inlineKeyboard, buildNPSMessage, buildNPSKeyboard, answerCallbackQuery } from "@/lib/telegram";
import { chatWithContext } from "@/lib/openrouter";
import { logger } from "@/lib/logger";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number; type: string };
  text?: string;
  date: number;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export async function POST(req: NextRequest) {
  // 1. Validate secret token
  const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: TelegramUpdate = await req.json();
  const admin = createAdminClient();

  // 2. Idempotency — check if already processed
  const { data: exists } = await admin
    .from("telegram_updates")
    .select("update_id")
    .eq("update_id", update.update_id)
    .single();

  if (exists) return NextResponse.json({ ok: true });

  // 3. Register update
  await admin.from("telegram_updates").insert({ update_id: update.update_id });

  try {
    if (update.message) {
      await handleMessage(update.message, admin);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query, admin);
    }
  } catch (error) {
    logger.error("[Telegram] Handler error", { error: String(error), update_id: update.update_id });
    // Never throw so Telegram doesn't retry
  }

  return NextResponse.json({ ok: true });
}

type PatientRef = { id: string; name: string } | null;

async function findOrCreatePatient(from: TelegramUser, admin: ReturnType<typeof createAdminClient>): Promise<PatientRef> {
  const { data: existing } = await admin
    .from("patients")
    .select("id, name")
    .eq("telegram_chat_id", from.id)
    .single();

  return existing as PatientRef;
}

async function handleMessage(msg: TelegramMessage, admin: ReturnType<typeof createAdminClient>) {
  const text = msg.text ?? "";
  const chatId = msg.chat.id;

  if (!msg.from) return;

  const patient = await findOrCreatePatient(msg.from, admin);

  if (text.startsWith("/start")) return handleStart(chatId, patient);
  if (text.startsWith("/agendar")) return handleAgendar(chatId, patient);
  if (text.startsWith("/sessoes")) return handleSessoes(chatId, patient, admin);
  if (text.startsWith("/cancelar")) return handleCancelar(chatId, patient);
  if (text.startsWith("/pagar")) return handlePagar(chatId, patient, admin);
  if (text.startsWith("/ajuda")) return handleAjuda(chatId);
  if (text.startsWith("/falar")) {
    const query = text.replace("/falar", "").trim();
    return handleFalar(chatId, patient, query, admin);
  }

  // Free text → IA intent detection
  return handleFreeMessage(chatId, patient, text, admin);
}

async function handleCallbackQuery(query: TelegramCallbackQuery, admin: ReturnType<typeof createAdminClient>) {
  const data = query.data ?? "";
  const chatId = query.message?.chat.id ?? query.from.id;

  await answerCallbackQuery({ callbackQueryId: query.id });

  // NPS response: nps_3_<sessionId>
  if (data.startsWith("nps_")) {
    const [, score, sessionId] = data.split("_");
    await admin
      .from("sessions")
      .update({ nps_score: parseInt(score) })
      .eq("id", sessionId);

    await sendMessage({
      chatId,
      text: `⭐ Obrigado pela avaliação *${score}/5*! Seu feedback é muito importante. Até a próxima sessão.`,
    });
    return;
  }

  // Booking slot: book_slot_<appointmentId>
  if (data.startsWith("book_slot_")) {
    const appointmentId = data.replace("book_slot_", "");
    await sendMessage({
      chatId,
      text: `✅ Horário selecionado! Enviando link de pagamento...`,
    });
    // TODO: redirect to Stripe checkout
    logger.info("[Telegram] Slot selected", { appointmentId, chatId });
  }
}

async function handleStart(chatId: number, patient: PatientRef) {
  const name = patient?.name ?? "";
  await sendMessage({
    chatId,
    text: `Ψ *Bem-vindo ao Psique!*\n\n${name ? `Olá, ${name}! ` : ""}Sou o assistente da sua clínica terapêutica.\n\nUse os botões abaixo ou os comandos disponíveis:`,
    replyMarkup: inlineKeyboard([
      [{ text: "📅 Agendar Sessão", callback_data: "agendar" }],
      [{ text: "📋 Minhas Sessões", callback_data: "sessoes" }],
      [{ text: "💬 Falar com IA", callback_data: "falar" }],
      [{ text: "❓ Ajuda", callback_data: "ajuda" }],
    ]),
  });
}

async function handleAgendar(chatId: number, patient: PatientRef) {
  await sendMessage({
    chatId,
    text: `📅 *Agendar Sessão*\n\nPara agendar, acesse o link público da sua terapeuta. Você receberá o link em breve!\n\n_Ou entre em contato diretamente com o consultório._`,
  });
}

async function handleSessoes(chatId: number, patient: PatientRef, admin: ReturnType<typeof createAdminClient>) {
  if (!patient) {
    await sendMessage({ chatId, text: "Você ainda não está cadastrado. Contacte sua terapeuta." });
    return;
  }

  const { data: appointments } = await admin
    .from("appointments")
    .select("scheduled_at, status, type")
    .eq("patient_id", patient.id)
    .in("status", ["confirmed", "pending"])
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at")
    .limit(5);

  if (!appointments?.length) {
    await sendMessage({ chatId, text: "📋 Você não tem sessões agendadas. Use /agendar para marcar uma." });
    return;
  }

  const list = appointments
    .map((a) => {
      const date = new Date(a.scheduled_at).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
      const time = new Date(a.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return `• ${date} às ${time} — ${a.type === "online" ? "🎥 Online" : "🏢 Presencial"}`;
    })
    .join("\n");

  await sendMessage({ chatId, text: `📋 *Suas próximas sessões:*\n\n${list}` });
}

async function handleCancelar(chatId: number, patient: PatientRef) {
  await sendMessage({
    chatId,
    text: `❌ *Cancelar Sessão*\n\nPara cancelar uma sessão, entre em contato com sua terapeuta com pelo menos 24h de antecedência.\n\n_Cancelamentos sem aviso prévio podem incorrer em cobrança._`,
  });
}

async function handlePagar(chatId: number, patient: PatientRef, admin: ReturnType<typeof createAdminClient>) {
  if (!patient) {
    await sendMessage({ chatId, text: "Você ainda não está cadastrado." });
    return;
  }

  const { data: pending } = await admin
    .from("appointments")
    .select("id, scheduled_at, price_charged")
    .eq("patient_id", patient.id)
    .eq("payment_status", "pending")
    .limit(3);

  if (!pending?.length) {
    await sendMessage({ chatId, text: "✅ Você não tem sessões pendentes de pagamento." });
    return;
  }

  await sendMessage({
    chatId,
    text: `💳 *Sessões pendentes de pagamento:*\n\n_Acesse o painel ou entre em contato com sua terapeuta para regularizar._`,
  });
}

async function handleFalar(chatId: number, patient: PatientRef, query: string, admin: ReturnType<typeof createAdminClient>) {
  if (!query) {
    await sendMessage({ chatId, text: "💬 O que você gostaria de perguntar? Ex: /falar Como gerenciar ansiedade entre sessões?" });
    return;
  }

  await sendMessage({ chatId, text: "💭 _Processando..._" });

  try {
    const reply = await chatWithContext({
      messages: [{ role: "user", content: query }],
      model: "anthropic/claude-3-haiku",
    });

    await sendMessage({ chatId, text: reply });
  } catch {
    await sendMessage({ chatId, text: "Desculpe, não consegui processar sua mensagem no momento." });
  }
}

async function handleFreeMessage(chatId: number, patient: PatientRef, text: string, admin: ReturnType<typeof createAdminClient>) {
  // Detect intent
  const lower = text.toLowerCase();
  if (lower.includes("agendar") || lower.includes("marcar")) {
    return handleAgendar(chatId, patient);
  }
  if (lower.includes("cancelar")) {
    return handleCancelar(chatId, patient);
  }
  if (lower.includes("pagar") || lower.includes("pagamento")) {
    return handlePagar(chatId, patient, admin);
  }

  // Generic IA response
  return handleFalar(chatId, patient, text, admin);
}

async function handleAjuda(chatId: number) {
  await sendMessage({
    chatId,
    text: `ℹ️ *Comandos disponíveis:*\n\n/start — Início\n/agendar — Agendar sessão\n/sessoes — Ver próximas sessões\n/cancelar — Cancelar sessão\n/pagar — Sessões pendentes\n/falar — Chat com assistente IA\n/ajuda — Esta mensagem`,
  });
}
