import { NextResponse } from "next/server";
import { getAllMonitors, createMonitor } from "@/lib/db";
import { pingMonitor } from "@/lib/monitorEngine";

export async function GET() {
  try {
    const monitors = getAllMonitors();
    return NextResponse.json({ monitors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format. Must include http:// or https://" }, { status: 400 });
    }

    const monitor = createMonitor({
      name: body.name.trim(),
      url: body.url.trim(),
      method: body.method || "GET",
      interval: Number(body.interval) || 60,
      timeout: Number(body.timeout) || 5000,
      expectedStatus: Number(body.expectedStatus) || 200,
      headers: body.headers ? JSON.stringify(body.headers) : undefined,
      body: body.body || undefined,
      alertEmail: body.alertEmail || undefined,
    });

    // Run initial ping
    await pingMonitor(monitor);

    return NextResponse.json({ monitor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
