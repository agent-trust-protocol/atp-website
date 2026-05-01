'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Shield, Zap, Lock, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PreflightCheck } from '@/components/onboard/PreflightCheck';
import { ExecutionLog } from '@/components/onboard/ExecutionLog';

type SecurityProfile = 'standard' | 'enhanced' | 'maximum';

const SECURITY_PROFILES: {
  id: SecurityProfile;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Good defaults for most agents: shell disabled, filesystem read-only, full audit trail.',
    icon: Shield,
    color: 'text-green-400'
  },
  {
    id: 'enhanced',
    label: 'Enhanced',
    description: 'Stricter controls for sensitive workloads: credential access blocked, external network restricted.',
    icon: Zap,
    color: 'text-blue-400'
  },
  {
    id: 'maximum',
    label: 'Maximum',
    description: 'Locked-down for production: every action requires approval, full redaction of sensitive fields.',
    icon: Lock,
    color: 'text-purple-400'
  }
];

const STEPS = ['Environment', 'Configure', 'Review'];

function buildCommand(dir: string, profile: SecurityProfile) {
  const dirArg = dir.trim() ? `--dir "${dir.trim()}"` : '--dir <path>';
  return `npm install atp-sdk && npx atp-init ${dirArg} --profile ${profile}`;
}

function CliPanel({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-black/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs text-muted-foreground font-mono">CLI equivalent</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
          aria-label="Copy CLI command"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="px-4 py-3 font-mono text-sm text-green-400 break-all">{command}</div>
      <div className="px-4 pb-3 text-xs text-muted-foreground">
        This is exactly what runs when you click <strong>Run Setup</strong>.
      </div>
    </div>
  );
}

export default function ExistingProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [preflightReady, setPreflightReady] = useState(false);
  const [dir, setDir] = useState('');
  const [profile, setProfile] = useState<SecurityProfile>('standard');
  const [running, setRunning] = useState(false);

  const command = buildCommand(dir, profile);

  const handlePreflightReady = useCallback((ready: boolean) => {
    setPreflightReady(ready);
  }, []);

  const canProceed = () => {
    if (step === 0) return preflightReady;
    if (step === 1) return dir.trim() !== '';
    return true;
  };

  const back = () => {
    if (step === 0) { router.push('/onboard'); return; }
    setStep((s) => s - 1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-8 pt-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Connect Existing Project</span>
            <span>Step {step + 1} of {STEPS.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`text-xs hidden sm:inline ${i === step ? 'text-foreground font-medium' : i < step ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Check your environment</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We'll verify your system is ready before installing ATP.
                </p>
              </div>
              <PreflightCheck onReady={handlePreflightReady} />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Configure your project</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tell us where your project lives and how strict you want security to be.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-dir">Project directory path</Label>
                <Input
                  id="project-dir"
                  placeholder="./my-agent or /Users/you/projects/my-agent"
                  value={dir}
                  autoFocus
                  onChange={(e) => setDir(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Absolute or relative path to your existing project root.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Choose your protection level</Label>
                {SECURITY_PROFILES.map(({ id, label, description, icon: Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => setProfile(id)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-start gap-4 ${
                      profile === id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-border/80 bg-card'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${color}`} />
                    <div>
                      <div className="font-semibold">{label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && !running && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Ready to connect</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Click <strong>Run Setup</strong> to install ATP into your existing project.
                </p>
              </div>
              <div className="rounded-xl border border-border divide-y divide-border text-sm">
                {[
                  ['Directory', dir || '—'],
                  ['Security profile', SECURITY_PROFILES.find((p) => p.id === profile)?.label ?? profile]
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium font-mono text-xs sm:text-sm truncate max-w-[60%] text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {running && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Installing ATP</h2>
                <p className="text-sm text-muted-foreground mt-1">This usually takes 30–60 seconds.</p>
              </div>
              <ExecutionLog command={command} />
            </div>
          )}
        </div>

        {/* CLI panel — visible on steps 1–2 */}
        {step >= 1 && !running && <CliPanel command={command} />}

        {/* Navigation */}
        {!running && (
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={back} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="flex items-center gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setRunning(true)} className="flex items-center gap-2">
                Run Setup <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
