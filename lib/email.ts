import nodemailer from "nodemailer";
import { StoredReport } from "@/lib/types";

export function canSendEmail() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.EMAIL_FROM
  );
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

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipient,
    subject: `GrowthLens AI report for ${report.url}`,
    html: `
      <div style="margin:0;padding:32px;background:#0a0e14;color:#f1f3fc;font-family:Inter,Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;border:1px solid #44484f33;background:#151a21;border-radius:28px;padding:32px;">
          <div style="font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:#81ecff;font-weight:800;margin-bottom:20px;">GrowthLens AI</div>
          <h1 style="font-size:32px;line-height:1.1;margin:0 0 16px;color:#f8faff;">Your growth report is ready.</h1>
          <p style="font-size:15px;line-height:1.7;color:#a8abb3;margin:0 0 24px;">The analysis for <strong style="color:#81ecff;">${report.url}</strong> is ready with a growth score of <strong style="color:#a68cff;">${report.aiReport.growth_score}/100</strong>.</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
            <a href="${shareLink}" style="display:inline-block;background:#81ecff;color:#003840;text-decoration:none;border-radius:999px;padding:14px 20px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:800;">Open Report</a>
            <a href="${pdfLink}" style="display:inline-block;background:#20262f;color:#f1f3fc;text-decoration:none;border:1px solid #44484f55;border-radius:999px;padding:14px 20px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:800;">Download PDF</a>
          </div>
          <div style="border-top:1px solid #44484f33;padding-top:18px;color:#72757d;font-size:12px;">Copyright 2024 GrowthLens AI. All Intelligence Reserved.</div>
        </div>
      </div>
    `
  });
}
