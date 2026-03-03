# PSIQUE — Master Project Prompt

## Para uso no Cursor / Windsurf / Claude Code

### Cole este arquivo como contexto inicial ou salve como `CLAUDE.md` na raiz do projeto

---

# PARTE 1 — LEIA PRIMEIRO: ENTENDIMENTO DO PROJETO

Você é um engenheiro sênior full-stack com expertise em SaaS clínico, arquiteturas event-driven, IA generativa e UX terapêutica. Você está desenvolvendo a plataforma **PSIQUE** — um SaaS completo para psicanalistas gerenciarem sua prática clínica com IA, automação e foco em resultado terapêutico.

## O QUE É O PSIQUE

**PSIQUE** é uma plataforma SaaS B2B/B2C para psicanalistas e psicólogos que combina:

- **Agenda inteligente** com página pública de autoagendamento e pagamento
- **Videochamadas HD** com salas criadas automaticamente por sessão
- **IA Clínica via OpenRouter** — resumos, insights, transcrição, análise de carteira
- **Telegram Bot nativo** — agendamento, lembretes, cobrança, chat com IA
- **Prontuário eletrônico LGPD** — assinatura digital, histórico completo
- **KPIs em tempo real** — MRR, NPS, presença, conversão de leads, cancelamentos
- **Portal duplo** — painel do terapeuta (admin) + portal do paciente/lead

## POR QUE EXISTE

Psicanalistas no Brasil gerenciam sua prática com planilhas, WhatsApp manual e agendas físicas. Isso gera:

- Perda de leads por falta de resposta rápida
- Esquecimento de sessões (cancelamentos desnecessários)
- Ausência de dados clínicos estruturados
- Tempo desperdiçado em burocracia em vez de terapia
- Zero visibilidade sobre a saúde financeira da clínica

O PSIQUE resolve tudo isso com uma plataforma única, configurável em 5 minutos.

## PÚBLICO-ALVO

**Primário:** Psicanalistas e psicólogos solo ou em grupo no Brasil (estimativa: 450k CRPs ativos)
**Secundário:** Pacientes (usuário final do portal, agendamento, acesso à sessão)
**Terciário:** Leads (potenciais clientes que chegam via link público, descobrem e convertem)

## PROPOSTA DE VALOR ÚNICA

> "A única plataforma que cuida de quem cuida — com IA que entende psicanálise, bot do Telegram que agenda sozinho, e dados que revelam o que sua clínica realmente precisa."

---

# PARTE 2 — CLAUDE.md (REGRAS DO PROJETO)

```markdown
# CLAUDE.md — PSIQUE Platform

## Identidade do Projeto

- **Nome:** PSIQUE — Plataforma Terapêutica
- **Versão atual:** 1.0.0-beta
- **Stack:** Next.js 15 (estabelecer plano para migrar 2e2 nas melhores praticas e recursos modernos integrados de forma inteligente e2e) · TypeScript · Supabase · OpenRouter · Telegram · Daily.co · Stripe
- **Repositório:** github.com/softwarelotus/psique
- **Deploy:** Vercel (frontend) + Supabase Cloud (backend)
- **Ambiente:** Node.js 20+ · pnpm

## Princípios de Engenharia (NÃO NEGOCIÁVEIS)

1. **Zero gaps** — Toda funcionalidade descrita deve ter implementação completa. Sem TODOs em código de produção.
2. **TypeScript strict** — `strict: true` em tsconfig. Sem `any` implícito. Sem `as unknown`.
3. **Server-first** — Prefira Server Components. Use Client Components apenas quando necessário (interatividade, hooks de estado).
4. **RLS everywhere** — Todo acesso ao banco passa por Row Level Security do Supabase. Nunca exponha dados de outros terapeutas.
5. **Error boundaries** — Todo componente crítico tem tratamento de erro explícito.
6. **Secrets no servidor** — API keys (OpenRouter, Telegram, Stripe) NUNCA no cliente. Sempre em API Routes ou Server Actions.
7. **Acessibilidade** — ARIA labels, contraste mínimo 4.5:1, navegação por teclado.
8. **LGPD** — Dados sensíveis (prontuário, transcrições) com criptografia em repouso. Consentimento explícito registrado.

## Estrutura de Pastas (OBRIGATÓRIA)
```

