import { Eye, EyeOff, Lock } from 'lucide-react';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Reusable password field with show/hide toggle eye icon that adapts to light/dark.
export function PasswordField({ id, label, value, onChange, autoComplete = 'new-password' }) {
  const [show, setShow] = useState(false);
  return (
    <div className='grid gap-2'>
      <Label htmlFor={id}>{label}</Label>
      <div className='relative'>
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-no-native-toggle
          className='appearance-none pr-9 pl-8'
        />
        <Lock className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 my-auto ml-2 h-4 w-4' />
        <button
          type='button'
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/70 absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-md transition-colors'
        >
          {show ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
        </button>
      </div>
    </div>
  );
}

export function FieldWithIcon({
  id,
  label,
  type = 'text',
  icon: Icon,
  value,
  onChange,
  autoComplete,
}) {
  return (
    <div className='grid gap-2'>
      <Label htmlFor={id}>{label}</Label>
      <div className='relative'>
        <Input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='pl-8'
          required
        />
        {Icon && (
          <Icon className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 my-auto ml-2 h-4 w-4' />
        )}
      </div>
    </div>
  );
}
