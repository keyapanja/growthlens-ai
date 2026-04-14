import { notFound } from "next/navigation";
import { ReportDashboard } from "@/components/report/report-dashboard";
import { getReportByShareId } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SharedReportPage({
  params
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const report = await getReportByShareId(shareId);

  if (!report) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <ReportDashboard initialReport={report} />
    </main>
  );
}
