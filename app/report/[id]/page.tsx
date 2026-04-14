import { notFound } from "next/navigation";
import { ReportDashboard } from "@/components/report/report-dashboard";
import { getReportById } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <ReportDashboard initialReport={report} />
    </main>
  );
}
