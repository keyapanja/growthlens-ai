import { NextResponse } from "next/server";
import { z } from "zod";
import { canSendEmail, sendReportEmail } from "@/lib/email";
import { getReportById } from "@/lib/db";

const bodySchema = z.object({
  email: z.string().email()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = getReportById(id);

  if (!report) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }

  if (!canSendEmail()) {
    return NextResponse.json(
      { message: "Email delivery is not configured yet. Add SMTP env vars to enable it." },
      { status: 501 }
    );
  }

  try {
    const json = await request.json();
    const { email } = bodySchema.parse(json);
    await sendReportEmail(report, email);

    return NextResponse.json({ message: `Report sent to ${email}.` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send the email.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
