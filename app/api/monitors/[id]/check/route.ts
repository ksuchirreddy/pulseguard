import { NextResponse } from "next/server";
import { triggerCheckById } from "@/lib/monitorEngine";
import { getMonitorById, getHeartbeatsForMonitor } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await triggerCheckById(id);
    if (!result) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }
    const monitor = getMonitorById(id);
    const heartbeats = getHeartbeatsForMonitor(id, 60);
    return NextResponse.json({ result, monitor, heartbeats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