psique/
|-- docs/
| |-- PSIQUE_CURSOR_MASTER_PROMPT.md
|-- app/
│ ├── (auth)/ # Login, registro, magic link, forgot
│ ├── (dashboard)/ # Painel terapeuta (protegido)
│ │ ├── layout.tsx # Sidebar + auth guard + analytics
│ │ ├── page.tsx # Dashboard principal com KPIs
│ │ ├── agenda/
│ │ ├── pacientes/[id]/
│ │ ├── consulta/[roomId]/
│ │ ├── ia/
│ │ ├── telegram/
│ │ ├── financeiro/
│ │ └── configuracoes/
│ ├── (patient)/ # Portal paciente (auth separado)
│ │ ├── layout.tsx
│ │ ├── page.tsx # Home do paciente
│ │ ├── agendar/
│ │ ├── sessoes/
│ │ ├── chat/
│ │ └── apoio/
│ ├── booking/[slug]/ # Página pública (sem auth)
│ ├── api/
│ │ ├── ai/
│ │ │ ├── summarize/route.ts
│ │ │ ├── insights/route.ts
│ │ │ └── transcribe/route.ts
│ │ ├── video/
│ │ │ └── room/route.ts
│ │ ├── telegram/
│ │ │ └── webhook/route.ts
│ │ ├── webhooks/
│ │ │ ├── stripe/route.ts
│ │ │ └── supabase/route.ts
│ │ └── cron/
│ │ └── reminders/route.ts
│ └── layout.tsx
├── components/
│ ├── ui/ # Design system (Button, Card, Input, etc.)
│ ├── dashboard/ # Componentes do painel
│ ├── agenda/ # Calendário, slots, booking
│ ├── consulta/ # Videochamada, notas, timer
│ ├── pacientes/ # Cards, prontuário, mood tracker
│ ├── ia/ # Chat IA, modelo selector, templates
│ └── telegram/ # Status bot, preview chat, automações
├── lib/
│ ├── supabase/
│ │ ├── client.ts # Browser client (SSR)
│ │ ├── server.ts # Server client (Server Components)
│ │ └── admin.ts # Service role (webhooks/cron)
│ ├── openrouter.ts # OpenRouter client + helpers
│ ├── telegram.ts # Telegram Bot API wrapper
│ ├── daily.ts # Daily.co client
│ ├── stripe.ts # Stripe client + helpers
│ ├── resend.ts # Email templates (Resend)
│ └── utils.ts # Helpers genéricos
├── types/
│ ├── database.ts # Gerado pelo Supabase CLI
│ ├── api.ts # Tipos de request/response
│ └── domain.ts # Tipos de domínio (Therapist, Patient, etc.)
├── hooks/ # Custom hooks React
├── stores/ # Zustand stores (estado global cliente)
├── supabase/
│ ├── migrations/ # SQL migrations versionadas
│ └── functions/ # Edge Functions
├── middleware.ts # Auth + rate limiting
├── CLAUDE.md # Este arquivo
└── .env.local # Variables (nunca commitar)

````

## Convenções de Código

### Nomenclatura
- **Componentes:** PascalCase. Ex: `PatientCard`, `VideoRoom`
- **Hooks:** camelCase com prefixo `use`. Ex: `useSession`, `useAI`
- **API Routes:** kebab-case nos segmentos. Ex: `/api/ai/summarize`
- **Variáveis de ambiente:** SCREAMING_SNAKE_CASE com prefixo de serviço
- **Database:** snake_case. Ex: `therapist_id`, `scheduled_at`
- **Tipos TS:** PascalCase com sufixo descritivo. Ex: `TherapistProfile`, `SessionSummary`

### Padrões de Componente
```typescript
// Sempre exportar tipos de props
export interface PatientCardProps {
  patient: Patient;
  onSelect?: (patient: Patient) => void;
  showTelegram?: boolean;
}

// Server Component por padrão, client apenas se necessário
export async function PatientCard({ patient, onSelect, showTelegram = true }: PatientCardProps) {
  // ...
}
````

### API Routes

```typescript
// Sempre validar auth, sempre tratar erros, sempre retornar tipos consistentes
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // lógica aqui
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[API] summarize error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Regras de IA / OpenRouter

- **Modelo padrão:** `anthropic/claude-3.5-sonnet` para resumos clínicos (melhor raciocínio ético)
- **Fallback:** `anthropic/claude-3-haiku` para respostas rápidas do bot
- **Modelo configurável por terapeuta:** armazenar em `therapists.ai_model`
- **System prompt clínico:** sempre incluir contexto ético e confidencialidade
- **Nunca armazenar:** conversas do paciente em texto plano sem criptografia
- **Rate limit:** máximo 10 chamadas/minuto por terapeuta

## Regras do Telegram Bot

- **Webhook:** `POST /api/telegram/webhook` validado com `X-Telegram-Bot-Api-Secret-Token`
- **Comandos obrigatórios:** /start, /agendar, /sessoes, /cancelar, /pagar, /falar, /ajuda
- **Idioma:** sempre português brasileiro
- **Timeout:** responder em < 5s (Telegram espera no máximo 5s antes de retentar)
- **Idempotência:** verificar `update_id` para evitar processamento duplicado

## Regras de Segurança

