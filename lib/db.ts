import { createPool } from "@vercel/postgres";
import fs from "fs/promises";
import path from "path";
import { StoredReport } from "@/lib/types";

type ReportRow = {
  id: string;
  shareid: string;
  shareId?: string;
  viewerid?: string | null;
  viewerId?: string | null;
  url: string;
  competitorurl: string | null;
  competitorUrl?: string | null;
  competitorurlsjson?: string | null;
  competitorUrlsJson?: string | null;
  createdat: string;
  createdAt?: string;
  updatedat: string;
  updatedAt?: string;
  pagespeedjson: string;
  pagespeedJson?: string;
  competitorpagespeedjson: string | null;
  competitorPagespeedJson?: string | null;
  competitorsjson?: string | null;
  competitorsJson?: string | null;
  aireportjson: string;
  aiReportJson?: string;
};

const databaseUrl =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL;

const usePostgres = Boolean(databaseUrl);
const isVercelRuntime = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const db = usePostgres ? createPool({ connectionString: databaseUrl }) : null;

let postgresSchemaReady: Promise<void> | null = null;
const localDataDir = path.join(process.cwd(), "data");
const localReportsPath = path.join(localDataDir, "growthlens-reports.json");

function mapRow(row: ReportRow): StoredReport {
  const pagespeedJson = row.pagespeedjson ?? row.pagespeedJson;
  const competitorPagespeedJson =
    row.competitorpagespeedjson ?? row.competitorPagespeedJson ?? null;
  const competitorUrlsJson = row.competitorurlsjson ?? row.competitorUrlsJson ?? null;
  const competitorsJson = row.competitorsjson ?? row.competitorsJson ?? null;
  const aiReportJson = row.aireportjson ?? row.aiReportJson;

  return {
    id: row.id,
    shareId: row.shareid ?? row.shareId ?? "",
    viewerId: row.viewerid ?? row.viewerId ?? null,
    url: row.url,
    competitorUrl: row.competitorurl ?? row.competitorUrl ?? null,
    competitorUrls: competitorUrlsJson
      ? typeof competitorUrlsJson === "string"
        ? JSON.parse(competitorUrlsJson)
        : (competitorUrlsJson as never)
      : row.competitorurl ?? row.competitorUrl
        ? [row.competitorurl ?? row.competitorUrl ?? ""].filter(Boolean)
        : [],
    createdAt: row.createdat ?? row.createdAt ?? "",
    updatedAt: row.updatedat ?? row.updatedAt ?? "",
    pagespeed:
      typeof pagespeedJson === "string" ? JSON.parse(pagespeedJson) : (pagespeedJson as never),
    competitorPagespeed: competitorPagespeedJson
      ? typeof competitorPagespeedJson === "string"
        ? JSON.parse(competitorPagespeedJson)
        : (competitorPagespeedJson as never)
      : null,
    competitors: competitorsJson
      ? typeof competitorsJson === "string"
        ? JSON.parse(competitorsJson)
        : (competitorsJson as never)
      : competitorPagespeedJson && (row.competitorurl ?? row.competitorUrl)
        ? [
            {
              url: row.competitorurl ?? row.competitorUrl ?? "",
              pagespeed:
                typeof competitorPagespeedJson === "string"
                  ? JSON.parse(competitorPagespeedJson)
                  : (competitorPagespeedJson as never)
            }
          ]
        : [],
    aiReport:
      typeof aiReportJson === "string" ? JSON.parse(aiReportJson) : (aiReportJson as never)
  };
}

