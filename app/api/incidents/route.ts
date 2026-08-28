import { NextResponse } from "next/server";
import { getIncidents } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "OPEN" | "RESOLVED" | undefined;
    const incidents = getIncidents(status, 50);
    return NextResponse.json({ incidents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
