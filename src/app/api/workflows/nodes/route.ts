import { NextRequest, NextResponse } from 'next/server';
import { NODE_CATEGORIES, WORKFLOW_NODES } from '@/workflow-engine/nodes/catalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

// Node *types* are code-defined (their behavior lives in the engine),
// so this route is just transport over the static catalog. There's no
// owner scoping here — the catalog is the same for every viewer.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const nodes = category ? WORKFLOW_NODES.filter((n) => n.category === category) : WORKFLOW_NODES;
  return NextResponse.json(
    { nodes, categories: NODE_CATEGORIES, total: nodes.length, timestamp: new Date().toISOString() },
    { headers: NO_STORE }
  );
}