- **RLS:** todo SELECT/INSERT/UPDATE/DELETE em tabelas sensíveis tem política
- **CORS:** configurado explicitamente no middleware
- **Rate limiting:** Upstash Redis para endpoints críticos
- **Webhook validation:** assinaturas verificadas para Stripe e Telegram
- **Sanitização:** todo input de usuário sanitizado antes de inserir no banco
- **Headers de segurança:** CSP, HSTS, X-Frame-Options via next.config

## O que NUNCA fazer

- ❌ Commitar `.env.local` ou qualquer secret
- ❌ Usar `any` em TypeScript
- ❌ Fazer chamadas ao OpenRouter/Telegram direto do cliente
- ❌ Armazenar prontuários sem RLS
- ❌ Deixar endpoints de API sem autenticação (exceto `/booking/[slug]` e `/api/telegram/webhook`)
- ❌ Usar `console.log` em produção (usar logger estruturado)
- ❌ Ignorar erros do Supabase sem tratar
- ❌ Criar migrations sem rollback

````

---

# PARTE 3 — SKILLS DO PROJETO

## SKILL: openrouter-ai-clinical

```markdown
# Skill: OpenRouter AI Clínico

## Quando usar
- Gerar resumo de sessão terapêutica a partir de notas brutas
- Analisar carteira de pacientes e gerar insights
- Transcrever áudio de sessão (Gemini multimodal)
- Responder perguntas do paciente via bot com contexto clínico
- Sugerir próximos passos terapêuticos

## Implementação padrão

```typescript
// lib/openrouter.ts
import OpenAI from 'openai';

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://psique.app',
    'X-Title': 'Psique — Plataforma Terapêutica',
  },
});

export const CLINICAL_SYSTEM_PROMPT = `
Você é um assistente clínico especializado em psicanálise e psicoterapia.
DIRETRIZES ÉTICAS OBRIGATÓRIAS:
- Mantenha absoluta confidencialidade
- Não faça diagnósticos definitivos
- Use linguagem clínica profissional em português
- Base análises em material fornecido, sem especulação
- Sempre sugira que material relevante seja explorado em sessão
- Nunca reproduza dados identificáveis do paciente
`.trim();

export async function generateSessionSummary(params: {
  notes: string;
  patientName: string;
  sessionNumber: number;
  previousSummaries?: string[];
  model?: string;
}): Promise<SessionSummaryResult> {
  const response = await openrouter.chat.completions.create({
    model: params.model ?? 'anthropic/claude-3.5-sonnet',
    messages: [
      { role: 'system', content: CLINICAL_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `
Sessão #${params.sessionNumber} — Paciente: ${params.patientName}
${params.previousSummaries?.length ? `Contexto anterior: ${params.previousSummaries.slice(-3).join(' | ')}` : ''}

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
    response_format: { type: 'json_object' },
    max_tokens: 800,
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content!);
}
````

## Modelos disponíveis e uso recomendado

| Modelo            | ID OpenRouter                            | Uso ideal                  | Custo            |
| ----------------- | ---------------------------------------- | -------------------------- | ---------------- |
| Claude 3.5 Sonnet | `anthropic/claude-3.5-sonnet`            | Resumos clínicos complexos | ~$3/1M tokens    |
| GPT-4o            | `openai/gpt-4o`                          | Análise multimodal         | ~$5/1M tokens    |
| Gemini 1.5 Pro    | `google/gemini-pro-1.5`                  | Transcrição de áudio       | ~$3.5/1M tokens  |
| Claude 3 Haiku    | `anthropic/claude-3-haiku`               | Bot Telegram (rápido)      | ~$0.25/1M tokens |
| Llama 3.1 70B     | `meta-llama/llama-3.1-70b-instruct:free` | Testes e demos             | Gratuito         |

## Padrão de API Route

```typescript
// app/api/ai/summarize/route.ts
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId, notes } = await req.json();

  // Buscar contexto
  const { data: session } = await supabase
    .from("sessions")
    .select(
      "*, patient:patients(name, tags), appointment:appointments(scheduled_at)",
    )
    .eq("id", sessionId)
    .single();

  // Buscar histórico para contexto
  const { data: history } = await supabase
    .from("sessions")
    .select("ai_summary")
    .eq("patient_id", session.patient_id)
    .not("ai_summary", "is", null)
    .order("created_at", { ascending: false })
    .limit(3);

  const result = await generateSessionSummary({
    notes,
    patientName: session.patient.name,
    sessionNumber: session.session_number,
    previousSummaries: history?.map((h) => h.ai_summary!),
    model: session.therapist?.ai_model, // modelo configurado pelo terapeuta
  });

  // Salvar resultado
  await supabase
    .from("sessions")
    .update({
      therapist_notes: notes,
      ai_summary: result.summary,
      ai_insights: result.insights,
      ai_next_steps: result.nextSteps,
      ai_risk_flags: result.riskFlags,
    })
    .eq("id", sessionId);

  return NextResponse.json(result);
}
```

````

---

## SKILL: telegram-bot-integration

```markdown
# Skill: Telegram Bot Integration

## Arquitetura do Bot

O bot opera via webhook (não polling). O Telegram envia updates para:
`POST https://psique.app/api/telegram/webhook`

## Setup inicial

```typescript
// Registrar webhook (executar uma vez no deploy)
await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: `${NEXTAUTH_URL}/api/telegram/webhook`,
    secret_token: TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ['message', 'callback_query'],
  }),
});
````

## Handler principal (app/api/telegram/webhook/route.ts)

```typescript
export async function POST(req: NextRequest) {
  // 1. Validar assinatura
  const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: TelegramUpdate = await req.json();

  // 2. Idempotência - verificar se já processamos este update
  const { data: exists } = await supabase
    .from("telegram_updates")
    .select("id")
    .eq("update_id", update.update_id)
    .single();

  if (exists) return NextResponse.json({ ok: true }); // já processado

  // 3. Registrar update
  await supabase
    .from("telegram_updates")
    .insert({ update_id: update.update_id });

  // 4. Roteamento por tipo
  if (update.message) {
    await handleMessage(update.message);
  } else if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
  }

  return NextResponse.json({ ok: true });
}

async function handleMessage(msg: TelegramMessage) {
  const text = msg.text ?? "";
  const chatId = msg.chat.id;

  // Identificar/criar usuário
  const patient = await findOrCreatePatientByTelegram(msg.from!);

  // Roteamento por comando
  if (text.startsWith("/start")) return handleStart(chatId, patient);
  if (text.startsWith("/agendar")) return handleAgendar(chatId, patient);
  if (text.startsWith("/sessoes")) return handleSessoes(chatId, patient);
  if (text.startsWith("/cancelar")) return handleCancelar(chatId, patient);
  if (text.startsWith("/pagar")) return handlePagar(chatId, patient);
  if (text.startsWith("/falar")) return handleFalar(chatId, patient, text);
  if (text.startsWith("/ajuda")) return handleAjuda(chatId);

  // Mensagem livre → IA com intenção
  return handleFreeMessage(chatId, patient, text);
}
```

## Envio de mensagens (lib/telegram.ts)

```typescript
export async function sendMessage(params: {
  chatId: number | string;
  text: string;
  replyMarkup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
  parseMode?: "Markdown" | "HTML";
}) {
  return fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: params.chatId,
        text: params.text,
        parse_mode: params.parseMode ?? "Markdown",
        reply_markup: params.replyMarkup,
      }),
    },
  );
}

