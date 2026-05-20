/**
 * Static catalog of ATP-specific workflow nodes. Node *types* are
 * code-defined (their behavior lives in the engine), so this is correctly
 * a constant rather than a database table — only runtime state
 * (workflows, executions) belongs in Postgres.
 *
 * Moved out of `src/app/api/workflows/nodes/route.ts` during Phase 2 so
 * the API route is just transport over this catalog.
 */

export type NodeCategory = 'trigger' | 'action' | 'condition';

export interface NodePort {
  name: string;
  type: string;
  required?: boolean;
}

export interface NodeDefinition {
  type: string;
  category: NodeCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  inputs: NodePort[];
  outputs: NodePort[];
}

export const NODE_CATEGORIES: NodeCategory[] = ['trigger', 'action', 'condition'];

export const WORKFLOW_NODES: NodeDefinition[] = [
  // Policy Nodes
  {
    type: 'policy-change-trigger',
    category: 'trigger',
    label: 'Policy Change Trigger',
    description: 'Triggers when a policy is created, updated, or deleted',
    icon: '📋',
    color: '#3B82F6',
    inputs: [],
    outputs: [{ name: 'policyData', type: 'object' }]
  },
  {
    type: 'policy-violation-trigger',
    category: 'trigger',
    label: 'Policy Violation Trigger',
    description: 'Triggers when a policy violation is detected',
    icon: '⚠️',
    color: '#EF4444',
    inputs: [],
    outputs: [{ name: 'violationData', type: 'object' }]
  },
  {
    type: 'create-policy',
    category: 'action',
    label: 'Create Policy',
    description: 'Creates a new policy in the ATP system',
    icon: '➕',
    color: '#10B981',
    inputs: [{ name: 'policyDefinition', type: 'object', required: true }],
    outputs: [{ name: 'policyId', type: 'string' }]
  },
  {
    type: 'validate-policy',
    category: 'action',
    label: 'Validate Policy',
    description: 'Validates policy syntax and rules',
    icon: '✅',
    color: '#8B5CF6',
    inputs: [{ name: 'policy', type: 'object', required: true }],
    outputs: [{ name: 'isValid', type: 'boolean' }, { name: 'errors', type: 'array' }]
  },
  {
    type: 'policy-valid',
    category: 'condition',
    label: 'Policy Valid?',
    description: 'Checks if a policy passes validation',
    icon: '❓',
    color: '#F59E0B',
    inputs: [{ name: 'validationResult', type: 'object', required: true }],
    outputs: [{ name: 'true', type: 'boolean' }, { name: 'false', type: 'boolean' }]
  },

  // Trust Nodes
  {
    type: 'trust-change-trigger',
    category: 'trigger',
    label: 'Trust Change Trigger',
    description: 'Triggers when trust scores change significantly',
    icon: '🔄',
    color: '#06B6D4',
    inputs: [],
    outputs: [{ name: 'trustData', type: 'object' }]
  },
  {
    type: 'evaluate-trust',
    category: 'action',
    label: 'Evaluate Trust Score',
    description: 'Calculates trust score for an agent or transaction',
    icon: '📊',
    color: '#84CC16',
    inputs: [{ name: 'agentId', type: 'string', required: true }],
    outputs: [{ name: 'trustScore', type: 'number' }, { name: 'factors', type: 'array' }]
  },
  {
    type: 'trust-threshold',
    category: 'condition',
    label: 'Trust Threshold Check',
    description: 'Checks if trust score meets minimum threshold',
    icon: '📏',
    color: '#F97316',
    inputs: [{ name: 'trustScore', type: 'number', required: true }, { name: 'threshold', type: 'number', required: true }],
    outputs: [{ name: 'above', type: 'boolean' }, { name: 'below', type: 'boolean' }]
  },

  // Monitoring Nodes
  {
    type: 'security-alert-trigger',
    category: 'trigger',
    label: 'Security Alert Trigger',
    description: 'Triggers on security events and anomalies',
    icon: '🚨',
    color: '#DC2626',
    inputs: [],
    outputs: [{ name: 'alertData', type: 'object' }]
  },
  {
    type: 'send-alert',
    category: 'action',
    label: 'Send Alert',
    description: 'Sends notifications via configured channels',
    icon: '📢',
    color: '#7C3AED',
    inputs: [{ name: 'message', type: 'string', required: true }, { name: 'severity', type: 'string', required: true }],
    outputs: [{ name: 'sent', type: 'boolean' }]
  },
  {
    type: 'generate-report',
    category: 'action',
    label: 'Generate Report',
    description: 'Generates compliance and audit reports',
    icon: '📄',
    color: '#059669',
    inputs: [{ name: 'reportType', type: 'string', required: true }, { name: 'timeRange', type: 'object' }],
    outputs: [{ name: 'reportUrl', type: 'string' }]
  }
];
