import { nanoid } from "nanoid";
import { getReportById, saveReport } from "@/lib/db";
import { analyzeWithPageSpeed } from "@/lib/pagespeed";
import { generateAIReport } from "@/lib/openrouter-client";
import { getSiteContentContext } from "@/lib/site-context";
import { StoredReport } from "@/lib/types";

export async function createOrRefreshReport(params: {
  url: string;
  competitorUrl?: string;
  reportId?: string;
}) {
  const now = new Date().toISOString();
  const existing = params.reportId ? await getReportById(params.reportId) : null;

  const pagespeed = await analyzeWithPageSpeed(params.url);
  const competitorPagespeed = params.competitorUrl
    ? await analyzeWithPageSpeed(params.competitorUrl)
    : null;
  const [siteContext, competitorContext] = await Promise.all([
    getSiteContentContext(pagespeed.url),
    competitorPagespeed ? getSiteContentContext(competitorPagespeed.url) : Promise.resolve(null)
  ]);
  const aiReport = await generateAIReport(pagespeed, competitorPagespeed, siteContext, competitorContext);

  const report: StoredReport = {
    id: existing?.id ?? nanoid(10),
    shareId: existing?.shareId ?? nanoid(14),
    url: pagespeed.url,
    competitorUrl: params.competitorUrl ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    pagespeed,
    competitorPagespeed,
    aiReport
  };

  await saveReport(report);
  return report;
}
