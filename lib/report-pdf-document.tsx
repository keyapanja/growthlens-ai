import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { PageSpeedReport, ReportCompetitor, StoredReport } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0a0e14",
    color: "#f8fafc",
    fontSize: 11,
    paddingTop: 28,
    paddingBottom: 26,
    paddingHorizontal: 28
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8
  },
  subheading: {
    fontSize: 12,
    color: "#a8abb3",
    marginBottom: 16
  },
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#4c3b85",
    backgroundColor: "#241c44",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12
  },
  badgeText: {
    fontSize: 10,
    color: "#c8b8ff",
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  heroCard: {
    backgroundColor: "#0f141a",
    borderWidth: 1,
    borderColor: "#26303d",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16
  },
  scoreBubble: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 7,
    borderColor: "#81ecff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18
  },
  row: { flexDirection: "row" },
  grow: { flexGrow: 1 },
  metricGrid: {
    flexDirection: "row",
    marginHorizontal: -6,
    marginBottom: 16
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: "#1b2028",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2d3642",
    padding: 14,
    marginHorizontal: 6
  },
  metricLabel: {
    color: "#a8abb3",
    fontSize: 10,
    textTransform: "uppercase",
    marginBottom: 4
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 700
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 10
  },
  card: {
    backgroundColor: "#1b2028",
    borderWidth: 1,
    borderColor: "#2d3642",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14
  },
  body: {
    color: "#dbe3ee",
    lineHeight: 1.5
  },
  smallMuted: {
    color: "#a8abb3",
    fontSize: 10
  },
  table: {
    borderWidth: 1,
    borderColor: "#2d3642",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#161d26",
    paddingVertical: 9,
    paddingHorizontal: 10
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#2d3642"
  },
  metricCell: {
    width: 120,
    paddingRight: 8
  },
  siteCell: {
    flexGrow: 1,
    flexBasis: 0,
    paddingRight: 8
  },
  trendCell: {
    width: 86
  },
  planRow: {
    flexDirection: "row",
    marginBottom: 12
  },
  planNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#81ecff",
    color: "#003840",
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
    paddingTop: 7,
    marginRight: 12
  },
  footer: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 14,
    textAlign: "center",
    color: "#7a818e",
    fontSize: 9
  }
});

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function getCompetitors(report: StoredReport): ReportCompetitor[] {
  if (report.competitors?.length) return report.competitors;
  if (report.competitorPagespeed) {
    return [{ url: report.competitorPagespeed.url, pagespeed: report.competitorPagespeed }];
  }
  return [];
}

function getComparedSites(report: StoredReport) {
  return [{ url: report.url, pagespeed: report.pagespeed }, ...getCompetitors(report).map((competitor) => ({
    url: competitor.url,
    pagespeed: competitor.pagespeed
  }))];
}

function overallScore(pagespeed: PageSpeedReport) {
  return Math.round((pagespeed.mobile.overallScore + pagespeed.desktop.overallScore) / 2);
}

function buildComparisonRows(report: StoredReport) {
  const sites = getComparedSites(report);
  const rows = [
    {
      label: "Page Load Speed",
      best: "min" as const,
      getValue: (pagespeed: PageSpeedReport) => pagespeed.mobile.vitals.lcp.value / 1000,
      format: (value: number) => `${value.toFixed(1)}s`
    },
    {
      label: "Performance Score",
      best: "max" as const,
      getValue: (pagespeed: PageSpeedReport) => pagespeed.mobile.categories.performance.score,
      format: (value: number) => `${Math.round(value)}`
    },
    {
      label: "Accessibility",
      best: "max" as const,
      getValue: (pagespeed: PageSpeedReport) => pagespeed.mobile.categories.accessibility.score,
      format: (value: number) => `${Math.round(value)}`
    },
    {
      label: "SEO Score",
      best: "max" as const,
      getValue: (pagespeed: PageSpeedReport) => pagespeed.mobile.categories.seo.score,
      format: (value: number) => `${Math.round(value)}`
    }
  ];

  return rows.map((row) => {
    const values = sites.map((site) => row.getValue(site.pagespeed));
    const bestValue = row.best === "min" ? Math.min(...values) : Math.max(...values);
    const primaryValue = values[0];
    const primaryLeads = primaryValue === bestValue;
    const gap = row.best === "min" ? primaryValue - bestValue : bestValue - primaryValue;

    return {
      label: row.label,
      values: values.map((value) => row.format(value)),
      trend: primaryLeads ? "Leading" : row.best === "min" ? `${gap.toFixed(1)}s behind` : `${Math.round(gap)} behind`
    };
  });
}

