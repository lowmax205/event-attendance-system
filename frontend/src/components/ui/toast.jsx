'use client';
import { cva } from 'class-variance-authority';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';

class ToastManager {
  toasts = [];
  listeners = new Set();

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  add(props) {
    const id = props.id || Math.random().toString(36).substr(2, 9);

    const existingIndex = this.toasts.findIndex((toast) => toast.id === id);
    if (existingIndex !== -1) {
      this.toasts[existingIndex] = { ...this.toasts[existingIndex], ...props, id };
      this.notify();
      return id;
    }

    const newToast = {
      ...props,
      id,
      timestamp: Date.now(),
    };

    this.toasts = [newToast, ...this.toasts];

    if (this.toasts.length > 10) {
      this.toasts = this.toasts.slice(0, 10);
    }

    this.notify();
    return id;
  }

  update(id, props) {
    const index = this.toasts.findIndex((toast) => toast.id === id);
    if (index !== -1) {
      this.toasts[index] = { ...this.toasts[index], ...props };
      this.notify();
    }
  }

  remove(id) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  getToasts() {
    return [...this.toasts];
  }
}

const toastManager = new ToastManager();

export function toast(messageOrOptions, options) {
  let toastProps;

  if (typeof messageOrOptions === 'string') {
    toastProps = {
      title: messageOrOptions,
      ...options,
    };
  } else {
    toastProps = messageOrOptions;
  }

  return toastManager.add(toastProps);
}

toast.success = (message, options) => toast({ title: message, variant: 'success', ...options });

toast.error = (message, options) => toast({ title: message, variant: 'destructive', ...options });

toast.warning = (message, options) => toast({ title: message, variant: 'warning', ...options });

toast.info = (message, options) => toast({ title: message, variant: 'info', ...options });

toast.delete = (message, options) => toast({ title: message, variant: 'destructive', ...options });

toast.update = (message, options) => toast({ title: message, variant: 'info', ...options });

toast.loading = (message, options) =>
  toast({ title: message, variant: 'loading', duration: Infinity, ...options });

toast.promise = (promise, options) => {
  const id = toast.loading(options.loading || 'Loading...');

  promise
    .then((data) => {
      toastManager.update(id, {
        title: options.success || 'Success!',
        description: options.successDescription,
        variant: 'success',
        duration: options.successDuration || 5000,
      });
      return data;
    })
    .catch((error) => {
      toastManager.update(id, {
        title: options.error || 'Error occurred',
        description: options.errorDescription || error?.message,
        variant: 'destructive',
        duration: options.errorDuration || 5000,
      });
      throw error;
    });

  return promise;
};

toast.dismiss = (id) => {
  if (id) {
    toastManager.remove(id);
  } else {
    toastManager.clear();
  }
};

// Additional convenience methods for common use cases
toast.custom = (component, options) => toast({ title: component, ...options });

toast.message = (title, options) => toast({ title, variant: 'default', ...options });

// Bulk actions
toast.dismissAll = () => {
  toastManager.clear();
};

const toastVariants = cva(
  'toast-base fixed z-[100] pointer-events-auto relative w-[calc(100%-2rem)] max-w-sm min-h-[5rem] rounded-lg border px-4 py-4 pr-8 shadow-lg text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border border-border',
        success:
          'bg-green-100 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-50 dark:border-green-800 [&>svg]:text-green-600 dark:[&>svg]:text-green-400',
        destructive:
          'bg-red-100 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-50 dark:border-red-800 [&>svg]:text-red-600 dark:[&>svg]:text-red-400',
        warning:
          'bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-50 dark:border-yellow-800 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400',
        info: 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-50 dark:border-blue-800 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400',
        loading:
          'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-50 dark:border-blue-800 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400',
      },
      position: {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      position: 'top-right',
    },
  },
);

const ToastIcons = {
  success: <CheckCircle className='h-4 w-4' />,
  destructive: <AlertCircle className='h-4 w-4' />,
  warning: <AlertCircle className='h-4 w-4' />,
  info: <Info className='h-4 w-4' />,
  loading: (
    <div className='relative h-4 w-4'>
      <motion.div
        className='absolute inset-0 bg-current shadow-[0_0_4px_currentColor]'
        animate={{ rotateX: [0, 180, 0], rotateY: [0, 180, 0] }}
        transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
      />
    </div>
  ),
};

