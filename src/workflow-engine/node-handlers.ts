/**
 * Node-type → handler registry. PR #39 is the executor foundation: every
 * handler returns a canned-but-realistic shape that respects the
 * input/output contract from src/workflow-engine/nodes/catalog.ts so
 * downstream nodes can consume it without crashing. Real implementations
 * (DB writes, email, etc.) land in PR #40.
 */

import type { NodeHandler } from './executor';

const ok = (output: unknown): ReturnType<NodeHandler> => ({ output });

const noop: NodeHandler = ({ nodeType }) => ok({ stubbed: true, nodeType });

// ---- Triggers -------------------------------------------------------------
// Triggers fire from outside the executor (manual run, schedule, webhook),
// so when they're encountered mid-graph they just forward whatever the
// orchestrator passed in as triggerInput.
const triggerPassthrough: NodeHandler = ({ inputs }) => ok(inputs.__trigger ?? { triggeredAt: new Date().toISOString() });

// ---- Actions --------------------------------------------------------------
// Stubbed canned outputs that match catalog.ts shapes.
const createPolicy: NodeHandler = () => ok({ policyId: `stub-policy-${Date.now().toString(36)}` });
const validatePolicy: NodeHandler = () => ok({ isValid: true, errors: [] });
const evaluateTrust: NodeHandler = ({ inputs }) => {
  const agentId = (inputs.agentId as string) ?? 'stub-agent';
  return ok({ trustScore: 0.75, factors: ['stub: no real evaluator wired yet'], agentId });
};
const sendAlert: NodeHandler = ({ inputs }) => ok({ sent: true, message: inputs.message ?? null, severity: inputs.severity ?? 'info' });
const generateReport: NodeHandler = ({ inputs }) => ok({ reportUrl: `data:application/json,${encodeURIComponent(JSON.stringify({ stub: true, type: inputs.reportType ?? 'summary' }))}` });

// ---- Conditions -----------------------------------------------------------
// Conditions must return a `branch` so the executor knows which outgoing
// edge to follow. v1 picks safe defaults; PR #40 reads them from inputs.
const policyValid: NodeHandler = ({ inputs }) => {
  const v = inputs.validationResult as { isValid?: boolean } | undefined;
  const isValid = v?.isValid ?? true;
  return { output: { isValid }, branch: isValid ? 'true' : 'false' };
};
const trustThreshold: NodeHandler = ({ inputs }) => {
  const score = Number(inputs.trustScore ?? 0);
  const threshold = Number(inputs.threshold ?? 0.5);
  const above = score >= threshold;
  return { output: { score, threshold, above }, branch: above ? 'above' : 'below' };
};

// ---- Registry -------------------------------------------------------------
export const NODE_HANDLERS: Record<string, NodeHandler> = {
  // Triggers
  'policy-change-trigger': triggerPassthrough,
  'policy-violation-trigger': triggerPassthrough,
  'trust-change-trigger': triggerPassthrough,
  'security-alert-trigger': triggerPassthrough,
  'schedule-trigger': triggerPassthrough,

  // Actions
  'create-policy': createPolicy,
  'validate-policy': validatePolicy,
  'evaluate-trust': evaluateTrust,
  'send-alert': sendAlert,
  'send-notification': sendAlert, // designer palette uses this alias
  'generate-report': generateReport,

  // Conditions
  'policy-valid': policyValid,
  'trust-threshold': trustThreshold,
  'policy-compliance': policyValid, // designer palette alias

  // Outputs
  'audit-log': noop
};
