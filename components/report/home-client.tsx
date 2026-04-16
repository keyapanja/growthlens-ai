"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Brain, Check, Grid2x2, LoaderCircle, Share2, Sparkles, Zap } from "lucide-react";
import { StoredReport } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function getProgressSteps(hasCompetitor: boolean) {
  return [
    "Checking live performance data for your website...",
    hasCompetitor
      ? "Comparing your website with the competitor you added..."
      : "Reviewing speed, SEO, and user experience signals...",
    "Writing your GrowthLens report with clear action steps..."
  ];
}

const featureCards = [
  {
    title: "Structured AI reports",
    copy:
      "Sophisticated, machine-generated intelligence that categorizes every growth opportunity into logical, high-impact pillars.",
    icon: Brain,
    iconClassName: "text-[#81ecff]",
    iconSurfaceClassName: "bg-[#81ecff]/10"
  },
  {
    title: "Interactive dashboard",
    copy:
      "A live, fluid environment that goes beyond flat PDFs. Filter, pivot, and explore your growth data in real-time.",
    icon: Grid2x2,
    iconClassName: "text-[#a68cff]",
    iconSurfaceClassName: "bg-[#a68cff]/10"
  },
  {
    title: "Export-ready output",
    copy:
      "Ready-to-present executive summaries designed like a high-end product, not a raw data dump from a script.",
    icon: Share2,
    iconClassName: "text-[#6e9bff]",
    iconSurfaceClassName: "bg-[#6e9bff]/10"
  }
];

const benefitItems = [
  {
    title: "Color-coded scoring",
    copy: "Instant visual feedback on what's critical, what's healthy, and what's thriving."
  },
  {
    title: "Beginner-friendly action plans",
    copy: "No complex jargon. Just clear, prioritized steps to improve performance."
  },
  {
    title: "Dynamic share links",
    copy: "Generate professional dashboards you can send directly to stakeholders."
  }
];

function getRecentAnalysisCards(recentReports: StoredReport[]) {
  if (!recentReports.length) return [];

  return recentReports.map((report) => {
    const score = report.aiReport.growth_score;
    const strongest = report.aiReport.metrics.strongest_area.replaceAll("_", " ").toUpperCase();
    const weakest = report.aiReport.metrics.weakest_area.replaceAll("_", " ").toUpperCase();

    return {
      id: report.id,
      href: `/report/${report.id}`,
      score,
      url: report.url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      processedAt: `Processed: ${formatDate(report.updatedAt)}`,
      status: score >= 90 ? "OPTIMIZED" : score >= 75 ? "GROWTH READY" : "AT RISK",
      statusClassName: score >= 75 ? "text-[#81ecff]" : "text-[#ff716c]",
      scoreClassName: score >= 90 ? "text-[#81ecff]" : score >= 75 ? "text-[#a68cff]" : "text-[#ff716c]",
      tags: [strongest, weakest]
    };
  });
}

