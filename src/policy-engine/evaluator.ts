/**
 * Pure policy evaluator. Takes a policy document + a context object,
 * returns a decision. No DB, no I/O — `src/lib/policies/evaluate.ts`
 * wraps this with persistence.
 *
 * Policy document shape (v1):
 *
 *   {
 *     rules: Rule[],       // ordered; first-match-wins by priority
 *     default?: Decision,  // returned when no rule matches; defaults to 'deny'
 *     nodes?, edges?       // visual editor data, ignored by the engine
 *   }
 *
 * Rule shape:
 *
 *   {
 *     id, name, description?,
 *     priority: number,    // higher = evaluated first
 *     effect: Decision,
 *     conditions: Condition[]   // ALL must match for the rule to fire
 *   }
 *
 * Condition shape:
 *
 *   { path: 'tool.sensitivity', op: 'equals', value: 'high' }
 *
 * Supported operators: equals, not_equals, in, not_in, gte, lte, gt, lt,
 * contains, starts_with, ends_with, exists, not_exists.
 */

export type Decision = 'allow' | 'deny' | 'throttle' | 'require_approval';

export interface Condition {
  path: string;
  op:
    | 'equals'
    | 'not_equals'
    | 'in'
    | 'not_in'
    | 'gte'
    | 'lte'
    | 'gt'
    | 'lt'
    | 'contains'
    | 'starts_with'
    | 'ends_with'
    | 'exists'
    | 'not_exists';
  value?: unknown;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  priority?: number;
  effect: Decision;
  conditions: Condition[];
}

export interface PolicyDocument {
  rules?: Rule[];
  default?: Decision;
  // The visual editor's React Flow data; ignored by the engine for now.
  // PR #2 will let the editor write into rules[] directly.
  nodes?: unknown[];
  edges?: unknown[];
}

export interface EvaluationResult {
  decision: Decision;
  matchedRule: { id: string; name: string } | null;
  reason: string;
  processingTimeMs: number;
  evaluatedAt: string;
}

/** Walk a dot-path into a nested object. Returns undefined for any
 *  missing segment so condition operators can distinguish present/absent. */
function getByPath(obj: unknown, path: string): unknown {
  if (!path) return undefined;
  let cur: unknown = obj;
  for (const segment of path.split('.')) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[segment];
  }
  return cur;
}

function evaluateCondition(cond: Condition, ctx: unknown): boolean {
  const actual = getByPath(ctx, cond.path);
  switch (cond.op) {
    case 'equals':
      return actual === cond.value;
    case 'not_equals':
      return actual !== cond.value;
    case 'in':
      return Array.isArray(cond.value) && (cond.value as unknown[]).includes(actual);
    case 'not_in':
      return Array.isArray(cond.value) && !(cond.value as unknown[]).includes(actual);
    case 'gte':
      return typeof actual === 'number' && typeof cond.value === 'number' && actual >= cond.value;
    case 'lte':
      return typeof actual === 'number' && typeof cond.value === 'number' && actual <= cond.value;
    case 'gt':
      return typeof actual === 'number' && typeof cond.value === 'number' && actual > cond.value;
    case 'lt':
      return typeof actual === 'number' && typeof cond.value === 'number' && actual < cond.value;
    case 'contains':
      if (typeof actual === 'string' && typeof cond.value === 'string') return actual.includes(cond.value);
      if (Array.isArray(actual)) return (actual as unknown[]).includes(cond.value);
      return false;
    case 'starts_with':
      return typeof actual === 'string' && typeof cond.value === 'string' && actual.startsWith(cond.value);
    case 'ends_with':
      return typeof actual === 'string' && typeof cond.value === 'string' && actual.endsWith(cond.value);
    case 'exists':
      return actual !== undefined && actual !== null;
    case 'not_exists':
      return actual === undefined || actual === null;
    default:
      return false;
  }
}

function ruleMatches(rule: Rule, ctx: unknown): boolean {
  // A rule with zero conditions is a catch-all (matches everything).
  // Useful as a default-allow / default-deny at the end of a list.
  if (!Array.isArray(rule.conditions) || rule.conditions.length === 0) return true;
  return rule.conditions.every((c) => evaluateCondition(c, ctx));
}

/** Pure: evaluate a policy against a context. */
export function evaluatePolicy(
  policy: PolicyDocument | null | undefined,
  context: unknown
): EvaluationResult {
  const startedAt = process.hrtime.bigint();
  const rules = Array.isArray(policy?.rules) ? [...(policy!.rules as Rule[])] : [];
  // Higher priority first; stable for equal priorities (preserves authoring order).
  rules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const rule of rules) {
    if (ruleMatches(rule, context)) {
      const elapsedNs = Number(process.hrtime.bigint() - startedAt);
      return {
        decision: rule.effect,
        matchedRule: { id: rule.id, name: rule.name },
        reason: rule.description?.trim()
          ? rule.description.trim()
          : `Matched rule "${rule.name}" (effect: ${rule.effect})`,
        processingTimeMs: Math.round(elapsedNs / 10_000) / 100,
        evaluatedAt: new Date().toISOString()
      };
    }
  }

  const fallback: Decision = (policy?.default as Decision | undefined) ?? 'deny';
  const elapsedNs = Number(process.hrtime.bigint() - startedAt);
  return {
    decision: fallback,
    matchedRule: null,
    reason: rules.length === 0
      ? 'Policy has no rules; default decision applied'
      : `No rule matched; default decision (${fallback}) applied`,
    processingTimeMs: Math.round(elapsedNs / 10_000) / 100,
    evaluatedAt: new Date().toISOString()
  };
}
