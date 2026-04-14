export type DeviceType = "mobile" | "desktop";
export type PriorityLevel = "High" | "Medium" | "Low";
export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export type CategoryKey =
  | "performance"
  | "accessibility"
  | "best_practices"
  | "seo";

export interface ScoreCategory {
  label: string;
  score: number;
}

export interface CoreWebVital {
  label: string;
  value: number;
  displayValue: string;
  numericUnit: string;
  score: number;
}

export interface DeviceMetrics {
  categories: Record<CategoryKey, ScoreCategory>;
  vitals: {
    fcp: CoreWebVital;
    lcp: CoreWebVital;
    tbt: CoreWebVital;
    cls: CoreWebVital;
  };
}

export interface CompetitorSnapshot {
  url: string;
  overallScore: number;
  mobileScore: number;
  desktopScore: number;
  betterAreas: string[];
  gaps: string[];
}

export interface TopIssue {
  title: string;
  description: string;
  impact: string;
  fix: string;
  impactLevel: PriorityLevel;
  difficulty: DifficultyLevel;
  priority: number;
  affectedMetric?: string;
}

export interface FixPriorityRow {
  fix: string;
  impact: PriorityLevel;
  difficulty: DifficultyLevel;
  priority: number;
}

export interface SeoRecommendation {
  titleTag: string;
  metaDescription: string;
  keywords: string[];
  contentAngle: string;
}

export interface SiteContentContext {
  url: string;
  title?: string;
  metaDescription?: string;
  h1?: string;
  h2Headings: string[];
  paragraphs: string[];
}

export interface AIReportPayload {
  growth_score: number;
  summary: string;
  ai_insight: string;
  metrics: {
    mobile_score: number;
    desktop_score: number;
    strongest_area: string;
    weakest_area: string;
  };
  score_prediction: {
    current: number;
    potential: number;
    rationale: string;
  };
  top_issues: TopIssue[];
  quick_wins: string[];
  priority_fixes: FixPriorityRow[];
  step_by_step_plan: string[];
  seo_strategy: SeoRecommendation;
  competitor_comparison?: {
    summary: string;
    outperform_actions: string[];
  };
}

export interface PageSpeedDeviceSnapshot extends DeviceMetrics {
  strategy: DeviceType;
  overallScore: number;
}

export interface PageSpeedReport {
  url: string;
  fetchedAt: string;
  mobile: PageSpeedDeviceSnapshot;
  desktop: PageSpeedDeviceSnapshot;
  audits: Array<{
    id: string;
    title: string;
    description: string;
    displayValue?: string;
    score: number | null;
  }>;
}

export interface StoredReport {
  id: string;
  shareId: string;
  url: string;
  competitorUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  pagespeed: PageSpeedReport;
  competitorPagespeed?: PageSpeedReport | null;
  aiReport: AIReportPayload;
}
