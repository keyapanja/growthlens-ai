import { Navbar } from "@/components/layout/navbar";
import { HomeClient } from "@/components/report/home-client";
import { getRecentReports } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const recent = getRecentReports(5);

  return (
    <main className="min-h-screen">
      <Navbar />
      <HomeClient recentReports={recent} />
    </main>
  );
}
