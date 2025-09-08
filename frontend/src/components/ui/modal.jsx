import { X } from 'lucide-react';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { cn } from '@/lib/utils';

/**
 * Modal Component
 *
 * Features:
 * - Responsive font sizes
 * - Scroll area with custom scrollbar
 * - Background scroll lock
 * - ESC key to close
 * - Disabled outside click
 * - Close button
 * - Reusable for any content
 */
export function Modal({
  open = false,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'default', // 'sm', 'default', 'lg', 'xl', 'full'
  disableOutsideClick = true,
  showCloseButton = true,
  enableScrollLock = true,
  className,
  ...props
}) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && open) {
        onOpenChange?.(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);

      // Add scroll lock to body
      if (enableScrollLock) {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = 'var(--removed-body-scroll-bar-size, 0px)';
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Remove scroll lock
      if (enableScrollLock) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
  }, [open, onOpenChange, enableScrollLock]);

  // Size variants for responsive design
  const sizeClasses = {
    sm: 'max-w-sm',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  // Font size classes that scale with screen size
  const responsiveFontClasses = {
    title: 'text-lg sm:text-xl lg:text-2xl font-semibold leading-tight',
    description: 'text-sm sm:text-base text-muted-foreground',
    content: 'text-sm sm:text-base',
  };

  const handleInteractOutside = (event) => {
    if (disableOutsideClick) {
      event.preventDefault();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'overflow-hidden p-0',
          sizeClasses[size],
          // Responsive padding and mobile optimizations
          'w-[95vw] sm:w-full',
          // Mobile viewport fixes for better scrolling
          'max-h-[90vh] sm:max-h-[90vh]',
          // Ensure proper touch scrolling on mobile
          'touch-pan-y',
          // Responsive height for large content
          size === 'full' && 'h-[95vh]',
          className,
        )}
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={() => {
          // Let the ESC key work
          onOpenChange?.(false);
        }}
        showCloseButton={false} // We'll add our own
        {...props}
      >
        <div
          className={cn('flex h-full flex-col', size === 'full' ? 'max-h-[95vh]' : 'max-h-[90vh]')}
        >
          {/* Always provide a DialogTitle for accessibility */}
          {!title && !(title || description || showCloseButton) && (
            <VisuallyHidden>
              <DialogTitle>Modal</DialogTitle>
            </VisuallyHidden>
          )}

          {/* Header */}
          {(title || description || showCloseButton) && (
            <div className='border-border flex-shrink-0 border-b p-4 sm:p-6'>
              <div className='flex items-start justify-between'>
                <DialogHeader className='flex-1 text-left'>
                  {title ? (
                    <DialogTitle className={responsiveFontClasses.title}>{title}</DialogTitle>
                  ) : (
                    <VisuallyHidden>
                      <DialogTitle>Modal</DialogTitle>
                    </VisuallyHidden>
                  )}
                  {description && (
                    <DialogDescription className={responsiveFontClasses.description}>
                      {description}
                    </DialogDescription>
                  )}
                </DialogHeader>

                {showCloseButton && (
                  <DialogClose asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='ml-4 h-8 w-8 rounded-full p-0 opacity-70 hover:opacity-100 focus-visible:ring-2'
                      aria-label='Close modal'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </DialogClose>
                )}
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className='flex-1 overflow-hidden'>
            <ScrollArea className={cn('h-full px-4 py-4 sm:px-6', responsiveFontClasses.content)}>
              <div className='space-y-4 pb-4'>{children}</div>
            </ScrollArea>
          </div>

          {/* Footer */}
          {footer && (
            <div className='border-border flex-shrink-0 border-t p-4 sm:p-6'>
              <DialogFooter className='gap-2 sm:gap-3'>{footer}</DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Quick modal variants for common use cases
 */

// Confirmation Modal
export function ConfirmationModal({
  open,
  onOpenChange,
  title = 'Confirm Action',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default', // 'default', 'destructive'
  loading = false,
  ...props
}) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size='sm'
      footer={
        <>
          <Button variant='outline' onClick={handleCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Loading...' : confirmText}
          </Button>
        </>
      }
      {...props}
    />
  );
}

// Information Modal
export function InfoModal({
  open,
  onOpenChange,
  title,
  children,
  actionText = 'OK',
  onAction,
  ...props
}) {
  const handleAction = () => {
    onAction?.();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <Button onClick={handleAction} className='w-full sm:w-auto'>
          {actionText}
        </Button>
      }
      {...props}
    >
      {children}
    </Modal>
  );
}

export default Modal;
