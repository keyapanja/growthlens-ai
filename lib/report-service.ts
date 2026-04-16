import { nanoid } from "nanoid";
import { getReportById, saveReport } from "@/lib/db";
import { analyzeWithPageSpeed } from "@/lib/pagespeed";
import { generateAIReport } from "@/lib/openrouter-client";
import { getSiteContentContext } from "@/lib/site-context";
import { StoredReport } from "@/lib/types";

export async function createOrRefreshReport(params: {
  url: string;
  competitorUrl?: string;
  competitorUrls?: string[];
  reportId?: string;
}) {
  const now = new Date().toISOString();
  const existing = params.reportId ? await getReportById(params.reportId) : null;
  const competitorUrls = Array.from(
    new Set(
      [params.competitorUrl, ...(params.competitorUrls ?? [])]
        .map((url) => url?.trim())
        .filter((url): url is string => Boolean(url))
    )
  ).slice(0, 3);

  const pagespeed = await analyzeWithPageSpeed(params.url);
  const competitorPagespeeds = await Promise.all(
    competitorUrls.map((url) => analyzeWithPageSpeed(url))
  );
  const [siteContext, ...competitorContexts] = await Promise.all([
    getSiteContentContext(pagespeed.url),
    ...competitorPagespeeds.map((competitor) => getSiteContentContext(competitor.url))
  ]);
  const aiReport = await generateAIReport(
    pagespeed,
    competitorPagespeeds,
    siteContext,
    competitorContexts
  );

  const report: StoredReport = {
    id: existing?.id ?? nanoid(10),
    shareId: existing?.shareId ?? nanoid(14),
    url: pagespeed.url,
    competitorUrl: competitorPagespeeds[0]?.url ?? null,
    competitorUrls: competitorPagespeeds.map((competitor) => competitor.url),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    pagespeed,
    competitorPagespeed: competitorPagespeeds[0] ?? null,
    competitors: competitorPagespeeds.map((competitor) => ({
      url: competitor.url,
      pagespeed: competitor
    })),
    aiReport
  };

  await saveReport(report);
  return report;
}
