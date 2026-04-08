"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowRightLeft, Download, LoaderCircle, Mail, RefreshCw, Share2, Trophy } from "lucide-react";
import { ScoreDonut } from "@/components/charts/score-donut";
import { HeroScore } from "@/components/report/hero-score";
import { MetricBox } from "@/components/report/metric-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeviceType, StoredReport } from "@/lib/types";
import { formatDate, getDifficultyTone, getPriorityTone } from "@/lib/utils";

type DeviceMode = "mobile" | "desktop";

const metricHelpText: Record<string, string> = {
  FCP: "How quickly visitors see the first visible content",
  LCP: "How quickly the main part of the page becomes visible",
  TBT: "How much the page gets blocked before becoming interactive",
  CLS: "How stable the layout feels while the page loads"
};

function getOverallScore(report: StoredReport) {
  return Math.round((report.pagespeed.mobile.overallScore + report.pagespeed.desktop.overallScore) / 2);
}

function getCompetitorOverallScore(report: StoredReport) {
  if (!report.competitorPagespeed) return null;
  return Math.round(
    (report.competitorPagespeed.mobile.overallScore + report.competitorPagespeed.desktop.overallScore) / 2
  );
}

function deviceLabel(device: DeviceType) {
  return device === "mobile" ? "Mobile" : "Desktop";
}

