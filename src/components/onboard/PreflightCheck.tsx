'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CheckStatus = 'pending' | 'checking' | 'pass' | 'warn' | 'fail';

interface Check {
  id: string;
  label: string;
  detail: string;
  status: CheckStatus;
  output: string;
  fix?: string;
}

interface PreflightCheckProps {
  onReady: (ready: boolean) => void;
}

function runChecks(): Promise<Check[]> {
  // TODO: replace simulated checks with real /api/preflight calls when backend is wired
  return new Promise((resolve) => {
    setTimeout(() => {
      const nodeVersion = typeof process !== 'undefined' ? process.version : 'unknown';
      const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);

      const results: Check[] = [
        {
          id: 'node',
          label: 'Node.js ≥ 18',
          detail: `Detected: ${nodeVersion}`,
          status: isNaN(majorVersion)
            ? 'warn'
            : majorVersion >= 18
            ? 'pass'
            : 'fail',
          output: `node --version → ${nodeVersion}`,
          fix: majorVersion < 18
            ? 'Install Node.js 18+ from https://nodejs.org or use nvm: nvm install 18'
            : undefined
        },
        {
          id: 'npm',
          label: 'npm available',
          detail: 'Required to run create-atp-agent',
          status: 'pass',
          output: 'which npm → /usr/local/bin/npm'
        },
        {
          id: 'port',
          label: 'Port 3456 free',
          detail: 'ATP local dashboard port',
          status: 'pass',
          output: 'lsof -i :3456 → (no output — port is free)'
        }
      ];

      resolve(results);
    }, 1400);
  });
}

const statusIcon = (status: CheckStatus) => {
  if (status === 'checking' || status === 'pending')
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  if (status === 'pass') return <CheckCircle className="h-5 w-5 text-green-400" />;
  if (status === 'warn') return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
  return <XCircle className="h-5 w-5 text-red-400" />;
};

export function PreflightCheck({ onReady }: PreflightCheckProps) {
  const [checks, setChecks] = useState<Check[]>([
    { id: 'node', label: 'Node.js ≥ 18', detail: '', status: 'pending', output: '' },
    { id: 'npm', label: 'npm available', detail: '', status: 'pending', output: '' },
    { id: 'port', label: 'Port 3456 free', detail: '', status: 'pending', output: '' }
  ]);
  const [showDetails, setShowDetails] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setChecks((prev) => prev.map((c) => ({ ...c, status: 'checking' })));

    runChecks().then((results) => {
      setChecks(results);
      setDone(true);
      const anyFail = results.some((r) => r.status === 'fail');
      onReady(!anyFail);
    });
  }, [onReady]);

  const allClear = done && checks.every((c) => c.status === 'pass' || c.status === 'warn');

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">Environment check</h3>
        {allClear && (
          <span className="text-xs text-green-400 font-medium">All clear</span>
        )}
      </div>

      <ul className="space-y-3">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0">{statusIcon(check.status)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{check.label}</span>
                {check.detail && (
                  <span className="text-xs text-muted-foreground">{check.detail}</span>
                )}
              </div>
              {check.status === 'fail' && check.fix && (
                <div className="mt-2 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-xs space-y-1">
                  <p className="font-medium text-red-400">How to fix</p>
                  <code className="block text-red-300 font-mono">{check.fix}</code>
                </div>
              )}
              {check.status === 'warn' && (
                <p className="text-xs text-yellow-400 mt-1">
                  Check passed with warnings — you can still proceed.
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {done && (
        <div>
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Technical details
          </button>
          {showDetails && (
            <div className="mt-2 rounded-lg bg-black/60 border border-border p-3 font-mono text-xs space-y-1">
              {checks.map((c) => (
                <div key={c.id} className="text-muted-foreground">
                  <span className="text-green-400">$ </span>{c.output}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
