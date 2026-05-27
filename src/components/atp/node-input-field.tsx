'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export interface NodeInputSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  required?: boolean;
  description?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
  };
}

interface Props {
  field: NodeInputSchema;
  value: unknown;
  onChange: (next: unknown) => void;
}

const MULTILINE_NAMES = new Set(['context', 'rules', 'actions', 'definition', 'payload', 'body']);

export function NodeInputField({ field, value, onChange }: Props) {
  const id = `node-input-${field.name}`;
  const label = (
    <Label htmlFor={id} className="text-sm font-medium">
      {field.name}
      {field.required && <span className="text-red-600 ml-1">*</span>}
    </Label>
  );
  const help = field.description ? (
    <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
  ) : null;

  if (field.type === 'string' && field.validation?.enum?.length) {
    return (
      <div>
        {label}
        <Select value={(value as string) ?? ''} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={id}>
            <SelectValue placeholder={`Select ${field.name}`} />
          </SelectTrigger>
          <SelectContent>
            {field.validation.enum.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {help}
      </div>
    );
  }

  if (field.type === 'string') {
    const multiline = MULTILINE_NAMES.has(field.name);
    return (
      <div>
        {label}
        {multiline ? (
          <Textarea
            id={id}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
          />
        ) : (
          <Input
            id={id}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {help}
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div>
        {label}
        <Input
          id={id}
          type="number"
          value={value == null ? '' : String(value)}
          min={field.validation?.min}
          max={field.validation?.max}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
        {help}
      </div>
    );
  }

  if (field.type === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        {label}
        <Switch checked={Boolean(value)} onCheckedChange={(c) => onChange(c)} />
      </div>
    );
  }

  // object | array | any → JSON textarea with parse-on-blur
  return <JsonField id={id} labelEl={label} helpEl={help} value={value} onChange={onChange} />;
}

function JsonField({
  id,
  labelEl,
  helpEl,
  value,
  onChange
}: {
  id: string;
  labelEl: React.ReactNode;
  helpEl: React.ReactNode;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const [text, setText] = useState<string>(value == null ? '' : JSON.stringify(value, null, 2));
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      {labelEl}
      <Textarea
        id={id}
        value={text}
        rows={4}
        onChange={(e) => {
          setText(e.target.value);
          setErr(null);
        }}
        onBlur={() => {
          if (text.trim() === '') {
            onChange(undefined);
            return;
          }
          try {
            onChange(JSON.parse(text));
            setErr(null);
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Invalid JSON');
          }
        }}
        className={err ? 'border-red-500' : undefined}
        placeholder='{ "key": "value" }'
      />
      {err ? <p className="text-xs text-red-600 mt-1">{err}</p> : helpEl}
    </div>
  );
}