const ToastComponent = ({
  title,
  description,
  variant = 'default',
  position = 'top-right',
  duration = 5000,
  onClose,
  action,
  cancel,
  stackIndex = 0,
  isVisible = true,
  isStacked = false,
  isHovered = false,
  stackDirection = 'down',
  isExiting = false,
  totalCount = 1,
  timestamp,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const toastRef = useRef(null);
  const closeButtonRef = useRef(null);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const isTouchAction = useRef(false);

  const handleClose = useCallback(
    (e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      onClose?.();
    },
    [onClose],
  );

  const handleTouchStart = useCallback((e) => {
    if (e.target instanceof Element) {
      if (closeButtonRef.current?.contains(e.target) || e.target.closest('button[role="button"]')) {
        isTouchAction.current = true;
        return;
      }
    }

    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;

    startX.current = clientX;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (isTouchAction.current || !isDragging.current || !toastRef.current) return;

      e.stopPropagation();
      e.preventDefault();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const diff = clientX - startX.current;

      if (position.includes('right') && diff > 0) {
        setTranslateX(diff);
      } else if (position.includes('left') && diff < 0) {
        setTranslateX(diff);
      }
    },
    [position],
  );

  const handleTouchEnd = useCallback(
    (e) => {
      if (isTouchAction.current) {
        isTouchAction.current = false;
        return;
      }

      if (!isDragging.current || !toastRef.current) return;

      e.stopPropagation();

      const toastWidth = toastRef.current.offsetWidth;
      const swipeThreshold = toastWidth * 0.3;

      if (Math.abs(translateX) >= swipeThreshold) {
        handleClose();
      } else {
        setTranslateX(0);
      }

      isDragging.current = false;
    },
    [translateX, handleClose],
  );

  useEffect(() => {
    let timer;
    if (!isHovered && duration !== Infinity && duration > 0 && !isExiting) {
      timer = setTimeout(() => {
        handleClose();
      }, duration);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [duration, isHovered, handleClose, isExiting]);

  useEffect(() => {
    const currentRef = toastRef.current;
    if (currentRef) {
      const touchStartOptions = { passive: false };

      currentRef.addEventListener('touchstart', handleTouchStart, touchStartOptions);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);

      currentRef.addEventListener('mousedown', handleTouchStart);
      window.addEventListener('mousemove', handleTouchMove);
      window.addEventListener('mouseup', handleTouchEnd);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);

        currentRef.removeEventListener('mousedown', handleTouchStart);
        window.removeEventListener('mousemove', handleTouchMove);
        window.removeEventListener('mouseup', handleTouchEnd);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!isVisible) return null;

  const getTransform = () => {
    if (isStacked && stackIndex > 0) {
      const offset = stackIndex * 8;
      const scale = Math.max(0.85, 1 - stackIndex * 0.05);

      if (stackDirection === 'up') {
        return `translateX(${translateX}px) translateY(-${offset}px) scale(${scale})`;
      } else {
        return `translateX(${translateX}px) translateY(${offset}px) scale(${scale})`;
      }
    } else if (!isStacked && stackIndex > 0) {
      const expandedOffset = stackIndex * 88;

      if (stackDirection === 'up') {
        return `translateX(${translateX}px) translateY(-${expandedOffset}px)`;
      } else {
        return `translateX(${translateX}px) translateY(${expandedOffset}px)`;
      }
    }

    return `translateX(${translateX}px)`;
  };

  const getOpacity = () => {
    if (translateX !== 0) {
      return Math.max(0.3, 1 - Math.abs(translateX) / (toastRef.current?.offsetWidth || 320));
    }

    if (isStacked && stackIndex >= 3) {
      return 0.4;
    }

    return 1;
  };

  const getZIndex = () => {
    return 1100 - stackIndex;
  };

  const renderAction = () => {
    if (!action) return null;

    if (React.isValidElement(action)) {
      const actionElement = action;
      return (
        <div className='ml-2 flex-shrink-0'>
          {React.cloneElement(actionElement, {
            onClick: (e) => {
              e.stopPropagation();
              if (actionElement.props.onClick) {
                actionElement.props.onClick(e);
              }
              handleClose();
            },
          })}
        </div>
      );
    }

    if (typeof action === 'object' && action !== null && 'label' in action && 'onClick' in action) {
      const actionObj = action;
      return (
        <div className='ml-2 flex-shrink-0'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              actionObj.onClick();
              handleClose();
            }}
            className='bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1 text-xs font-medium transition-colors'
          >
            {actionObj.label}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      ref={toastRef}
      role='alert'
      aria-live='polite'
      className={toastVariants({ variant, position })}
      initial={{
        x: position.includes('right') ? 400 : -400,
        y: position.includes('top') ? -100 : 100,
        opacity: 0,
        scale: 0.9,
      }}
      animate={{
        x: 0,
        y: 0,
        opacity: getOpacity(),
        scale: isStacked && stackIndex > 0 ? Math.max(0.85, 1 - stackIndex * 0.05) : 1,
        transform: getTransform(),
      }}
      exit={{
        x: position.includes('right') ? 400 : -400,
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.2, ease: 'easeIn' },
      }}
      transition={{
        type: 'spring',
        damping: 30,
        stiffness: 400,
        duration: 0.3,
      }}
      style={{
        zIndex: getZIndex(),
        pointerEvents: 'auto',
      }}
    >
      {variant !== 'default' && ToastIcons[variant]}
      <div className='flex min-h-[calc(5rem-2rem)] flex-col justify-center'>
        {title && (
          <div className='leading-tight font-medium tracking-tight break-words'>{title}</div>
        )}
        {description && (
          <div className='mt-1 text-sm break-words [&_p]:leading-relaxed'>{description}</div>
        )}
        <div className='mt-2 text-xs break-words opacity-60'>
          {formatTimestamp(timestamp || Date.now())}
        </div>
      </div>
      {isStacked && stackIndex === 0 && totalCount > 3 && (
        <motion.div
          className='bg-muted-foreground text-muted absolute -top-1 -right-1 z-20 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium'
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          +{totalCount - 3}
        </motion.div>
      )}
      {renderAction()}
      {cancel && (
        <div className='ml-2 flex-shrink-0'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              cancel.onClick();
              handleClose();
            }}
            className='bg-muted text-muted-foreground hover:bg-muted/80 rounded px-3 py-1 text-xs font-medium transition-colors'
          >
            {cancel.label}
          </button>
        </div>
      )}
      <button
        ref={closeButtonRef}
        onClick={handleClose}
        className='hover:bg-opacity-10 absolute top-2 right-2 z-10 rounded-full p-1 transition-opacity hover:bg-black hover:opacity-75'
        aria-label='Close'
      >
        <X className='h-4 w-4' />
      </button>
    </motion.div>
  );
};

