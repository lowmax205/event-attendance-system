import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Contract: render an array of metric cards
// Props: items: Array<{ label: string, value: React.ReactNode, icon?: React.ElementType, hint?: string }>
export default function MetricsCards({ items, columns = { md: 2, lg: 4 } }) {
  const md = columns.md ?? 2;
  const lg = columns.lg ?? 4;
  const gridCls = `grid gap-4 md:grid-cols-${md} lg:grid-cols-${lg}`;
  return (
    <div className={gridCls}>
      {items.map((it, idx) => (
        <Card key={idx}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>{it.label}</CardTitle>
            {it.icon ? <it.icon className='text-muted-foreground h-4 w-4' /> : null}
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{it.value}</div>
            {it.hint ? <p className='text-muted-foreground text-xs'>{it.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
