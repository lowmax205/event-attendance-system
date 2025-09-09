import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const loadingVariants = cva(
  'animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        default: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
      },
      variant: {
        default: 'text-current',
        primary: 'text-primary',
        secondary: 'text-secondary',
        muted: 'text-muted-foreground',
        white: 'text-white',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  },
);

const Spinner = React.forwardRef(({ className, size, variant, ...props }, ref) => {
  return <div ref={ref} className={cn(loadingVariants({ size, variant }), className)} {...props} />;
});
Spinner.displayName = 'Spinner';

const LoadingButton = React.forwardRef(
  (
    {
      children,
      loading = false,
      loadingText = 'Loading...',
      spinnerSize = 'sm',
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button ref={ref} className={className} disabled={disabled || loading} {...props}>
        {loading ? (
          <div className='flex items-center justify-center gap-2'>
            <Spinner size={spinnerSize} variant='white' />
            {loadingText}
          </div>
        ) : (
          children
        )}
      </button>
    );
  },
);
LoadingButton.displayName = 'LoadingButton';

const LoadingScreen = ({ message = 'Loading...', size = 'xl', className, ...props }) => {
  return (
    <div
      className={cn(
        'bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      <div className='flex flex-col items-center gap-4'>
        <Spinner size={size} variant='primary' />
        <p className='text-muted-foreground text-sm'>{message}</p>
      </div>
    </div>
  );
};

const LoadingModal = ({
  open = false,
  message = 'Loading...',
  size = 'lg',
  className,
  ...props
}) => {
  if (!open) return null;

  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-center justify-center bg-black/50', className)}
      {...props}
    >
      <div className='bg-card rounded-lg p-6 shadow-lg'>
        <div className='flex flex-col items-center gap-4'>
          <Spinner size={size} variant='primary' />
          <p className='text-card-foreground text-sm'>{message}</p>
        </div>
      </div>
    </div>
  );
};

const LoadingDots = ({ className, ...props }) => {
  return (
    <div className={cn('flex items-center gap-1', className)} {...props}>
      <div className='h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]' />
      <div className='h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]' />
      <div className='h-2 w-2 animate-bounce rounded-full bg-current' />
    </div>
  );
};

const LoadingPulse = ({ className, children, ...props }) => {
  return (
    <div className={cn('animate-pulse', className)} {...props}>
      {children}
    </div>
  );
};

export {
  Spinner,
  LoadingButton,
  LoadingScreen,
  LoadingModal,
  LoadingDots,
  LoadingPulse,
  loadingVariants,
};
