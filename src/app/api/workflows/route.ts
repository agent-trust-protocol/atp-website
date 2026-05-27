import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import {
  listWorkflows,
  createWorkflow,
  toApiShape,
  NotAuthorized
} from '@/lib/workflows/store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId && !viewer.isFounder) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'AUTH_REQUIRED', loginUrl: '/login' },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? undefined;
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  try {
    const rows = await listWorkflows(viewer, { status, limit: Number.isFinite(limit) ? limit : undefined });
    const workflows = rows.map(toApiShape);
    return NextResponse.json({
      workflows,
      total: workflows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[workflows] list failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'AUTH_REQUIRED', loginUrl: '/login' },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'Workflow name is required' }, { status: 400 });
  }

  try {
    const row = await createWorkflow(viewer, {
      name: body.name,
      description: typeof body.description === 'string' ? body.description : undefined,
      status: body.status,
      nodes: Array.isArray(body.nodes) ? body.nodes : undefined,
      edges: Array.isArray(body.edges) ? body.edges : undefined,
      variables: body.variables && typeof body.variables === 'object' ? body.variables : undefined
    });
    return NextResponse.json(
      { message: 'Workflow created successfully', workflow: toApiShape(row) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof NotAuthorized) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('[workflows] create failed:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
