'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

type Status = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'success' } | { kind: 'error'; message: string };

export function EnterpriseContactForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ kind: 'submitting' });
    const form = e.currentTarget;

    try {
      // Route handler uses request.formData(); keep the wire format aligned.
      const res = await fetch('/api/enterprise/contact', {
        method: 'POST',
        body: new FormData(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus({ kind: 'error', message: body?.error || `Request failed (${res.status}).` });
        return;
      }
      setStatus({ kind: 'success' });
      form.reset();
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Network error.' });
    }
  };

  if (status.kind === 'success') {
    return (
      <div className="flex items-start gap-3 rounded-md border border-green-500/40 bg-green-500/10 p-4">
        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
        <div>
          <p className="font-medium">Request received.</p>
          <p className="text-sm text-foreground/70 mt-1">
            Our enterprise team will be in touch within 24 hours.
          </p>
        </div>
      </div>
    );
  }

  const submitting = status.kind === 'submitting';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" name="firstName" required placeholder="John" className="glass" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" name="lastName" required placeholder="Smith" className="glass" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Business Email *</Label>
        <Input id="email" name="email" type="email" required placeholder="john.smith@company.com" className="glass" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 123-4567" className="glass" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company Name *</Label>
          <Input id="company" name="company" required placeholder="Acme Corporation" className="glass" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job Title *</Label>
          <Input id="jobTitle" name="jobTitle" required placeholder="CTO" className="glass" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companySize">Company Size *</Label>
          <select id="companySize" name="companySize" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm glass">
            <option value="">Select company size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-1000">201-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry *</Label>
          <select id="industry" name="industry" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm glass">
            <option value="">Select industry</option>
            <option value="financial-services">Financial Services</option>
            <option value="healthcare">Healthcare</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="technology">Technology</option>
            <option value="government">Government</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="useCase">Primary Use Case *</Label>
        <select id="useCase" name="useCase" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm glass">
          <option value="">Select primary use case</option>
          <option value="ai-agent-security">AI Agent Security</option>
          <option value="multi-party-collaboration">Multi-Party Collaboration</option>
          <option value="compliance-automation">Compliance Automation</option>
          <option value="quantum-safe-migration">Quantum-Safe Migration</option>
          <option value="custom-integration">Custom Integration</option>
          <option value="evaluation">General Evaluation</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agentCount">Expected Number of Agents</Label>
        <select id="agentCount" name="agentCount" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm glass">
          <option value="">Select agent count</option>
          <option value="10-50">10-50 agents</option>
          <option value="51-200">51-200 agents</option>
          <option value="201-1000">201-1000 agents</option>
          <option value="1000+">1000+ agents</option>
          <option value="unknown">Not sure yet</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeline">Implementation Timeline</Label>
        <select id="timeline" name="timeline" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm glass">
          <option value="">Select timeline</option>
          <option value="immediate">Immediate (within 30 days)</option>
          <option value="3-months">3 months</option>
          <option value="6-months">6 months</option>
          <option value="12-months">12 months</option>
          <option value="evaluating">Just evaluating</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Additional Information</Label>
        <Textarea id="message" name="message" placeholder="Tell us about your specific security requirements, compliance needs, or any questions you have..." rows={4} className="glass" />
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <input type="checkbox" id="consent" name="consent" required className="mt-1" />
          <Label htmlFor="consent" className="text-sm text-foreground/70 leading-relaxed">
            I agree to receive communications from Sovr INC regarding Agent Trust Protocol™ enterprise solutions.
            We respect your privacy and will never share your information.
          </Label>
        </div>

        {status.kind === 'error' && (
          <div className="flex items-start gap-3 rounded-md border border-red-500/40 bg-red-500/10 p-3">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
            <p className="text-sm">{status.message}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-[hsl(var(--atp-quantum))] to-[hsl(var(--atp-primary))] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 h-14 text-lg font-semibold disabled:opacity-60 disabled:hover:scale-100"
        >
          <Calendar className="h-5 w-5 mr-3" />
          {submitting ? 'Sending…' : 'Request Enterprise Demo'}
        </Button>
      </div>
    </form>
  );
}
