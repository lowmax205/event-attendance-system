import React from 'react';
// no imports from ui needed here; actions provided via children

// Contract: Render a title, subtitle, and optional right-aligned actions
// Props: { title: string, subtitle?: string, children?: ReactNode } children rendered at right side (actions)
export default function ManagementHeader({ title, subtitle, children }) {
  return (
    <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
      <div>
        <h2 className='text-2xl font-bold'>{title}</h2>
        {subtitle ? <p className='text-muted-foreground'>{subtitle}</p> : null}
      </div>
      {children ? <div className='flex gap-2'>{children}</div> : null}
    </div>
  );
}
