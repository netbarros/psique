import { Resend } from "resend";
import { logger } from "@/lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `${process.env.RESEND_FROM_NAME ?? "Psique"} <${process.env.RESEND_FROM_EMAIL ?? "noreply@psique.app"}>`;

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    logger.error("[Resend] Failed to send email", { error, to: params.to });
    throw new Error(`Email send failed: ${error.message}`);
  }

  logger.info("[Resend] Email sent", { to: params.to, subject: params.subject });
}

export async function sendBookingConfirmation(params: {
  to: string;
  patientName: string;
  therapistName: string;
  scheduledAt: string;
  roomUrl?: string;
  accessToken?: string;
}) {
  const date = new Date(params.scheduledAt).toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = new Date(params.scheduledAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return sendEmail({
    to: params.to,
    subject: `✅ Consulta confirmada — ${date}`,
    html: `
<!DOCTYPE html>
<html>
<body style="background:#080F0B;color:#DDD7C8;font-family:'Instrument Sans',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="font-size:36px;font-weight:200;color:#EDE7D9;letter-spacing:-1px;">Ψ Psique</div>
    <p style="color:#8A8070;font-size:13px">Plataforma Terapêutica</p>
  </div>
  <div style="background:#121A14;border:1px solid #1C2E20;border-radius:16px;padding:32px;">
    <h2 style="font-weight:300;color:#52B788;margin:0 0 8px">Consulta Confirmada</h2>
    <p style="color:#C8BFA8;margin:0 0 24px">Olá, ${params.patientName}</p>
    <div style="background:#0C1510;border:1px solid #243828;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#8A8070">Profissional</p>
      <p style="margin:4px 0 16px;font-size:16px;color:#EDE7D9">${params.therapistName}</p>
      <p style="margin:0;font-size:13px;color:#8A8070">Data e Horário</p>
      <p style="margin:4px 0;font-size:18px;color:#C4A35A;font-weight:500">${date} às ${time}</p>
    </div>
    ${
      params.roomUrl
        ? `<a href="${params.roomUrl}" style="display:block;text-align:center;background:#52B788;color:#060E09;padding:14px;border-radius:12px;font-weight:600;text-decoration:none;">
        Acessar Sala de Consulta →
      </a>`
        : ""
    }
    <p style="font-size:12px;color:#8A8070;text-align:center;margin-top:20px">
      Em caso de necessidade de cancelamento, entre em contato com antecedência mínima de 24h.
    </p>
  </div>
  <p style="font-size:11px;color:#8A8070;text-align:center;margin-top:24px">
    © Psique — Plataforma Terapêutica · psique.app
  </p>
</body>
</html>`,
  });
}

export async function sendSessionReminder(params: {
  to: string;
  patientName: string;
  therapistName: string;
  scheduledAt: string;
  roomUrl?: string;
  hoursUntil: 24 | 1;
}) {
  const time = new Date(params.scheduledAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const subject =
    params.hoursUntil === 24
      ? `⏰ Lembrete: consulta amanhã às ${time}`
      : `🔔 Sua consulta começa em 1 hora — ${time}`;

  return sendEmail({
    to: params.to,
    subject,
    html: `
<!DOCTYPE html>
<html>
<body style="background:#080F0B;color:#DDD7C8;font-family:'Instrument Sans',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
  <div style="background:#121A14;border:1px solid #1C2E20;border-radius:16px;padding:32px;text-align:center;">
    <h2 style="font-weight:300;color:#C4A35A">${subject}</h2>
    <p>Olá, ${params.patientName}. Sua consulta com <strong>${params.therapistName}</strong>${params.hoursUntil === 24 ? " é amanhã" : " começa em breve"} às <strong>${time}</strong>.</p>
    ${
      params.roomUrl
        ? `<a href="${params.roomUrl}" style="display:inline-block;background:#52B788;color:#060E09;padding:12px 28px;border-radius:12px;font-weight:600;text-decoration:none;margin-top:16px;">Acessar Sala →</a>`
        : ""
    }
  </div>
</body>
</html>`,
  });
}

export { sendEmail };
