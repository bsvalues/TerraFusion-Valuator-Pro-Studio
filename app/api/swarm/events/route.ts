import { NextResponse } from "next/server";
import { getEventLog } from "@/lib/swarm";

export async function GET() {
  const events = getEventLog();
  return NextResponse.json({ events });
}
