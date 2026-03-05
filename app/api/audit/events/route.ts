import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function titleFromAction(action: string, tableName: string): string {
  if (tableName === "patient_journal_entries") return "Registro de diário";
  if (tableName === "therapist_settings") return "Atualização de segurança";
  if (tableName === "therapists") return "Atualização de perfil";
  if (tableName === "appointments") return "Mudança em agendamento";
  if (tableName === "sessions") return "Atualização de sessão";

  if (action === "export") return "Exportação de dados";
  if (action === "view") return "Acesso a registro";
  if (action === "create") return "Criação de registro";
  if (action === "delete") return "Remoção de registro";

  return "Atualização de registro";
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: therapist } = await supabase
    .from("therapists")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!therapist) {
    return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const parsedLimit = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 20;

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, table_name, record_id, created_at, ip_address, metadata")
    .eq("therapist_id", therapist.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Failed to load audit events" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: (data ?? []).map((event) => ({
      id: event.id,
      title: titleFromAction(event.action, event.table_name),
      action: event.action,
      tableName: event.table_name,
      recordId: event.record_id,
      createdAt: event.created_at,
      ip: event.ip_address,
      metadata: event.metadata,
    })),
  });
}
