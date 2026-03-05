import type { ScreenContract } from "./screen-contract";

// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source: docs/stitch/CANONICAL_MANIFEST.json
export const SCREEN_CONTRACTS: ScreenContract[] = [
  {
    "id": "S01",
    "title": "Therapist Dashboard",
    "route": "/dashboard",
    "routePattern": "/dashboard",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": true,
    "theme": "dark_core",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/dashboard"
    },
    "sourceFile": "app/dashboard/page.tsx"
  },
  {
    "id": "S02",
    "title": "Public Booking Page",
    "route": "/booking/test-terapeuta",
    "routePattern": "/booking/[slug]",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": false,
    "theme": "dark_core",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/booking/[slug]"
    },
    "sourceFile": "app/booking/[slug]/page.tsx"
  },
  {
    "id": "S03",
    "title": "Clinical Session Video",
    "route": "/dashboard/consulta/room-stitch-check",
    "routePattern": "/dashboard/consulta/[roomId]",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": true,
    "theme": "dark_theater",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/dashboard/consulta/[roomId]"
    },
    "sourceFile": "app/dashboard/consulta/[roomId]/page.tsx"
  },
  {
    "id": "S04",
    "title": "Patient Clinical Profile",
    "route": "/dashboard/pacientes/11111111-1111-1111-1111-111111111111",
    "routePattern": "/dashboard/pacientes/[id]",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": true,
    "theme": "dark_core",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/dashboard/pacientes/[id]"
    },
    "sourceFile": "app/dashboard/pacientes/[id]/page.tsx"
  },
  {
    "id": "S05",
    "title": "AI Clinical Assistant",
    "route": "/dashboard/ia",
    "routePattern": "/dashboard/ia",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": true,
    "theme": "dark_core",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/dashboard/ia"
    },
    "sourceFile": "app/dashboard/ia/page.tsx"
  },
  {
    "id": "S06",
    "title": "Financial Intelligence",
    "route": "/dashboard/financeiro",
    "routePattern": "/dashboard/financeiro",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": true,
    "theme": "dark_core",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/dashboard/financeiro"
    },
    "sourceFile": "app/dashboard/financeiro/page.tsx"
  },
  {
    "id": "S07",
    "title": "Telegram Hub",
    "route": "/dashboard/telegram",
    "routePattern": "/dashboard/telegram",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": true,
    "theme": "dark_core",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/dashboard/telegram"
    },
    "sourceFile": "app/dashboard/telegram/page.tsx"
  },
  {
    "id": "S08",
    "title": "Therapist Onboarding Wizard",
    "route": "/dashboard/onboarding",
    "routePattern": "/dashboard/onboarding",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": true,
    "theme": "light_onboard",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/dashboard/onboarding"
    },
    "sourceFile": "app/dashboard/onboarding/page.tsx"
  },
  {
    "id": "S09",
    "title": "Segurança & LGPD",
    "route": "/dashboard/configuracoes",
    "routePattern": "/dashboard/configuracoes",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": true,
    "theme": "dark_core",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/dashboard/configuracoes"
    },
    "sourceFile": "app/dashboard/configuracoes/page.tsx"
  },
  {
    "id": "S10",
    "title": "Patient Reflection Portal",
    "route": "/portal",
    "routePattern": "/portal",
    "aliases": [
      "/portal/apoio",
      "/apoio"
    ],
    "actor": "patient",
    "requiresAuth": true,
    "theme": "light_patient",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/portal"
    },
    "sourceFile": "app/portal/page.tsx"
  },
  {
    "id": "S11",
    "title": "Landing Hero",
    "route": "/",
    "routePattern": "/",
    "aliases": [],
    "actor": "public",
    "requiresAuth": false,
    "theme": "dark_core",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/"
    },
    "sourceFile": "app/page.tsx"
  },
  {
    "id": "S12",
    "title": "Landing Features & Value",
    "route": "/",
    "routePattern": "/",
    "aliases": [],
    "actor": "public",
    "requiresAuth": false,
    "theme": "dark_core",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/"
    },
    "sourceFile": "app/page.tsx"
  },
  {
    "id": "S13",
    "title": "Pricing Plans",
    "route": "/pricing",
    "routePattern": "/pricing",
    "aliases": [],
    "actor": "public",
    "requiresAuth": false,
    "theme": "dark_core",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/pricing"
    },
    "sourceFile": "app/pricing/page.tsx"
  },
  {
    "id": "S14",
    "title": "Secure Checkout",
    "route": "/checkout/secure",
    "routePattern": "/checkout/secure",
    "aliases": [],
    "actor": "public",
    "requiresAuth": false,
    "theme": "dark_core",
    "source": "stitch",
    "coverageLevel": "L2",
    "evidenceRequired": [
      "route-contract",
      "flow-critical",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/checkout/secure"
    },
    "sourceFile": "app/checkout/secure/page.tsx"
  },
  {
    "id": "S15",
    "title": "Login Dual Role",
    "route": "/auth/login",
    "routePattern": "/auth/login",
    "aliases": [],
    "actor": "public",
    "requiresAuth": false,
    "theme": "dark_core",
    "source": "derived",
    "coverageLevel": "L1",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/auth.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/auth/login"
    },
    "sourceFile": "app/auth/login/page.tsx"
  },
  {
    "id": "S16",
    "title": "Register Therapist",
    "route": "/auth/register",
    "routePattern": "/auth/register",
    "aliases": [],
    "actor": "public",
    "requiresAuth": false,
    "theme": "light_onboard",
    "source": "derived",
    "coverageLevel": "L1",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/auth.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/auth/register"
    },
    "sourceFile": "app/auth/register/page.tsx",
    "derivesFrom": [
      "S08"
    ]
  },
  {
    "id": "S17",
    "title": "Register Patient",
    "route": "/auth/register/patient",
    "routePattern": "/auth/register/patient",
    "aliases": [],
    "actor": "public",
    "requiresAuth": false,
    "theme": "light_patient",
    "source": "derived",
    "coverageLevel": "L1",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/auth.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/auth/register/patient"
    },
    "sourceFile": "app/auth/register/patient/page.tsx",
    "derivesFrom": [
      "S10"
    ]
  },
  {
    "id": "S18",
    "title": "Forgot Password",
    "route": "/auth/forgot-password",
    "routePattern": "/auth/forgot-password",
    "aliases": [],
    "actor": "public",
    "requiresAuth": false,
    "theme": "dark_core",
    "source": "derived",
    "coverageLevel": "L1",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/auth.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/auth/forgot-password"
    },
    "sourceFile": "app/auth/forgot-password/page.tsx"
  },
  {
    "id": "S19",
    "title": "Agenda Semanal",
    "route": "/dashboard/agenda",
    "routePattern": "/dashboard/agenda",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": true,
    "theme": "dark_core",
    "source": "derived",
    "coverageLevel": "L1",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/dashboard/agenda"
    },
    "sourceFile": "app/dashboard/agenda/page.tsx",
    "derivesFrom": [
      "S01",
      "S04"
    ]
  },
  {
    "id": "S20",
    "title": "Lista de Pacientes",
    "route": "/dashboard/pacientes",
    "routePattern": "/dashboard/pacientes",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": true,
    "theme": "dark_core",
    "source": "derived",
    "coverageLevel": "L1",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/dashboard/pacientes"
    },
    "sourceFile": "app/dashboard/pacientes/page.tsx",
    "derivesFrom": [
      "S04"
    ]
  },
  {
    "id": "S21",
    "title": "Settings Perfil",
    "route": "/dashboard/configuracoes/perfil",
    "routePattern": "/dashboard/configuracoes/perfil",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": true,
    "theme": "dark_core",
    "source": "derived",
    "coverageLevel": "L1",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/dashboard/configuracoes/perfil"
    },
    "sourceFile": "app/dashboard/configuracoes/perfil/page.tsx",
    "derivesFrom": [
      "S09"
    ]
  },
  {
    "id": "S22",
    "title": "Settings Integrações",
    "route": "/dashboard/configuracoes/integracoes",
    "routePattern": "/dashboard/configuracoes/integracoes",
    "aliases": [],
    "actor": "therapist",
    "requiresAuth": true,
    "theme": "dark_core",
    "source": "derived",
    "coverageLevel": "L1",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/dashboard/configuracoes/integracoes"
    },
    "sourceFile": "app/dashboard/configuracoes/integracoes/page.tsx",
    "derivesFrom": [
      "S09"
    ]
  },
  {
    "id": "S23",
    "title": "Patient Self-Booking",
    "route": "/portal/agendar",
    "routePattern": "/portal/agendar",
    "aliases": [
      "/agendar"
    ],
    "actor": "patient",
    "requiresAuth": true,
    "theme": "light_patient",
    "source": "derived",
    "coverageLevel": "L1",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/portal/agendar"
    },
    "sourceFile": "app/portal/agendar/page.tsx",
    "derivesFrom": [
      "S02",
      "S10"
    ]
  },
  {
    "id": "S24",
    "title": "Patient Sessions History",
    "route": "/portal/sessoes",
    "routePattern": "/portal/sessoes",
    "aliases": [
      "/sessoes"
    ],
    "actor": "patient",
    "requiresAuth": true,
    "theme": "light_patient",
    "source": "derived",
    "coverageLevel": "L1",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/portal/sessoes"
    },
    "sourceFile": "app/portal/sessoes/page.tsx",
    "derivesFrom": [
      "S10"
    ]
  },
  {
    "id": "S25",
    "title": "Patient AI Chat",
    "route": "/portal/chat",
    "routePattern": "/portal/chat",
    "aliases": [
      "/chat"
    ],
    "actor": "patient",
    "requiresAuth": true,
    "theme": "light_patient",
    "source": "derived",
    "coverageLevel": "L1",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/portal/chat"
    },
    "sourceFile": "app/portal/chat/page.tsx",
    "derivesFrom": [
      "S05",
      "S10"
    ]
  },
  {
    "id": "S26",
    "title": "Booking Confirmation",
    "route": "/booking/test-terapeuta/sucesso",
    "routePattern": "/booking/[slug]/sucesso",
    "aliases": [],
    "actor": "public",
    "requiresAuth": false,
    "theme": "dark_core",
    "source": "derived",
    "coverageLevel": "L1",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot"
    ],
    "testSpec": "e2e/booking.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/booking/[slug]/sucesso"
    },
    "sourceFile": "app/booking/[slug]/sucesso/page.tsx",
    "derivesFrom": [
      "S14"
    ]
  },
  {
    "id": "S27",
    "title": "Global Loading",
    "route": "__component__:app/loading.tsx",
    "routePattern": "__component__:app/loading.tsx",
    "aliases": [],
    "actor": "system",
    "requiresAuth": false,
    "theme": "dark_core",
    "source": "derived",
    "coverageLevel": "L3",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot",
      "visual-snapshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": false,
      "evidenceTarget": "component:app/loading.tsx"
    },
    "sourceFile": "app/loading.tsx"
  },
  {
    "id": "S28",
    "title": "Not Found / Global Error",
    "route": "/_mf00r_not_found_probe",
    "routePattern": "/_mf00r_not_found_probe",
    "aliases": [
      "app/global-error.tsx"
    ],
    "actor": "public",
    "requiresAuth": false,
    "theme": "dark_core",
    "source": "derived",
    "coverageLevel": "L3",
    "evidenceRequired": [
      "route-contract",
      "trace",
      "screenshot",
      "visual-snapshot"
    ],
    "testSpec": "e2e/screen-contract.spec.ts",
    "capture": {
      "capturable": true,
      "evidenceTarget": "route:/_mf00r_not_found_probe"
    },
    "sourceFile": "app/not-found.tsx | app/global-error.tsx"
  }
];

export const CAPTURABLE_SCREEN_CONTRACTS = SCREEN_CONTRACTS.filter((screen) => screen.capture.capturable);
