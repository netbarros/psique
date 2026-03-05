-- MF-25.1: initial published backfill for master_admin content/plans

-- Plans extracted from current hardcoded pricing/checkout experience
INSERT INTO plan_documents (plan_key, locale)
VALUES
  ('solo', 'pt-BR'),
  ('pro', 'pt-BR')
ON CONFLICT (plan_key, locale) DO NOTHING;

INSERT INTO plan_revisions (
  id,
  document_id,
  version,
  status,
  payload_json,
  etag,
  created_by,
  published_by,
  published_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  d.id,
  COALESCE((SELECT MAX(pr.version) + 1 FROM plan_revisions pr WHERE pr.document_id = d.id), 1),
  'published',
  CASE d.plan_key
    WHEN 'solo' THEN jsonb_build_object(
      'name', 'Plano Analista Solo',
      'headline', 'Essencial para operação clínica individual com IA',
      'description', 'Para o profissional independente focado em qualidade.',
      'currency', 'BRL',
      'amountCents', 29700,
      'interval', 'month',
      'ctaLabel', 'Assinar Agora',
      'ctaHref', '/auth/register?plan=solo',
      'features', jsonb_build_array(
        'Agenda inteligente ilimitada',
        'Videochamadas HD nativas',
        'Bot do Telegram (Atendente virtual)',
        '100 Resumos de IA /mês (Claude 3.5)',
        'Prontuário eletrônico LGPD'
      )
    )
    ELSE jsonb_build_object(
      'name', 'Plano Clínica Pro',
      'headline', 'Escala e automação total para sua carteira',
      'description', 'Acesso completo com IA e automação clínica para escala.',
      'currency', 'BRL',
      'amountCents', 49700,
      'interval', 'month',
      'ctaLabel', 'Assinar Clínica Pro',
      'ctaHref', '/auth/register?plan=pro',
      'features', jsonb_build_array(
        'Tudo do plano Solo, mais:',
        'Resumos de IA Ilimitados',
        'Transcrição de áudio Gemini Pro',
        'Automação de cobrança via Stripe',
        'Dashboards financeiros avançados'
      )
    )
  END,
  md5(random()::text || clock_timestamp()::text || d.id::text),
  NULL,
  NULL,
  NOW(),
  NOW(),
  NOW()
FROM plan_documents d
WHERE d.locale = 'pt-BR'
  AND d.plan_key IN ('solo', 'pro')
  AND NOT EXISTS (
    SELECT 1 FROM plan_revisions pr
    WHERE pr.document_id = d.id
      AND pr.status = 'published'
  );

-- Public content documents derived from current stitched pages
INSERT INTO content_documents (page_key, section_key, locale)
VALUES
  ('landing', 'main', 'pt-BR'),
  ('pricing', 'main', 'pt-BR'),
  ('checkout_secure', 'main', 'pt-BR'),
  ('booking', 'main', 'pt-BR'),
  ('booking_success', 'main', 'pt-BR')
ON CONFLICT (page_key, section_key, locale) DO NOTHING;

INSERT INTO content_revisions (
  id,
  document_id,
  version,
  status,
  payload_json,
  etag,
  created_by,
  published_by,
  published_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  d.id,
  COALESCE((SELECT MAX(cr.version) + 1 FROM content_revisions cr WHERE cr.document_id = d.id), 1),
  'published',
  CASE d.page_key
    WHEN 'landing' THEN jsonb_build_object(
      'heroTitle', 'A única plataforma que cuida de quem cuida.',
      'heroSubtitle', 'Automação clínica, insights terapêuticos por IA e operação completa da prática em uma plataforma Stitch-first.',
      'primaryCta', jsonb_build_object('label', 'Começar Teste Grátis', 'href', '/auth/register'),
      'secondaryCta', jsonb_build_object('label', 'Descobrir Planos', 'href', '/pricing')
    )
    WHEN 'pricing' THEN jsonb_build_object(
      'title', 'O investimento na sua excelência clínica',
      'subtitle', 'Plataforma premium desenhada exclusivamente para a prática psicanalítica de alto nível.',
      'faq', jsonb_build_array(
        jsonb_build_object('q', 'Posso cancelar quando quiser?', 'a', 'Sim, não há fidelidade.'),
        jsonb_build_object('q', 'Meus dados estão seguros?', 'a', 'Sim. Criptografia e práticas LGPD.'),
        jsonb_build_object('q', 'Como funciona a IA nas sessões?', 'a', 'IA como copiloto sob guardrails clínicos.')
      )
    )
    WHEN 'checkout_secure' THEN jsonb_build_object(
      'title', 'Checkout Seguro',
      'subtitle', 'Fluxo seguro de ativação da plataforma Psique.',
      'trustBadges', jsonb_build_array('256-bit Encryption', 'LGPD Compliant')
    )
    WHEN 'booking' THEN jsonb_build_object(
      'title', 'Agendamento público',
      'subtitle', 'Agende com segurança e pagamento integrado.',
      'footerNote', 'Seus dados são protegidos por criptografia e LGPD'
    )
    ELSE jsonb_build_object(
      'title', 'Agendamento confirmado',
      'subtitle', 'Sua confirmação foi registrada com sucesso.'
    )
  END,
  md5(random()::text || clock_timestamp()::text || d.id::text),
  NULL,
  NULL,
  NOW(),
  NOW(),
  NOW()
FROM content_documents d
WHERE d.locale = 'pt-BR'
  AND d.page_key IN ('landing', 'pricing', 'checkout_secure', 'booking', 'booking_success')
  AND d.section_key = 'main'
  AND NOT EXISTS (
    SELECT 1 FROM content_revisions cr
    WHERE cr.document_id = d.id
      AND cr.status = 'published'
  );
