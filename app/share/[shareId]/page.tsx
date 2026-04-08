import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { ReportDashboard } from "@/components/report/report-dashboard";
import { getReportByShareId } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SharedReportPage({
  params
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const report = getReportByShareId(shareId);

  if (!report) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="section-shell py-10">
        <ReportDashboard initialReport={report} />
      </section>
    </main>
  );
}
