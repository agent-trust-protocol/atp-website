/**
 * Convert a rules array (the source of truth that the policy evaluator
 * consumes) into a React Flow node/edge layout for visualization.
 *
 * Layout (left → right, one row per rule, top-down by priority):
 *
 *   [ cond ]
 *   [ cond ] ─→ [ rule ] ─→ [ effect ]
 *   [ cond ]
 *
 * Plus a single "default" terminal node at the bottom representing the
 * policy-level fallback decision.
 *
 * IDs are prefixed (`r:`, `c:`, `e:`, `default`) so they don't collide
 * with any pre-existing nodes a user may have dragged onto the canvas.
 */

import type { PolicyRule, PolicyDecision } from '@/components/atp/policy-rules-editor';

const RULE_ROW_HEIGHT = 180;
const COND_SPACING = 60;
const COL_CONDITIONS_X = 60;
const COL_RULE_X = 380;
const COL_EFFECT_X = 660;

interface FlowNode {
  id: string;
  type: 'condition' | 'action';
  position: { x: number; y: number };
  data: { label: string; type: string };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

const EFFECT_LABEL: Record<PolicyDecision, string> = {
  allow: '✅ Allow',
  deny: '🛑 Deny',
  throttle: '⏳ Throttle',
  require_approval: '🔒 Require approval'
};

function conditionLabel(c: { path?: string; op?: string; value?: unknown }): string {
  if (!c.path) return '(empty)';
  if (c.op === 'exists') return `${c.path} exists`;
  if (c.op === 'not_exists') return `${c.path} not exists`;
  const v = Array.isArray(c.value)
    ? `[${(c.value as unknown[]).join(', ')}]`
    : JSON.stringify(c.value ?? '');
  return `${c.path} ${c.op ?? '='} ${v}`;
}

export function rulesToFlow(
  rules: PolicyRule[],
  defaultDecision: PolicyDecision
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // Sort by priority desc — matches evaluator's evaluation order so the top
  // row of the canvas is the rule that fires first.
  const sorted = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  sorted.forEach((rule, ri) => {
    const rowY = ri * RULE_ROW_HEIGHT;
    const ruleId = `r:${rule.id}`;
    const effectId = `e:${rule.id}`;

    // Rule center node — labels the rule + priority.
    nodes.push({
      id: ruleId,
      type: 'action',
      position: { x: COL_RULE_X, y: rowY + 30 },
      data: { label: `${rule.name} · priority ${rule.priority ?? 0}`, type: 'rule' }
    });

    // Effect terminal on the right.
    nodes.push({
      id: effectId,
      type: 'action',
      position: { x: COL_EFFECT_X, y: rowY + 30 },
      data: { label: EFFECT_LABEL[rule.effect], type: rule.effect }
    });
    edges.push({ id: `e:${rule.id}-effect`, source: ruleId, target: effectId, animated: true });

    // Conditions stacked on the left. Empty list → a single "catch-all"
    // placeholder so the rule still has an upstream node visually.
    if (rule.conditions.length === 0) {
      const id = `c:${rule.id}:catchall`;
      nodes.push({
        id,
        type: 'condition',
        position: { x: COL_CONDITIONS_X, y: rowY + 30 },
        data: { label: '(catch-all — no conditions)', type: 'catchall' }
      });
      edges.push({ id: `${id}->${ruleId}`, source: id, target: ruleId });
    } else {
      rule.conditions.forEach((cond, ci) => {
        const id = `c:${rule.id}:${ci}`;
        nodes.push({
          id,
          type: 'condition',
          position: { x: COL_CONDITIONS_X, y: rowY + ci * COND_SPACING },
          data: { label: conditionLabel(cond), type: cond.op ?? 'equals' }
        });
        edges.push({ id: `${id}->${ruleId}`, source: id, target: ruleId });
      });
    }
  });

  // Default terminal at the bottom — fires when no rule matches.
  const defaultY = sorted.length * RULE_ROW_HEIGHT + 40;
  nodes.push({
    id: 'default',
    type: 'action',
    position: { x: COL_EFFECT_X, y: defaultY },
    data: { label: `Default: ${EFFECT_LABEL[defaultDecision]}`, type: defaultDecision }
  });

  return { nodes, edges };
}
