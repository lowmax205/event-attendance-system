import { CalendarIcon } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDateTimeLocal } from '@/lib/formatting';

// Contract: Controlled date-time picker with calendar + time input + quick actions
// Props:
// - label: string
// - value: string | '' (datetime-local string)
// - onChange: (val: string) => void
// - open: boolean
// - onOpenChange: (open: boolean) => void
// - placeholder?: string
// - nowLabel?: string (button label for quick set)
// - nowFn?: () => Date (produce date for quick set)
// - showClear?: boolean (default true)
// - doneLabel?: string (default 'Done')
export default function DateTimePicker({
  label,
  value,
  onChange,
  open,
  onOpenChange,
  placeholder = 'Select date & time',
  nowLabel = 'Now',
  nowFn = () => new Date(),
  showClear = true,
  doneLabel = 'Done',
}) {
  const selectedDate = value ? new Date(value) : undefined;

  return (
    <div className='space-y-2'>
      {label ? <Label className='text-muted-foreground'>{label}</Label> : null}
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button variant='outline' className='w-full justify-start text-left font-normal'>
            <CalendarIcon className='mr-2 h-4 w-4' />
            {value ? new Date(value).toLocaleString() : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <div className='space-y-3 p-3'>
            <CalendarComponent
              mode='single'
              selected={selectedDate}
              onSelect={(date) => {
                if (!date) return;
                const base = selectedDate || new Date();
                date.setHours(base.getHours());
                date.setMinutes(base.getMinutes());
                onChange(formatDateTimeLocal(date));
              }}
              initialFocus
            />
            <div className='flex items-center space-x-2'>
              <Input
                type='time'
                value={selectedDate ? selectedDate.toTimeString().slice(0, 5) : ''}
                onChange={(e) => {
                  const timeValue = e.target.value;
                  if (timeValue) {
                    const date = selectedDate || new Date();
                    const [hours, minutes] = timeValue.split(':');
                    date.setHours(parseInt(hours, 10));
                    date.setMinutes(parseInt(minutes, 10));
                    onChange(formatDateTimeLocal(date));
                  }
                }}
                className='flex-1'
              />
              <Button size='sm' onClick={() => onChange(formatDateTimeLocal(nowFn()))}>
                {nowLabel}
              </Button>
              {showClear && (
                <Button size='sm' variant='outline' onClick={() => onChange('')}>
                  Clear
                </Button>
              )}
              <Button size='sm' variant='secondary' onClick={() => onOpenChange(false)}>
                {doneLabel}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
