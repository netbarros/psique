import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { logger } from "@/lib/logger";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appointmentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { newScheduledAt: string };

  if (!body.newScheduledAt) {
    return NextResponse.json(
      { error: "newScheduledAt is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  try {
    // Fetch appointment
    const { data: appointment, error: apptError } = await admin
      .from("appointments")
      .select(
        `*, 
         patient:patients(id, name, email, user_id),
         therapist:therapists(id, name, user_id, session_duration)`
      )
      .eq("id", appointmentId)
      .single();

    if (apptError || !appointment) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      );
    }

    const patient = appointment.patient as unknown as {
      id: string;
      name: string;
      email: string;
      user_id: string | null;
    };
    const therapist = appointment.therapist as unknown as {
      id: string;
      name: string;
      user_id: string | null;
      session_duration: number;
    };

    const isTherapist = user.id === therapist.user_id;
    const isPatient = user.id === patient.user_id;

    if (!isTherapist && !isPatient) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only reschedule pending or confirmed
    if (!["pending", "confirmed"].includes(appointment.status)) {
      return NextResponse.json(
        { error: "Não é possível reagendar este agendamento" },
        { status: 400 }
      );
    }

    // Check for conflicts at the new time
    const newDate = new Date(body.newScheduledAt);
    const endDate = new Date(
      newDate.getTime() + therapist.session_duration * 60 * 1000
    );

    const { data: conflicts } = await admin
      .from("appointments")
      .select("id")
      .eq("therapist_id", therapist.id)
      .neq("id", appointmentId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", newDate.toISOString())
      .lt("scheduled_at", endDate.toISOString());

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: "O novo horário já está ocupado" },
        { status: 409 }
      );
    }

    const oldDate = new Date(appointment.scheduled_at);

    // Update appointment
    await admin
      .from("appointments")
      .update({
        scheduled_at: body.newScheduledAt,
        reminder_24h_sent: false,
        reminder_1h_sent: false,
      })
      .eq("id", appointmentId);

    // Send rescheduling email
    if (patient.email) {
      const oldDateStr = oldDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });
      const oldTimeStr = oldDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const newDateStr = newDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });
      const newTimeStr = newDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      await sendEmail({
        to: patient.email,
        subject: `🔄 Sessão reagendada — ${newDateStr} às ${newTimeStr}`,
        html: `
<!DOCTYPE html>
<html>
<body style="background:#080F0B;color:#DDD7C8;font-family:'Instrument Sans',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
  <div style="background:#121A14;border:1px solid #1C2E20;border-radius:16px;padding:32px;">
    <h2 style="font-weight:300;color:#4A8FA8;margin:0 0 12px">Sessão Reagendada</h2>
    <p style="color:#C8BFA8">Olá, ${patient.name}.</p>
    <p style="color:#8A8070;text-decoration:line-through;font-size:13px">Antigo: ${oldDateStr} às ${oldTimeStr}</p>
    <p style="color:#52B788;font-weight:500;font-size:16px">Novo: ${newDateStr} às ${newTimeStr}</p>
    <p style="color:#C8BFA8">Sua sessão com <strong>${therapist.name}</strong> foi reagendada com sucesso.</p>
    <p style="font-size:13px;color:#8A8070;margin-top:24px">O link de acesso será enviado 1h antes do novo horário.</p>
  </div>
</body>
</html>`,
      }).catch((err) =>
        logger.warn("[Reschedule] Email failed", { error: String(err) })
      );
    }

    logger.info("[Reschedule] Appointment rescheduled", {
      appointmentId,
      oldDate: oldDate.toISOString(),
      newDate: newDate.toISOString(),
      by: isTherapist ? "therapist" : "patient",
    });

    return NextResponse.json({
      success: true,
      data: { newScheduledAt: body.newScheduledAt },
    });
  } catch (error) {
    logger.error("[Reschedule] Error", { error: String(error) });
    return NextResponse.json(
      { error: "Erro interno ao reagendar" },
      { status: 500 }
    );
  }
}
