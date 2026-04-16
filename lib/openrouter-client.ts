import { aiResponseSchema, type AIResponse } from "@/lib/schema";
import { ActionPlanStep, PageSpeedReport, SiteContentContext } from "@/lib/types";

function getSiteLabel(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const base = hostname.split(".")[0] || hostname;
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return "This website";
  }
}

function buildPrompt(
  report: PageSpeedReport,
  competitorReports: PageSpeedReport[] = [],
  siteContext?: SiteContentContext | null,
  competitorContexts: Array<SiteContentContext | null> = []
) {
  return `
You are an expert growth strategist, technical SEO consultant, and website performance specialist.
Return ONLY valid JSON. No markdown. No prose outside JSON.

Analyze the website performance data and produce concrete, specific recommendations.
Focus on actionable growth, conversion, SEO, metadata, and speed improvements.
Avoid generic advice. Tie recommendations to the provided metrics and audit gaps.
Write for non-technical business users. Use plain English and explain things in a friendly, easy-to-understand way.
The SEO strategy MUST be about the analyzed website URL, not about GrowthLens AI or any generic product.
Use the provided page content context to infer what the website actually offers. Base the title tag, meta description, focus keywords, and content angle on that content.
Do not write vague SEO suggestions. Write concrete metadata a real business could use.

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
  "step_by_step_plan": [
    {
      "title": string,
      "description": string
    }
  ],
  "seo_strategy": {
    "titleTag": string,
    "metaDescription": string,
    "keywords": string[],
    "contentAngle": string
  },
  "competitor_comparison": {
    "executive_summary": string,
    "insights": [
      {
        "website": string,
        "strongest_area": string,
        "weakest_area": string,
        "why_it_wins": string,
        "why_it_lags": string
      }
    ]
  }
}

Rules:
- growth_score must be 0-100
- score_prediction.current must match the current growth score closely
- score_prediction.potential must be greater than or equal to current and at most 100
- top_issues must be sorted by highest business impact first
- priority_fixes must prioritize high impact and lower effort
- step_by_step_plan must be beginner-friendly and ordered, with a clear title and description for each step
- quick_wins, top_issues, step_by_step_plan, and ai_insight must be understandable by a founder, marketer, or small business owner
- If no competitor report exists, omit competitor_comparison
- If competitor reports exist, compare the main website against all provided competitors and explain which website is stronger in which area and why

Primary site data:
${JSON.stringify(report, null, 2)}

Primary site content context:
${JSON.stringify(siteContext ?? null, null, 2)}

Competitor data:
${competitorReports.length ? JSON.stringify(competitorReports, null, 2) : "none"}

Competitor content context:
${JSON.stringify(competitorContexts, null, 2)}
`.trim();
}

