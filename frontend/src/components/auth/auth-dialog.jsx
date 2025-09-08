import SNSULogo from '@assets/images/SNSU-Logo.jpg';
import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import LoginForm from './login-form';
import RegisterForm from './register-form';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// AuthDialog: central auth modal with tabs for Login/Register
export function AuthDialog({
  open,
  onOpenChange,
  forced = false,
  onAuthSuccess,
  showDemoAccounts = true,
}) {
  const [tab, setTab] = useState('login');
  const [demoCredentials, setDemoCredentials] = useState({});
  const mockAccounts = [
    { email: 'admin@snsu.edu.ph', password: 'AdminPass123!' },
    { email: 'student@snsu.edu.ph', password: 'StudentPass123!' },
    { email: 'organizer@snsu.edu.ph', password: 'OrganizerPass123!' },
  ];
  const [demoOpen, setDemoOpen] = useState(false);

  const handleAuthSuccess = (destination) => {
    // Broadcast global auth success so other consumers (e.g., NavBar) can close their dialogs
    try {
      window.dispatchEvent(new CustomEvent('eas:auth-success'));
    } catch {
      /* noop */
    }
    onOpenChange?.(false);
    if (typeof onAuthSuccess === 'function') {
      onAuthSuccess();
    } else {
      window.location.href = destination || '/dashboard';
    }
  };

  const handleDemoAccountSelect = (account) => {
    setTab('login');
    setDemoCredentials({ email: account.email, password: account.password });
  };

  useEffect(() => {
    if (open) setTab('login');
  }, [open]);

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (forced && next === false) return; // block closing when forced
        onOpenChange?.(next);
      }}
      size='lg'
      showCloseButton={false} // Remove the default close button and header
      disableOutsideClick={forced}
      enableScrollLock={true}
    >
      <div className='auth-gradient-header relative flex flex-col items-center px-4 py-6 text-center sm:px-6 sm:py-8'>
        {/* Close button positioned at top-right edge of modal */}
        {!forced && (
          <Button
            variant='ghost'
            size='sm'
            className='absolute top-4 right-4 h-8 w-8 rounded-full border-2 border-white/30 bg-black/20 p-0 text-white/90 shadow-md backdrop-blur-sm hover:bg-black/40 hover:text-white sm:top-6 sm:right-6'
            onClick={() => onOpenChange?.(false)}
            aria-label='Close modal'
          >
            <X className='h-4 w-4' />
          </Button>
        )}

        <div className='mb-4'>
          <img
            src={SNSULogo}
            alt='Logo'
            className='h-20 w-20 rounded-full border-4 border-white/70 shadow-lg'
          />
        </div>
        <div className='text-primary-foreground gap-1'>
          <h2 className='text-2xl font-bold tracking-tight'>
            {tab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className='text-primary-foreground/80'>
            {tab === 'login' ? 'Sign in to your account' : 'Join the platform today'}
          </p>
        </div>
        <div className='mt-6 w-full'>
          <Tabs value={tab} onValueChange={setTab} className='w-full'>
            <TabsList className='bg-primary/30 supports-[backdrop-filter]:bg-primary/25 w-full backdrop-blur'>
              <TabsTrigger className='flex-1' value='login'>
                Login
              </TabsTrigger>
              <TabsTrigger className='flex-1' value='register'>
                Register
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {forced && (
            <div className='mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-center text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200'>
              You must log in to continue.
            </div>
          )}
          {showDemoAccounts && (
            <div className='mt-3'>
              <DropdownMenu open={demoOpen} onOpenChange={setDemoOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='text-muted-foreground w-full justify-between text-xs'
                  >
                    Demo accounts <span>▼</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='start'
                  sideOffset={4}
                  className='p-1'
                  style={{
                    width: 'var(--radix-dropdown-menu-trigger-width)',
                    minWidth: 'var(--radix-dropdown-menu-trigger-width)',
                  }}
                >
                  <DropdownMenuLabel className='text-foreground text-xs'>
                    Select demo account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {mockAccounts.map((acct) => (
                    <DropdownMenuItem
                      key={acct.email}
                      className='text-foreground hover:text-foreground focus:text-foreground flex w-full min-w-0 cursor-pointer items-center justify-between text-xs'
                      onClick={() => handleDemoAccountSelect(acct)}
                    >
                      <span className='min-w-0 flex-1 truncate font-medium'>{acct.email}</span>
                      <span className='text-muted-foreground ml-2 font-mono text-[10px] whitespace-nowrap'>
                        {acct.password}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Main content area with forms - this will use Modal's built-in ScrollArea */}
      <div className='space-y-6'>
        {tab === 'login' && (
          <LoginForm
            onSuccess={handleAuthSuccess}
            setTab={setTab}
            initialValues={demoCredentials}
          />
        )}
        {tab === 'register' && <RegisterForm onSuccess={handleAuthSuccess} setTab={setTab} />}
      </div>

      {/* Footer - positioned at bottom */}
      <div className='bg-muted text-muted-foreground -mx-4 mt-6 px-4 py-3 text-center text-[10px] sm:-mx-6 sm:px-6'>
        By continuing you agree to our Terms & Privacy Policy.
      </div>
    </Modal>
  );
}

export default AuthDialog;
