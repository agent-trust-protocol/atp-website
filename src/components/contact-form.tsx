'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  inquiryType: string;
  message: string;
}

const initialFormData: ContactFormData = {
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  inquiryType: '',
  message: ''
};

export function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const onChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const payload = await response.json();

      if (!response.ok) {
        setResult({ type: 'error', message: payload.message || 'Failed to send message. Please try again.' });
        return;
      }

      setResult({ type: 'success', message: payload.message || 'Message sent successfully.' });
      setFormData(initialFormData);
    } catch {
      setResult({ type: 'error', message: 'Something went wrong. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" value={formData.firstName} onChange={(e) => onChange('firstName', e.target.value)} placeholder="John" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" value={formData.lastName} onChange={(e) => onChange('lastName', e.target.value)} placeholder="Doe" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" value={formData.email} onChange={(e) => onChange('email', e.target.value)} placeholder="john.doe@company.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input id="company" value={formData.company} onChange={(e) => onChange('company', e.target.value)} placeholder="Your Company Inc." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="inquiryType">Inquiry Type</Label>
        <select
          id="inquiryType"
          name="inquiryType"
          value={formData.inquiryType}
          onChange={(e) => onChange('inquiryType', e.target.value)}
          aria-label="Select inquiry type"
          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">Select an option</option>
          <option value="enterprise">Enterprise Sales</option>
          <option value="technical">Technical Support</option>
          <option value="partnership">Partnership</option>
          <option value="demo">Request Demo</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => onChange('message', e.target.value)}
          placeholder="Tell us about your AI security needs, deployment plans, or any questions you have..."
          rows={4}
          required
        />
      </div>

      {result && (
        <p className={`text-sm ${result.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
        </p>
      )}

      <Button disabled={isSubmitting} className="w-full bg-gradient-to-r from-[hsl(var(--atp-quantum))] to-[hsl(var(--atp-primary))] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 h-14 px-8 text-lg font-semibold">
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
