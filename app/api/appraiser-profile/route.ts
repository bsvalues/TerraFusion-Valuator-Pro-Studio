/**
 * /api/appraiser-profile
 *
 * GET  — Load the appraiser profile
 * POST — Save the appraiser profile
 */

import { NextRequest, NextResponse } from "next/server";
import { loadAppraiserProfile, saveAppraiserProfile } from "@/lib/persistence";

export async function GET() {
  const profile = await loadAppraiserProfile();
  if (!profile) {
    return NextResponse.json({ profile: null, source: "not_found" });
  }
  return NextResponse.json({ profile, source: "supabase" });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await saveAppraiserProfile({
    appraiser_name: body.appraiserName as string,
    appraiser_title: body.appraiserTitle as string,
    license_number: body.licenseNumber as string,
    license_state: body.licenseState as string,
    license_type: body.licenseType as string,
    license_expiry: body.licenseExpiry as string,
    firm_name: body.firmName as string,
    firm_address: body.firmAddress as string,
    firm_phone: body.firmPhone as string,
    firm_email: body.firmEmail as string,
    designations: body.designations
      ? (body.designations as string).split(",").map((s) => s.trim()).filter(Boolean)
      : [],
  });

  return NextResponse.json({ status: "ok" });
}
