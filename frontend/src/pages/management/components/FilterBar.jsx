import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Contract: search + select(s) + sort controls
// Props:
// - search: { value, placeholder, onChange }
// - selects: Array<{ value, onChange, items: Array<{value,label}>, placeholder, className? }>
// - sort: { direction, onToggleDirection, field, onFieldChange, fields: Array<{value,label}>, compact?: boolean }
// - clear?: { show: boolean, onClear }
// - leftExtra?: ReactNode
// - rightExtra?: ReactNode
export default function FilterBar({ search, selects = [], sort, clear, rightExtra }) {
  return (
    <div className='flex flex-col gap-4 md:flex-row md:items-center'>
      <div className='relative flex-1'>
        {search?.icon}
        <Input
          placeholder={search?.placeholder || 'Search...'}
          value={search?.value || ''}
          onChange={(e) => search?.onChange?.(e.target.value)}
          className={search?.icon ? 'pl-10' : undefined}
        />
      </div>

      {selects.map((s, idx) => (
        <Select key={idx} value={s.value} onValueChange={s.onChange}>
          <SelectTrigger className={s.className || 'w-full md:w-48'}>
            <SelectValue placeholder={s.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {s.items.map((it) => (
              <SelectItem key={it.value} value={it.value}>
                {it.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {sort && (
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={sort.onToggleDirection}
            className='bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring rounded-md border p-2 focus-visible:ring-2 focus-visible:outline-none'
            title={`Toggle sort order (${sort.direction === 'asc' ? 'Ascending' : 'Descending'})`}
            aria-label='Toggle sort order'
          >
            {sort.icon}
          </button>
          <Select value={sort.field} onValueChange={sort.onFieldChange}>
            <SelectTrigger className='w-full md:w-48' aria-label='Select sort field'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              {sort.fields.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {clear?.show && (
        <Button onClick={clear.onClear} variant='outline'>
          Clear Filters
        </Button>
      )}

      {rightExtra}
    </div>
  );
}
