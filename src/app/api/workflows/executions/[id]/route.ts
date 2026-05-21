import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { getExecutionDetail } from '@/lib/workflows/execute';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getViewer(request.headers);
  try {
    const detail = await getExecutionDetail(params.id, viewer);
    if (!detail) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json(detail, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/workflows/executions/:id]', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
