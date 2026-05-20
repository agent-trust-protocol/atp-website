import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { listActiveExecutions } from '@/lib/workflows/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  try {
    const executions = await listActiveExecutions(viewer);
    return NextResponse.json(
      { executions, count: executions.length, timestamp: new Date().toISOString() },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/workflows/executions/active]', error);
    return NextResponse.json(
      { error: 'Failed to fetch active executions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
