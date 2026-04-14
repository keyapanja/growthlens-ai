import { clamp, normalizeUrl, toPercent } from "@/lib/utils";
import { CategoryKey, DeviceType, PageSpeedDeviceSnapshot, PageSpeedReport } from "@/lib/types";

const CATEGORY_MAP: Record<CategoryKey, string> = {
  performance: "performance",
  accessibility: "accessibility",
  best_practices: "best-practices",
  seo: "seo"
};

const VITAL_KEYS = {
  fcp: "first-contentful-paint",
  lcp: "largest-contentful-paint",
  tbt: "total-blocking-time",
  cls: "cumulative-layout-shift"
} as const;

type PageSpeedApiResponse = {
  lighthouseResult: {
    finalDisplayedUrl: string;
    categories: Record<string, { score: number | null; title: string }>;
    audits: Record<
      string,
      {
        id: string;
        title: string;
        description: string;
        displayValue?: string;
        score: number | null;
        numericValue?: number;
      }
    >;
  };
};

function getPageSpeedErrorMessage(strategy: DeviceType, status: number, rawMessage: string) {
  const message = rawMessage.toLowerCase();

  if (status === 429 || message.includes("quota exceeded") || message.includes("rateLimitExceeded".toLowerCase())) {
    return `PageSpeed quota exceeded for ${strategy}. The configured Google PageSpeed API key has hit its request limit, so the analysis cannot continue right now.`;
  }

  if (status === 403 || message.includes("api key not valid")) {
    return `PageSpeed rejected the API key for ${strategy}. Please verify the Google PageSpeed Insights key configuration.`;
  }

  if (status === 500 && (message.includes("page_hung") || message.includes("stopped responding"))) {
    return `PageSpeed could not finish the ${strategy} test because the website stopped responding during analysis. This usually happens when the page is too heavy, blocks too long, or the target site temporarily fails to load. Please try again in a moment or test a different page from the same website.`;
  }

  if (status === 400 && message.includes("lighthouse")) {
    return `PageSpeed could not complete the ${strategy} test for this URL. Please double-check the website address and try again.`;
  }

  return `PageSpeed request failed for ${strategy}. ${rawMessage}`;
}

function scoreFromCategory(
  categories: PageSpeedApiResponse["lighthouseResult"]["categories"],
  key: CategoryKey
) {
  const score = categories[CATEGORY_MAP[key]]?.score ?? 0;
  return toPercent(score);
}

function metricScore(metric: keyof typeof VITAL_KEYS, numericValue: number) {
  switch (metric) {
    case "fcp":
      if (numericValue <= 1800) return 100;
      if (numericValue <= 3000) return 70;
      return 35;
    case "lcp":
      if (numericValue <= 2500) return 100;
      if (numericValue <= 4000) return 65;
      return 25;
    case "tbt":
      if (numericValue <= 200) return 100;
      if (numericValue <= 600) return 60;
      return 25;
    case "cls":
      if (numericValue <= 0.1) return 100;
      if (numericValue <= 0.25) return 60;
      return 20;
  }
}

function buildDeviceSnapshot(
  strategy: DeviceType,
  response: PageSpeedApiResponse
): PageSpeedDeviceSnapshot {
  const categories = {
    performance: {
      label: "Performance",
      score: scoreFromCategory(response.lighthouseResult.categories, "performance")
    },
    accessibility: {
      label: "Accessibility",
      score: scoreFromCategory(response.lighthouseResult.categories, "accessibility")
    },
    best_practices: {
      label: "Best Practices",
      score: scoreFromCategory(response.lighthouseResult.categories, "best_practices")
    },
    seo: {
      label: "SEO",
      score: scoreFromCategory(response.lighthouseResult.categories, "seo")
    }
  };

  const audits = response.lighthouseResult.audits;
  const fcpValue = audits[VITAL_KEYS.fcp]?.numericValue ?? 0;
  const lcpValue = audits[VITAL_KEYS.lcp]?.numericValue ?? 0;
  const tbtValue = audits[VITAL_KEYS.tbt]?.numericValue ?? 0;
  const clsValue = audits[VITAL_KEYS.cls]?.numericValue ?? 0;

  const overallScore = clamp(
    Math.round(
      categories.performance.score * 0.55 +
        categories.accessibility.score * 0.15 +
        categories.best_practices.score * 0.15 +
        categories.seo.score * 0.15
    ),
    0,
    100
  );

  return {
    strategy,
    overallScore,
    categories,
    vitals: {
      fcp: {
        label: "FCP",
        value: fcpValue,
        displayValue: audits[VITAL_KEYS.fcp]?.displayValue ?? `${(fcpValue / 1000).toFixed(1)} s`,
        numericUnit: "ms",
        score: metricScore("fcp", fcpValue)
      },
      lcp: {
        label: "LCP",
        value: lcpValue,
        displayValue: audits[VITAL_KEYS.lcp]?.displayValue ?? `${(lcpValue / 1000).toFixed(1)} s`,
        numericUnit: "ms",
        score: metricScore("lcp", lcpValue)
      },
      tbt: {
        label: "TBT",
        value: tbtValue,
        displayValue: audits[VITAL_KEYS.tbt]?.displayValue ?? `${Math.round(tbtValue)} ms`,
        numericUnit: "ms",
        score: metricScore("tbt", tbtValue)
      },
      cls: {
        label: "CLS",
        value: clsValue,
        displayValue: audits[VITAL_KEYS.cls]?.displayValue ?? clsValue.toFixed(2),
        numericUnit: "",
        score: metricScore("cls", clsValue)
      }
    }
  };
}

async function fetchStrategy(url: string, strategy: DeviceType) {
  const apiKey = process.env.PAGESPEED_API_KEY;
  const apiBaseUrl =
    process.env.PAGESPEED_API_URL ??
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

  if (!apiKey) {
    throw new Error(
      "PageSpeed API key is missing. Set PAGESPEED_API_KEY in your local environment before analyzing."
    );
  }

  const params = new URLSearchParams({
    url,
    strategy,
    category: "performance"
  });

  ["accessibility", "best-practices", "seo"].forEach((category) =>
    params.append("category", category)
  );

  if (apiKey) {
    params.set("key", apiKey);
  }

  const response = await fetch(`${apiBaseUrl}?${params.toString()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    const rawMessage = await response.text();
    throw new Error(getPageSpeedErrorMessage(strategy, response.status, rawMessage));
  }

  return (await response.json()) as PageSpeedApiResponse;
}

export async function analyzeWithPageSpeed(inputUrl: string): Promise<PageSpeedReport> {
  const url = normalizeUrl(inputUrl);
  const [mobileResponse, desktopResponse] = await Promise.all([
    fetchStrategy(url, "mobile"),
    fetchStrategy(url, "desktop")
  ]);

  const mobile = buildDeviceSnapshot("mobile", mobileResponse);
  const desktop = buildDeviceSnapshot("desktop", desktopResponse);

  const audits = Object.values(mobileResponse.lighthouseResult.audits)
    .filter((audit) => audit.score !== null && audit.score < 0.9)
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 8)
    .map((audit) => ({
      id: audit.id,
      title: audit.title,
      description: audit.description,
      displayValue: audit.displayValue,
      score: audit.score
    }));

  return {
    url: mobileResponse.lighthouseResult.finalDisplayedUrl || url,
    fetchedAt: new Date().toISOString(),
    mobile,
    desktop,
    audits
  };
}
