import { aiResponseSchema, type AIResponse } from "@/lib/schema";
import { PageSpeedReport } from "@/lib/types";

function buildPrompt(report: PageSpeedReport, competitorReport?: PageSpeedReport | null) {
  return `
You are an expert growth strategist, technical SEO consultant, and web performance specialist.
Return ONLY valid JSON. No markdown. No prose outside JSON.

Analyze the following website performance data and produce concrete, specific recommendations.
Focus on actionable growth, conversion, SEO, metadata, and speed improvements.
Avoid generic advice. Tie recommendations to metrics and audit gaps.

Required output schema:
{
  "growth_score": number,
  "summary": string,
  "ai_insight": string,
  "metrics": {
    "mobile_score": number,
    "desktop_score": number,
    "strongest_area": string,
    "weakest_area": string
  },
  "score_prediction": {
    "current": number,
    "potential": number,
    "rationale": string
  },
  "top_issues": [
    {
      "title": string,
      "description": string,
      "impact": string,
      "fix": string,
      "impactLevel": "High" | "Medium" | "Low",
      "difficulty": "Easy" | "Medium" | "Hard",
      "priority": number,
      "affectedMetric": string
    }
  ],
  "quick_wins": string[],
  "priority_fixes": [
    {
      "fix": string,
      "impact": "High" | "Medium" | "Low",
      "difficulty": "Easy" | "Medium" | "Hard",
      "priority": number
    }
  ],
  "step_by_step_plan": string[],
  "seo_strategy": {
    "titleTag": string,
    "metaDescription": string,
    "keywords": string[],
    "contentAngle": string
  },
  "competitor_comparison": {
    "summary": string,
    "outperform_actions": string[]
  }
}

Rules:
- growth_score must be 0-100
- score_prediction.current must match the current growth score closely
- score_prediction.potential must be greater than or equal to current and at most 100
- top_issues must be sorted by highest business impact first
- priority_fixes must prioritize high impact and lower effort
- step_by_step_plan must be beginner-friendly and ordered
- If no competitor report exists, omit competitor_comparison

Primary site data:
${JSON.stringify(report, null, 2)}

Competitor data:
${competitorReport ? JSON.stringify(competitorReport, null, 2) : "none"}
`.trim();
}

function fallbackInsight(report: PageSpeedReport, competitorReport?: PageSpeedReport | null): AIResponse {
  const current = Math.round((report.mobile.overallScore + report.desktop.overallScore) / 2);
  const potential = Math.min(100, current + 18);
  const worstAudits = report.audits.slice(0, 4);

  return {
    growth_score: current,
    summary:
      "This site shows clear room to improve speed, SEO hygiene, and UX confidence. Tightening the heaviest bottlenecks should lift both discoverability and conversion readiness.",
    ai_insight:
      "The biggest growth unlock is reducing render-blocking and heavy-page friction first, then refining metadata and trust signals so search traffic lands on a faster, clearer experience.",
    metrics: {
      mobile_score: report.mobile.overallScore,
      desktop_score: report.desktop.overallScore,
      strongest_area:
        report.desktop.categories.seo.score >= report.mobile.categories.performance.score
          ? "SEO"
          : "Desktop performance",
      weakest_area:
        report.mobile.categories.performance.score <= report.desktop.categories.accessibility.score
          ? "Mobile performance"
          : "Accessibility"
    },
    score_prediction: {
      current,
      potential,
      rationale:
        "Resolving the weakest Lighthouse audits and tightening core web vitals should reasonably unlock a double-digit score improvement."
    },
    top_issues: worstAudits.map((audit, index) => ({
      title: audit.title,
      description: audit.description,
      impact: audit.displayValue || "This audit is underperforming and likely contributing to slower UX or weaker SEO signals.",
      fix: `Address ${audit.title.toLowerCase()} by reviewing the affected templates, scripts, and asset delivery path.`,
      impactLevel: index < 2 ? "High" : "Medium",
      difficulty: index === 0 ? "Medium" : "Easy",
      priority: 100 - index * 12,
      affectedMetric: audit.title
    })),
    quick_wins: [
      "Compress and defer non-critical images below the fold.",
      "Trim unused JavaScript and third-party scripts on initial load.",
      "Refresh title/meta description copy to better match search intent.",
      "Ensure headings and primary CTA communicate value in the first viewport."
    ],
    priority_fixes: [
      { fix: "Optimize above-the-fold images", impact: "High", difficulty: "Easy", priority: 95 },
      { fix: "Reduce unused JavaScript", impact: "High", difficulty: "Medium", priority: 90 },
      { fix: "Improve metadata and CTR copy", impact: "Medium", difficulty: "Easy", priority: 84 },
      { fix: "Audit third-party scripts", impact: "Medium", difficulty: "Medium", priority: 78 }
    ],
    step_by_step_plan: [
      "Benchmark the current homepage and top landing pages so improvements can be measured clearly.",
      "Compress large media assets and serve responsive image sizes first.",
      "Remove or defer non-essential scripts that block rendering.",
      "Tighten the page title, meta description, and hero copy around the site’s main offer.",
      "Re-run the audit and compare mobile and desktop gains before moving to deeper template refactors."
    ],
    seo_strategy: {
      titleTag: "GrowthLens AI | Faster Website Performance & Growth Insights",
      metaDescription:
        "Get an AI-powered website growth report with performance insights, SEO recommendations, and prioritized fixes in minutes.",
      keywords: ["website performance audit", "ai growth report", "seo insights", "core web vitals"],
      contentAngle:
        "Position the site around measurable growth outcomes, not only technical metrics, so messaging supports acquisition and trust."
    },
    competitor_comparison: competitorReport
      ? {
          summary:
            "The competitor appears to edge ahead in some performance or SEO signals, which suggests faster delivery or stronger content alignment.",
          outperform_actions: [
            "Close the largest Core Web Vitals gap first to narrow UX perception differences.",
            "Upgrade landing-page metadata and headline clarity to compete more aggressively for search clicks.",
            "Use comparison benchmarks from the faster category scores to guide sprint priorities."
          ]
        }
      : undefined
  };
}

function parseJsonFromText(text: string) {
  const direct = text.trim();
  try {
    return JSON.parse(direct);
  } catch {
    const match = direct.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("OpenRouter did not return JSON.");
    }
    return JSON.parse(match[0]);
  }
}

export async function generateAIReport(
  report: PageSpeedReport,
  competitorReport?: PageSpeedReport | null
) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return fallbackInsight(report, competitorReport);
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "GrowthLens AI"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4.1-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: buildPrompt(report, competitorReport)
          }
        ]
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      throw new Error("OpenRouter returned an unexpected payload.");
    }

    const parsed = parseJsonFromText(content);
    return aiResponseSchema.parse(parsed);
  } catch {
    return fallbackInsight(report, competitorReport);
  }
}