async function ensurePostgresSchema() {
  if (!db) return;

  if (!postgresSchemaReady) {
    postgresSchemaReady = (async () => {
      await db.sql`
        CREATE TABLE IF NOT EXISTS reports (
          id TEXT PRIMARY KEY,
          shareId TEXT NOT NULL UNIQUE,
          viewerId TEXT,
          url TEXT NOT NULL,
          competitorUrl TEXT,
          competitorUrlsJson JSONB,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          pagespeedJson JSONB NOT NULL,
          competitorPagespeedJson JSONB,
          competitorsJson JSONB,
          aiReportJson JSONB NOT NULL
        );
      `;

      await db.sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS competitorUrlsJson JSONB;`;
      await db.sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS competitorsJson JSONB;`;
      await db.sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS viewerId TEXT;`;

      await db.sql`
        CREATE INDEX IF NOT EXISTS reports_updatedAt_idx
        ON reports (updatedAt DESC);
      `;

      await db.sql`
        CREATE INDEX IF NOT EXISTS reports_viewerId_updatedAt_idx
        ON reports (viewerId, updatedAt DESC);
      `;
    })();
  }

  await postgresSchemaReady;
}

async function readLocalReports(): Promise<StoredReport[]> {
  if (isVercelRuntime) {
    throw new Error(
      "Database is not configured on Vercel. Add POSTGRES_URL or DATABASE_URL to your project environment variables."
    );
  }

  try {
    const file = await fs.readFile(localReportsPath, "utf8");
    const parsed = JSON.parse(file) as { reports?: StoredReport[] } | StoredReport[];

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return Array.isArray(parsed.reports) ? parsed.reports : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeLocalReports(reports: StoredReport[]) {
  if (isVercelRuntime) {
    throw new Error(
      "Database is not configured on Vercel. Add POSTGRES_URL or DATABASE_URL to your project environment variables."
    );
  }

  await fs.mkdir(localDataDir, { recursive: true });
  await fs.writeFile(
    localReportsPath,
    JSON.stringify({ reports }, null, 2),
    "utf8"
  );
}

export async function saveReport(report: StoredReport) {
  if (db) {
    await ensurePostgresSchema();
    await db.sql`
      INSERT INTO reports (
        id, shareId, viewerId, url, competitorUrl, competitorUrlsJson, createdAt, updatedAt,
        pagespeedJson, competitorPagespeedJson, competitorsJson, aiReportJson
      ) VALUES (
        ${report.id},
        ${report.shareId},
        ${report.viewerId ?? null},
        ${report.url},
        ${report.competitorUrl ?? null},
        ${JSON.stringify(report.competitorUrls ?? [])}::jsonb,
        ${report.createdAt},
        ${report.updatedAt},
        ${JSON.stringify(report.pagespeed)}::jsonb,
        ${report.competitorPagespeed ? JSON.stringify(report.competitorPagespeed) : null}::jsonb,
        ${report.competitors?.length ? JSON.stringify(report.competitors) : null}::jsonb,
        ${JSON.stringify(report.aiReport)}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        shareId = EXCLUDED.shareId,
        viewerId = EXCLUDED.viewerId,
        url = EXCLUDED.url,
        competitorUrl = EXCLUDED.competitorUrl,
        competitorUrlsJson = EXCLUDED.competitorUrlsJson,
        updatedAt = EXCLUDED.updatedAt,
        pagespeedJson = EXCLUDED.pagespeedJson,
        competitorPagespeedJson = EXCLUDED.competitorPagespeedJson,
        competitorsJson = EXCLUDED.competitorsJson,
        aiReportJson = EXCLUDED.aiReportJson;
    `;
    return;
  }

  const reports = await readLocalReports();
  const index = reports.findIndex((item) => item.id === report.id);

  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.push(report);
  }

  await writeLocalReports(reports);
}

export async function getReportById(id: string) {
  if (db) {
    await ensurePostgresSchema();
    const { rows } = await db.sql<ReportRow>`
      SELECT
        id,
        shareId,
        viewerId,
        url,
        competitorUrl,
        competitorUrlsJson::text AS competitorUrlsJson,
        createdAt,
        updatedAt,
        pagespeedJson::text AS pagespeedJson,
        competitorPagespeedJson::text AS competitorPagespeedJson,
        competitorsJson::text AS competitorsJson,
        aiReportJson::text AS aiReportJson
      FROM reports
      WHERE id = ${id}
      LIMIT 1;
    `;

    return rows[0] ? mapRow(rows[0]) : null;
  }

  const reports = await readLocalReports();
  return reports.find((report) => report.id === id) ?? null;
}

export async function getReportByShareId(shareId: string) {
  if (db) {
    await ensurePostgresSchema();
    const { rows } = await db.sql<ReportRow>`
      SELECT
        id,
        shareId,
        viewerId,
        url,
        competitorUrl,
        competitorUrlsJson::text AS competitorUrlsJson,
        createdAt,
        updatedAt,
        pagespeedJson::text AS pagespeedJson,
        competitorPagespeedJson::text AS competitorPagespeedJson,
        competitorsJson::text AS competitorsJson,
        aiReportJson::text AS aiReportJson
      FROM reports
      WHERE shareId = ${shareId}
      LIMIT 1;
    `;

    return rows[0] ? mapRow(rows[0]) : null;
  }

  const reports = await readLocalReports();
  return reports.find((report) => report.shareId === shareId) ?? null;
}

export async function getRecentReports(viewerId?: string | null, limit = 6): Promise<StoredReport[]> {
  if (!viewerId) {
    return [];
  }

  if (db) {
    await ensurePostgresSchema();
    const { rows } = await db.sql<ReportRow>`
      SELECT
        id,
        shareId,
        viewerId,
        url,
        competitorUrl,
        competitorUrlsJson::text AS competitorUrlsJson,
        createdAt,
        updatedAt,
        pagespeedJson::text AS pagespeedJson,
        competitorPagespeedJson::text AS competitorPagespeedJson,
        competitorsJson::text AS competitorsJson,
        aiReportJson::text AS aiReportJson
      FROM reports
      WHERE viewerId = ${viewerId}
      ORDER BY updatedAt DESC
      LIMIT ${limit};
    `;

    return rows.map(mapRow);
  }

  const reports = await readLocalReports();
  return reports
    .filter((report) => report.viewerId === viewerId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}
