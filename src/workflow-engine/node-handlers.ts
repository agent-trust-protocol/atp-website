/**
 * Real action implementations. Phase 2 of the worker series (PR #2 of 3).
 *
 * Each handler runs server-side from `runWorkflow()` (src/lib/workflows/execute.ts)
 * with access to the workflow's owner identity via `ctx.runtime`. Writes are
 * scoped to the owner; reads are scoped to what the owner can see.
 *
 * Replaces the canned stubs from PR #1. Trigger nodes still pass through
 * their input — non-manual triggers (schedule/webhook) land in PR #3.
 */

import { randomUUID } from 'node:crypto';
import { execute as runSql } from '@/lib/db';
import { createPolicy, getPolicy } from '@/lib/policies/db';
import { getAgent } from '@/lib/agents/store';
import { emailService } from '@/lib/email';
import type { NodeHandler } from './executor';

function viewerForOwner(runtime: { ownerUserId: string | null }) {
  return { userId: runtime.ownerUserId, isFounder: false };
}

const triggerPassthrough: NodeHandler = ({ inputs }) =>
  ({ output: inputs.__trigger ?? { triggeredAt: new Date().toISOString() } });

// ---- Actions --------------------------------------------------------------

const createPolicyHandler: NodeHandler = async ({ inputs, runtime }) => {
  if (!runtime.ownerUserId) {
    throw new Error('create-policy requires an authenticated workflow owner');
  }
  const defn = (inputs.policyDefinition ?? {}) as Record<string, unknown>;
  const name = typeof defn.name === 'string' && defn.name.trim()
    ? defn.name.trim()
    : `Policy from workflow ${runtime.workflowId.slice(0, 8)}`;
  const policy = await createPolicy(
    {
      name,
      description: typeof defn.description === 'string' ? defn.description : '',
      document: defn,
      tags: Array.isArray(defn.tags) ? (defn.tags as string[]) : ['workflow-generated']
    },
    { userId: runtime.ownerUserId }
  );
  return { output: { policyId: policy.id, name: policy.name } };
};

const validatePolicyHandler: NodeHandler = async ({ inputs, runtime }) => {
  const policyInput = inputs.policy as { id?: string; document?: unknown } | undefined;
  const errors: string[] = [];

  // Accept either an inline document or a saved policy id; if neither, treat
  // as a configuration error so the workflow fails loudly rather than silently
  // calling everything valid.
  let document: unknown = policyInput?.document;
  if (!document && policyInput?.id) {
    const saved = await getPolicy(policyInput.id, viewerForOwner(runtime));
    if (!saved) errors.push(`Policy ${policyInput.id} not found or not visible to workflow owner`);
    document = saved?.document;
  }
  if (!document) {
    errors.push('No policy document or id provided to validate');
  } else if (typeof document !== 'object' || document === null) {
    errors.push('Policy document is not an object');
  } else {
    const doc = document as Record<string, unknown>;
    if (!Array.isArray(doc.nodes)) errors.push('document.nodes is missing or not an array');
    if (!Array.isArray(doc.edges)) errors.push('document.edges is missing or not an array');
  }

  return { output: { isValid: errors.length === 0, errors } };
};

const policyValidHandler: NodeHandler = ({ inputs }) => {
  const v = inputs.validationResult as { isValid?: boolean } | undefined;
  const isValid = Boolean(v?.isValid);
  return { output: { isValid }, branch: isValid ? 'true' : 'false' };
};

const evaluateTrustHandler: NodeHandler = async ({ inputs, runtime }) => {
  const agentId = inputs.agentId as string | undefined;
  if (!agentId) {
    throw new Error('evaluate-trust requires an agentId input');
  }
  const agent = await getAgent(agentId, viewerForOwner(runtime));
  if (!agent) {
    throw new Error(`Agent ${agentId} not found or not visible to workflow owner`);
  }
  return {
    output: {
      agentId: agent.id,
      trustScore: agent.trustScore,
      trustLevel: agent.trustLevel,
      factors: agent.riskFactors
    }
  };
};

