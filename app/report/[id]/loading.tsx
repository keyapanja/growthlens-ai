import { Navbar } from "@/components/layout/navbar";
import { ReportSkeleton } from "@/components/report/report-skeleton";

export default function ReportLoading() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="section-shell py-10">
        <ReportSkeleton />
      </section>
    </main>
  );
}
