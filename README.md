# GrowthLens AI

GrowthLens AI is a full-stack SaaS MVP built with Next.js App Router. It analyzes a website with Google PageSpeed Insights, turns the raw metrics into structured AI recommendations with OpenRouter, and presents the result in a premium dashboard with sharing, history, re-analysis, email delivery, competitor comparison, and stable PDF export.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Better SQLite3 for local persistence
- OpenRouter API for AI insights
- Google PageSpeed Insights API for performance data
- `@react-pdf/renderer` for robust PDF generation

## Features

- Landing page with URL input, competitor input, and live progress feedback
- Report dashboard with growth score, device toggle, donut charts, core web vitals, AI insight section, quick wins, priority table, and step-by-step plan
- Structured JSON AI pipeline with safe fallback behavior
- Shareable report URLs
- PDF download endpoint with dark theme layout
- Optional email sending via SMTP
- Recent report history from SQLite

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in your keys:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment variables

- `NEXT_PUBLIC_APP_URL`: public base URL for share links and email links
- `PAGESPEED_API_KEY`: optional but recommended for higher PageSpeed quota
- `OPENROUTER_API_KEY`: required for live AI output
- `OPENROUTER_MODEL`: optional OpenRouter model name override
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`: optional email delivery config

## Architecture notes

- `app/api/analyze/route.ts` orchestrates the analysis pipeline
- `lib/pagespeed.ts` normalizes URLs and fetches mobile/desktop Lighthouse data
- `lib/openrouter.ts` requests strict JSON and falls back gracefully if AI is unavailable
- `lib/db.ts` persists reports in `data/growthlens.db`
- `components/report/report-client.tsx` powers the interactive dashboard
- `app/api/reports/[id]/pdf/route.tsx` renders PDFs server-side with React PDF

## Production guidance

- Swap SQLite for Postgres if you need multi-instance persistence
- Add auth, billing, and rate limiting before launching publicly
- Consider background jobs for heavy report generation and email delivery at scale
- Add tests around parsing, route validation, and external API adapters before broad rollout
