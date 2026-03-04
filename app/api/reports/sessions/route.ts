import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { renderToBuffer } from "@react-pdf/renderer";
import React, { createElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { SessionReportDocument } from "@/lib/pdf/session-report";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!patientId) {
    return NextResponse.json(
      { error: "patientId is required" },
      { status: 400 }
    );
  }

  try {
    // Verify therapist owns this patient
    const { data: therapist } = await supabase
      .from("therapists")
      .select("id, name, crp")
      .eq("user_id", user.id)
      .single();

    if (!therapist) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: patient } = await supabase
      .from("patients")
      .select("id, name, email, cpf")
      .eq("id", patientId)
      .eq("therapist_id", therapist.id)
      .single();

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente não encontrado" },
        { status: 404 }
      );
    }

    // Fetch sessions in date range
    let query = supabase
      .from("sessions")
      .select("*")
      .eq("patient_id", patientId)
      .eq("therapist_id", therapist.id)
      .order("created_at", { ascending: true });

    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data: sessions } = await query;

    // Fetch appointments for payment info
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, paid_at, status")
      .eq("patient_id", patientId)
      .eq("therapist_id", therapist.id)
      .eq("status", "paid");

    const reportData = {
      therapist: {
        name: therapist.name,
        crp: therapist.crp,
      },
      patient: {
        name: patient.name,
        email: patient.email,
        cpf: patient.cpf as string | null,
      },
      sessions: (sessions ?? []).map((s) => ({
        sessionNumber: s.session_number as number,
        date: s.created_at as string,
        durationSeconds: s.duration_seconds as number | null,
        moodBefore: s.mood_before as number | null,
        moodAfter: s.mood_after as number | null,
        aiSummary: s.ai_summary as string | null,
        npsScore: s.nps_score as number | null,
      })),
      payments: (payments ?? []).map((p) => ({
        amount: p.amount as number,
        paidAt: p.paid_at as string | null,
      })),
      dateRange: {
        from: from ?? sessions?.[0]?.created_at ?? new Date().toISOString(),
        to: to ?? new Date().toISOString(),
      },
    };

    const buffer = await renderToBuffer(
      createElement(SessionReportDocument, reportData) as unknown as React.ReactElement<DocumentProps>
    );

    const pdfBytes = new Uint8Array(buffer);

    logger.info("[PDF] Report generated", {
      patientId,
      sessions: reportData.sessions.length,
    });

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-${patient.name.replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (error) {
    logger.error("[PDF] Generation error", { error: String(error) });
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}
