import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { ReportDashboard } from "@/components/report/report-dashboard";
import { getReportById } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = getReportById(id);

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
