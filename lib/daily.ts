import { logger } from "@/lib/logger";

const DAILY_API_URL = process.env.DAILY_API_URL ?? "https://api.daily.co/v1";
const DAILY_API_KEY = process.env.DAILY_API_KEY;

interface DailyHeaders {
  Authorization: string;
  "Content-Type": string;
  [key: string]: string;
}

function dailyHeaders(): DailyHeaders {
  if (!DAILY_API_KEY) throw new Error("[PSIQUE] Missing DAILY_API_KEY");
  return {
    Authorization: `Bearer ${DAILY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: number;
  config: {
    exp: number;
    max_participants: number;
    enable_recording: string;
  };
}

export interface DailyMeetingToken {
  token: string;
}

export async function createRoom(params: {
  sessionId: string;
  expiresInMinutes?: number;
  enableRecording?: boolean;
}): Promise<DailyRoom> {
  const expiresAt = Math.floor(Date.now() / 1000) + (params.expiresInMinutes ?? 120) * 60;
  const roomName = `psique-${params.sessionId}`;

  logger.info("[Daily] Creating room", { roomName });

  const res = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: dailyHeaders(),
    body: JSON.stringify({
      name: roomName,
      properties: {
        exp: expiresAt,
        max_participants: 2,
        enable_recording: params.enableRecording ? "local" : "off",
        enable_chat: false,
        enable_knocking: false,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    logger.error("[Daily] Failed to create room", { error: err });
    throw new Error(`Daily.co room creation failed: ${err.error}`);
  }

  return res.json();
}

export async function createMeetingToken(params: {
  roomName: string;
  isOwner?: boolean;
  userName?: string;
  expiresInMinutes?: number;
}): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + (params.expiresInMinutes ?? 90) * 60;

  const res = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: "POST",
    headers: dailyHeaders(),
    body: JSON.stringify({
      properties: {
        room_name: params.roomName,
        is_owner: params.isOwner ?? false,
        user_name: params.userName,
        exp: expiresAt,
        enable_recording: params.isOwner ? "local" : "off",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Daily.co token creation failed: ${err.error}`);
  }

  const data: DailyMeetingToken = await res.json();
  return data.token;
}

export async function deleteRoom(roomName: string): Promise<void> {
  logger.info("[Daily] Deleting room", { roomName });

  const res = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: "DELETE",
    headers: dailyHeaders(),
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.json();
    logger.warn("[Daily] Failed to delete room", { error: err, roomName });
  }
}

export async function getRoom(roomName: string): Promise<DailyRoom | null> {
  const res = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    headers: dailyHeaders(),
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("[Daily] Failed to fetch room");

  return res.json();
}
