import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer";
import { StoredReport } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#08101f",
    color: "#f8fafc",
    fontSize: 11,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 30
  },
  heading: {
    fontSize: 24,
    marginBottom: 8,
    fontWeight: 700
  },
  subheading: {
    fontSize: 12,
    color: "#cbd5e1",
    marginBottom: 16
  },
  card: {
    backgroundColor: "#0f172a",
    border: "1 solid #1e293b",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  col: {
    flexGrow: 1
  },
  metricLabel: {
    color: "#94a3b8",
    fontSize: 10,
    marginBottom: 4
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 700
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 8
  },
  listItem: {
    marginBottom: 6,
    lineHeight: 1.45
  },
  footer: {
    position: "absolute",
    left: 30,
    right: 30,
    bottom: 16,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 9
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#111c33",
    borderRadius: 8,
    padding: 8,
    marginBottom: 6
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottom: "1 solid #172554"
  },
  cellLg: {
    width: "40%"
  },
  cell: {
    width: "20%"
  }
});

export function ReportPdfDocument({ report }: { report: StoredReport }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const primaryScore = report.aiReport.growth_score;
  const mobile = report.pagespeed.mobile;
  const desktop = report.pagespeed.desktop;

  return (
    <Document title={`GrowthLens AI Report - ${report.url}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>GrowthLens AI Report</Text>
        <Text style={styles.subheading}>
          {report.url} • Generated {new Date(report.updatedAt).toLocaleString("en-IN")}
        </Text>

        <View style={styles.row}>
          <View style={[styles.card, styles.col]}>
            <Text style={styles.metricLabel}>Growth Score</Text>
            <Text style={styles.metricValue}>{primaryScore}/100</Text>
          </View>
          <View style={[styles.card, styles.col]}>
            <Text style={styles.metricLabel}>Potential Score</Text>
            <Text style={styles.metricValue}>{report.aiReport.score_prediction.potential}/100</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text>{report.aiReport.summary}</Text>
          <Text style={{ marginTop: 8 }}>{report.aiReport.ai_insight}</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, styles.col]}>
            <Text style={styles.sectionTitle}>Mobile Snapshot</Text>
            <Text style={styles.listItem}>Performance: {mobile.categories.performance.score}</Text>
            <Text style={styles.listItem}>Accessibility: {mobile.categories.accessibility.score}</Text>
            <Text style={styles.listItem}>Best Practices: {mobile.categories.best_practices.score}</Text>
            <Text style={styles.listItem}>SEO: {mobile.categories.seo.score}</Text>
            <Text style={styles.listItem}>FCP: {mobile.vitals.fcp.displayValue}</Text>
            <Text style={styles.listItem}>LCP: {mobile.vitals.lcp.displayValue}</Text>
            <Text style={styles.listItem}>TBT: {mobile.vitals.tbt.displayValue}</Text>
            <Text style={styles.listItem}>CLS: {mobile.vitals.cls.displayValue}</Text>
          </View>
          <View style={[styles.card, styles.col]}>
            <Text style={styles.sectionTitle}>Desktop Snapshot</Text>
            <Text style={styles.listItem}>Performance: {desktop.categories.performance.score}</Text>
            <Text style={styles.listItem}>Accessibility: {desktop.categories.accessibility.score}</Text>
            <Text style={styles.listItem}>Best Practices: {desktop.categories.best_practices.score}</Text>
            <Text style={styles.listItem}>SEO: {desktop.categories.seo.score}</Text>
            <Text style={styles.listItem}>FCP: {desktop.vitals.fcp.displayValue}</Text>
            <Text style={styles.listItem}>LCP: {desktop.vitals.lcp.displayValue}</Text>
            <Text style={styles.listItem}>TBT: {desktop.vitals.tbt.displayValue}</Text>
            <Text style={styles.listItem}>CLS: {desktop.vitals.cls.displayValue}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Top Issues & Fixes</Text>
          {report.aiReport.top_issues.map((issue, index) => (
            <Text key={issue.title + index} style={styles.listItem}>
              {index + 1}. {issue.title}: {issue.fix}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fix Priority Table</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.cellLg}>Fix</Text>
            <Text style={styles.cell}>Impact</Text>
            <Text style={styles.cell}>Difficulty</Text>
            <Text style={styles.cell}>Priority</Text>
          </View>
          {report.aiReport.priority_fixes.map((row) => (
            <View key={row.fix} style={styles.tableRow}>
              <Text style={styles.cellLg}>{row.fix}</Text>
              <Text style={styles.cell}>{row.impact}</Text>
              <Text style={styles.cell}>{row.difficulty}</Text>
              <Text style={styles.cell}>{row.priority}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Step-by-Step Plan</Text>
          {report.aiReport.step_by_step_plan.map((step, index) => (
            <Text key={step + index} style={styles.listItem}>
              {index + 1}. {step}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SEO Strategy</Text>
          <Text style={styles.listItem}>Title: {report.aiReport.seo_strategy.titleTag}</Text>
          <Text style={styles.listItem}>
            Meta Description: {report.aiReport.seo_strategy.metaDescription}
          </Text>
          <Text style={styles.listItem}>
            Keywords: {report.aiReport.seo_strategy.keywords.join(", ")}
          </Text>
          <Text>{report.aiReport.seo_strategy.contentAngle}</Text>
        </View>

        <Text style={styles.footer}>
          Generated by GrowthLens AI ({appUrl}) • {report.url} •{" "}
          {new Date(report.updatedAt).toLocaleDateString("en-IN")}
        </Text>
      </Page>
    </Document>
  );
}
