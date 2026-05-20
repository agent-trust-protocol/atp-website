import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { createWorkflow, listWorkflows } from '@/lib/workflows/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? undefined;
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(200, parseInt(limitParam, 10) || 0)) : undefined;

  try {
    const rows = await listWorkflows(viewer, { status, limit });
    return NextResponse.json(
      { workflows: rows, total: rows.length, timestamp: new Date().toISOString() },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/workflows GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function POST(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId) {
    return NextResponse.json(
      { error: 'Sign in to create a workflow.' },
      { status: 401, headers: NO_STORE }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_STORE });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Workflow name is required' }, { status: 400, headers: NO_STORE });
  }

  // Workflow definition: accept the React Flow shape the designer ships
  // (nodes + edges + variables) or any caller-supplied object. Everything
  // lands in the `definition` JSONB column so the engine can interpret it.
  const definition =
    typeof body.definition === 'object' && body.definition !== null
      ? body.definition
      : { nodes: body.nodes ?? [], edges: body.edges ?? [], variables: body.variables ?? {} };

  try {
    const workflow = await createWorkflow(
      {
        name,
        description: typeof body.description === 'string' ? body.description : null,
        definition,
        category: typeof body.category === 'string' ? body.category : null,
        tags: Array.isArray(body.tags) ? body.tags : []
      },
      { userId: viewer.userId }
    );
    return NextResponse.json(
      { message: 'Workflow created successfully', workflow },
      { status: 201, headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/workflows POST]', error);
    return NextResponse.json(
      { error: 'Failed to create workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