// Botões inline
export function inlineKeyboard(
  buttons: Array<Array<{ text: string; callback_data: string }>>,
) {
  return { inline_keyboard: buttons };
}

// Exemplo: escolha de horário
sendMessage({
  chatId,
  text: "📅 Escolha um horário disponível:",
  replyMarkup: inlineKeyboard([
    [{ text: "Qua 05/03 · 16h", callback_data: "book_slot_123" }],
    [{ text: "Sex 07/03 · 11h", callback_data: "book_slot_124" }],
    [{ text: "Seg 10/03 · 15h", callback_data: "book_slot_125" }],
  ]),
});
```

## Automações (Vercel Cron)

```typescript
// app/api/cron/reminders/route.ts
// vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "*/30 * * * *" }] }

export async function GET(req: NextRequest) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results = { reminders24h: 0, reminders1h: 0, nps: 0 };

  // Lembretes 24h
  const upcoming24h = await getUpcomingAppointments(supabase, 24);
  for (const appt of upcoming24h) {
    if (appt.patient.telegram_chat_id) {
      await sendMessage({
        chatId: appt.patient.telegram_chat_id,
        text: `⏰ *Lembrete de Sessão*\n\nSua consulta com *${appt.therapist.name}* é amanhã às *${formatTime(appt.scheduled_at)}*.\n\n🔗 Link de acesso enviado por email.\n\nResponda *NÃO* para cancelar.`,
      });
    }
    await markReminderSent(supabase, appt.id, "24h");
    results.reminders24h++;
  }

  // NPS pós-sessão (2h após)
  const completedSessions = await getSessionsForNPS(supabase);
  for (const session of completedSessions) {
    await sendMessage({
      chatId: session.patient.telegram_chat_id,
      text: `⭐ *Como foi sua sessão hoje?*\n\nSua avaliação ajuda a Dra. ${session.therapist.first_name} a melhorar cada vez mais.`,
      replyMarkup: inlineKeyboard([
        [
          { text: "😕 1", callback_data: `nps_1_${session.id}` },
          { text: "😐 2", callback_data: `nps_2_${session.id}` },
          { text: "🙂 3", callback_data: `nps_3_${session.id}` },
          { text: "😊 4", callback_data: `nps_4_${session.id}` },
          { text: "😍 5", callback_data: `nps_5_${session.id}` },
        ],
      ]),
    });
    results.nps++;
  }

  return NextResponse.json({ ok: true, ...results });
}
```

````

---

## SKILL: supabase-schema

```markdown
# Skill: Supabase Schema — PSIQUE

