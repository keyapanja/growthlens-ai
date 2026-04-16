import nodemailer from "nodemailer";
import { PageSpeedReport, ReportCompetitor, StoredReport } from "@/lib/types";

export function canSendEmail() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.EMAIL_FROM
  );
}

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

function comparisonRows(report: StoredReport) {
  const sites = getComparedSites(report);
  const rows = [
    {
      label: "Page Load Speed",
      best: "min" as const,
      getValue: (pagespeed: PageSpeedReport) => pagespeed.mobile.vitals.lcp.value / 1000,
      format: (value: number) => `${value.toFixed(1)}s`
    },
    {
      label: "Performance",
      best: "max" as const,
      getValue: (pagespeed: PageSpeedReport) => pagespeed.mobile.categories.performance.score,
      format: (value: number) => `${Math.round(value)}`
    },
    {
      label: "SEO",
      best: "max" as const,
      getValue: (pagespeed: PageSpeedReport) => pagespeed.mobile.categories.seo.score,
      format: (value: number) => `${Math.round(value)}`
    }
  ];

  return rows.map((row) => {
    const values = sites.map((site) => row.getValue(site.pagespeed));
    const bestValue = row.best === "min" ? Math.min(...values) : Math.max(...values);
    const primaryValue = values[0];
    return {
      label: row.label,
      values: values.map((value) => row.format(value)),
      trend:
        primaryValue === bestValue
          ? "Leading"
          : row.best === "min"
            ? `${(primaryValue - bestValue).toFixed(1)}s behind`
            : `${Math.round(bestValue - primaryValue)} pts behind`
    };
  });
}

