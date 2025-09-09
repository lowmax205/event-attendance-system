import { AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

// Contract: standard error panel with icon, message and optional retry button
// Props: { message: string, onRetry?: () => void, retryLabel?: string }
export default function ErrorState({ message, onRetry, retryLabel = 'Retry' }) {
  return (
    <div className='flex h-64 items-center justify-center'>
      <div className='text-center'>
        <AlertCircle className='text-destructive mx-auto h-8 w-8' />
        <p className='text-destructive mt-2'>{message}</p>
        {onRetry ? (
          <Button onClick={onRetry} variant='outline' className='mt-4'>
            <RefreshCw className='mr-2 h-4 w-4' />
            {retryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