## Schema Completo (Migration 001)

```sql
-- ── EXTENSÕES ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── TERAPEUTA ─────────────────────────────────────────────────
CREATE TABLE therapists (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  crp                   TEXT UNIQUE NOT NULL,
  bio                   TEXT,
  photo_url             TEXT,
  slug                  TEXT UNIQUE NOT NULL,
  specialties           TEXT[] DEFAULT '{}',
  session_price         NUMERIC(10,2) NOT NULL DEFAULT 200.00,
  session_duration      INT NOT NULL DEFAULT 50,
  timezone              TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  ai_model              TEXT DEFAULT 'anthropic/claude-3.5-sonnet',
  openrouter_key_hash   TEXT,
  telegram_bot_token    TEXT,
  telegram_chat_id      BIGINT,
  telegram_bot_username TEXT,
  stripe_account_id     TEXT,
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  active                BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── DISPONIBILIDADE ───────────────────────────────────────────
CREATE TABLE availability (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  day_of_week  INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE availability_blocks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  blocked_at   TIMESTAMPTZ NOT NULL,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PACIENTES ─────────────────────────────────────────────────
CREATE TABLE patients (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id         UUID REFERENCES therapists(id) ON DELETE CASCADE,
  user_id              UUID REFERENCES auth.users(id),
  name                 TEXT NOT NULL,
  email                TEXT NOT NULL,
  phone                TEXT,
  telegram_chat_id     BIGINT,
  telegram_username    TEXT,
  birth_date           DATE,
  cpf                  TEXT,
  address              JSONB,
  emergency_contact    JSONB,
  private_notes        TEXT,
  tags                 TEXT[] DEFAULT '{}',
  status               TEXT NOT NULL DEFAULT 'lead'
                       CHECK (status IN ('lead','new','active','inactive','archived')),
  mood_score           INT CHECK (mood_score BETWEEN 0 AND 100),
  gdpr_consent         BOOLEAN DEFAULT FALSE,
  gdpr_consent_at      TIMESTAMPTZ,
  gdpr_consent_ip      INET,
  onboarding_source    TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_therapist ON patients(therapist_id);
CREATE INDEX idx_patients_email     ON patients(therapist_id, email);
CREATE INDEX idx_patients_status    ON patients(therapist_id, status);
CREATE INDEX idx_patients_telegram  ON patients(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- ── AGENDAMENTOS ──────────────────────────────────────────────
CREATE TABLE appointments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id          UUID REFERENCES therapists(id) ON DELETE CASCADE,
  patient_id            UUID REFERENCES patients(id) ON DELETE CASCADE,
  scheduled_at          TIMESTAMPTZ NOT NULL,
  duration_minutes      INT NOT NULL DEFAULT 50,
  type                  TEXT NOT NULL DEFAULT 'online'
                        CHECK (type IN ('online','presencial','hybrid')),
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','in_progress','completed','cancelled','no_show')),
  video_room_id         TEXT,
  video_room_url        TEXT,
  patient_access_token  TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  payment_status        TEXT DEFAULT 'pending'
                        CHECK (payment_status IN ('pending','paid','refunded','exempt','free')),
  stripe_session_id     TEXT,
  stripe_payment_id     TEXT,
  price_charged         NUMERIC(10,2),
  cancellation_reason   TEXT,
  cancelled_at          TIMESTAMPTZ,
  cancelled_by          TEXT CHECK (cancelled_by IN ('therapist','patient','system')),
  reminder_24h_sent     BOOLEAN DEFAULT FALSE,
  reminder_1h_sent      BOOLEAN DEFAULT FALSE,
  nps_sent              BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_therapist_date ON appointments(therapist_id, scheduled_at);
CREATE INDEX idx_appointments_patient        ON appointments(patient_id, scheduled_at);
CREATE INDEX idx_appointments_status         ON appointments(status, scheduled_at);

-- ── SESSÕES (pós-consulta) ────────────────────────────────────
CREATE TABLE sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id    UUID UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  therapist_id      UUID REFERENCES therapists(id),
  patient_id        UUID REFERENCES patients(id),
  session_number    INT NOT NULL,
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  duration_seconds  INT,
  therapist_notes   TEXT,
  ai_summary        TEXT,
  ai_insights       TEXT[],
  ai_next_steps     TEXT[],
  ai_risk_flags     TEXT[],
  transcript        TEXT,
  mood_before       INT CHECK (mood_before BETWEEN 1 AND 10),
  mood_after        INT CHECK (mood_after BETWEEN 1 AND 10),
  nps_score         INT CHECK (nps_score BETWEEN 1 AND 5),
  is_signed         BOOLEAN DEFAULT FALSE,
  signed_at         TIMESTAMPTZ,
  signed_hash       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── PRONTUÁRIO ────────────────────────────────────────────────
CREATE TABLE medical_records (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id   UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id),
  session_id   UUID REFERENCES sessions(id),
  type         TEXT NOT NULL
               CHECK (type IN ('note','hypothesis','goal','evolution','attachment','risk_assessment')),
  content      TEXT NOT NULL,
  is_private   BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PAGAMENTOS ────────────────────────────────────────────────
CREATE TABLE payments (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id     UUID REFERENCES appointments(id),
  therapist_id       UUID REFERENCES therapists(id),
  patient_id         UUID REFERENCES patients(id),
  amount             NUMERIC(10,2) NOT NULL,
  currency           TEXT DEFAULT 'BRL',
  method             TEXT CHECK (method IN ('stripe','pix','manual','exempt')),
  stripe_payment_id  TEXT UNIQUE,
  pix_qrcode         TEXT,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','paid','failed','refunded','disputed')),
  paid_at            TIMESTAMPTZ,
  refunded_at        TIMESTAMPTZ,
  refund_reason      TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── TELEGRAM UPDATES (idempotência) ───────────────────────────
CREATE TABLE telegram_updates (
  update_id  BIGINT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONFIGS DO BOT ────────────────────────────────────────────
CREATE TABLE telegram_configs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID UNIQUE REFERENCES therapists(id) ON DELETE CASCADE,
  welcome_msg  TEXT,
  automations  JSONB DEFAULT '{
    "reminder_24h": true,
    "reminder_1h": true,
    "post_session_billing": true,
    "nps_collection": true,
    "lead_nurture": false,
    "reengagement": false
  }'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE therapists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability        ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_configs    ENABLE ROW LEVEL SECURITY;

-- Terapeutas acessam apenas seus próprios dados
CREATE POLICY "therapist_own" ON therapists
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "therapist_patients" ON patients
  FOR ALL USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

CREATE POLICY "therapist_appointments" ON appointments
  FOR ALL USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

CREATE POLICY "therapist_sessions" ON sessions
  FOR ALL USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

CREATE POLICY "therapist_records" ON medical_records
  FOR ALL USING (therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  ));

-- Pacientes acessam seus próprios agendamentos
CREATE POLICY "patient_own_appointments" ON appointments
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
  );
````

````

---

# PARTE 4 — VARIÁVEIS DE AMBIENTE

```bash
# .env.local — NUNCA commitar este arquivo

