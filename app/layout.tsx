import type { Metadata } from "next";
import "./globals.css";
import { Toast } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";


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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bg-base text-text-primary">
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {children}
          <Toast />
        </ThemeProvider>
      </body>
    </html>
  );
}
