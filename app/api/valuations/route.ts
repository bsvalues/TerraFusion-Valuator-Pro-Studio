import { NextResponse } from "next/server";
import type { Property } from "@/lib/types";
import { calculateValuation } from "@/lib/engines";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Property;
    const valuation = calculateValuation(body);
    return NextResponse.json(valuation);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Valuation failed", code: "VALUATION_ERROR" },
      { status: 400 }
    );
  }
}