function buildFallbackKeywords(siteLabel: string, siteContext?: SiteContentContext | null) {
  const source = [
    siteContext?.title,
    siteContext?.metaDescription,
    siteContext?.h1,
    ...(siteContext?.h2Headings ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const candidates = [
    siteLabel.toLowerCase(),
    ...Array.from(
      new Set(
        source
          .split(/[^a-z0-9]+/)
          .filter((word) => word.length >= 4)
          .filter((word) => !["with", "that", "this", "from", "your", "have", "will", "page", "home"].includes(word))
      )
    ).slice(0, 5)
  ];

  return Array.from(new Set(candidates)).slice(0, 6);
}

function buildFallbackTitle(siteLabel: string, siteContext?: SiteContentContext | null) {
  const h1 = siteContext?.h1 || siteContext?.title;
  if (h1) {
    return `${h1} | ${siteLabel}`;
  }
  return `${siteLabel} | Trusted solutions and a faster website experience`;
}

function buildFallbackMeta(siteLabel: string, siteContext?: SiteContentContext | null) {
  const source = siteContext?.metaDescription || siteContext?.paragraphs?.[0] || siteContext?.h1;
  if (source) {
    return source.slice(0, 155);
  }
  return `Discover what ${siteLabel} offers, why it matters, and how a faster, clearer website experience can help turn more visitors into customers.`;
}

function buildFallbackAngle(siteLabel: string, siteContext?: SiteContentContext | null) {
  const h1 = siteContext?.h1 || siteContext?.title;
  if (h1) {
    return `Lead with "${h1}" and support it with simple proof points, a clear call to action, and a faster page experience.`;
  }
  return `Clarify the main promise ${siteLabel} offers, then support it with stronger proof, clearer messaging, and a faster experience.`;
}

function buildFallbackPlan(siteLabel: string): ActionPlanStep[] {
  return [
    {
      title: "Review the first screen experience",
      description: `Review ${siteLabel}'s homepage like a first-time visitor and note what feels slow or unclear.`
    },
    {
      title: "Compress heavy visual assets",
      description: "Compress large images and videos, especially those shown near the top of the page."
    },
    {
      title: "Delay non-essential scripts",
      description: "Delay popups, trackers, and extra scripts until after the main content has loaded."
    },
    {
      title: "Clarify headline and metadata",
      description: "Rewrite the page title, description, and top headline so the main value is obvious in seconds."
    }
  ];
}

function fallbackInsight(
  report: PageSpeedReport,
  competitorReports: PageSpeedReport[] = [],
  siteContext?: SiteContentContext | null
): AIResponse {
  const siteLabel = getSiteLabel(report.url);
  const current = Math.round((report.mobile.overallScore + report.desktop.overallScore) / 2);
  const potential = Math.min(100, current + 18);
  const worstAudits = report.audits.slice(0, 4);
  const competitorScores = competitorReports.map((competitor) => ({
    url: competitor.url,
    score: Math.round((competitor.mobile.overallScore + competitor.desktop.overallScore) / 2),
    report: competitor
  }));
  const bestCompetitor = [...competitorScores].sort((a, b) => b.score - a.score)[0] ?? null;

  return {
    growth_score: current,
    summary: `${siteLabel} already has a useful foundation, but a few slow or heavy page elements are likely making the experience feel less polished than it should.`,
    ai_insight:
      "The simplest growth win is to make the first screen load faster and feel clearer. Once visitors can understand the page quickly, they are more likely to stay, trust the site, and take action.",
    metrics: {
      mobile_score: report.mobile.overallScore,
      desktop_score: report.desktop.overallScore,
      strongest_area:
        report.desktop.categories.seo.score >= report.mobile.categories.performance.score
          ? "Search visibility"
          : "Desktop experience",
      weakest_area:
        report.mobile.categories.performance.score <= report.desktop.categories.accessibility.score
          ? "Mobile speed"
          : "Usability"
    },
    score_prediction: {
      current,
      potential,
      rationale:
        "If the slowest page elements are cleaned up first, the site should feel faster and the overall score should rise noticeably."
    },
    top_issues: worstAudits.map((audit, index) => ({
      title:
        index === 0
          ? "Important parts of the page are loading too slowly"
          : index === 1
            ? "The page is carrying more weight than it needs to"
            : audit.title,
      description:
        index < 2
          ? "Visitors may feel the page is slower than expected, which can reduce trust and increase drop-offs."
          : audit.description,
      impact:
        audit.displayValue ||
        "This can make the website feel slower, reduce engagement, and weaken the first impression.",
      fix:
        index === 0
          ? "Reduce large images, videos, and heavy scripts near the top of the page so visitors see useful content faster."
          : index === 1
            ? "Remove or delay anything that is not needed immediately, so the main message loads first."
            : `Review ${audit.title.toLowerCase()} and simplify or delay whatever is slowing the page down.`,
      impactLevel: index < 2 ? "High" : "Medium",
      difficulty: index === 0 ? "Medium" : "Easy",
      priority: 100 - index * 12,
      affectedMetric: audit.title
    })),
    quick_wins: [
      "Shrink large images so the page feels faster, especially on phones.",
      "Delay extra scripts until after the main content becomes visible.",
      `Rewrite ${siteLabel}'s title and description so search users immediately understand the offer.`,
      "Make the headline and call-to-action clearer in the first screen people see."
    ],
    priority_fixes: [
      { fix: "Compress the largest images on key pages", impact: "High", difficulty: "Easy", priority: 95 },
      { fix: "Delay extra scripts until after the page becomes usable", impact: "High", difficulty: "Medium", priority: 90 },
      { fix: "Rewrite page titles and descriptions for clearer search appeal", impact: "Medium", difficulty: "Easy", priority: 84 },
      { fix: "Review third-party widgets and remove low-value ones", impact: "Medium", difficulty: "Medium", priority: 78 }
    ],
    step_by_step_plan: buildFallbackPlan(siteLabel),
    seo_strategy: {
      titleTag: buildFallbackTitle(siteLabel, siteContext),
      metaDescription: buildFallbackMeta(siteLabel, siteContext),
      keywords: buildFallbackKeywords(siteLabel, siteContext),
      contentAngle: buildFallbackAngle(siteLabel, siteContext)
    },
    competitor_comparison: competitorReports.length
      ? {
          executive_summary:
            bestCompetitor && bestCompetitor.score > current
              ? `${siteLabel} is currently trailing ${getSiteLabel(bestCompetitor.url)} in overall experience, mainly because the competitor feels faster or clearer in a few high-visibility areas.`
              : `${siteLabel} is performing competitively across the comparison set, with room to improve speed consistency and message clarity even further.`,
          insights: [
            {
              website: siteLabel,
              strongest_area:
                report.desktop.categories.seo.score >= report.mobile.categories.performance.score
                  ? "SEO"
                  : "Desktop experience",
              weakest_area:
                report.mobile.categories.performance.score <=
                report.desktop.categories.accessibility.score
                  ? "Mobile speed"
                  : "Usability",
              why_it_wins:
                "The site already has at least one strong area that gives it a solid base to compete from.",
              why_it_lags:
                "The biggest gaps are still tied to how quickly and clearly the experience lands for new visitors."
            },
            ...competitorScores.map((competitor) => ({
              website: getSiteLabel(competitor.url),
              strongest_area:
                competitor.report.mobile.categories.performance.score >=
                competitor.report.desktop.categories.seo.score
                  ? "Mobile performance"
                  : "SEO",
              weakest_area:
                competitor.report.desktop.categories.accessibility.score <=
                competitor.report.mobile.categories.performance.score
                  ? "Accessibility"
                  : "Desktop consistency",
              why_it_wins:
                competitor.score >= current
                  ? "This site currently feels stronger because its page experience or message clarity is landing better in the comparison set."
                  : "It still provides a useful benchmark in at least one category where it performs well.",
              why_it_lags:
                "It also has visible weaknesses, so it can still be overtaken with stronger speed and content improvements."
            }))
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
  competitorReports: PageSpeedReport[] = [],
  siteContext?: SiteContentContext | null,
  competitorContexts: Array<SiteContentContext | null> = []
) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return fallbackInsight(report, competitorReports, siteContext);
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
            content: buildPrompt(report, competitorReports, siteContext, competitorContexts)
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
    return fallbackInsight(report, competitorReports, siteContext);
  }
}
