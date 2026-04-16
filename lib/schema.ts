import { z } from "zod";

export const analyzeRequestSchema = z.object({
  url: z.string().min(1),
  competitorUrl: z.string().optional(),
  competitorUrls: z.array(z.string().min(1)).max(3).optional(),
  reportId: z.string().optional()
});

export const aiResponseSchema = z.object({
  growth_score: z.number().min(0).max(100),
  summary: z.string().min(1),
  ai_insight: z.string().min(1),
  metrics: z.object({
    mobile_score: z.number().min(0).max(100),
    desktop_score: z.number().min(0).max(100),
    strongest_area: z.string().min(1),
    weakest_area: z.string().min(1)
  }),
  score_prediction: z.object({
    current: z.number().min(0).max(100),
    potential: z.number().min(0).max(100),
    rationale: z.string().min(1)
  }),
  top_issues: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        impact: z.string().min(1),
        fix: z.string().min(1),
        impactLevel: z.enum(["High", "Medium", "Low"]),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        priority: z.number().min(1).max(100),
        affectedMetric: z.string().optional()
      })
    )
    .min(3)
    .max(8),
  quick_wins: z.array(z.string().min(1)).min(3).max(8),
  priority_fixes: z
    .array(
      z.object({
        fix: z.string().min(1),
        impact: z.enum(["High", "Medium", "Low"]),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        priority: z.number().min(1).max(100)
      })
    )
    .min(3)
    .max(8),
  step_by_step_plan: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1)
      })
    )
    .min(3)
    .max(6),
  seo_strategy: z.object({
    titleTag: z.string().min(1),
    metaDescription: z.string().min(1),
    keywords: z.array(z.string().min(1)).min(3).max(8),
    contentAngle: z.string().min(1)
  }),
  competitor_comparison: z
    .object({
      executive_summary: z.string().min(1),
      insights: z
        .array(
          z.object({
            website: z.string().min(1),
            strongest_area: z.string().min(1),
            weakest_area: z.string().min(1),
            why_it_wins: z.string().min(1),
            why_it_lags: z.string().min(1)
          })
        )
        .min(1)
        .max(4)
    })
    .optional()
});

export type AIResponse = z.infer<typeof aiResponseSchema>;