export function ReportPdfDocument({ report }: { report: StoredReport }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const comparedSites = getComparedSites(report);
  const comparisonRows = buildComparisonRows(report);
  const mobile = report.pagespeed.mobile;
  const desktop = report.pagespeed.desktop;
  const executiveSummary = report.aiReport.competitor_comparison?.executive_summary;

  return (
    <Document title={`GrowthLens AI Report - ${report.url}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AI Growth Intelligence</Text>
        </View>
        <Text style={styles.heading}>Your growth report is ready.</Text>
        <Text style={styles.subheading}>
          {comparedSites.map((site) => displayUrl(site.url)).join("  vs  ")} | Generated {new Date(report.updatedAt).toLocaleString("en-IN")}
        </Text>

        <View style={styles.heroCard}>
          <View style={styles.row}>
            <View style={styles.scoreBubble}>
              <Text style={{ fontSize: 32, fontWeight: 700 }}>{report.aiReport.growth_score}</Text>
              <Text style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#81ecff" }}>Score</Text>
            </View>
            <View style={styles.grow}>
              <Text style={[styles.body, { fontSize: 16, fontWeight: 600, marginBottom: 10 }]}>{report.aiReport.summary}</Text>
              <Text style={styles.body}>{report.aiReport.ai_insight}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricGrid}>
          <View style={styles.metricCard}><Text style={styles.metricLabel}>Growth Score</Text><Text style={[styles.metricValue, { color: "#81ecff" }]}>{report.aiReport.growth_score}</Text></View>
          <View style={styles.metricCard}><Text style={styles.metricLabel}>Mobile Score</Text><Text style={[styles.metricValue, { color: "#a68cff" }]}>{report.aiReport.metrics.mobile_score}</Text></View>
          <View style={styles.metricCard}><Text style={styles.metricLabel}>Desktop Score</Text><Text style={[styles.metricValue, { color: "#6e9bff" }]}>{report.aiReport.metrics.desktop_score}</Text></View>
          <View style={styles.metricCard}><Text style={styles.metricLabel}>SEO Score</Text><Text style={[styles.metricValue, { color: "#00d4ec" }]}>{mobile.categories.seo.score}</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Performance Snapshot</Text>
          <View style={styles.row}>
            <View style={[styles.grow, { marginRight: 10 }]}>
              <Text style={styles.smallMuted}>Mobile</Text>
              <Text style={styles.body}>FCP {mobile.vitals.fcp.displayValue}</Text>
              <Text style={styles.body}>LCP {mobile.vitals.lcp.displayValue}</Text>
              <Text style={styles.body}>TBT {mobile.vitals.tbt.displayValue}</Text>
              <Text style={styles.body}>CLS {mobile.vitals.cls.displayValue}</Text>
            </View>
            <View style={styles.grow}>
              <Text style={styles.smallMuted}>Desktop</Text>
              <Text style={styles.body}>FCP {desktop.vitals.fcp.displayValue}</Text>
              <Text style={styles.body}>LCP {desktop.vitals.lcp.displayValue}</Text>
              <Text style={styles.body}>TBT {desktop.vitals.tbt.displayValue}</Text>
              <Text style={styles.body}>CLS {desktop.vitals.cls.displayValue}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Search Messaging Analysis</Text>
          <Text style={[styles.smallMuted, { marginBottom: 4 }]}>Recommended Meta Title</Text>
          <Text style={[styles.body, { marginBottom: 10 }]}>{report.aiReport.seo_strategy.titleTag}</Text>
          <Text style={[styles.smallMuted, { marginBottom: 4 }]}>AI Suggested Meta Description</Text>
          <Text style={[styles.body, { marginBottom: 10 }]}>{report.aiReport.seo_strategy.metaDescription}</Text>
          <Text style={[styles.smallMuted, { marginBottom: 4 }]}>Target Keywords</Text>
          <Text style={styles.body}>{report.aiReport.seo_strategy.keywords.join(", ")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Top Issues to Address</Text>
          {report.aiReport.top_issues.slice(0, 3).map((issue, index) => (
            <Text key={`${issue.title}-${index}`} style={[styles.body, { marginBottom: 8 }]}>
              {index + 1}. {issue.title} - {issue.fix}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Step-by-step Action Plan</Text>
          {report.aiReport.step_by_step_plan.slice(0, 4).map((step, index) => (
            <View key={`${step.title}-${index}`} style={styles.planRow}>
              <Text style={styles.planNumber}>{index + 1}</Text>
              <View style={styles.grow}>
                <Text style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{step.title}</Text>
                <Text style={styles.body}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated by GrowthLens AI ({appUrl}) | {displayUrl(report.url)} | {new Date(report.updatedAt).toLocaleDateString("en-IN")}
        </Text>
      </Page>

      {comparedSites.length > 1 ? (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <Text style={styles.heading}>Competitor Comparison</Text>
          <Text style={styles.subheading}>{comparedSites.map((site) => displayUrl(site.url)).join("  vs  ")}</Text>

          <View style={styles.metricGrid}>
            {comparedSites.map((site) => (
              <View key={site.url} style={styles.metricCard}>
                <Text style={styles.metricLabel}>{site.url === report.url ? "Your Site" : "Competitor"}</Text>
                <Text style={[styles.metricValue, { color: site.url === report.url ? "#81ecff" : "#d8caff" }]}>{overallScore(site.pagespeed)}</Text>
                <Text style={[styles.smallMuted, { marginTop: 4 }]}>{displayUrl(site.url)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <Text style={styles.body}>{executiveSummary ?? "This report includes competitor benchmarking to show where the primary website is leading and where it still has room to improve."}</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.smallMuted, styles.metricCell]}>Metric</Text>
              {comparedSites.map((site) => <Text key={site.url} style={[styles.smallMuted, styles.siteCell]}>{site.url === report.url ? "Your Site" : displayUrl(site.url)}</Text>)}
              <Text style={[styles.smallMuted, styles.trendCell]}>Trend</Text>
            </View>
            {comparisonRows.map((row) => (
              <View key={row.label} style={styles.tableRow}>
                <Text style={[styles.body, styles.metricCell, { fontWeight: 700 }]}>{row.label}</Text>
                {row.values.map((value, index) => <Text key={`${row.label}-${index}`} style={index === 0 ? [styles.body, styles.siteCell, { color: "#81ecff", fontWeight: 700 }] : [styles.body, styles.siteCell]}>{value}</Text>)}
                <Text style={[styles.body, styles.trendCell]}>{row.trend}</Text>
              </View>
            ))}
          </View>

          {report.aiReport.competitor_comparison?.insights?.length ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Competitive Highlights</Text>
              {report.aiReport.competitor_comparison.insights.map((insight) => (
                <View key={insight.website} style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{insight.website}</Text>
                  <Text style={styles.body}>Strongest area: {insight.strongest_area}. Weakest area: {insight.weakest_area}. {insight.why_it_wins} {insight.why_it_lags}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.footer}>Generated by GrowthLens AI ({appUrl}) | {comparedSites.map((site) => displayUrl(site.url)).join(" vs ")}</Text>
        </Page>
      ) : null}
    </Document>
  );
}
