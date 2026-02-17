import { NextResponse } from "next/server";
import type { Property } from "@/lib/types";
import { getAgentStatuses, runSwarmPipeline } from "@/lib/swarm";

export async function GET() {
  const statuses = getAgentStatuses();
  return NextResponse.json({ agents: statuses });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      property: Property;
      region: string;
    };
    const result = runSwarmPipeline(body.property, body.region);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Swarm pipeline failed",
        code: "SWARM_ERROR",
      },
      { status: 400 }
    );
  }
}