# ── Supabase ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=seu-jwt-secret

# ── OpenRouter AI ─────────────────────────────────────────
OPENROUTER_API_KEY=sk-or-v1-...

# ── Telegram Bot ──────────────────────────────────────────
TELEGRAM_BOT_TOKEN=6825301234:AAFx...
TELEGRAM_BOT_USERNAME=PsiqueBotOficial
TELEGRAM_WEBHOOK_SECRET=gerar-com-openssl-rand-hex-32

# ── Daily.co (Videochamadas) ──────────────────────────────
DAILY_API_KEY=xxxx...
DAILY_API_URL=https://api.daily.co/v1

# ── Stripe (Pagamentos) ───────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Resend (Emails) ───────────────────────────────────────
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@psique.app
RESEND_FROM_NAME=Psique

# ── App ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://psique.app
NEXTAUTH_URL=https://psique.app
NEXTAUTH_SECRET=gerar-com-openssl-rand-base64-32

# ── Cron Security ─────────────────────────────────────────
CRON_SECRET=gerar-com-openssl-rand-hex-32

# ── Upstash Redis (Rate Limiting) ─────────────────────────
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# ── Sentry (Observability) ────────────────────────────────
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
````

---

# PARTE 5 — SEQUÊNCIA DE IMPLEMENTAÇÃO (O QUE FAZER E EM QUE ORDEM)

Execute esta sequência em ordem estrita. Não pule etapas.

## FASE 1 — FUNDAÇÃO (dias 1-2)

### 1.1 Setup do projeto

```bash
npx create-next-app@latest psique \
  --typescript --tailwind --app --src-dir=false \
  --import-alias "@/*"
cd psique
pnpm install
```

### 1.2 Dependências core

```bash
# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# IA
pnpm add openai  # cliente para OpenRouter (compatível com API OpenAI)

# Pagamentos
pnpm add stripe @stripe/stripe-js

# Email
pnpm add resend

# Formulários e validação
pnpm add react-hook-form @hookform/resolvers zod

# UI e animações
pnpm add clsx tailwind-merge
pnpm add lucide-react

# Datas
pnpm add date-fns date-fns-tz

# Rate limiting
pnpm add @upstash/ratelimit @upstash/redis

# IDs únicos
pnpm add nanoid

# Dev
pnpm add -D @types/node supabase
```