export async function sendReportEmail(report: StoredReport, recipient: string) {
  if (!canSendEmail()) {
    throw new Error("Email sending is not configured on this deployment.");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareLink = `${appUrl}/share/${report.shareId}`;
  const pdfLink = `${appUrl}/api/reports/${report.id}/pdf`;
  const comparedSites = getComparedSites(report);
  const summary = report.aiReport.competitor_comparison?.executive_summary ?? report.aiReport.summary;
  const rows = comparisonRows(report);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipient,
    subject: `GrowthLens AI report for ${displayUrl(report.url)}`,
    html: `
      <div style="margin:0;padding:32px;background:#0a0e14;color:#f1f3fc;font-family:Inter,Arial,sans-serif;">
        <div style="max-width:760px;margin:0 auto;border:1px solid rgba(68,72,79,.35);background:#151a21;border-radius:30px;padding:32px;">
          <div style="display:inline-block;margin-bottom:18px;padding:7px 14px;border-radius:999px;border:1px solid rgba(166,140,255,.22);background:rgba(166,140,255,.08);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#c8b8ff;font-weight:800;">AI Growth Intelligence</div>
          <div style="font-size:34px;line-height:1.05;font-weight:800;color:#f8faff;margin-bottom:14px;">Your growth report is ready.</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px;">
            ${comparedSites
              .map(
                (site, index) => `
                  <span style="font-size:20px;font-weight:700;color:${index === 0 ? "#81ecff" : "#d8caff"};">${displayUrl(site.url)}</span>
                  ${index < comparedSites.length - 1 ? '<span style="padding:6px 12px;border-radius:999px;background:#1d2330;border:1px solid rgba(68,72,79,.3);font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#a68cff;">vs</span>' : ''}
                `
              )
              .join("")}
          </div>
          <p style="font-size:16px;line-height:1.7;color:#a8abb3;margin:0 0 24px;">${summary}</p>

          <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:24px;">
            <div style="background:#1b2028;border:1px solid rgba(68,72,79,.25);border-radius:18px;padding:16px;">
              <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a8abb3;margin-bottom:6px;">Growth Score</div>
              <div style="font-size:26px;font-weight:800;color:#81ecff;">${report.aiReport.growth_score}</div>
            </div>
            <div style="background:#1b2028;border:1px solid rgba(68,72,79,.25);border-radius:18px;padding:16px;">
              <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a8abb3;margin-bottom:6px;">Mobile Score</div>
              <div style="font-size:26px;font-weight:800;color:#a68cff;">${report.aiReport.metrics.mobile_score}</div>
            </div>
            <div style="background:#1b2028;border:1px solid rgba(68,72,79,.25);border-radius:18px;padding:16px;">
              <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a8abb3;margin-bottom:6px;">Desktop Score</div>
              <div style="font-size:26px;font-weight:800;color:#6e9bff;">${report.aiReport.metrics.desktop_score}</div>
            </div>
            <div style="background:#1b2028;border:1px solid rgba(68,72,79,.25);border-radius:18px;padding:16px;">
              <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a8abb3;margin-bottom:6px;">SEO Score</div>
              <div style="font-size:26px;font-weight:800;color:#00d4ec;">${report.pagespeed.mobile.categories.seo.score}</div>
            </div>
          </div>

          ${comparedSites.length > 1 ? `
            <div style="margin-bottom:24px;background:#10161f;border:1px solid rgba(68,72,79,.25);border-radius:22px;padding:18px;">
              <div style="font-size:22px;font-weight:700;color:#f8faff;margin-bottom:16px;">How your site compares</div>
              <table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
                <thead>
                  <tr>
                    <th align="left" style="padding:8px 12px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a8abb3;">Metric</th>
                    ${comparedSites
                      .map(
                        (site, index) => `<th align="left" style="padding:8px 12px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:${index === 0 ? "#81ecff" : "#a8abb3"};">${index === 0 ? "Your Site" : `<a href="${site.url}" style="color:#a8abb3;text-decoration:none;">${displayUrl(site.url)}</a>`}</th>`
                      )
                      .join("")}
                    <th align="left" style="padding:8px 12px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a8abb3;">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows
                    .map(
                      (row) => `
                        <tr style="background:#1b2028;">
                          <td style="padding:14px 12px;border-radius:16px 0 0 16px;font-size:14px;font-weight:700;">${row.label}</td>
                          ${row.values
                            .map(
                              (value, index) => `<td style="padding:14px 12px;font-size:14px;color:${index === 0 ? "#81ecff" : "#d2d7e0"};font-weight:${index === 0 ? "800" : "500"};">${value}</td>`
                            )
                            .join("")}
                          <td style="padding:14px 12px;border-radius:0 16px 16px 0;font-size:14px;color:#d2d7e0;">${row.trend}</td>
                        </tr>
                      `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          ` : ""}

          <div style="margin-bottom:24px;background:#10161f;border:1px solid rgba(68,72,79,.25);border-radius:22px;padding:18px;">
            <div style="font-size:22px;font-weight:700;color:#f8faff;margin-bottom:14px;">Step-by-step Action Plan</div>
            <ol style="margin:0;padding-left:22px;">
              ${report.aiReport.step_by_step_plan
                .slice(0, 3)
                .map(
                  (step) => `
                    <li style="margin-bottom:14px;color:#f8faff;">
                      <div style="font-size:18px;font-weight:700;color:#f8faff;margin-bottom:4px;">${step.title}</div>
                      <div style="font-size:14px;line-height:1.7;color:#a8abb3;">${step.description}</div>
                    </li>
                  `
                )
                .join("")}
            </ol>
          </div>

          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
            <a href="${shareLink}" style="display:inline-block;background:#81ecff;color:#003840;text-decoration:none;border-radius:999px;padding:14px 20px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:800;">Open Report</a>
            <a href="${pdfLink}" style="display:inline-block;background:#20262f;color:#f1f3fc;text-decoration:none;border:1px solid rgba(68,72,79,.45);border-radius:999px;padding:14px 20px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:800;">Download PDF</a>
          </div>

          <div style="border-top:1px solid rgba(68,72,79,.3);padding-top:18px;color:#72757d;font-size:12px;">Copyright 2024 GrowthLens AI. All Intelligence Reserved.</div>
        </div>
      </div>
    `
  });
}
