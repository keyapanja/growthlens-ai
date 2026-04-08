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
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2>GrowthLens AI report ready</h2>
        <p>Your website analysis for <strong>${report.url}</strong> is ready.</p>
        <p><a href="${shareLink}">Open shared report</a></p>
        <p><a href="${pdfLink}">Download PDF</a></p>
      </div>
    `
  });
}