### 1.3 Supabase CLI setup

```bash
npx supabase init
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push  # executar migration 001
npx supabase gen types typescript --local > types/database.ts
```

### 1.4 Configurar middleware.ts

```typescript
// middleware.ts — auth guard para rotas protegidas
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // ... (implementação completa com refresh de sessão)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|booking|api/telegram|api/webhooks).*)",
  ],
};
```

## FASE 2 — AUTH (dia 2-3)

Implementar em ordem:

1. `app/(auth)/login/page.tsx` — email/senha + magic link + Google OAuth
2. `app/(auth)/register/page.tsx` — cadastro terapeuta com validação CRP
3. `app/(auth)/register/patient/page.tsx` — cadastro paciente (mais simples)
4. `app/(auth)/forgot-password/page.tsx`
5. `app/(auth)/callback/route.ts` — callback OAuth/Magic Link
6. Onboarding wizard: `app/(dashboard)/onboarding/page.tsx` (6 steps)

## FASE 3 — DASHBOARD TERAPEUTA (dias 3-5)

Implementar em ordem:

1. Layout com sidebar animada (`app/(dashboard)/layout.tsx`)
2. Dashboard com KPIs reais do banco (`app/(dashboard)/page.tsx`)
3. Agenda semanal (`app/(dashboard)/agenda/page.tsx`)
4. Lista de pacientes com busca e filtros (`app/(dashboard)/pacientes/page.tsx`)
5. Detalhe do paciente com abas (`app/(dashboard)/pacientes/[id]/page.tsx`)
6. Assistente IA (`app/(dashboard)/ia/page.tsx`)
7. Painel Telegram (`app/(dashboard)/telegram/page.tsx`)
8. Financeiro (`app/(dashboard)/financeiro/page.tsx`)
9. Configurações (`app/(dashboard)/configuracoes/page.tsx`)

## FASE 4 — CORE FEATURES (dias 5-8)

Implementar em ordem:

1. **Página pública de booking** (`app/booking/[slug]/page.tsx`)
   - Exibir disponibilidade em tempo real
   - Formulário de agendamento
   - Checkout Stripe
2. **Videochamada** (`app/(dashboard)/consulta/[roomId]/page.tsx`)
   - Integração Daily.co
   - Timer de sessão
   - Painel de notas ao vivo
   - Botão "Encerrar + Gerar Resumo IA"

3. **Webhook Stripe** (`app/api/webhooks/stripe/route.ts`)
   - `checkout.session.completed` → confirmar agendamento, criar sala
   - Enviar email de confirmação
   - Enviar Telegram com link

4. **Webhook Telegram** (`app/api/telegram/webhook/route.ts`)
   - Roteamento de comandos
   - Intenção via IA
   - Respostas com botões inline

5. **Cron de lembretes** (`app/api/cron/reminders/route.ts`)
   - Lembretes 24h e 1h
   - NPS pós-sessão
   - Cobrança automática

6. **API de IA** (todas as rotas em `app/api/ai/`)

## FASE 5 — PORTAL DO PACIENTE (dias 8-10)

1. Layout separado (`app/(patient)/layout.tsx`)
2. Home com próximas sessões
3. Agendamento self-service
4. Histórico de sessões
5. Chat com assistente IA
6. Espaço de reflexão (apoio entre sessões)

## FASE 6 — POLISH E DEPLOY (dias 10-12)

1. SEO e metadados
2. Error pages (404, 500)
3. Loading states e Suspense boundaries
4. Rate limiting em todas as API routes
5. Testes E2E com Playwright (fluxos críticos)
6. Setup Sentry para monitoramento
7. Deploy Vercel + configurar cron jobs
8. DNS e domínio personalizado

---

# PARTE 6 — DESIGN SYSTEM

## Tokens de Design (usar exatamente estes)

