import { NextResponse } from "next/server";
import { getGlobalStats } from "@/lib/db";

export async function GET() {
  try {
    const stats = getGlobalStats();
    return NextResponse.json({ stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
