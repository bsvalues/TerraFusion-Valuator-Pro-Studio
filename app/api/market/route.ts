import { NextResponse } from "next/server";
import { analyzeMarket } from "@/lib/engines";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { region: string };
    const marketData = analyzeMarket(body.region);
    return NextResponse.json(marketData);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Market analysis failed", code: "MARKET_ERROR" },
      { status: 400 }
    );
  }
}
