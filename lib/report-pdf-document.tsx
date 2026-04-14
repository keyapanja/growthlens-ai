import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { StoredReport } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0a0e14",
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
    color: "#a8abb3",
    marginBottom: 16
  },
  card: {
    backgroundColor: "#1b2028",
    borderWidth: 1,
    borderColor: "#44484f",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12
  },
  row: {
    flexDirection: "row",
    marginBottom: 12
  },
  col: {
    flexGrow: 1
  },
  metricLabel: {
    color: "#a8abb3",
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
    color: "#a8abb3",
    fontSize: 9
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#20262f",
    borderRadius: 8,
    padding: 8,
    marginBottom: 6
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#44484f"
  },
  cellLg: {
    width: "40%"
  },
  cell: {
    width: "20%"
  },
  comparisonHero: {
    backgroundColor: "#0d1a2d",
    borderWidth: 1,
    borderColor: "#21415f",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12
  },
  labelSm: {
    color: "#a8abb3",
    fontSize: 9,
    marginBottom: 4
  },
  scoreLg: {
    fontSize: 24,
    fontWeight: 700
  },
  cellQuarter: {
    width: "25%"
  }
});

export function ReportPdfDocument({ report }: { report: StoredReport }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const primaryScore = report.aiReport.growth_score;
  const mobile = report.pagespeed.mobile;
  const desktop = report.pagespeed.desktop;
  const competitor = report.competitorPagespeed;
  const competitorOverall = competitor
    ? Math.round((competitor.mobile.overallScore + competitor.desktop.overallScore) / 2)
    : null;
  const currentOverall = Math.round((mobile.overallScore + desktop.overallScore) / 2);

  return (
    <Document title={`GrowthLens AI Report - ${report.url}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>GrowthLens AI Report</Text>
        <Text style={styles.subheading}>
          {report.url} | Generated {new Date(report.updatedAt).toLocaleString("en-IN")}
        </Text>

        <View style={styles.row}>
          <View style={[styles.card, styles.col, { marginRight: 6 }]}>
            <Text style={styles.metricLabel}>Growth Score</Text>
            <Text style={styles.metricValue}>{primaryScore}/100</Text>
          </View>
          <View style={[styles.card, styles.col, { marginLeft: 6 }]}>
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
          <View style={[styles.card, styles.col, { marginRight: 6 }]}>
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
          <View style={[styles.card, styles.col, { marginLeft: 6 }]}>
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
          Generated by GrowthLens AI ({appUrl}) | {report.url} |{" "}
          {new Date(report.updatedAt).toLocaleDateString("en-IN")}
        </Text>
      </Page>

      {competitor ? (
        <Page size="A4" style={styles.page}>
          <Text style={styles.heading}>Competitor Comparison</Text>
          <Text style={styles.subheading}>
            {report.url} vs {competitor.url}
          </Text>

          <View style={styles.row}>
            <View style={[styles.comparisonHero, styles.col, { marginRight: 6 }]}>
              <Text style={styles.labelSm}>Your website</Text>
              <Text style={styles.listItem}>{report.url}</Text>
              <Text style={styles.scoreLg}>{currentOverall}</Text>
              <Text style={styles.metricLabel}>Overall score</Text>
            </View>
            <View style={[styles.comparisonHero, styles.col, { marginLeft: 6 }]}>
              <Text style={styles.labelSm}>Competitor website</Text>
              <Text style={styles.listItem}>{competitor.url}</Text>
              <Text style={styles.scoreLg}>{competitorOverall}</Text>
              <Text style={styles.metricLabel}>Overall score</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Comparison Summary</Text>
            <Text>
              {report.aiReport.competitor_comparison?.summary ??
                "This report includes a competitor benchmark to show where the analyzed website is ahead and where it needs improvement."}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mobile Comparison</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.cellLg}>Area</Text>
              <Text style={styles.cell}>Your Site</Text>
              <Text style={styles.cell}>Competitor</Text>
              <Text style={styles.cell}>Leader</Text>
            </View>
            {[
              ["Performance", mobile.categories.performance.score, competitor.mobile.categories.performance.score],
              ["Accessibility", mobile.categories.accessibility.score, competitor.mobile.categories.accessibility.score],
              ["Best Practices", mobile.categories.best_practices.score, competitor.mobile.categories.best_practices.score],
              ["SEO", mobile.categories.seo.score, competitor.mobile.categories.seo.score]
            ].map(([label, own, comp]) => (
              <View key={`mobile-${label}`} style={styles.tableRow}>
                <Text style={styles.cellLg}>{String(label)}</Text>
                <Text style={styles.cell}>{String(own)}</Text>
                <Text style={styles.cell}>{String(comp)}</Text>
                <Text style={styles.cell}>
                  {Number(own) === Number(comp) ? "Tie" : Number(own) > Number(comp) ? "Your site" : "Competitor"}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Desktop Comparison</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.cellLg}>Area</Text>
              <Text style={styles.cell}>Your Site</Text>
              <Text style={styles.cell}>Competitor</Text>
              <Text style={styles.cell}>Leader</Text>
            </View>
            {[
              ["Performance", desktop.categories.performance.score, competitor.desktop.categories.performance.score],
              ["Accessibility", desktop.categories.accessibility.score, competitor.desktop.categories.accessibility.score],
              ["Best Practices", desktop.categories.best_practices.score, competitor.desktop.categories.best_practices.score],
              ["SEO", desktop.categories.seo.score, competitor.desktop.categories.seo.score]
            ].map(([label, own, comp]) => (
              <View key={`desktop-${label}`} style={styles.tableRow}>
                <Text style={styles.cellLg}>{String(label)}</Text>
                <Text style={styles.cell}>{String(own)}</Text>
                <Text style={styles.cell}>{String(comp)}</Text>
                <Text style={styles.cell}>
                  {Number(own) === Number(comp) ? "Tie" : Number(own) > Number(comp) ? "Your site" : "Competitor"}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recommended Actions</Text>
            {(report.aiReport.competitor_comparison?.outperform_actions ?? []).map((action, index) => (
              <Text key={action + index} style={styles.listItem}>
                {index + 1}. {action}
              </Text>
            ))}
          </View>

          <Text style={styles.footer}>
            Generated by GrowthLens AI ({appUrl}) | {report.url} vs {competitor.url} |{" "}
            {new Date(report.updatedAt).toLocaleDateString("en-IN")}
          </Text>
        </Page>
      ) : null}
    </Document>
  );
}

