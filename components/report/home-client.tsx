"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, LoaderCircle, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StoredReport } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const progressSteps = [
  "Fetching performance data...",
  "Analyzing metrics...",
  "Generating AI insights..."
];

export function HomeClient({ recentReports }: { recentReports: StoredReport[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    <div className="relative overflow-hidden">
      <div className="grid-overlay absolute inset-0 opacity-25" />
      <section className="section-shell relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70"
          >
            <Sparkles className="mr-2 h-4 w-4 text-accent" />
            AI-powered performance intelligence for growth teams
          </motion.div>
          <h1 className="mt-8 text-5xl font-semibold leading-tight text-white md:text-7xl">
            Turn any website audit into a premium growth report.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-white/68">
            GrowthLens AI pulls live performance data, runs structured AI analysis, and turns the output
            into a polished report you can share, export, and act on immediately.
          </p>
        </div>

        <Card className="mx-auto mt-12 max-w-4xl p-4 sm:p-6">
          <form onSubmit={handleAnalyze} className="grid gap-4 md:grid-cols-[1.4fr,1fr,auto]">
            <input
              required
              type="url"
              placeholder="Enter website URL"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={isPending}
              className="h-14 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm text-white outline-none placeholder:text-white/30"
            />
            <input
              type="url"
              placeholder="Competitor URL (optional)"
              value={competitorUrl}
              onChange={(event) => setCompetitorUrl(event.target.value)}
              disabled={isPending}
              className="h-14 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm text-white outline-none placeholder:text-white/30"
            />
            <Button type="submit" className="h-14 px-7" disabled={isPending}>
              {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Analyze Website
            </Button>
          </form>

          <div className="mt-4 min-h-10">
            {stepIndex !== null ? (
              <div className="flex flex-wrap gap-2">
                {progressSteps.map((step, index) => (
                  <div
                    key={step}
                    className={`rounded-full px-4 py-2 text-sm ${
                      index <= stepIndex
                        ? "bg-sky-400/12 text-sky-100 ring-1 ring-sky-300/20"
                        : "bg-white/[0.03] text-white/35"
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/42">This will take only a few minutes.</p>
            )}
            {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
          </div>
        </Card>
      </section>

      <section id="features" className="section-shell py-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            {
              title: "Structured AI reports",
              copy: "Every analysis returns prioritized fixes, score forecasts, quick wins, and metadata suggestions in a clean JSON-backed format."
            },
            {
              title: "Interactive dashboard",
              copy: "Device toggles, animated donut charts, issue badges, and shareable views give the report a polished SaaS feel."
            },
            {
              title: "Export-ready output",
              copy: "Stable PDF generation and share links make the report usable for clients, internal teams, and async reviews."
            }
          ].map((item) => (
            <Card key={item.title} className="p-6">
              <div className="mb-4 inline-flex rounded-2xl bg-white/[0.05] p-3">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/68">{item.copy}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="benefits" className="section-shell py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr,1.1fr]">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-warm">Built for momentum</p>
            <h2 className="text-4xl font-semibold text-white">Designed like a product, not a raw audit dump.</h2>
            <p className="max-w-2xl text-base leading-7 text-white/68">
              The report experience is shaped for founders, growth marketers, agencies, and product teams who
              need a fast answer to what matters most and what to fix first.
            </p>
          </div>
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Color-coded performance scoring",
                "Competitor side-by-side benchmarking",
                "Beginner-friendly action plans",
                "Priority matrix for engineering focus",
                "Share links for stakeholders",
                "Email delivery support"
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent-warm" />
                  <span className="text-sm text-white/72">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section id="history" className="section-shell pb-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent">Recent analyses</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Continue from past reports</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentReports.length ? (
            recentReports.map((report) => (
              <a key={report.id} href={`/report/${report.id}`}>
                <Card className="h-full p-5 transition hover:-translate-y-1 hover:bg-white/[0.06]">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/40">Growth score</div>
                  <div className="mt-3 text-4xl font-semibold text-white">{report.aiReport.growth_score}</div>
                  <p className="mt-4 line-clamp-2 text-sm text-white/66">{report.url}</p>
                  <p className="mt-4 text-xs text-white/42">{formatDate(report.updatedAt)}</p>
                </Card>
              </a>
            ))
          ) : (
            <Card className="col-span-full p-6 text-sm text-white/56">
              No reports yet. Run your first analysis above to populate history.
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
