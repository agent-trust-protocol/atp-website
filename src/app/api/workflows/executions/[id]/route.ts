import { NextRequest, NextResponse } from 'next/server';
import { getViewer } from '@/lib/viewer';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ExecutionDetailRow {
  id: string;
  workflow_id: string;
  user_id: string;
  state: string;
  start_time: string;
  end_time: string | null;
  duration_ms: number | null;
  initial_data: unknown;
  result: unknown;
  error: string | null;
  completed_nodes: string[];
  workflow_name: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewer = await getViewer(request.headers);
  if (!viewer.userId && !viewer.isFounder) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'AUTH_REQUIRED', loginUrl: '/login' },
      { status: 401 }
    );
  }

  const row = await queryOne<ExecutionDetailRow>(
    `SELECT e.id, e.workflow_id, e.user_id, e.state, e.start_time, e.end_time,
            e.duration_ms, e.initial_data, e.result, e.error, e.completed_nodes,
            w.name AS workflow_name
     FROM workflow_executions e
     LEFT JOIN workflows w ON w.id = e.workflow_id
     WHERE e.id = $1`,
    [params.id]
  );

  if (!row) return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  if (!viewer.isFounder && row.user_id !== viewer.userId) {
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  }

  return NextResponse.json({
    execution: {
      executionId: row.id,
      workflowId: row.workflow_id,
      workflowName: row.workflow_name ?? row.workflow_id,
      state: row.state,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration_ms,
      initialData: row.initial_data,
      result: row.result,
      error: row.error,
      completedNodes: row.completed_nodes
    }
  });
}
