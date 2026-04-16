"use client";

import { ReportDashboard } from "@/components/report/report-dashboard";
import { StoredReport } from "@/lib/types";

export function ReportClient({ initialReport }: { initialReport: StoredReport }) {
  return <ReportDashboard initialReport={initialReport} />;
}
