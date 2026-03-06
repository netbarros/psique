import type { Metadata } from "next";
import { Cormorant_Garamond, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Toast } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Psique — Plataforma Terapêutica",
    template: "%s | Psique",
  },
  description:
    "A única plataforma que cuida de quem cuida — agenda inteligente, videochamadas HD, IA clínica e Telegram bot para psicanalistas.",
  keywords: ["psicanálise", "psicólogo", "terapeuta", "agenda", "LGPD", "telemedicina"],
  authors: [{ name: "Software Lotus", url: "https://psique.app" }],
  openGraph: {
    title: "Psique — Plataforma Terapêutica",
    description: "A plataforma com IA para psicanalistas gerenciarem sua prática clínica.",
    url: "https://psique.app",
    siteName: "Psique",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Psique — Plataforma Terapêutica",
    description: "A plataforma com IA para psicanalistas.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${instrumentSans.variable} ${cormorantGaramond.variable} bg-bg-base text-text-primary`}>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {children}
          <Toast />
        </ThemeProvider>
      </body>
    </html>
  );
}
