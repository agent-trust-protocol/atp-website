'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Shared with src/components/atp/visual-policy-editor.tsx and matches the
 * Rule shape the evaluator (src/policy-engine/evaluator.ts) expects.
 */
export type PolicyDecision = 'allow' | 'deny' | 'throttle' | 'require_approval';

export type ConditionOp =
  | 'equals' | 'not_equals'
  | 'in' | 'not_in'
  | 'gte' | 'lte' | 'gt' | 'lt'
  | 'contains' | 'starts_with' | 'ends_with'
  | 'exists' | 'not_exists';

export interface PolicyCondition {
  path: string;
  op: ConditionOp;
  value?: unknown;
}

export interface PolicyRule {
  id: string;
  name: string;
  description?: string;
  priority?: number;
  effect: PolicyDecision;
  conditions: PolicyCondition[];
}

const OP_OPTIONS: { value: ConditionOp; label: string; needsValue: boolean }[] = [
  { value: 'equals', label: 'equals', needsValue: true },
  { value: 'not_equals', label: 'not equals', needsValue: true },
  { value: 'in', label: 'in (comma list)', needsValue: true },
  { value: 'not_in', label: 'not in (comma list)', needsValue: true },
  { value: 'gte', label: '≥', needsValue: true },
  { value: 'lte', label: '≤', needsValue: true },
  { value: 'gt', label: '>', needsValue: true },
  { value: 'lt', label: '<', needsValue: true },
  { value: 'contains', label: 'contains', needsValue: true },
  { value: 'starts_with', label: 'starts with', needsValue: true },
  { value: 'ends_with', label: 'ends with', needsValue: true },
  { value: 'exists', label: 'exists', needsValue: false },
  { value: 'not_exists', label: 'not exists', needsValue: false }
];

const EFFECT_BADGE: Record<PolicyDecision, string> = {
  allow: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  deny: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  throttle: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  require_approval: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
};

function newRule(): PolicyRule {
  return {
    id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'New rule',
    priority: 100,
    effect: 'deny',
    conditions: []
  };
}

function newCondition(): PolicyCondition {
  return { path: '', op: 'equals', value: '' };
}

interface PolicyRulesEditorProps {
  rules: PolicyRule[];
  onChange: (rules: PolicyRule[]) => void;
  defaultDecision: PolicyDecision;
  onDefaultChange: (decision: PolicyDecision) => void;
}

/**
 * Inline rules editor — renders a list of rules with priority controls,
 * each rule expanding to show its conditions. Designed to be dropped
 * inside a Dialog from the visual editor.
 */
