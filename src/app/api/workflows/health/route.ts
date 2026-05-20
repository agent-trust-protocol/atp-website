import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { getWorkflowEngineHealth } from '@/lib/workflows/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  try {
    const health = await getWorkflowEngineHealth(viewer);
    return NextResponse.json(
      {
        ...health,
        service: 'workflow-engine',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/workflows/health]', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: NO_STORE }
    );
  }
}
