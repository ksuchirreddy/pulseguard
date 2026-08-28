import { NextResponse } from "next/server";
import { getAllMonitors } from "@/lib/db";
import { pingMonitor } from "@/lib/monitorEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const monitors = getAllMonitors();
    const activeMonitors = monitors.filter((m) => m.status !== "PAUSED");

    const results = await Promise.allSettled(activeMonitors.map((m) => pingMonitor(m)));

    const summary = {
      total: activeMonitors.length,
      success: results.filter((r) => r.status === "fulfilled").length,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