```css
:root {
  /* Cores */
  --bg: #080f0b; /* Background principal */
  --bg2: #0c1510; /* Background secundário */
  --card: #121a14; /* Cards */
  --border: #1c2e20; /* Bordas */
  --mint: #52b788; /* Primária / ações */
  --mintl: #74c9a0; /* Primária hover */
  --gold: #c4a35a; /* Destaques / KPIs */
  --ivory: #ede7d9; /* Texto principal */
  --ivoryD: #c8bfa8; /* Texto secundário */
  --ivoryDD: #8a8070; /* Texto terciário */
  --red: #b85450; /* Erros / alertas */
  --blue: #4a8fa8; /* Info / links */

  /* Tipografia */
  --ff: "Cormorant Garant", serif; /* Headings */
  --fs: "Instrument Sans", sans-serif; /* Body */

  /* Easing */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## Componentes obrigatórios a implementar em `components/ui/`

```
Button.tsx        # Magnetic button com variantes
Card.tsx          # Com hover elevation
Input.tsx         # Com estados focus/error/disabled
Select.tsx        # Dropdown customizado
Modal.tsx         # Dialog acessível
Toast.tsx         # Notificações (Sonner)
Avatar.tsx        # Com fallback de iniciais
Badge.tsx         # Tag colorida
Spinner.tsx       # Loading indicator
LineChart.tsx     # Gráfico de linha (SVG puro)
BarChart.tsx      # Gráfico de barras (SVG puro)
Counter.tsx       # Número animado ao entrar no viewport
```

---

# PARTE 7 — GAPS E LACUNAS CONHECIDOS (COBRIR OBRIGATORIAMENTE)

## Gaps de Segurança

- [ ] Validação CNPJ/CPF em cadastro
- [ ] 2FA obrigatório para terapeutas (TOTP via Supabase Auth)
- [ ] Session tokens com expiração adequada
- [ ] Audit log de acesso a prontuários
- [ ] Criptografia de notas clínicas em repouso (pgcrypto)

## Gaps de Produto

- [ ] Cancelamento com política configurável (ex: 24h antes = sem cobrança)
- [ ] Reagendamento pelo paciente (sem intervenção do terapeuta)
- [ ] Cobrança por cartão recorrente (pacotes de sessões)
- [ ] Emissão de NF (integração com Nuvemfiscal ou ContaAzul)
- [ ] Relatório exportável em PDF para planos de saúde
- [ ] Modo offline para notas (PWA com sync)

## Gaps de UX

- [ ] Onboarding interativo com tooltip tour
- [ ] Dark/light mode toggle
- [ ] Atalhos de teclado no painel do terapeuta
- [ ] Notificações push (web push API)
- [ ] Compartilhar tela na videochamada

## Gaps de Infra

- [ ] Backup automático de prontuários (Supabase Storage)
- [ ] CDN para fotos de perfil
- [ ] Monitoramento de uptime (BetterStack)
- [ ] Feature flags (Vercel Edge Config)
- [ ] Internacionalização (next-intl) para expansão futura

---

# PARTE 8 — COMANDOS ÚTEIS

```bash
# Desenvolvimento
pnpm dev                          # inicia servidor local

# Banco de dados
npx supabase db reset             # resetar banco local
npx supabase db push              # aplicar migrations
npx supabase gen types typescript # regenerar tipos

# Telegram
# Registrar webhook (executar após deploy)
curl -X POST "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://psique.app/api/telegram/webhook","secret_token":"SEU_SECRET"}'

# Verificar webhook
curl "https://api.telegram.org/bot${TOKEN}/getWebhookInfo"

# Stripe webhook local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Testes
pnpm test                         # unit tests
pnpm test:e2e                     # playwright e2e

# Build
pnpm build                        # production build
pnpm start                        # iniciar produção local

# Deploy
vercel --prod                     # deploy para produção
```

---

# PARTE 9 — CHECKLIST DE REVISÃO ANTES DE CADA COMMIT

```
□ TypeScript sem erros (tsc --noEmit)
□ ESLint sem warnings
□ Nenhum secret hardcoded
□ Nenhum console.log em código de produção
□ Todas as API routes têm auth check
□ Todas as mutations têm validação Zod
□ Todos os erros são tratados e logados
□ RLS verificado para novas tabelas
□ Migration tem rollback
□ Componentes novos têm ARIA labels
□ Imagens novas têm alt text
□ Funcionalidade testada em mobile
```

---

# PARTE 10 — CONTEXTO TÉCNICO ADICIONAL

## Por que OpenRouter em vez de direto Google/Anthropic?

- Uma única API key para 200+ modelos
- Fallback automático se um modelo falhar
- Terapeuta pode trocar de modelo sem novo setup
- Billing unificado
- Compatível com SDK OpenAI (zero friction)

## Por que Supabase em vez de Prisma + PostgreSQL custom?

- Auth, Storage, Realtime e Edge Functions incluídos
- RLS nativo (segurança por design)
- SDK TypeScript com tipos gerados automaticamente
- Menos infra para gerenciar, foco no produto

## Por que Daily.co em vez de Jitsi/WebRTC puro?

- Salas criadas via API em < 200ms
- Tokens de acesso com expiração
- Gravação gerenciada
- SDK React bem mantido
- Compliance médico (HIPAA ready)

## Por que Telegram em vez de WhatsApp Business API?

- Bot API gratuita e sem aprovação
- Webhook simples, sem complicação
- Botões inline nativos (UX superior para agendamento)
- Usuários técnicos (perfil do público de psicanalistas)
- Zero custo de mensagem

---

_Prompt gerado para o projeto PSIQUE — Software Lotus_
_Versão: 1.0.0 | Sistema: System-6 Compliant | Zero Gaps_
