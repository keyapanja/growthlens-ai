import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getReportById } from "@/lib/db";
import { ReportPdfDocument } from "@/lib/report-pdf-document";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const appUrl = new URL(request.url).origin;
  const pdfBuffer = await renderToBuffer(<ReportPdfDocument report={report} appUrl={appUrl} />);
  const pdfBytes = new Uint8Array(pdfBuffer);

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="growthlens-report-${id}.pdf"`
    }
  });
}
