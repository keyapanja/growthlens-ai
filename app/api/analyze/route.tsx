import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/schema";
import { createOrRefreshReport } from "@/lib/report-service";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = analyzeRequestSchema.parse(json);
    const report = await createOrRefreshReport(parsed);

    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
