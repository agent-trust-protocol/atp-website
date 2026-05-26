'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/use-me';
import { WORKFLOW_NODES, type NodeDefinition } from '@/workflow-engine/nodes/catalog';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  ReactFlowInstance,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Save,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Settings,
  Trash2,
  Zap,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Database,
  Shield,
  Activity
} from 'lucide-react';

// Custom node types for ATP workflows
const nodeTypes = {
  trigger: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-blue-100 border-2 border-blue-300 min-w-[150px]">
      <div className="flex items-center gap-2 mb-1">
        <Play className="h-4 w-4 text-blue-600" />
        <div className="font-medium text-blue-800">{data.label}</div>
      </div>
      <div className="text-xs text-blue-600">{data.type}</div>
    </div>
  ),
  action: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-green-100 border-2 border-green-300 min-w-[150px]">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="h-4 w-4 text-green-600" />
        <div className="font-medium text-green-800">{data.label}</div>
      </div>
      <div className="text-xs text-green-600">{data.type}</div>
    </div>
  ),
  condition: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-yellow-100 border-2 border-yellow-300 min-w-[150px]">
      <div className="flex items-center gap-2 mb-1">
        <GitBranch className="h-4 w-4 text-yellow-600" />
        <div className="font-medium text-yellow-800">{data.label}</div>
      </div>
      <div className="text-xs text-yellow-600">{data.type}</div>
    </div>
  ),
  output: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-purple-100 border-2 border-purple-300 min-w-[150px]">
      <div className="flex items-center gap-2 mb-1">
        <Database className="h-4 w-4 text-purple-600" />
        <div className="font-medium text-purple-800">{data.label}</div>
      </div>
      <div className="text-xs text-purple-600">{data.type}</div>
    </div>
  )
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: { label: 'Policy Change Trigger', type: 'policy-change-trigger' }
  },
  {
    id: '2',
    type: 'action',
    position: { x: 300, y: 100 },
    data: { label: 'Validate Policy', type: 'validate-policy' }
  },
  {
    id: '3',
    type: 'condition',
    position: { x: 500, y: 100 },
    data: { label: 'Policy Valid?', type: 'policy-valid' }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true }
];

// Available node templates for the toolbar
const nodeTemplates = [
  {
    category: 'Triggers',
    nodes: [
      { type: 'trigger', label: 'Policy Change', nodeType: 'policy-change-trigger', icon: Shield },
      { type: 'trigger', label: 'Trust Change', nodeType: 'trust-change-trigger', icon: Activity },
      { type: 'trigger', label: 'Security Alert', nodeType: 'security-alert-trigger', icon: AlertTriangle },
      { type: 'trigger', label: 'Schedule', nodeType: 'schedule-trigger', icon: Clock }
    ]
  },
  {
    category: 'Actions',
    nodes: [
      { type: 'action', label: 'Validate Policy', nodeType: 'validate-policy', icon: CheckCircle },
      { type: 'action', label: 'Evaluate Policy', nodeType: 'evaluate-policy', icon: Shield },
      { type: 'action', label: 'Evaluate Trust', nodeType: 'evaluate-trust', icon: Activity },
      { type: 'action', label: 'Send Notification', nodeType: 'send-notification', icon: Mail },
      { type: 'action', label: 'Generate Report', nodeType: 'generate-report', icon: Database }
    ]
  },
  {
    category: 'Conditions',
    nodes: [
      { type: 'condition', label: 'Trust Threshold', nodeType: 'trust-threshold', icon: GitBranch },
      { type: 'condition', label: 'Policy Compliance', nodeType: 'policy-compliance', icon: Shield }
    ]
  },
  {
    category: 'Outputs',
    nodes: [
      { type: 'output', label: 'Audit Log', nodeType: 'audit-log', icon: Database }
    ]
  }
];

