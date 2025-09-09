import { Lock } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Reusable AccessDenied component
// Use when authenticated user lacks required permission/role.
// Unauthenticated users should be redirected before rendering this component.
const AccessDenied = ({
  title = 'Access Denied',
  message = 'You do not have permission to view this page.',
  actionLabel = 'Go Home',
  redirectTo = '/',
  showIcon = true,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className='flex h-screen items-center justify-center p-6'>
      <div className='max-w-md text-center'>
        {showIcon && (
          <div className='bg-destructive/10 text-destructive mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full'>
            <Lock className='h-8 w-8' />
          </div>
        )}
        <h2 className='mb-3 text-3xl font-bold tracking-tight'>{title}</h2>
        <p className='text-muted-foreground mb-6 leading-relaxed'>{message}</p>
        {children}
        <div className='flex items-center justify-center gap-3'>
          <Button onClick={() => navigate(redirectTo, { replace: true })}>{actionLabel}</Button>
        </div>
      </div>
    </div>
  );
};

export { AccessDenied };
export default AccessDenied;
