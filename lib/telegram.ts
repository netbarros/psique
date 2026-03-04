import { logger } from "@/lib/logger";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export interface InlineKeyboardMarkup {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
}

export interface ReplyKeyboardMarkup {
  keyboard: Array<Array<{ text: string }>>;
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
}

export interface SendMessageParams {
  chatId: number | string;
  text: string;
  replyMarkup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
  parseMode?: "Markdown" | "HTML" | "MarkdownV2";
  disableWebPagePreview?: boolean;
}

async function telegramRequest(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!data.ok) {
    logger.error(`[Telegram] ${method} failed`, { error: data.description, body });
    throw new Error(`Telegram API error: ${data.description}`);
  }

  return data.result;
}

export async function sendMessage(params: SendMessageParams) {
  return telegramRequest("sendMessage", {
    chat_id: params.chatId,
    text: params.text,
    parse_mode: params.parseMode ?? "Markdown",
    reply_markup: params.replyMarkup,
    disable_web_page_preview: params.disableWebPagePreview,
  });
}

export async function editMessage(params: {
  chatId: number | string;
  messageId: number;
  text: string;
  replyMarkup?: InlineKeyboardMarkup;
}) {
  return telegramRequest("editMessageText", {
    chat_id: params.chatId,
    message_id: params.messageId,
    text: params.text,
    parse_mode: "Markdown",
    reply_markup: params.replyMarkup,
  });
}

export async function answerCallbackQuery(params: {
  callbackQueryId: string;
  text?: string;
  showAlert?: boolean;
}) {
  return telegramRequest("answerCallbackQuery", {
    callback_query_id: params.callbackQueryId,
    text: params.text,
    show_alert: params.showAlert,
  });
}

export function inlineKeyboard(
  buttons: Array<Array<{ text: string; callback_data: string }>>
): InlineKeyboardMarkup {
  return { inline_keyboard: buttons };
}

export async function setWebhook(url: string, secret: string) {
  return telegramRequest("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
}

export async function deleteWebhook() {
  return telegramRequest("deleteWebhook", { drop_pending_updates: true });
}

export async function getWebhookInfo() {
  const res = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
  return res.json();
}

// ── Predefined message builders ──────────────────────────────────

export function buildReminderMessage(params: {
  therapistName: string;
  scheduledAt: string;
  hours: 24 | 1;
}): string {
  const timeStr = new Date(params.scheduledAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (params.hours === 24) {
    return `⏰ *Lembrete de Sessão*\n\nSua consulta com *${params.therapistName}* é amanhã às *${timeStr}*.\n\n🔗 Você receberá o link de acesso em breve.\n\nResponda *NÃO* para cancelar.`;
  }

  return `🔔 *Sessão em 1 hora!*\n\nSua consulta com *${params.therapistName}* começa às *${timeStr}*.\n\n✅ Acesse pelo link enviado por email.`;
}

export function buildNPSMessage(therapistFirstName: string): string {
  return `⭐ *Como foi sua sessão hoje?*\n\nSua avaliação ajuda a Dra. ${therapistFirstName} a melhorar cada vez mais.`;
}

export function buildNPSKeyboard(sessionId: string): InlineKeyboardMarkup {
  return inlineKeyboard([
    [
      { text: "😕 1", callback_data: `nps_1_${sessionId}` },
      { text: "😐 2", callback_data: `nps_2_${sessionId}` },
      { text: "🙂 3", callback_data: `nps_3_${sessionId}` },
      { text: "😊 4", callback_data: `nps_4_${sessionId}` },
      { text: "😍 5", callback_data: `nps_5_${sessionId}` },
    ],
  ]);
}