function WorkflowDesignerContent() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onInit = useCallback((rfi: ReactFlowInstance) => {
    setReactFlowInstance(rfi);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeData = event.dataTransfer.getData('application/reactflow');
      if (typeof nodeData === 'undefined' || !nodeData) {
        return;
      }

      const { type, label, nodeType } = JSON.parse(nodeData);
      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      const newNode: Node = {
        id: `${Date.now()}`,
        type,
        position: position || { x: 0, y: 0 },
        data: { label, type: nodeType }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, type: string) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ type: nodeType, label, nodeType: type })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveWorkflow = async () => {
    setSaveState('saving');
    setSaveError(null);
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflowName,
          definition: { nodes, edges }
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Save failed (${res.status})`);
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err) {
      setSaveState('error');
      setSaveError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const resetWorkflow = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setWorkflowName('New Workflow');
    setSelectedNode(null);
  };

  // Better Auth session (via /api/me) is the canonical gate. The previous
  // implementation checked an `atp_token` cookie that nothing in the stack
  // sets, so the designer rendered the "Authenticating..." placeholder for
  // every visitor. Founder bypasses unconditionally.
  const me = useMe();
  useEffect(() => {
    if (me.loading) return;
    if (!me.authenticated && !me.isFounder) {
      router.push('/login?returnTo=/dashboard/workflows/designer&feature=workflow-designer&tier=startup');
      return;
    }
    setIsAuthenticated(true);
  }, [me.loading, me.authenticated, me.isFounder, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-semibold">Authenticating...</p>
          <p className="text-sm text-muted-foreground">Verifying access to workflow designer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-[800px]">
      {/* Node Palette */}
      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Node Palette</CardTitle>
            <CardDescription>Drag nodes to the canvas to build your workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nodeTemplates.map((category) => (
              <div key={category.category}>
                <h4 className="font-medium text-sm text-gray-600 mb-2">{category.category}</h4>
                <div className="space-y-2">
                  {category.nodes.map((node) => {
                    const IconComponent = node.icon;
                    return (
                      <div
                        key={node.nodeType}
                        className="flex items-center gap-2 p-2 border rounded cursor-move hover:bg-gray-50 transition-colors"
                        draggable
                        onDragStart={(e) => onDragStart(e, node.type, node.label, node.nodeType)}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm">{node.label}</span>
                      </div>
                    );
                  })}
                </div>
                <Separator className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Canvas */}
      <div className="col-span-6">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-lg font-medium border-none p-0 h-auto bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              {saveState === 'saved' && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Saved
                </span>
              )}
              {saveState === 'error' && (
                <span className="text-xs text-red-600 flex items-center gap-1" title={saveError ?? ''}>
                  <AlertTriangle className="h-3 w-3" /> {saveError ?? 'Save failed'}
                </span>
              )}
              <Button size="sm" variant="outline" onClick={resetWorkflow}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={saveWorkflow} disabled={saveState === 'saving'}>
                <Save className="h-4 w-4 mr-1" />
                {saveState === 'saving' ? 'Saving…' : 'Save'}
              </Button>
              <Button size="sm" variant="outline">
                <Play className="h-4 w-4 mr-1" />
                Test
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={reactFlowWrapper} className="h-[600px]">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={onInit}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-gray-50"
              >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Panel */}
      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Properties</CardTitle>
            <CardDescription>Configure the selected node</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNode ? (
              <NodeProperties
                node={selectedNode}
                onLabelChange={(label) => {
                  setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label } } : n)));
                  setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label } });
                }}
                onConfigChange={(config) => {
                  setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, config } } : n)));
                  setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, config } });
                }}
                onDelete={() => {
                  setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                  setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
                  setSelectedNode(null);
                }}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Settings className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Select a node to view its properties</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function WorkflowDesigner() {
  return (
    <ReactFlowProvider>
      <WorkflowDesignerContent />
    </ReactFlowProvider>
  );
}

/**
 * Per-node configuration form. Catalog-driven: looks up the node's
 * `data.type` in WORKFLOW_NODES and renders one input per declared
 * catalog input. The values land on `node.data.config`, which the
 * executor merges into the node's runtime inputs as defaults (PR #N).
 *
 * For object/array inputs we render a JSON textarea — good enough for
 * v1; a structured editor can ship later.
 */
function NodeProperties({
  node,
  onLabelChange,
  onConfigChange,
  onDelete
}: {
  node: Node;
  onLabelChange: (label: string) => void;
  onConfigChange: (config: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const def: NodeDefinition | undefined = WORKFLOW_NODES.find((n) => n.type === node.data?.type);
  const config = (node.data?.config ?? {}) as Record<string, unknown>;

  const updateField = (name: string, value: unknown) => {
    onConfigChange({ ...config, [name]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Node type</Label>
        <div className="text-sm text-gray-600 font-mono">{node.data?.type}</div>
      </div>
      <div>
        <Label htmlFor="node-label" className="text-sm font-medium">Label</Label>
        <Input
          id="node-label"
          value={node.data?.label ?? ''}
          onChange={(e) => onLabelChange(e.target.value)}
        />
      </div>

      {def && def.inputs.length > 0 ? (
        <div className="space-y-3 border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Configuration
          </div>
          {def.inputs.map((input) => {
            const current = config[input.name];
            // object/array → JSON textarea; everything else → single-line input.
            if (input.type === 'object' || input.type === 'array') {
              return (
                <div key={input.name}>
                  <Label className="text-xs">
                    {input.name} <span className="text-muted-foreground">({input.type}{input.required ? ', required' : ''})</span>
                  </Label>
                  <textarea
                    className="mt-1 w-full bg-background border border-border rounded-md px-2 py-2 text-xs font-mono min-h-[80px]"
                    placeholder={input.type === 'array' ? '[]' : '{}'}
                    value={current != null ? JSON.stringify(current, null, 2) : ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw.trim() === '') { updateField(input.name, undefined); return; }
                      try {
                        updateField(input.name, JSON.parse(raw));
                      } catch {
                        // Keep the raw string so the user can fix it; the
                        // executor will fail with a clearer error than silent
                        // data loss.
                        updateField(input.name, raw);
                      }
                    }}
                  />
                </div>
              );
            }
            return (
              <div key={input.name}>
                <Label className="text-xs">
                  {input.name} <span className="text-muted-foreground">({input.type}{input.required ? ', required' : ''})</span>
                </Label>
                <Input
                  className="mt-1 text-xs"
                  value={current != null ? String(current) : ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (input.type === 'number') {
                      const n = Number(raw);
                      updateField(input.name, Number.isFinite(n) ? n : raw);
                    } else if (input.type === 'boolean') {
                      updateField(input.name, raw === 'true');
                    } else {
                      updateField(input.name, raw);
                    }
                  }}
                />
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            These values are passed to the node as default inputs; upstream
            edges can override them at runtime.
          </p>
        </div>
      ) : def ? (
        <div className="text-xs text-muted-foreground border-t pt-3">
          This node has no configurable inputs.
        </div>
      ) : (
        <div className="text-xs text-amber-600 border-t pt-3">
          Unknown node type — no schema in the catalog. Inputs must flow in via edges.
        </div>
      )}

      <Button size="sm" variant="destructive" className="w-full" onClick={onDelete}>
        <Trash2 className="h-3 w-3 mr-1" />
        Delete Node
      </Button>
    </div>
  );
}
