/**
 * GET /api/health
 *
 * System health check endpoint.
 * Returns Supabase connection status and environment configuration.
 */

import { NextResponse } from "next/server";
import { checkSupabaseConnection } from "@/lib/persistence";

export async function GET() {
  const supabase = await checkSupabaseConnection();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
    environment: process.env.NODE_ENV ?? "development",
    services: {
      supabase: {
        connected: supabase.connected,
        message: supabase.message,
        configured: !!(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ),
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
      },
    },
  });
}