export function ReportDashboard({ initialReport }: { initialReport: StoredReport }) {
  const [report, setReport] = useState(initialReport);
  const [device, setDevice] = useState<DeviceMode>("mobile");
  const [email, setEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [isRefreshing, startRefresh] = useTransition();
  const [isEmailing, startEmail] = useTransition();

  const deviceMetrics = report.pagespeed[device];
  const competitorMetrics = report.competitorPagespeed?.[device] ?? null;
  const competitorOverall = getCompetitorOverallScore(report);
  const currentOverall = useMemo(() => getOverallScore(report), [report]);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/share/${report.shareId}`);
  }, [report.shareId]);

  async function handleReanalyze() {
    startRefresh(async () => {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: report.url,
          competitorUrl: report.competitorUrl ?? undefined,
          reportId: report.id
        })
      });

      if (!response.ok) return;

      const payload = await response.json();
      setReport(payload.report);
    });
  }

  async function handleSendEmail() {
    setEmailMessage(null);
    startEmail(async () => {
      const response = await fetch(`/api/reports/${report.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const payload = await response.json();
      setEmailMessage(payload.message);
    });
  }

  async function copyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
  }

  return (
    <div className="space-y-8 pb-16">
      <HeroScore score={report.aiReport.growth_score} url={report.url} summary={report.aiReport.summary} />

      <section className="grid gap-4 lg:grid-cols-[1fr,auto]">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/[0.04] p-1">
              {(["mobile", "desktop"] as DeviceMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDevice(mode)}
                  className={`rounded-full px-4 py-2 text-sm capitalize transition ${
                    device === mode ? "bg-white text-slate-950" : "text-white/70 hover:text-white"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="text-sm text-white/60">Updated {formatDate(report.updatedAt)}</div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleReanalyze} disabled={isRefreshing}>
            {isRefreshing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Re-analyze
          </Button>
          <a href={`/api/reports/${report.id}/pdf`} target="_blank" rel="noreferrer">
            <Button variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Download report
            </Button>
          </a>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-4">
        {Object.values(deviceMetrics.categories).map((item) => (
          <ScoreDonut key={item.label} label={item.label} score={item.score} />
        ))}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Object.values(deviceMetrics.vitals).map((metric) => (
          <div key={metric.label} className="space-y-2">
            <MetricBox label={metric.label} value={metric.displayValue} score={metric.score} />
            <p className="px-1 text-xs leading-5 text-white/48">{metricHelpText[metric.label]}</p>
          </div>
        ))}
      </section>

      {report.competitorPagespeed && competitorMetrics ? (
        <section>
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent-warm">Competitor comparison</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">How your site compares with the competitor</h2>
              </div>
              <ArrowRightLeft className="h-5 w-5 text-accent-warm" />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-white/40">Your website</div>
                <div className="mt-2 text-sm text-sky-300">{report.url}</div>
                <div className="mt-4 text-4xl font-semibold text-white">{currentOverall}</div>
                <div className="mt-1 text-sm text-white/60">{deviceLabel(device)} overall score</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-white/40">Competitor website</div>
                <div className="mt-2 text-sm text-sky-300">{report.competitorPagespeed.url}</div>
                <div className="mt-4 text-4xl font-semibold text-white">{competitorOverall}</div>
                <div className="mt-1 text-sm text-white/60">{deviceLabel(device)} overall score</div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4 text-sm text-emerald-100">
              <div className="flex items-center gap-2 font-medium">
                <Trophy className="h-4 w-4" />
                {currentOverall >= (competitorOverall ?? 0)
                  ? "Your website is currently ahead overall."
                  : "The competitor is currently ahead overall."}
              </div>
              <p className="mt-2 leading-6 text-emerald-50/85">
                {report.aiReport.competitor_comparison?.summary}
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.05] text-white/60">
                  <tr>
                    <th className="px-4 py-3 font-medium">Area</th>
                    <th className="px-4 py-3 font-medium">Your site</th>
                    <th className="px-4 py-3 font-medium">Competitor</th>
                    <th className="px-4 py-3 font-medium">Who leads</th>
                  </tr>
                </thead>
                <tbody className="text-white/75">
                  {Object.values(deviceMetrics.categories).map((item) => {
                    const competitorValue =
                      competitorMetrics.categories[
                        item.label.toLowerCase().replace(" ", "_") as keyof typeof competitorMetrics.categories
                      ].score;
                    const leader = item.score === competitorValue ? "Tie" : item.score > competitorValue ? "Your site" : "Competitor";

                    return (
                      <tr key={item.label} className="border-t border-white/10">
                        <td className="px-4 py-4">{item.label}</td>
                        <td className="px-4 py-4">{item.score}</td>
                        <td className="px-4 py-4">{competitorValue}</td>
                        <td className="px-4 py-4">{leader}</td>
                      </tr>
                    );
                  })}
                  {Object.values(deviceMetrics.vitals).map((metric) => {
                    const competitorValue =
                      competitorMetrics.vitals[
                        metric.label.toLowerCase() as keyof typeof competitorMetrics.vitals
                      ].displayValue;

                    return (
                      <tr key={metric.label} className="border-t border-white/10">
                        <td className="px-4 py-4">{metric.label}</td>
                        <td className="px-4 py-4">{metric.displayValue}</td>
                        <td className="px-4 py-4">{competitorValue}</td>
                        <td className="px-4 py-4">Review side by side</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5">
              <h3 className="text-lg font-medium text-white">How to catch up or stay ahead</h3>
              <ul className="mt-3 space-y-3 text-sm text-white/72">
                {report.aiReport.competitor_comparison?.outperform_actions.map((action) => (
                  <li key={action} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-accent-warm" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.35fr,0.95fr]">
        <Card className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent">AI insights</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">What this means for the business</h2>
            </div>
            <Badge className="bg-sky-500/12 text-sky-100 ring-1 ring-sky-300/20">Structured JSON</Badge>
          </div>
          <p className="text-base leading-7 text-white/78">{report.aiReport.ai_insight}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">Current score</div>
              <div className="mt-2 text-4xl font-semibold text-white">{report.aiReport.score_prediction.current}</div>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Potential after fixes</div>
              <div className="mt-2 text-4xl font-semibold text-emerald-200">
                {report.aiReport.score_prediction.potential}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/60">{report.aiReport.score_prediction.rationale}</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-accent-warm">SEO strategy</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Search messaging for this website</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            These suggestions are meant for <span className="text-white">{report.url}</span>, based on the site you analyzed.
          </p>
          <div className="mt-5 space-y-4 text-sm text-white/72">
            <div>
              <div className="mb-1 text-xs uppercase tracking-[0.24em] text-white/40">Suggested page title</div>
              <p>{report.aiReport.seo_strategy.titleTag}</p>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-[0.24em] text-white/40">Suggested search description</div>
              <p>{report.aiReport.seo_strategy.metaDescription}</p>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-[0.24em] text-white/40">Relevant keyword ideas</div>
              <p>{report.aiReport.seo_strategy.keywords.join(" | ")}</p>
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-[0.24em] text-white/40">Content angle</div>
              <p>{report.aiReport.seo_strategy.contentAngle}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-white">Top issues and how to improve them</h2>
          <div className="mt-5 space-y-4">
            {report.aiReport.top_issues.map((issue, index) => (
              <motion.div
                key={issue.title + index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium text-white">{issue.title}</h3>
                  <Badge className={getPriorityTone(issue.impactLevel)}>{issue.impactLevel} impact</Badge>
                  <Badge className={getDifficultyTone(issue.difficulty)}>{issue.difficulty} difficulty</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/70">{issue.description}</p>
                <p className="mt-3 text-sm text-white/58">Why it matters: {issue.impact}</p>
                <p className="mt-2 text-sm text-sky-200">What to do: {issue.fix}</p>
              </motion.div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-white">Quick wins</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/72">
              {report.aiReport.quick_wins.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-white">At a glance</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/40">Mobile score</div>
                <div className="mt-2 text-3xl font-semibold text-white">{report.aiReport.metrics.mobile_score}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/40">Desktop score</div>
                <div className="mt-2 text-3xl font-semibold text-white">{report.aiReport.metrics.desktop_score}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/40">Strongest area</div>
                <div className="mt-2 text-lg font-medium text-white">{report.aiReport.metrics.strongest_area}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/40">Needs the most work</div>
                <div className="mt-2 text-lg font-medium text-white">{report.aiReport.metrics.weakest_area}</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="overflow-hidden p-6">
          <h2 className="text-2xl font-semibold text-white">Fix priority table</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.05] text-white/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Fix</th>
                  <th className="px-4 py-3 font-medium">Impact</th>
                  <th className="px-4 py-3 font-medium">Difficulty</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody>
                {report.aiReport.priority_fixes.map((row) => (
                  <tr key={row.fix} className="border-t border-white/10 text-white/75">
                    <td className="px-4 py-4">{row.fix}</td>
                    <td className="px-4 py-4">
                      <Badge className={getPriorityTone(row.impact)}>{row.impact}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={getDifficultyTone(row.difficulty)}>{row.difficulty}</Badge>
                    </td>
                    <td className="px-4 py-4">{row.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-white">Step-by-step plan</h2>
          <ol className="mt-4 space-y-4 text-sm text-white/72">
            {report.aiReport.step_by_step_plan.map((step, index) => (
              <li key={step} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="pt-1 leading-6">{step}</p>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr,0.9fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-white">Share this report</h2>
            <button
              type="button"
              onClick={copyShareLink}
              className="inline-flex items-center text-sm text-sky-300 transition hover:text-sky-200"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Copy link
            </button>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/68">
            {shareUrl || `/share/${report.shareId}`}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-white">Email report</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              className="h-12 flex-1 rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm text-white outline-none ring-0 placeholder:text-white/30"
            />
            <Button onClick={handleSendEmail} disabled={!email || isEmailing}>
              {isEmailing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send
            </Button>
          </div>
          {emailMessage ? <p className="mt-3 text-sm text-white/60">{emailMessage}</p> : null}
        </Card>
      </section>
    </div>
  );
}