const ToastStack = ({ toasts, position, onRemoveToast }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isTapped, setIsTapped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    setIsHovered(true);
  }, [isMobile]);

  const handleMouseLeave = useCallback(
    (e) => {
      if (isMobile) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const { clientX, clientY } = e;

      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return;
      }

      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
        hoverTimeoutRef.current = null;
      }, 150);
    },
    [isMobile],
  );

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleRemoveToast = useCallback(
    (id) => {
      const toastToRemove = toasts.find((t) => t.id === id);
      if (
        toastToRemove &&
        toasts.filter((t) => t.position === toastToRemove.position).length === 1
      ) {
        setIsHovered(false);
        setIsTapped(false);
      }
      onRemoveToast(id);
    },
    [toasts, onRemoveToast],
  );

  const handleStackInteraction = () => {
    if (isMobile) {
      setIsTapped(!isTapped);
    }
  };

  const getVisibleToasts = () => {
    const maxVisible = 3;
    const shouldStack = toasts.length > 1;
    const isExpanded = isMobile ? isTapped : isHovered;

    if (shouldStack && !isExpanded) {
      return toasts.slice(0, maxVisible);
    }

    return toasts.slice(0, maxVisible);
  };

  const visibleToasts = getVisibleToasts();

  const getStackDirection = (pos) => {
    return pos.includes('bottom') ? 'up' : 'down';
  };

  const stackDirection = getStackDirection(position);
  const shouldStack = toasts.length > 1;
  const isExpanded = isMobile ? isTapped : isHovered;

  if (toasts.length === 0) return null;

  return (
    <div
      className='pointer-events-none fixed z-[100]'
      style={{
        [position.includes('top') ? 'top' : 'bottom']: '1rem',
        [position.includes('right') ? 'right' : 'left']: '1rem',
      }}
    >
      <div
        className='pointer-events-auto'
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleStackInteraction}
      >
        <AnimatePresence mode='popLayout'>
          {visibleToasts.map((toastProps, index) => (
            <ToastComponent
              key={toastProps.id}
              {...toastProps}
              stackIndex={index}
              isVisible={true}
              isStacked={shouldStack && !isExpanded}
              isHovered={isHovered || isTapped}
              stackDirection={stackDirection}
              totalCount={toasts.length}
              timestamp={toastProps.timestamp}
              onClose={() => handleRemoveToast(toastProps.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export function ToastContainer() {
  const [toasts, setToasts] = useState(toastManager.getToasts());

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleRemoveToast = useCallback((id) => {
    toastManager.remove(id);
  }, []);

  const toastsByPosition = toasts.reduce((acc, toast) => {
    const position = toast.position || 'top-right';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(toast);
    return acc;
  }, {});

  if (toasts.length === 0) return null;

  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <ToastStack
          key={position}
          toasts={positionToasts}
          position={position}
          onRemoveToast={handleRemoveToast}
        />
      ))}
    </>
  );
}

export const useToast = () => {
  return { toast };
};

export const ToastProvider = ({ children }) => {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
};

export default ToastComponent;
