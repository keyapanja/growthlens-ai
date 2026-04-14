"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Gauge,
  ImageIcon,
  LoaderCircle,
  Mail,
  Search,
  ShieldCheck,
  Share2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  WandSparkles
} from "lucide-react";
import { CategoryKey, StoredReport } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type DeviceMode = "mobile" | "desktop";
type SectionId = "hero" | "performance" | "comparison" | "messaging" | "issues" | "plan";
const SECTION_IDS: SectionId[] = ["hero", "performance", "comparison", "messaging", "issues", "plan"];

const categoryMeta: Record<CategoryKey, { title: string; color: string; bar: string; icon: typeof Gauge }> = {
  performance: { title: "Performance", color: "text-[#81ecff]", bar: "bg-[#81ecff]", icon: Gauge },
  accessibility: { title: "Accessibility", color: "text-[#a68cff]", bar: "bg-[#a68cff]", icon: Sparkles as typeof Gauge },
  best_practices: { title: "Best Practices", color: "text-[#6e9bff]", bar: "bg-[#6e9bff]", icon: ShieldCheck as typeof Gauge },
  seo: { title: "SEO Score", color: "text-[#00d4ec]", bar: "bg-[#00d4ec]", icon: Search as typeof Gauge }
};

function circleOffset(score: number) {
  const c = 2 * Math.PI * 100;
  return c - (score / 100) * c;
}

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function buildBenchmarks(report: StoredReport) {
  const currentLcp = report.pagespeed.mobile.vitals.lcp.value / 1000;
  const competitor = report.competitorPagespeed
    ? {
        label: report.competitorPagespeed.url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        lcp: report.competitorPagespeed.mobile.vitals.lcp.value / 1000,
        mobile: Math.round(report.competitorPagespeed.mobile.overallScore),
        seo: report.competitorPagespeed.mobile.categories.seo.score
      }
    : {
        label: "growthflow.io",
        lcp: Math.max(1.4, Number((currentLcp - 0.5).toFixed(1))),
        mobile: Math.min(99, report.aiReport.metrics.mobile_score + 8),
        seo: Math.min(99, report.pagespeed.mobile.categories.seo.score + 4)
      };

  return [
    competitor,
    {
      label: "scaleiq.ai",
      lcp: Math.max(1.6, Number((competitor.lcp + 0.7).toFixed(1))),
      mobile: Math.max(58, competitor.mobile - 6),
      seo: Math.max(62, competitor.seo - 7)
    }
  ];
}

