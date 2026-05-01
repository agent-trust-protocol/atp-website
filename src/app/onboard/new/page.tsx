'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Copy, Check, Shield, Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PreflightCheck } from '@/components/onboard/PreflightCheck';
import { ExecutionLog } from '@/components/onboard/ExecutionLog';

type Language = 'typescript' | 'javascript';
type SecurityProfile = 'standard' | 'enhanced' | 'maximum';

const SECURITY_PROFILES: {
  id: SecurityProfile;
  label: string;
  description: string;
  flag: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Good defaults for most agents: shell disabled, filesystem read-only, full audit trail.',
    flag: '--profile standard',
    icon: Shield,
    color: 'text-green-400'
  },
  {
    id: 'enhanced',
    label: 'Enhanced',
    description: 'Stricter controls for sensitive workloads: credential access blocked, external network restricted.',
    flag: '--profile enhanced',
    icon: Zap,
    color: 'text-blue-400'
  },
  {
    id: 'maximum',
    label: 'Maximum',
    description: 'Locked-down for production: every action requires approval, full redaction of sensitive fields.',
    flag: '--profile maximum',
    icon: Lock,
    color: 'text-purple-400'
  }
];

const STEPS = ['Environment', 'Project name', 'Language', 'Security', 'Review'];

function buildCommand(name: string, lang: Language, profile: SecurityProfile) {
  const tsFlag = lang === 'typescript' ? ' --typescript' : '';
  return `npx create-atp-agent ${name || '<project-name>'}${tsFlag} --profile ${profile}`;
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

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [preflightReady, setPreflightReady] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [lang, setLang] = useState<Language>('typescript');
  const [profile, setProfile] = useState<SecurityProfile>('standard');
  const [running, setRunning] = useState(false);

  const command = buildCommand(name, lang, profile);

  const handlePreflightReady = useCallback((ready: boolean) => {
    setPreflightReady(ready);
  }, []);

  const validateName = (value: string) => {
    if (!value) return 'Project name is required';
    if (/[^a-zA-Z0-9_-]/.test(value)) return 'Only letters, numbers, hyphens, and underscores allowed';
    return '';
  };

  const canProceed = () => {
    if (step === 0) return preflightReady;
    if (step === 1) return name.trim() !== '' && !validateName(name);
    return true;
  };

  const next = () => {
    if (step === 1) {
      const err = validateName(name);
      if (err) { setNameError(err); return; }
    }
    setStep((s) => s + 1);
  };

  const back = () => {
    if (step === 0) { router.push('/onboard'); return; }
    setStep((s) => s - 1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-8 pt-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>New ATP Project</span>
            <span>Step {Math.min(step + 1, STEPS.length)} of {STEPS.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }}
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
                  We'll verify your system is ready before doing anything.
                </p>
              </div>
              <PreflightCheck onReady={handlePreflightReady} />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">What's your project called?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This becomes the folder name and the package name.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input
                  id="project-name"
                  placeholder="my-atp-agent"
                  value={name}
                  autoFocus
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(validateName(e.target.value));
                  }}
                  className={nameError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {nameError && <p className="text-xs text-red-400">{nameError}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Which language?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  TypeScript is recommended — it ships with full type definitions.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['typescript', 'javascript'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`text-left rounded-xl border p-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      lang === l
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-border/80 bg-card'
                    }`}
                  >
                    <div className="font-semibold capitalize">{l === 'typescript' ? 'TypeScript' : 'JavaScript'}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {l === 'typescript' ? 'Recommended — full type safety' : 'Flexible, no compilation needed'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Choose your protection level</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This sets what your agent is allowed to do. You can change it later.
                </p>
              </div>
              <div className="space-y-3">
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

          {step === 4 && !running && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Ready to run</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Review your choices. Click <strong>Run Setup</strong> to execute.
                </p>
              </div>
              <Card className="border-border">
                <CardContent className="divide-y divide-border pt-0">
                  {[
                    ['Project name', name],
                    ['Language', lang === 'typescript' ? 'TypeScript' : 'JavaScript'],
                    ['Security profile', SECURITY_PROFILES.find((p) => p.id === profile)?.label ?? profile]
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-3 text-sm first:pt-4 last:pb-4">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {running && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Setting up your project</h2>
                <p className="text-sm text-muted-foreground mt-1">This usually takes 30–60 seconds.</p>
              </div>
              <ExecutionLog command={command} />
            </div>
          )}
        </div>

        {/* CLI panel — always visible on steps 1–4 */}
        {step >= 1 && !running && <CliPanel command={command} />}

        {/* Navigation */}
        {!running && (
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={back} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={!canProceed()} className="flex items-center gap-2">
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
