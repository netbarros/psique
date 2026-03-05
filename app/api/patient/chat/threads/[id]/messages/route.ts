import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!patient) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: thread } = await supabase
    .from("patient_chat_threads")
    .select("id")
    .eq("id", id)
    .eq("patient_id", patient.id)
    .single();

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const parsedLimit = Number(searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 100;

  const { data: messages, error } = await supabase
    .from("patient_chat_messages")
    .select("id, role, content, created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Failed to load thread messages" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      threadId: id,
      messages: (messages ?? []).map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.created_at,
      })),
    },
  });
}
