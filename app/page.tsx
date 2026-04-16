import { cookies } from "next/headers";
import { Navbar } from "@/components/layout/navbar";
import { HomeClient } from "@/components/report/home-client";
import { getRecentReports } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const viewerId = cookieStore.get("growthlens_viewer_id")?.value ?? null;
  const recent = await getRecentReports(viewerId, 5);

  return (
    <main className="min-h-screen">
      <Navbar />
      <HomeClient recentReports={recent} />
    </main>
  );
}
