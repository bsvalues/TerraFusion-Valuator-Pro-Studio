/**
 * GET /api/workfiles/[id]/pdf
 *
 * Fetches workfile from valuator-api, renders it as a PDF via @react-pdf/renderer,
 * and returns application/pdf with Content-Disposition: inline for browser preview.
 */
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import React, { type JSXElementConstructor, type ReactElement } from 'react';
import { WorkfilePdf } from '@/lib/pdf/WorkfilePdf';
import type { WorkfileRecord } from '@/lib/workfile-types';

const API_BASE = process.env.API_URL ?? 'http://127.0.0.1:8080';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing workfile id' }, { status: 400 });
  }

  // Fetch workfile from Rust backend
  let record: WorkfileRecord;
  try {
    const res = await fetch(`${API_BASE}/api/v1/workfiles/${encodeURIComponent(id)}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Workfile ${id} not found` },
        { status: 404 },
      );
    }
    record = await res.json() as WorkfileRecord;
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reach valuator-api', detail: String(err) },
      { status: 502 },
    );
  }

  const workfile = record.data;
  const generatedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Render PDF buffer server-side
  const element = React.createElement(
    WorkfilePdf,
    { workfile, generatedAt },
  ) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>;

  const buffer = await renderToBuffer(element);

  const filename = `workfile-${id.slice(0, 8)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': String(buffer.byteLength),
    },
  });
}
