import { sql } from "@vercel/postgres";
import { StoredReport } from "@/lib/types";

type ReportRow = {
  id: string;
  shareid: string;
  shareId?: string;
  url: string;
  competitorurl: string | null;
  competitorUrl?: string | null;
  createdat: string;
  createdAt?: string;
  updatedat: string;
  updatedAt?: string;
  pagespeedjson: string;
  pagespeedJson?: string;
  competitorpagespeedjson: string | null;
  competitorPagespeedJson?: string | null;
  aireportjson: string;
  aiReportJson?: string;
};

const usePostgres = Boolean(
  process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL
);

let postgresSchemaReady: Promise<void> | null = null;
let sqliteDbInstance: any = null;
let sqliteSchemaReady = false;

function mapRow(row: ReportRow): StoredReport {
  const pagespeedJson = row.pagespeedjson ?? row.pagespeedJson;
  const competitorPagespeedJson =
    row.competitorpagespeedjson ?? row.competitorPagespeedJson ?? null;
  const aiReportJson = row.aireportjson ?? row.aiReportJson;

  return {
    id: row.id,
    shareId: row.shareid ?? row.shareId ?? "",
    url: row.url,
    competitorUrl: row.competitorurl ?? row.competitorUrl ?? null,
    createdAt: row.createdat ?? row.createdAt ?? "",
    updatedAt: row.updatedat ?? row.updatedAt ?? "",
    pagespeed:
      typeof pagespeedJson === "string" ? JSON.parse(pagespeedJson) : (pagespeedJson as never),
    competitorPagespeed: competitorPagespeedJson
      ? typeof competitorPagespeedJson === "string"
        ? JSON.parse(competitorPagespeedJson)
        : (competitorPagespeedJson as never)
      : null,
    aiReport:
      typeof aiReportJson === "string" ? JSON.parse(aiReportJson) : (aiReportJson as never)
  };
}

async function ensurePostgresSchema() {
  if (!usePostgres) return;

  if (!postgresSchemaReady) {
    postgresSchemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS reports (
          id TEXT PRIMARY KEY,
          shareId TEXT NOT NULL UNIQUE,
          url TEXT NOT NULL,
          competitorUrl TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          pagespeedJson JSONB NOT NULL,
          competitorPagespeedJson JSONB,
          aiReportJson JSONB NOT NULL
        );
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS reports_updatedAt_idx
        ON reports (updatedAt DESC);
      `;
    })();
  }

  await postgresSchemaReady;
}

function getSqliteDb() {
  if (sqliteDbInstance) {
    return sqliteDbInstance;
  }

  // Keep local development simple when no Postgres connection is configured.
  const Database = require("better-sqlite3");
  const path = require("path");
  const fs = require("fs");
  const dataDir = path.join(process.cwd(), "data");
  const dbPath = path.join(dataDir, "growthlens.db");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  sqliteDbInstance = new Database(dbPath);
  return sqliteDbInstance;
}

function ensureSqliteSchema() {
  if (sqliteSchemaReady) return;

  const db = getSqliteDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      shareId TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      competitorUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      pagespeedJson TEXT NOT NULL,
      competitorPagespeedJson TEXT,
      aiReportJson TEXT NOT NULL
    );
  `);
  sqliteSchemaReady = true;
}