export function HomeClient({ recentReports }: { recentReports: StoredReport[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [isPending, startTransition] = useTransition();
  const reports = getRecentAnalysisCards(recentReports);
  const hasExpandableHistory = reports.length > 3;
  const visibleReports = showAllHistory ? reports : reports.slice(0, 3);
  const progressSteps = useMemo(() => getProgressSteps(Boolean(competitorUrl.trim())), [competitorUrl]);

  async function handleAnalyze(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setStepIndex(0);

    const stepTimer = window.setInterval(() => {
      setStepIndex((current) => {
        if (current === null) return 0;
        return Math.min(progressSteps.length - 1, current + 1);
      });
    }, 1200);

    startTransition(async () => {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          competitorUrl: competitorUrl || undefined
        })
      });

      window.clearInterval(stepTimer);

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Something went wrong while creating the report.");
        setStepIndex(null);
        return;
      }

      const payload = await response.json();
      router.push(`/report/${payload.report.id}`);
    });
  }

  return (
    <>
      <main>
        <section id="analyze" className="relative overflow-hidden px-6 pb-24 pt-32">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-full -translate-x-1/2 bg-gradient-to-b from-[#81ecff]/10 to-transparent" />
          <div className="relative z-10 mx-auto max-w-7xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#a68cff]/30 bg-[#591adc]/20 px-4 py-1.5">
              <Zap className="h-3.5 w-3.5 text-[#a68cff]" />
              <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-[#d8caff]">
                Next-Gen Intelligence
              </span>
            </div>

            <h1 className="mb-6 mt-8 font-headline text-5xl font-extrabold leading-[1.05] tracking-tighter md:text-7xl">
              Turn any website audit into a <br />
              <span className="bg-gradient-to-r from-[#81ecff] via-[#a68cff] to-[#00d4ec] bg-clip-text text-transparent">
                premium growth report.
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-2xl text-lg font-medium text-[#b8bcc5] md:text-xl">
              Pull live performance data and structured AI analysis instantly. Our synthetic architect
              transforms raw metrics into high-stakes growth strategies.
            </p>

            <div id="analyze-form" className="scroll-mt-28 mx-auto max-w-3xl rounded-[1rem] border border-[#44484f]/20 bg-[rgba(32,38,47,0.6)] p-2 shadow-2xl backdrop-blur-xl">
              <form onSubmit={handleAnalyze} className="flex flex-col gap-2 md:flex-row">
                <input
                  required
                  type="url"
                  placeholder="Enter website URL"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border-none bg-black px-6 py-4 font-body font-medium text-[#f8faff] outline-none placeholder:text-[#b8bcc5]/60 focus:ring-1 focus:ring-[#81ecff]/40"
                />
                <input
                  type="url"
                  placeholder="Competitor URL (Optional)"
                  value={competitorUrl}
                  onChange={(event) => setCompetitorUrl(event.target.value)}
                  disabled={isPending}
                  className="w-full rounded-xl border-none bg-black px-6 py-4 font-body font-medium text-[#f8faff] outline-none placeholder:text-[#b8bcc5]/60 focus:ring-1 focus:ring-[#81ecff]/40"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex min-h-[56px] items-center justify-center whitespace-nowrap rounded-xl bg-gradient-to-r from-[#81ecff] to-[#00d4ec] px-8 py-4 text-center font-body text-xs font-bold uppercase tracking-[0.24em] text-[#00163d] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 md:self-stretch"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                    <span>Analyze Website</span>
                  </span>
                </button>
              </form>
            </div>

            <div className="mx-auto mt-4 min-h-10 max-w-3xl">
              {stepIndex !== null ? (
                <div className="flex justify-center">
                  <div className="rounded-full bg-[#81ecff]/12 px-5 py-2 text-sm text-[#f8faff] ring-1 ring-[#81ecff]/20">
                    {progressSteps[stepIndex] ?? progressSteps[progressSteps.length - 1]}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#b8bcc5]/60">This will take only a few minutes.</p>
              )}
              {error ? <p className="mt-3 text-sm text-[#ffa8a3]">{error}</p> : null}
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {featureCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="group rounded-xl border border-[#44484f]/10 bg-[#1b2028] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-[#81ecff]/20 hover:bg-[#20262f]"
                >
                  <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-lg ${item.iconSurfaceClassName}`}>
                    <Icon className={`h-5 w-5 ${item.iconClassName}`} />
                  </div>
                  <h3 className="font-headline text-xl font-bold text-[#f8faff]">{item.title}</h3>
                  <p className="mt-4 font-body text-sm font-medium leading-relaxed text-[#b8bcc5]">
                    {item.copy}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="benefits" className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="mb-8 font-headline text-4xl font-bold tracking-tight md:text-5xl">
                Designed like a product, <br />
                <span className="text-[#a68cff]">not a raw audit dump.</span>
              </h2>
              <ul className="space-y-6">
                {benefitItems.map((item) => (
                  <li key={item.title} className="flex items-start gap-4">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#81ecff]/40 bg-[#81ecff]/20">
                      <Check className="h-3.5 w-3.5 text-[#81ecff]" />
                    </div>
                    <div>
                      <h4 className="mb-1 font-headline font-bold text-[#f8faff]">{item.title}</h4>
                      <p className="text-sm font-medium text-[#b8bcc5]">{item.copy}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -inset-10 rounded-full bg-[#81ecff]/10 blur-[100px]" />
              <div className="relative z-10 rounded-[1.5rem] border border-[#44484f]/15 bg-[#1b2028] p-8 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-[#44484f]/10 bg-[#0f141a] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-[#81ecff]/20 text-[#81ecff]">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-label text-[10px] font-bold uppercase tracking-wider text-[#b8bcc5]">
                          Performance Score
                        </div>
                        <div className="font-bold text-[#f8faff]">98/100</div>
                      </div>
                    </div>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#20262f]">
                      <div className="h-full w-[98%] bg-[#81ecff] shadow-[0_0_8px_rgba(129,236,255,0.4)]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#44484f]/10 bg-[#0f141a] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-[#a68cff]/20 text-[#a68cff]">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-label text-[10px] font-bold uppercase tracking-wider text-[#b8bcc5]">
                          Conversion Index
                        </div>
                        <div className="font-bold text-[#f8faff]">A+ Prime</div>
                      </div>
                    </div>
                    <span className="rounded-full border border-[#a68cff]/20 bg-[#591adc]/20 px-3 py-1 font-label text-[10px] font-bold uppercase tracking-tight text-[#a68cff]">
                      Growth Priority
                    </span>
                  </div>

                  <div className="rounded-xl border border-[#44484f]/10 bg-black p-6 text-center">
                    <p className="mb-4 text-sm font-medium italic text-[#f8faff]">
                      "Ready to scale. Recommendations focused on organic SEO layering."
                    </p>
                    <a href="#analyze-form" className="inline-flex rounded-full border border-[#81ecff]/40 px-5 py-3 text-xs font-bold uppercase tracking-[0.22em] text-[#81ecff] transition hover:bg-[#81ecff]/10">
                      Analyze Your Website
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="history" className="bg-[#0f141a]/30 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex items-center justify-between">
              <div>
                <h2 className="mb-2 font-headline text-3xl font-bold">Recent Analyses</h2>
                <p className="font-body font-medium text-[#b8bcc5]">
                  Complete website audit history from previous searches.
                </p>
              </div>
              {hasExpandableHistory ? (
                <a
                  href="#history"
                  onClick={(event) => {
                    event.preventDefault();
                    setShowAllHistory((current) => !current);
                  }}
                  className="group hidden items-center gap-2 font-headline text-xs font-extrabold uppercase tracking-widest text-[#81ecff] transition-colors hover:text-[#00d4ec] md:flex"
                >
                  {showAllHistory ? "Show Less" : "See History"}
                  <ArrowRight
                    className={`h-4 w-4 transition-transform ${
                      showAllHistory ? "-rotate-90" : "group-hover:translate-x-1"
                    }`}
                  />
                </a>
              ) : null}
            </div>

            {visibleReports.length ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visibleReports.map((report) => {
                  const card = (
                    <div className="group cursor-pointer rounded-2xl border border-[#44484f]/15 bg-[#1b2028] p-6 transition-all hover:border-[#81ecff]/40 hover:bg-[#20262f]">
                      <div className="mb-6 flex items-start justify-between">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl border border-[#44484f]/20 bg-black font-headline text-3xl font-black ${report.scoreClassName}`}
                        >
                          {report.score}
                        </div>
                        <div className="text-right">
                          <div className="font-label text-[10px] font-bold uppercase tracking-widest text-[#b8bcc5]">
                            Growth Score
                          </div>
                          <div className={`text-xs font-extrabold ${report.statusClassName}`}>{report.status}</div>
                        </div>
                      </div>
                      <div className="mb-6">
                        <div className="truncate font-headline text-lg font-bold text-[#f8faff]">{report.url}</div>
                        <div className="text-xs font-medium text-[#b8bcc5]">{report.processedAt}</div>
                      </div>
                      <div className="flex gap-2">
                        {report.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-[#44484f]/10 bg-black px-2 py-1 font-label text-[10px] font-bold uppercase tracking-wider text-[#b8bcc5]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );

                  return report.href === "#" ? (
                    <div key={report.id}>{card}</div>
                  ) : (
                    <a key={report.id} href={report.href}>
                      {card}
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#44484f]/25 bg-[#1b2028]/60 p-10 text-center">
                <h3 className="font-headline text-2xl font-bold text-[#f8faff]">Start analyzing your first website</h3>
                <p className="mt-3 text-sm font-medium text-[#b8bcc5]">
                  Run your first audit to build a searchable history of growth reports right here.
                </p>
                <a
                  href="#analyze-form"
                  className="mt-6 inline-flex rounded-full border border-[#81ecff]/35 bg-[#81ecff]/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#81ecff] transition hover:bg-[#81ecff]/15"
                >
                  Analyze a website
                </a>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-[#44484f]/20 bg-black py-12">
        <div className="flex flex-col items-center justify-between gap-8 px-12 md:flex-row">
          <div className="font-headline text-xl font-extrabold tracking-tighter text-[#f8faff]">GrowthLens AI</div>
          <div className="text-center md:ml-auto md:text-right">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-[#b8bcc5]">
              Copyright 2026 GrowthLens AI. The Synthetic Intelligence Architect.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