export function PolicyRulesEditor({ rules, onChange, defaultDecision, onDefaultChange }: PolicyRulesEditorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(rules[0]?.id ?? null);

  const updateRule = (id: string, patch: Partial<PolicyRule>) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRule = (id: string) => {
    onChange(rules.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = rules.findIndex((r) => r.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= rules.length) return;
    const next = [...rules];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const addRule = () => {
    const r = newRule();
    onChange([...rules, r]);
    setExpandedId(r.id);
  };

  const updateCondition = (ruleId: string, condIndex: number, patch: Partial<PolicyCondition>) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const nextConds = rule.conditions.map((c, i) => (i === condIndex ? { ...c, ...patch } : c));
    updateRule(ruleId, { conditions: nextConds });
  };

  const removeCondition = (ruleId: string, condIndex: number) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    updateRule(ruleId, { conditions: rule.conditions.filter((_, i) => i !== condIndex) });
  };

  const addCondition = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    updateRule(ruleId, { conditions: [...rule.conditions, newCondition()] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <Label htmlFor="default-decision">Default decision (when no rule matches)</Label>
          <select
            id="default-decision"
            value={defaultDecision}
            onChange={(e) => onDefaultChange(e.target.value as PolicyDecision)}
            className="ml-2 bg-background border border-border rounded-md px-2 py-1 text-sm"
          >
            <option value="deny">deny</option>
            <option value="allow">allow</option>
            <option value="throttle">throttle</option>
            <option value="require_approval">require_approval</option>
          </select>
        </div>
        <Button size="sm" onClick={addRule}>
          <Plus className="h-4 w-4 mr-1" /> Add rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No rules yet. A policy with zero rules will always return the
            default decision. Click <strong>Add rule</strong> above to start.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, idx) => {
            const isOpen = expandedId === rule.id;
            return (
              <Card key={rule.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={idx === 0} onClick={() => move(rule.id, -1)}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={idx === rules.length - 1} onClick={() => move(rule.id, 1)}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => setExpandedId(isOpen ? null : rule.id)}
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium">{rule.name}</span>
                          <Badge variant="outline" className={EFFECT_BADGE[rule.effect]}>
                            {rule.effect}
                          </Badge>
                          <span className="text-xs text-muted-foreground">priority {rule.priority ?? 0}</span>
                          <span className="text-xs text-muted-foreground">· {rule.conditions.length} condition{rule.conditions.length === 1 ? '' : 's'}</span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="space-y-3 mt-3 pl-1 border-l-2 border-muted-foreground/20">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-3">
                            <div>
                              <Label className="text-xs">Name</Label>
                              <Input value={rule.name} onChange={(e) => updateRule(rule.id, { name: e.target.value })} className="mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs">Effect</Label>
                              <select
                                value={rule.effect}
                                onChange={(e) => updateRule(rule.id, { effect: e.target.value as PolicyDecision })}
                                className="mt-1 w-full bg-background border border-border rounded-md px-2 py-2 text-sm"
                              >
                                <option value="allow">allow</option>
                                <option value="deny">deny</option>
                                <option value="throttle">throttle</option>
                                <option value="require_approval">require_approval</option>
                              </select>
                            </div>
                            <div>
                              <Label className="text-xs">Priority</Label>
                              <Input
                                type="number"
                                value={rule.priority ?? 0}
                                onChange={(e) => updateRule(rule.id, { priority: Number(e.target.value) || 0 })}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div className="pl-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Conditions (ALL must match)</Label>
                              <Button type="button" size="sm" variant="ghost" onClick={() => addCondition(rule.id)}>
                                <Plus className="h-3 w-3 mr-1" /> Add condition
                              </Button>
                            </div>
                            {rule.conditions.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                No conditions yet. A rule with zero conditions is a catch-all and will always fire.
                              </p>
                            ) : (
                              rule.conditions.map((cond, i) => {
                                const opMeta = OP_OPTIONS.find((o) => o.value === cond.op);
                                return (
                                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                    <Input
                                      className="col-span-4"
                                      placeholder="path (e.g. tool.sensitivity)"
                                      value={cond.path}
                                      onChange={(e) => updateCondition(rule.id, i, { path: e.target.value })}
                                    />
                                    <select
                                      className="col-span-3 bg-background border border-border rounded-md px-2 py-2 text-sm"
                                      value={cond.op}
                                      onChange={(e) => updateCondition(rule.id, i, { op: e.target.value as ConditionOp })}
                                    >
                                      {OP_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                      ))}
                                    </select>
                                    {opMeta?.needsValue ? (
                                      <Input
                                        className="col-span-4"
                                        placeholder="value"
                                        value={String(cond.value ?? '')}
                                        onChange={(e) => updateCondition(rule.id, i, { value: parseValueForOp(cond.op, e.target.value) })}
                                      />
                                    ) : (
                                      <div className="col-span-4 text-xs text-muted-foreground italic">no value</div>
                                    )}
                                    <Button type="button" size="sm" variant="ghost" className="col-span-1" onClick={() => removeCondition(rule.id, i)}>
                                      <Trash2 className="h-3 w-3 text-red-600" />
                                    </Button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeRule(rule.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Lenient string → typed value coercion based on the operator. */
function parseValueForOp(op: ConditionOp, raw: string): unknown {
  if (op === 'in' || op === 'not_in') {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (op === 'gte' || op === 'lte' || op === 'gt' || op === 'lt') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }
  return raw;
}
