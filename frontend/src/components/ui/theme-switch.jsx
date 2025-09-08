import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeSwitch({
  variant = 'icon-click',
  modes = ['light', 'dark', 'system'],
  icons = [],
  className,
  size = 'sm',
  ...props
}) {
  // Filter out non-DOM props so they don't get forwarded to the underlying button element
  const { showInactiveIcons: _showInactiveIcons, ...restProps } = props;
  console.log(_showInactiveIcons);
  const getStoredMode = () => localStorage.getItem('themeMode') || 'system';
  const prefersDark = () =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const [mode, setMode] = useState(getStoredMode);
  const [isDark, setIsDark] = useState(() => {
    const stored = getStoredMode();
    if (stored === 'light') return false;
    if (stored === 'dark') return true;
    return prefersDark();
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    if (mode === 'light') setIsDark(false);
    else if (mode === 'dark') setIsDark(true);
    else setIsDark(prefersDark());
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDark(e.matches);
    try {
      mql.addEventListener('change', handler);
    } catch {
      mql.addListener(handler);
    }
    return () => {
      try {
        mql.removeEventListener('change', handler);
      } catch {
        mql.removeListener(handler);
      }
    };
  }, [mode]);

  const cycleMode = () => {
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
  };

  const getCurrentModeIndex = () => modes.indexOf(mode);
  const currentIcon = icons[getCurrentModeIndex()] || null;
  const title = `Theme: ${mode === 'system' ? `System (${isDark ? 'Dark' : 'Light'})` : mode}`;

  if (variant === 'icon-click') {
    return (
      <Button
        variant='outline'
        size={size}
        onClick={cycleMode}
        aria-label='Toggle theme mode'
        title={title}
        className={cn(
          'border-secondary/30 hover:border-secondary/50 hover:bg-background/30 hover:text-background bg-card/80 px-3 transition-all duration-200',
          'focus:ring-primary/20 p-5 focus:ring-2 focus:outline-none',
          'dark:border-primary/30 dark:hover:border-primary/50 dark:hover:bg-foreground/30 dark:hover:text-foreground dark:bg-card/80',
          className,
        )}
        {...restProps}
      >
        {currentIcon}
      </Button>
    );
  }
  // Add other variants here if needed in the future
  return (
    <Button
      variant='outline'
      size={size}
      onClick={cycleMode}
      aria-label='Toggle theme mode'
      title={title}
      className={cn(
        'border-secondary/30 hover:border-secondary/50 hover:bg-background/30 hover:text-background bg-card/80 px-3 transition-all duration-200',
        'focus:ring-primary/20 focus:ring-2 focus:outline-none',
        'dark:border-primary/30 dark:hover:border-primary/50 dark:hover:bg-foreground/30 dark:hover:text-foreground dark:bg-card/80',
      )}
      {...restProps}
    >
      {currentIcon}
    </Button>
  );
}
