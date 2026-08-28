import { NextResponse } from "next/server";
import { getMonitorById, updateMonitor, deleteMonitor, getHeartbeatsForMonitor } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const monitor = getMonitorById(id);
    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }
    const heartbeats = getHeartbeatsForMonitor(id, 60);
    return NextResponse.json({ monitor, heartbeats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = updateMonitor(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }
    return NextResponse.json({ monitor: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const success = deleteMonitor(id);
    if (!success) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
