import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { deleteTrigger } from '@/lib/workflows/triggers';

export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401, headers: NO_STORE });
  }
  try {
    const ok = await deleteTrigger(params.id, viewer);
    if (!ok) return NextResponse.json({ error: 'Trigger not found' }, { status: 404, headers: NO_STORE });
    return NextResponse.json({ deleted: true }, { headers: NO_STORE });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.startsWith('Not permitted') ? 403 : 500;
    if (status === 500) console.error('[api/workflow-triggers/:id DELETE]', error);
    return NextResponse.json({ error: message }, { status, headers: NO_STORE });
  }
}
