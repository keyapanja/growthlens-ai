import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { StoredReport } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "growthlens.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

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

function mapRow(row: any): StoredReport {
  return {
    id: row.id,
    shareId: row.shareId,
    url: row.url,
    competitorUrl: row.competitorUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    pagespeed: JSON.parse(row.pagespeedJson),
    competitorPagespeed: row.competitorPagespeedJson
      ? JSON.parse(row.competitorPagespeedJson)
      : null,
    aiReport: JSON.parse(row.aiReportJson)
  };
}

export function saveReport(report: StoredReport) {
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

export function getReportById(id: string) {
  const stmt = db.prepare("SELECT * FROM reports WHERE id = ?");
  const row = stmt.get(id);
  return row ? mapRow(row) : null;
}

export function getReportByShareId(shareId: string) {
  const stmt = db.prepare("SELECT * FROM reports WHERE shareId = ?");
  const row = stmt.get(shareId);
  return row ? mapRow(row) : null;
}

export function getRecentReports(limit = 6): StoredReport[] {
  const stmt = db.prepare("SELECT * FROM reports ORDER BY datetime(updatedAt) DESC LIMIT ?");
  return stmt.all(limit).map(mapRow);
}