export async function saveReport(report: StoredReport) {
  if (usePostgres) {
    await ensurePostgresSchema();
    await sql`
      INSERT INTO reports (
        id, shareId, url, competitorUrl, createdAt, updatedAt,
        pagespeedJson, competitorPagespeedJson, aiReportJson
      ) VALUES (
        ${report.id},
        ${report.shareId},
        ${report.url},
        ${report.competitorUrl ?? null},
        ${report.createdAt},
        ${report.updatedAt},
        ${JSON.stringify(report.pagespeed)}::jsonb,
        ${report.competitorPagespeed ? JSON.stringify(report.competitorPagespeed) : null}::jsonb,
        ${JSON.stringify(report.aiReport)}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        shareId = EXCLUDED.shareId,
        url = EXCLUDED.url,
        competitorUrl = EXCLUDED.competitorUrl,
        updatedAt = EXCLUDED.updatedAt,
        pagespeedJson = EXCLUDED.pagespeedJson,
        competitorPagespeedJson = EXCLUDED.competitorPagespeedJson,
        aiReportJson = EXCLUDED.aiReportJson;
    `;
    return;
  }

  ensureSqliteSchema();
  const db = getSqliteDb();
  const stmt = db.prepare(`
    INSERT INTO reports (
      id, shareId, url, competitorUrl, createdAt, updatedAt,
      pagespeedJson, competitorPagespeedJson, aiReportJson
    ) VALUES (
      @id, @shareId, @url, @competitorUrl, @createdAt, @updatedAt,
      @pagespeedJson, @competitorPagespeedJson, @aiReportJson
    )
    ON CONFLICT(id) DO UPDATE SET
      shareId = excluded.shareId,
      url = excluded.url,
      competitorUrl = excluded.competitorUrl,
      updatedAt = excluded.updatedAt,
      pagespeedJson = excluded.pagespeedJson,
      competitorPagespeedJson = excluded.competitorPagespeedJson,
      aiReportJson = excluded.aiReportJson
  `);

  stmt.run({
    id: report.id,
    shareId: report.shareId,
    url: report.url,
    competitorUrl: report.competitorUrl ?? null,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    pagespeedJson: JSON.stringify(report.pagespeed),
    competitorPagespeedJson: report.competitorPagespeed
      ? JSON.stringify(report.competitorPagespeed)
      : null,
    aiReportJson: JSON.stringify(report.aiReport)
  });
}

export async function getReportById(id: string) {
  if (usePostgres) {
    await ensurePostgresSchema();
    const { rows } = await sql<ReportRow>`
      SELECT
        id,
        shareId,
        url,
        competitorUrl,
        createdAt,
        updatedAt,
        pagespeedJson::text AS pagespeedJson,
        competitorPagespeedJson::text AS competitorPagespeedJson,
        aiReportJson::text AS aiReportJson
      FROM reports
      WHERE id = ${id}
      LIMIT 1;
    `;

    return rows[0] ? mapRow(rows[0]) : null;
  }

  ensureSqliteSchema();
  const db = getSqliteDb();
  const row = db.prepare("SELECT * FROM reports WHERE id = ?").get(id) as ReportRow | undefined;
  return row ? mapRow(row) : null;
}

export async function getReportByShareId(shareId: string) {
  if (usePostgres) {
    await ensurePostgresSchema();
    const { rows } = await sql<ReportRow>`
      SELECT
        id,
        shareId,
        url,
        competitorUrl,
        createdAt,
        updatedAt,
        pagespeedJson::text AS pagespeedJson,
        competitorPagespeedJson::text AS competitorPagespeedJson,
        aiReportJson::text AS aiReportJson
      FROM reports
      WHERE shareId = ${shareId}
      LIMIT 1;
    `;

    return rows[0] ? mapRow(rows[0]) : null;
  }

  ensureSqliteSchema();
  const db = getSqliteDb();
  const row = db.prepare("SELECT * FROM reports WHERE shareId = ?").get(shareId) as ReportRow | undefined;
  return row ? mapRow(row) : null;
}

export async function getRecentReports(limit = 6): Promise<StoredReport[]> {
  if (usePostgres) {
    await ensurePostgresSchema();
    const { rows } = await sql<ReportRow>`
      SELECT
        id,
        shareId,
        url,
        competitorUrl,
        createdAt,
        updatedAt,
        pagespeedJson::text AS pagespeedJson,
        competitorPagespeedJson::text AS competitorPagespeedJson,
        aiReportJson::text AS aiReportJson
      FROM reports
      ORDER BY updatedAt DESC
      LIMIT ${limit};
    `;

    return rows.map(mapRow);
  }

  ensureSqliteSchema();
  const db = getSqliteDb();
  return db
    .prepare("SELECT * FROM reports ORDER BY datetime(updatedAt) DESC LIMIT ?")
    .all(limit)
    .map(mapRow);
}
