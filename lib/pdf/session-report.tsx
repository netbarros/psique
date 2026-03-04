import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
    backgroundColor: "#FAFAF7",
  },
  header: {
    marginBottom: 24,
    borderBottom: "2px solid #52B788",
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1A1A17",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#8A8070",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1A1A17",
    marginBottom: 10,
    marginTop: 20,
    paddingBottom: 4,
    borderBottom: "1px solid #DDD7C8",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 100,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#8A8070",
    textTransform: "uppercase",
  },
  infoValue: {
    flex: 1,
    fontSize: 10,
    color: "#1A1A17",
  },
  sessionCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    border: "1px solid #E5E1D8",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sessionNumber: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#52B788",
  },
  sessionDate: {
    fontSize: 9,
    color: "#8A8070",
  },
  moodRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 9,
    color: "#8A8070",
  },
  summary: {
    fontSize: 9,
    color: "#555",
    lineHeight: 1.5,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    border: "1px solid #E5E1D8",
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#52B788",
  },
  statLabel: {
    fontSize: 8,
    color: "#8A8070",
    marginTop: 4,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#8A8070",
    borderTop: "1px solid #DDD7C8",
    paddingTop: 8,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottom: "1px solid #F0EDE5",
  },
});

interface SessionReportProps {
  therapist: { name: string; crp: string };
  patient: { name: string; email: string; cpf: string | null };
  sessions: Array<{
    sessionNumber: number;
    date: string;
    durationSeconds: number | null;
    moodBefore: number | null;
    moodAfter: number | null;
    aiSummary: string | null;
    npsScore: number | null;
  }>;
  payments: Array<{
    amount: number;
    paidAt: string | null;
  }>;
  dateRange: { from: string; to: string };
}

function formatDateBR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

function moodEmoji(score: number | null): string {
  if (score === null) return "—";
  if (score <= 2) return `😔 ${score}/5`;
  if (score <= 3) return `😐 ${score}/5`;
  return `😊 ${score}/5`;
}

