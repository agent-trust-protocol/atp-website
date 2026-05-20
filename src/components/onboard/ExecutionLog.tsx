'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

export type ExecutionState = 'running' | 'success' | 'partial' | 'error';

interface LogLine {
  ts: string;
  text: string;
  verbose?: boolean;
}

interface ExecutionLogProps {
  command: string;
  onComplete?: (state: ExecutionState) => void;
}

function now() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

// TODO: replace simulated log lines with real streaming (SSE or ReadableStream) from /api/execute
const SIMULATED_LINES: LogLine[] = [
  { ts: '', text: 'Checking environment...' },
  { ts: '', text: '✓ Node.js 20.x detected' },
  { ts: '', text: '✓ npm 10.x detected' },
  { ts: '', text: 'Running setup command...' },
  { ts: '', text: '  Installing dependencies...', verbose: true },
  { ts: '', text: '  Resolving package versions...', verbose: true },
  { ts: '', text: '✓ Dependencies installed' },
  { ts: '', text: 'Generating agent identity...' },
  { ts: '', text: '  Generating ML-DSA key pair...', verbose: true },
  { ts: '', text: '  Generating Ed25519 key pair...', verbose: true },
  { ts: '', text: '✓ Quantum-safe keys generated' },
  { ts: '', text: 'Writing project files...' },
  { ts: '', text: '✓ Project scaffold complete' },
  { ts: '', text: '✓ ATP configuration written' },
  { ts: '', text: 'Setup complete.' }
];

export function ExecutionLog({ command, onComplete }: ExecutionLogProps) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [state, setState] = useState<ExecutionState>('running');
  const [progress, setProgress] = useState(0);
  const [showVerbose, setShowVerbose] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    const total = SIMULATED_LINES.length;

    const tick = () => {
      if (cancelled) return;
      if (i >= total) {
        setState('success');
        setProgress(100);
        onComplete?.('success');
        return;
      }
      setLines((prev) => [...prev, { ...SIMULATED_LINES[i], ts: now() }]);
      setProgress(Math.round(((i + 1) / total) * 95));
      i++;
      timerId = setTimeout(tick, 280 + Math.random() * 180);
    };

    tick();
    return () => {
      cancelled = true;
      if (timerId !== null) clearTimeout(timerId);
    };
  }, [onComplete]);

  useEffect(() => {
    try {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      bottomRef.current?.scrollIntoView();
    }
  }, [lines]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const visibleLines = showVerbose ? lines : lines.filter((l) => !l.verbose);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{state === 'running' ? 'Running...' : 'Complete'}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              state === 'success'
                ? 'bg-green-500'
                : state === 'error'
                ? 'bg-red-500'
                : state === 'partial'
                ? 'bg-yellow-500'
                : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Command reference */}
      <div className="flex items-center justify-between gap-2 rounded-lg bg-black/60 border border-border px-3 py-2">
        <code className="text-xs font-mono text-muted-foreground truncate">{command}</code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Copy command"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>

      {/* Terminal log */}
      <div className="rounded-lg bg-black/80 border border-border p-4 h-52 overflow-y-auto font-mono text-xs space-y-0.5">
        {visibleLines.map((line, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="text-muted-foreground flex-shrink-0 select-none">{line.ts}</span>
            <span className={line.text?.startsWith('✓') ? 'text-green-400' : 'text-foreground/80'}>
              {line.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Verbose toggle */}
      <button
        onClick={() => setShowVerbose((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        aria-expanded={showVerbose}
      >
        {showVerbose ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {showVerbose ? 'Hide' : 'Expand'} advanced output
      </button>

      {/* End states */}
      {state === 'success' && (
        <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="font-semibold text-green-400">Your agent is ready</span>
          </div>
          <p className="text-sm text-muted-foreground">Next step:</p>
          <code className="block text-sm font-mono bg-black/40 rounded px-3 py-2 text-green-300">
            npm start
          </code>
          {process.env.NEXT_PUBLIC_ONBOARD_EXECUTION_URL && (
            <p className="text-xs text-muted-foreground">
              Or open the dashboard at{' '}
              <a
                href={process.env.NEXT_PUBLIC_ONBOARD_EXECUTION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {process.env.NEXT_PUBLIC_ONBOARD_EXECUTION_URL}
              </a>
            </p>
          )}
        </div>
      )}

      {state === 'partial' && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <span className="font-semibold text-yellow-400">Partial success — review required</span>
          </div>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Project scaffold completed</li>
            <li className="text-yellow-300">Port 3456 may already be in use — run: <code>kill $(lsof -t -i:3456)</code></li>
          </ul>
        </div>
      )}

      {state === 'error' && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <span className="font-semibold text-red-400">Setup failed</span>
          </div>
          <p className="text-sm text-muted-foreground">
            npm could not install packages. This usually means a network issue or missing permissions.
          </p>
          <p className="text-sm font-medium text-foreground">Run this to fix:</p>
          <code className="block text-sm font-mono bg-black/40 rounded px-3 py-2 text-red-300">
            npm cache clean --force && npm install
          </code>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              Show raw error output
            </summary>
            <pre className="mt-2 bg-black/60 rounded p-2 text-red-300 overflow-x-auto">
              {lines.map((l) => `${l.ts}  ${l.text}`).join('\n')}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
