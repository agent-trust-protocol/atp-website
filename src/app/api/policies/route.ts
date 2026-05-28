import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { createPolicy, listPolicies } from '@/lib/policies/db';
import { recordAuditEvent } from '@/lib/audit/log';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  try {
    const policies = await listPolicies(viewer);
    return NextResponse.json(
      { policies, total: policies.length, timestamp: new Date().toISOString() },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/policies GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function POST(request: NextRequest) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId) {
    return NextResponse.json(
      { error: 'Sign in to create a policy.' },
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
    return NextResponse.json({ error: 'Policy name is required' }, { status: 400, headers: NO_STORE });
  }

  // Accept either the legacy `{ document }` shape from the editor or a flat
  // payload — anything not name/description/version/enabled/tags lands in
  // document so the visual editor can round-trip its full IR.
  const document =
    typeof body.document === 'object' && body.document !== null
      ? body.document
      : { nodes: body.nodes ?? [], edges: body.edges ?? [], rules: body.rules ?? [] };

  try {
    const policy = await createPolicy(
      {
        name,
        description: typeof body.description === 'string' ? body.description : '',
        version: typeof body.version === 'string' ? body.version : '1.0.0',
        document,
        enabled: typeof body.enabled === 'boolean' ? body.enabled : true,
        tags: Array.isArray(body.tags) ? (body.tags as string[]) : []
      },
      { userId: viewer.userId }
    );
    await recordAuditEvent(viewer, {
      entityType: 'policy',
      entityId: policy.id,
      action: 'create',
      changes: { name: policy.name, version: policy.version, enabled: policy.enabled },
      request
    });

    return NextResponse.json(
      { message: 'Policy created successfully', policy },
      { status: 201, headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/policies POST]', error);
    return NextResponse.json(
      { error: 'Failed to create policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: NO_STORE }
    );
  }
}
