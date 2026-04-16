import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/schema";
import { createOrRefreshReport } from "@/lib/report-service";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const existingViewerId = cookieStore.get("growthlens_viewer_id")?.value;
    const viewerId = existingViewerId ?? crypto.randomUUID();
    const json = await request.json();
    const parsed = analyzeRequestSchema.parse(json);
    const report = await createOrRefreshReport({
      ...parsed,
      viewerId
    });

    const response = NextResponse.json({ report });

    if (!existingViewerId) {
      response.cookies.set("growthlens_viewer_id", viewerId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/"
      });
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
