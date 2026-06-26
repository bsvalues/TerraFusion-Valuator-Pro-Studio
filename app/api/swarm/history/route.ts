import { NextResponse } from "next/server";
import { getPipelineHistory } from "@/lib/swarm";

export async function GET() {
  const history = getPipelineHistory();
  return NextResponse.json({ history });
}
