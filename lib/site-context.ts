import { normalizeUrl } from "@/lib/utils";
import { SiteContentContext } from "@/lib/types";

function decodeHtml(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(input: string) {
  return decodeHtml(input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function matchOne(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ? stripTags(match[1]) : undefined;
}

function matchMany(html: string, pattern: RegExp, limit: number) {
  const results: string[] = [];
  const matches = html.matchAll(pattern);

  for (const match of matches) {
    if (match[1]) {
      const value = stripTags(match[1]);
      if (value) {
        results.push(value);
      }
    }
    if (results.length >= limit) break;
  }

  return results;
}

export async function getSiteContentContext(inputUrl: string): Promise<SiteContentContext> {
  const url = normalizeUrl(inputUrl);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "GrowthLensAI/1.0"
      },
      cache: "no-store",
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { url, h2Headings: [], paragraphs: [] };
    }

    const html = await response.text();

    return {
      url,
      title: matchOne(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      metaDescription: matchOne(
        html,
        /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i
      ),
      h1: matchOne(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
      h2Headings: matchMany(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi, 6),
      paragraphs: matchMany(html, /<p[^>]*>([\s\S]*?)<\/p>/gi, 5)
    };
  } catch {
    return { url, h2Headings: [], paragraphs: [] };
  }
}