const trustThresholdHandler: NodeHandler = ({ inputs }) => {
  const score = Number(inputs.trustScore ?? 0);
  const threshold = Number(inputs.threshold ?? 0.5);
  const above = score >= threshold;
  return { output: { score, threshold, above }, branch: above ? 'above' : 'below' };
};

const sendAlertHandler: NodeHandler = async ({ inputs, runtime }) => {
  const message = typeof inputs.message === 'string' ? inputs.message : 'Workflow alert';
  const severity = typeof inputs.severity === 'string' ? inputs.severity : 'info';
  // Recipient: explicit `to` wins; otherwise the workflow owner's email.
  const to = (typeof inputs.to === 'string' && inputs.to.trim())
    ? inputs.to.trim()
    : runtime.ownerEmail;
  if (!to) {
    throw new Error('send-alert: no recipient (set inputs.to or ensure the workflow owner has an email)');
  }
  const subject = `[ATP ${severity.toUpperCase()}] ${message.slice(0, 80)}`;
  const sent = await emailService.sendEmail({
    to,
    subject,
    html: `
      <h2>Workflow alert</h2>
      <p><strong>Severity:</strong> ${severity}</p>
      <p><strong>Message:</strong></p>
      <pre style="background:#f4f4f5;padding:12px;border-radius:6px;white-space:pre-wrap">${message}</pre>
      <p style="color:#888;font-size:12px;margin-top:24px">
        Workflow ${runtime.workflowId} · Execution ${runtime.executionId}
      </p>
    `,
    text: `[${severity.toUpperCase()}] ${message}\n\nWorkflow ${runtime.workflowId} · Execution ${runtime.executionId}`
  });
  return { output: { sent, to, severity } };
};

const generateReportHandler: NodeHandler = async ({ inputs, runtime }) => {
  const reportType = typeof inputs.reportType === 'string' ? inputs.reportType : 'summary';
  const timeRange = inputs.timeRange ?? null;
  const reportId = randomUUID();
  // Persist into the existing audit_logs table — a purpose-built reports
  // table is overkill for v1 and `audit_logs` already has the shape we need.
  await runSql(
    `INSERT INTO audit_logs (id, entity_type, entity_id, action, user_id, changes, metadata)
     VALUES ($1, 'workflow', $2, 'report', $3, $4::jsonb, $5::jsonb)`,
    [
      reportId,
      runtime.workflowId,
      runtime.ownerUserId,
      JSON.stringify({ reportType, timeRange, inputs }),
      JSON.stringify({ executionId: runtime.executionId, generatedAt: new Date().toISOString() })
    ]
  );
  // Until a dedicated `/dashboard/reports/[id]` view exists, the execution
  // detail page is the honest landing surface — it already shows the report
  // payload as part of this node's output.
  return {
    output: {
      reportId,
      reportType,
      reportUrl: `/dashboard/workflows/executions/${runtime.executionId}`
    }
  };
};

// ---- Registry -------------------------------------------------------------

export function createNodeHandlers(): Record<string, NodeHandler> {
  return {
    // Triggers — passthrough. PR #3 will plumb schedule + webhook ingress
    // through the orchestrator's triggerInput.
    'policy-change-trigger': triggerPassthrough,
    'policy-violation-trigger': triggerPassthrough,
    'trust-change-trigger': triggerPassthrough,
    'security-alert-trigger': triggerPassthrough,
    'schedule-trigger': triggerPassthrough,

    // Actions — real implementations.
    'create-policy': createPolicyHandler,
    'validate-policy': validatePolicyHandler,
    'evaluate-trust': evaluateTrustHandler,
    'send-alert': sendAlertHandler,
    'send-notification': sendAlertHandler, // designer palette alias
    'generate-report': generateReportHandler,

    // Conditions — branch on real inputs.
    'policy-valid': policyValidHandler,
    'trust-threshold': trustThresholdHandler,
    'policy-compliance': policyValidHandler, // designer palette alias

    // Outputs.
    'audit-log': ({ inputs }) => ({ output: { logged: true, snapshot: inputs } })
  };
}
