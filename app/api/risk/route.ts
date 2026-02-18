import { NextResponse } from "next/server";
import type { Property } from "@/lib/types";
import { assessRisk } from "@/lib/engines";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Property;
    const assessment = assessRisk(body);
    return NextResponse.json(assessment);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Risk assessment failed", code: "RISK_ERROR" },
      { status: 400 }
    );
  }
}