export function ReportDashboard({ initialReport }: { initialReport: StoredReport }) {
  const [report, setReport] = useState(initialReport);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("mobile");
  const [email, setEmail] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("hero");
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [planSeen, setPlanSeen] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const [isEmailing, startEmail] = useTransition();

  const device = report.pagespeed[deviceMode];
  const benchmarks = useMemo(() => buildBenchmarks(report), [report]);
  const hasCompetitor = Boolean(report.competitorPagespeed);
  const uplift = Math.max(
    0,
    Number(
      (((report.aiReport.score_prediction.potential - report.aiReport.score_prediction.current) /
        Math.max(report.aiReport.score_prediction.current, 1)) *
        100).toFixed(1)
    )
  );

  useEffect(() => {
    setShareUrl(`${window.location.origin}/share/${report.shareId}`);
  }, [report.shareId]);

  useEffect(() => {
    const getRenderedSections = () =>
      SECTION_IDS.map((id) => {
        const element = document.getElementById(id);
        return element ? { id, element } : null;
      })
        .filter((item): item is { id: SectionId; element: HTMLElement } => Boolean(item))
        .sort((a, b) => a.element.offsetTop - b.element.offsetTop);

    const updateActiveSection = () => {
      const renderedSections = getRenderedSections();
      if (!renderedSections.length) return;

      const headerOffset = 120;
      const scrollPosition = window.scrollY + headerOffset;
      let nextActive: SectionId = renderedSections[0].id;

      renderedSections.forEach(({ id, element }) => {
        if (element.offsetTop <= scrollPosition) {
          nextActive = id;
        }
      });

      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120;

      if (nearBottom && renderedSections.some(({ id }) => id === "plan")) {
        nextActive = "plan";
      }

      setActiveSection(nextActive);

      const planElement = document.getElementById("plan");
      if (planElement) {
        const { top } = planElement.getBoundingClientRect();
        if (top <= window.innerHeight * 0.8) {
          setPlanSeen(true);
        }
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  async function handleRefresh() {
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
      setEmailMessage(payload.message ?? "Unable to send report.");
    });
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopyMessage("Share link copied.");
    window.setTimeout(() => setCopyMessage(null), 2400);
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#f1f3fc]">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#44484f]/10 bg-[#020712]/80 px-5 py-4 backdrop-blur-3xl lg:px-8">
        <Link href="/" className="font-headline text-xl font-black uppercase tracking-tighter text-cyan-400">GrowthLens AI</Link>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#81ecff] to-[#00d4ec] px-5 py-2.5 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-[#003840] disabled:opacity-70"
          >
            {isRefreshing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <WandSparkles className="h-3.5 w-3.5" />}
            Regenerate the Report
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-72 shrink-0 border-r border-[#44484f]/10 bg-[#04091b] lg:block">
          <div className="flex h-full flex-col px-5 py-5">
            <div className="mb-10 rounded-2xl border border-[#44484f]/10 bg-[#0b1120] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#a68cff] to-[#81ecff] p-[1px]">
                  <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#04091b]"><BrainCircuit className="h-5 w-5 text-[#81ecff]" /></div>
                </div>
                <div>
                  <p className="font-label text-[10px] uppercase tracking-[0.2em] text-[#a68cff]">Growth Architect</p>
                  <p className="text-xs font-bold text-[#f1f3fc]">System v4.2.0</p>
                </div>
              </div>
            </div>
            <nav className="space-y-1">
              {[
                { label: "Overview", id: "hero" as SectionId },
                { label: "Performance", id: "performance" as SectionId },
                { label: "SEO Audit", id: "messaging" as SectionId },
                 ...(hasCompetitor ? [{ label: "Competitors", id: "comparison" as SectionId }] : []),
                { label: "AI Strategy", id: "plan" as SectionId }
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={activeSection === item.id ? "flex items-center gap-4 rounded-r-full border-l-4 border-cyan-400 bg-cyan-400/10 px-5 py-3 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400" : "flex items-center gap-4 px-5 py-3 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-900 hover:text-slate-100"}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto pt-6">
              <div className="rounded-xl border border-[#44484f]/10 bg-[#1b2028] p-4">
                <p className="mb-1 font-label text-[10px] uppercase tracking-[0.2em] text-[#7e51ff]">Current Plan</p>
                <p className="mb-3 font-bold text-[#f1f3fc]">Enterprise Suite</p>
                <button type="button" className="w-full rounded-lg bg-[#20262f] py-2 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-[#81ecff]">Upgrade to Pro</button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-5 lg:p-8 xl:p-10">
          <div className="mx-auto max-w-7xl space-y-12">
            <section id="hero" className="relative overflow-hidden rounded-[2rem] border border-[#44484f]/5 bg-[#0f141a] p-8 lg:p-12">
              <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-[#81ecff]/5 blur-[120px]" />
              <div className="relative z-10 flex flex-col items-center gap-10 lg:flex-row">
                <div className="relative flex h-56 w-56 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 224 224">
                    <circle cx="112" cy="112" r="100" fill="transparent" stroke="rgba(38,44,54,1)" strokeWidth="12" />
                    <circle cx="112" cy="112" r="100" fill="transparent" stroke="#81ecff" strokeWidth="12" strokeDasharray={2 * Math.PI * 100} strokeDashoffset={circleOffset(report.aiReport.growth_score)} strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(129,236,255,0.3)]" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-headline text-6xl font-black">{report.aiReport.growth_score}</span>
                    <span className="mt-2 font-label text-[10px] uppercase tracking-[0.3em] text-[#81ecff]">Score</span>
                  </div>
                </div>
                <div className="max-w-2xl space-y-4 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#a68cff]/20 bg-[#a68cff]/10 px-3 py-1">
                    <Sparkles className="h-3.5 w-3.5 text-[#a68cff]" />
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#a68cff]">AI Growth Intelligence</span>
                  </div>
                  <h1 className="font-headline text-4xl font-extrabold tracking-tight lg:text-5xl">Your growth report is ready.</h1>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-base font-semibold text-[#81ecff] lg:justify-start">
                    <a
                      href={report.url}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-[#b6f3ff] hover:underline"
                    >
                      {displayUrl(report.url)}
                    </a>
                    {report.competitorUrl ? (
                      <>
                        <span className="inline-flex items-center rounded-full border border-[#44484f]/20 bg-[#151a21] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#a68cff]">
                          vs
                        </span>
                        <a
                          href={report.competitorUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="transition-colors hover:text-[#d8caff] hover:underline"
                        >
                          {displayUrl(report.competitorUrl)}
                        </a>
                      </>
                    ) : null}
                  </div>
                  <p className="max-w-xl text-lg leading-relaxed text-[#a8abb3]">
                    Our intelligence engine has identified <span className="font-bold text-[#81ecff]">{report.aiReport.top_issues.length} critical optimizations</span> that could increase your conversion velocity by <span className="font-bold text-[#a68cff]">{uplift}%</span> over the next quarter.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 pt-3 lg:justify-start">
                    <a href={`/api/reports/${report.id}/pdf`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#81ecff] to-[#00d4ec] px-8 py-4 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-[#004d57]">
                      <Download className="h-4 w-4" />Download PDF Report
                    </a>
                    <button type="button" onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full border border-[#44484f]/20 bg-[#20262f] px-8 py-4 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-[#f1f3fc]">
                      <Share2 className="h-4 w-4" />Share Report
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#72757d] lg:justify-start">
                    <span>Updated {formatDate(report.updatedAt)}</span>
                    {copyMessage ? <span className="text-[#81ecff]">{copyMessage}</span> : null}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-center md:justify-end">
              <div className="inline-flex rounded-full border border-[#44484f]/20 bg-[#151a21] p-1">
                {(["mobile", "desktop"] as DeviceMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDeviceMode(mode)}
                    className={deviceMode === mode ? "rounded-full bg-[#81ecff] px-5 py-2 font-label text-xs font-bold uppercase tracking-[0.18em] text-[#003840]" : "rounded-full px-5 py-2 font-label text-xs font-bold uppercase tracking-[0.18em] text-[#a8abb3] hover:text-[#f1f3fc]"}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <section id="performance" className="grid scroll-mt-28 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {(Object.keys(categoryMeta) as CategoryKey[]).map((key) => {
                const meta = categoryMeta[key];
                const Icon = meta.icon;
                const item = device.categories[key];
                return (
                  <div key={key} className="rounded-3xl border border-[#44484f]/10 bg-[#1b2028] p-6">
                    <div className="mb-4 flex items-start justify-between"><Icon className={`h-7 w-7 ${meta.color}`} /><div className={`font-headline text-2xl font-black ${meta.color}`}>{item.score}</div></div>
                    <h3 className="font-label text-[10px] uppercase tracking-[0.2em]">{meta.title}</h3>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black"><div className={`h-full ${meta.bar}`} style={{ width: `${item.score}%` }} /></div>
                  </div>
                );
              })}
            </section>

            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Object.values(device.vitals).map((metric) => {
                const tone = metric.score >= 0.9 ? "text-[#81ecff]" : metric.score >= 0.5 ? "text-[#ffbb70]" : "text-[#d7383b]";
                return (
                  <div key={metric.label} className="rounded-2xl border border-[#44484f]/5 bg-black p-5">
                    <p className="mb-1 font-label text-[10px] uppercase tracking-[0.2em] text-[#a8abb3]">{metric.label}</p>
                    <p className={`font-headline text-xl font-bold ${metric.score >= 0.5 ? "text-[#f1f3fc]" : "text-[#ff716c]"}`}>{metric.displayValue}</p>
                    <p className={`mt-2 text-[10px] ${tone}`}>Status: {metric.score >= 0.9 ? "Fast" : "Needs Improvement"}</p>
                  </div>
                );
              })}
            </section>

            <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <div className="space-y-6">
                <h2 className="px-2 font-headline text-2xl font-bold">What this means for the business</h2>
                <div className="rounded-3xl border border-[#44484f]/10 bg-[rgba(32,38,47,0.6)] p-8 backdrop-blur-xl">
                  <div className="mb-8 flex items-center justify-between gap-5">
                    <div className="text-center"><p className="mb-2 font-label text-[10px] uppercase tracking-[0.2em] text-[#a8abb3]">Current</p><div className="font-headline text-4xl font-black text-[#a8abb3]/50">{report.aiReport.score_prediction.current}</div></div>
                    <div className="relative flex-1 px-8"><div className="h-px w-full border-t border-dashed border-[#44484f]" /><TrendingUp className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 bg-[#0a0e14] text-[#a68cff]" /></div>
                    <div className="text-center"><p className="mb-2 font-label text-[10px] uppercase tracking-[0.2em] text-[#a68cff]">Potential</p><div className="font-headline text-4xl font-black text-[#a68cff]">{report.aiReport.score_prediction.potential}</div></div>
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-[#a8abb3]">{report.aiReport.score_prediction.rationale}</p>
                  <div className="flex items-center gap-4 rounded-2xl border border-[#44484f]/10 bg-black p-4"><Sparkles className="h-4 w-4 text-[#a68cff]" /><p className="text-xs italic text-[#d8caff]">"{report.aiReport.ai_insight}"</p></div>
                </div>
              </div>
              <div id="messaging" className="scroll-mt-28 space-y-6">
                <h2 className="px-2 font-headline text-2xl font-bold">Search Messaging Analysis</h2>
                <div className="rounded-3xl border border-[#44484f]/10 bg-[rgba(32,38,47,0.6)] p-8 backdrop-blur-xl">
                  <div className="space-y-6">
                    <div className="rounded-2xl border-l-4 border-[#81ecff] bg-[#1b2028] p-4"><p className="mb-1 font-label text-[10px] uppercase tracking-[0.2em] text-[#81ecff]">Recommended Meta Title</p><p className="font-medium">{report.aiReport.seo_strategy.titleTag}</p></div>
                    <div className="rounded-2xl border-l-4 border-[#6e9bff] bg-[#1b2028] p-4"><p className="mb-1 font-label text-[10px] uppercase tracking-[0.2em] text-[#6e9bff]">AI Suggested Meta Description</p><p className="text-sm leading-6 text-[#f1f3fc]">{report.aiReport.seo_strategy.metaDescription}</p></div>
                    <div className="rounded-2xl border-l-4 border-[#a68cff] bg-[#1b2028] p-4"><p className="mb-3 font-label text-[10px] uppercase tracking-[0.2em] text-[#a68cff]">Target Keyword Focus</p><div className="flex flex-wrap gap-2">{report.aiReport.seo_strategy.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-[#a68cff]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a68cff]">{keyword}</span>)}</div></div>
                  </div>
                </div>
              </div>
            </section>

            {hasCompetitor ? <section id="comparison" className="scroll-mt-28 space-y-6">
              <div className="flex items-center justify-between px-2"><h2 className="font-headline text-2xl font-bold">How your site compares</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-2">
                  <thead><tr className="text-left"><th className="p-4 font-label text-[10px] uppercase tracking-[0.2em] text-[#a8abb3]">Metric</th><th className="p-4 font-label text-[10px] uppercase tracking-[0.2em] text-[#81ecff]">Your Site</th><th className="p-4 font-label text-[10px] uppercase tracking-[0.2em] text-[#a8abb3]">{benchmarks[0].label}</th><th className="p-4 font-label text-[10px] uppercase tracking-[0.2em] text-[#a8abb3]">Trend Analysis</th></tr></thead>
                  <tbody>
                    {[
                      { label: "Page Load Speed", current: `${(device.vitals.lcp.value / 1000).toFixed(1)}s`, a: `${benchmarks[0].lcp.toFixed(1)}s`, up: device.vitals.lcp.value / 1000 <= benchmarks[0].lcp },
                      { label: "Mobile Score", current: `${report.aiReport.metrics.mobile_score}`, a: `${benchmarks[0].mobile}`, up: report.aiReport.metrics.mobile_score >= benchmarks[0].mobile },
                      { label: "SEO Score", current: `${device.categories.seo.score}`, a: `${benchmarks[0].seo}`, up: device.categories.seo.score >= benchmarks[0].seo }
                    ].map((row) => (
                      <tr key={row.label} className="bg-[#1b2028]/60 hover:bg-[#1b2028]"><td className="rounded-l-2xl p-4 text-sm font-bold">{row.label}</td><td className="p-4 font-black text-[#81ecff]">{row.current}</td><td className="p-4 text-[#a8abb3]">{row.a}</td><td className="rounded-r-2xl p-4">{row.up ? <TrendingUp className="h-4 w-4 text-[#81ecff]" /> : <TrendingDown className="h-4 w-4 text-[#ff716c]" />}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section> : null}

            <section id="issues" className="scroll-mt-28 grid grid-cols-1 gap-8 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <h2 className="px-2 font-headline text-2xl font-bold">Top Issues to Address</h2>
                <div className="space-y-4">
                  {report.aiReport.top_issues.slice(0, 2).map((issue, index) => {
                    const Icon = index === 0 ? TriangleAlert : ImageIcon;
                    const accent = issue.impactLevel === "High" ? "text-[#ff716c] bg-[#ff716c]/10" : "text-[#a68cff] bg-[#a68cff]/10";
                    return (
                      <div key={issue.title} className="flex items-start gap-6 rounded-3xl border border-[#44484f]/10 bg-[#1b2028] p-6">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent}`}><Icon className="h-5 w-5" /></div>
                        <div><div className="mb-2 flex flex-wrap items-center gap-3"><h4 className="font-bold">{issue.title}</h4><span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${issue.impactLevel === "High" ? "bg-[#ff716c]/20 text-[#ff716c]" : "bg-[#a68cff]/20 text-[#a68cff]"}`}>{issue.impactLevel} Impact</span></div><p className="mb-4 text-sm leading-relaxed text-[#a8abb3]">{issue.description}</p>{expandedIssue === index ? <div className="mb-4 rounded-2xl border border-[#44484f]/20 bg-black/40 p-4 text-sm leading-6 text-[#d8caff]"><p><span className="font-bold text-[#81ecff]">Impact:</span> {issue.impact}</p><p className="mt-2"><span className="font-bold text-[#81ecff]">Recommended fix:</span> {issue.fix}</p></div> : null}<button type="button" onClick={() => setExpandedIssue(expandedIssue === index ? null : index)} className="group inline-flex items-center gap-1 font-label text-[10px] uppercase tracking-[0.2em] text-[#81ecff]">{expandedIssue === index ? "Hide Details" : "See Detailed Fix"}<ChevronRight className={`h-3.5 w-3.5 transition-transform ${expandedIssue === index ? "rotate-90" : "group-hover:translate-x-1"}`} /></button></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="px-2 font-headline text-2xl font-bold">Quick Wins</h2>
                <div className="relative overflow-hidden rounded-3xl border border-[#44484f]/20 bg-gradient-to-br from-[#a68cff]/10 to-[#81ecff]/10 p-8">
                  <div className="absolute right-4 top-4 opacity-10"><WandSparkles className="h-16 w-16" /></div>
                  <ul className="relative z-10 space-y-6">{report.aiReport.quick_wins.slice(0, 3).map((item) => <li key={item} className="flex gap-4"><CheckCircle2 className="mt-0.5 h-5 w-5 text-[#81ecff]" /><div><p className="text-sm font-bold">{item}</p><p className="text-xs text-[#a8abb3]">Quick implementation | High-impact outcome</p></div></li>)}</ul>
                </div>
              </div>
            </section>

            <section id="plan" className="scroll-mt-28 grid grid-cols-1 gap-12 lg:grid-cols-[1fr,22rem]">
              <div className="space-y-6">
                <h2 className="px-2 font-headline text-2xl font-bold">Step-by-step Action Plan</h2>
                <div className="relative space-y-0 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-0.5 before:bg-[#44484f]/20 before:content-['']">
                  {report.aiReport.step_by_step_plan.slice(0, 3).map((step, index) => <div key={step} className={`relative pl-12 transition-all duration-700 ${planSeen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-45"} ${index < 2 ? "pb-10" : ""}`} style={{ transitionDelay: `${index * 180}ms` }}><div className={`absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition-all duration-700 ${planSeen ? "border-4 border-[#0a0e14] bg-[#81ecff] text-[#003840]" : "border-2 border-[#44484f] bg-[#20262f] text-[#a8abb3]"}`}>{index + 1}</div><h4 className={`mb-2 text-lg font-bold ${planSeen ? "text-[#f1f3fc]" : "text-[#a8abb3]"}`}>{step}</h4></div>)}
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="px-2 font-headline text-2xl font-bold">Share Report</h2>
                <div className="space-y-6 rounded-3xl border border-[#44484f]/10 bg-[#1b2028] p-8">
                  <div>
                    <label className="mb-3 block font-label text-[10px] uppercase tracking-[0.2em] text-[#a8abb3]">Email Report To</label>
                    <div className="relative"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="stakeholder@company.com" className="w-full rounded-2xl border-none bg-black py-4 pl-4 pr-14 text-sm text-[#f1f3fc] outline-none placeholder:text-[#72757d]" /><button type="button" onClick={handleSendEmail} disabled={!email || isEmailing} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-[#81ecff] text-[#003840] disabled:opacity-60">{isEmailing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}</button></div>
                    {emailMessage ? <p className="mt-3 text-xs text-[#a8abb3]">{emailMessage}</p> : null}
                  </div>
                  <div className="border-t border-[#44484f]/10 pt-4">
                    <label className="mb-3 block font-label text-[10px] uppercase tracking-[0.2em] text-[#a8abb3]">Shareable Link</label>
                    <div className="flex gap-2"><div className="flex-1 truncate rounded-2xl bg-black px-4 py-4 font-mono text-xs text-[#a8abb3]">{shareUrl || `/share/${report.shareId}`}</div><button type="button" onClick={handleCopy} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#44484f]/10 bg-[#20262f]"><Copy className="h-4 w-4" /></button></div>
                    {copyMessage ? <p className="mt-3 text-xs text-[#81ecff]">{copyMessage}</p> : null}
                  </div>
                </div>
              </div>
            </section>

            <footer className="border-t border-[#44484f]/5 pb-10 pt-12">
              <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                <div className="font-headline text-xl font-extrabold tracking-tighter text-[#f8faff]">GrowthLens AI</div>
                <div className="font-label text-xs uppercase tracking-[0.2em] text-[#a8abb3]/50 md:ml-auto">Copyright 2024 GrowthLens AI. All Intelligence Reserved.</div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}