export function SessionReportDocument(props: SessionReportProps) {
  const { therapist, patient, sessions, payments, dateRange } = props;

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const avgMoodBefore =
    sessions.filter((s) => s.moodBefore !== null).length > 0
      ? (
          sessions.reduce((s, x) => s + (x.moodBefore ?? 0), 0) /
          sessions.filter((s) => s.moodBefore !== null).length
        ).toFixed(1)
      : "—";
  const avgMoodAfter =
    sessions.filter((s) => s.moodAfter !== null).length > 0
      ? (
          sessions.reduce((s, x) => s + (x.moodAfter ?? 0), 0) /
          sessions.filter((s) => s.moodAfter !== null).length
        ).toFixed(1)
      : "—";
  const avgNps =
    sessions.filter((s) => s.npsScore !== null).length > 0
      ? (
          sessions.reduce((s, x) => s + (x.npsScore ?? 0), 0) /
          sessions.filter((s) => s.npsScore !== null).length
        ).toFixed(1)
      : "—";

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, "Ψ Relatório Terapêutico"),
        React.createElement(
          Text,
          { style: styles.subtitle },
          `${therapist.name} — CRP ${therapist.crp} · Período: ${formatDateBR(dateRange.from)} a ${formatDateBR(dateRange.to)}`
        )
      ),

      // Patient info
      React.createElement(
        Text,
        { style: styles.sectionTitle },
        "Dados do Paciente"
      ),
      React.createElement(
        View,
        { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Nome"),
        React.createElement(Text, { style: styles.infoValue }, patient.name)
      ),
      React.createElement(
        View,
        { style: styles.infoRow },
        React.createElement(Text, { style: styles.infoLabel }, "Email"),
        React.createElement(Text, { style: styles.infoValue }, patient.email)
      ),
      patient.cpf
        ? React.createElement(
            View,
            { style: styles.infoRow },
            React.createElement(Text, { style: styles.infoLabel }, "CPF"),
            React.createElement(Text, { style: styles.infoValue }, patient.cpf)
          )
        : null,

      // Stats
      React.createElement(
        View,
        { style: styles.statsRow },
        React.createElement(
          View,
          { style: styles.statBox },
          React.createElement(Text, { style: styles.statValue }, String(sessions.length)),
          React.createElement(Text, { style: styles.statLabel }, "Sessões")
        ),
        React.createElement(
          View,
          { style: styles.statBox },
          React.createElement(Text, { style: styles.statValue }, avgMoodBefore),
          React.createElement(Text, { style: styles.statLabel }, "Humor Médio (antes)")
        ),
        React.createElement(
          View,
          { style: styles.statBox },
          React.createElement(Text, { style: styles.statValue }, avgMoodAfter),
          React.createElement(Text, { style: styles.statLabel }, "Humor Médio (após)")
        ),
        React.createElement(
          View,
          { style: styles.statBox },
          React.createElement(Text, { style: styles.statValue }, avgNps),
          React.createElement(Text, { style: styles.statLabel }, "NPS Médio")
        )
      ),

      // Sessions
      React.createElement(
        Text,
        { style: styles.sectionTitle },
        "Sessões Realizadas"
      ),
      ...sessions.map((session) =>
        React.createElement(
          View,
          { key: session.sessionNumber, style: styles.sessionCard },
          React.createElement(
            View,
            { style: styles.sessionHeader },
            React.createElement(
              Text,
              { style: styles.sessionNumber },
              `Sessão #${session.sessionNumber}`
            ),
            React.createElement(
              Text,
              { style: styles.sessionDate },
              `${formatDateBR(session.date)} · ${formatDuration(session.durationSeconds)}`
            )
          ),
          React.createElement(
            View,
            { style: styles.moodRow },
            React.createElement(
              Text,
              { style: styles.moodLabel },
              `Humor antes: ${moodEmoji(session.moodBefore)}`
            ),
            React.createElement(
              Text,
              { style: styles.moodLabel },
              `Humor após: ${moodEmoji(session.moodAfter)}`
            ),
            session.npsScore !== null
              ? React.createElement(
                  Text,
                  { style: styles.moodLabel },
                  `NPS: ${session.npsScore}/10`
                )
              : null
          ),
          session.aiSummary
            ? React.createElement(
                Text,
                { style: styles.summary },
                session.aiSummary
              )
            : null
        )
      ),

      // Payments
      payments.length > 0
        ? React.createElement(
            View,
            null,
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              "Histórico Financeiro"
            ),
            ...payments.map((p, i) =>
              React.createElement(
                View,
                { key: i, style: styles.paymentRow },
                React.createElement(
                  Text,
                  { style: { fontSize: 9 } },
                  p.paidAt ? formatDateBR(p.paidAt) : "—"
                ),
                React.createElement(
                  Text,
                  { style: { fontSize: 9, fontFamily: "Helvetica-Bold" } },
                  `R$ ${p.amount.toFixed(2)}`
                )
              )
            ),
            React.createElement(
              View,
              {
                style: {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 8,
                  paddingTop: 6,
                  borderTop: "1px solid #DDD7C8",
                },
              },
              React.createElement(
                Text,
                { style: { fontSize: 10, fontFamily: "Helvetica-Bold" } },
                "Total"
              ),
              React.createElement(
                Text,
                {
                  style: {
                    fontSize: 10,
                    fontFamily: "Helvetica-Bold",
                    color: "#52B788",
                  },
                },
                `R$ ${totalPaid.toFixed(2)}`
              )
            )
          )
        : null,

      // Footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(
          Text,
          null,
          `Gerado em ${new Date().toLocaleDateString("pt-BR")} — Ψ Psique`
        ),
        React.createElement(
          Text,
          null,
          "Documento confidencial — LGPD Art. 7, §5"
        )
      )
    )
  );
}
