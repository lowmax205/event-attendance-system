import USCLogo from '@assets/icons/USC-Logo2.png';
import SNSULogo from '@assets/images/SNSU-Logo.png';
import { useAuth } from '@contexts/auth-context';
import {
  Home,
  CalendarDays,
  Map,
  Menu,
  X,
  Sun,
  Moon,
  Laptop,
  Bell,
  User,
  LogOut,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthDialog from '@/components/auth/auth-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InfoModal } from '@/components/ui/modal';
import { ThemeSwitch } from '@/components/ui/theme-switch';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
];

const ThemeSwitchIcon = () => {
  return (
    <div className='cursor-pointer'>
      <ThemeSwitch
        variant='icon-click'
        modes={['light', 'dark', 'system']}
        icons={[
          <Sun key='sun-icon' size={16} />,
          <Moon key='moon-icon' size={16} />,
          <Laptop key='laptop-icon' size={16} />,
        ]}
        showInactiveIcons='all'
        size='sm'
      />
    </div>
  );
};

export const NavBar = () => {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);
  const [forceAuth, setForceAuth] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Helper function to get user display name with fallbacks
  const getUserDisplayName = (user) => {
    if (!user) return 'User';

    // Try full name first (first + last name)
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`.trim();
    }

    // Fallback to first name only
    if (user.first_name) {
      return user.first_name;
    }

    // Fallback to last name only
    if (user.last_name) {
      return user.last_name;
    }

    // Fallback to username
    if (user.username) {
      return user.username;
    }

    // Final fallback to email (first part before @)
    if (user.email) {
      return user.email.split('@')[0];
    }

    return 'User';
  };

  // Helper function to get user initials for avatar fallback
  const getUserInitials = (user) => {
    if (!user) return 'U';

    // Try first and last name initials
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }

    // Try first name initial only
    if (user.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }

    // Try last name initial only
    if (user.last_name) {
      return user.last_name.charAt(0).toUpperCase();
    }

    // Try username initial
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }

    // Try email initial
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return 'U';
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Listen for global session-expired event and redirect home (do not auto-open login modal)
  useEffect(() => {
    const onExpired = () => {
      // Close any open auth modal and show a brief info modal
      setAuthOpen(false);
      setForceAuth(false);
      setSessionExpiredOpen(true);
      // Redirect to home page; QR page will manage its own forced login
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    };
    window.addEventListener('eas:session-expired', onExpired);
    // Also listen for a global auth-success to close any open auth modal
    const onAuthSuccess = () => {
      setAuthOpen(false);
      setForceAuth(false);
      setSessionExpiredOpen(false);
    };
    window.addEventListener('eas:auth-success', onAuthSuccess);
    return () => {
      window.removeEventListener('eas:session-expired', onExpired);
      window.removeEventListener('eas:auth-success', onAuthSuccess);
    };
  }, []);

  // Guard: if user clicks Profile while unauth, open auth dialog
  const ensureAuth = useCallback(
    (action) => (e) => {
      if (!isAuthenticated) {
        e?.preventDefault?.();
        setAuthOpen(true);
        return;
      }
      action?.();
    },
    [isAuthenticated],
  );

  const isActive = (path) => location.pathname === path;

  return (
    <nav className='flex h-full w-full items-center justify-between'>
      {/* Brand */}
      <Link to='/' className='flex items-center gap-3 font-semibold no-underline'>
        <span className='flex items-center gap-2'>
          <img
            src={SNSULogo}
            alt='SNSU Logo'
            className='bg-primary-foreground h-10 w-10 rounded-full border shadow-sm'
          />
          <img
            src={USCLogo}
            alt='USC Logo'
            className='bg-primary-foreground h-10 w-10 rounded-full border shadow-sm'
          />
        </span>
        <span className='hidden text-sm font-semibold tracking-wide md:inline'>
          Event Attendance System
        </span>
        <span className='text-sm font-semibold tracking-wide md:hidden'>EAS</span>
      </Link>

      {/* Desktop Nav */}
      <div className='hidden items-center gap-3 md:flex'>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Button
              key={item.to}
              asChild
              variant={active ? 'secondary' : 'ghost'}
              size='lg'
              className={`px-3 ${active ? 'shadow-sm' : ''}`}
            >
              <Link to={item.to} className='flex items-center gap-1'>
                <Icon className='h-4 w-4' />
                <span>{item.label}</span>
              </Link>
            </Button>
          );
        })}
        <ThemeSwitchIcon />
        {isAuthenticated && user ? (
          <>
            <Button
              variant='outline'
              size='sm'
              aria-label='Notifications'
              className='border-secondary/30 hover:border-secondary/50 hover:bg-background/30 hover:text-background bg-card/80 dark:border-primary/30 dark:hover:border-primary/50 dark:hover:bg-foreground/30 dark:hover:text-foreground dark:bg-card/80 cursor-pointer p-5'
            >
              <Bell className='h-4 w-4 transition-colors' />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='border-secondary/30 hover:border-secondary/50 hover:bg-background/30 hover:text-background bg-card/80 dark:border-primary/30 dark:hover:border-primary/50 dark:hover:bg-foreground/30 dark:hover:text-foreground dark:bg-card/80 cursor-pointer p-5'
                >
                  <Avatar className='border-primary/20 dark:border-primary/30 h-7 w-7 rounded-lg border-2'>
                    <AvatarImage src={user?.avatar} alt={getUserDisplayName(user)} />
                    <AvatarFallback className='bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground rounded-lg text-xs font-semibold'>
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='hidden text-left sm:flex sm:flex-col sm:items-start'>
                    <span className='text-foreground text-sm leading-none font-medium'>
                      {getUserDisplayName(user)}
                    </span>
                    <span className='text-muted-foreground mt-0.5 text-xs leading-none'>
                      {user?.email}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuGroup>
                  {(location.pathname === '/' ||
                    location.pathname === '/events' ||
                    location.pathname === '/roadmap') && (
                    <DropdownMenuItem asChild>
                      <Link to='/dashboard' className='flex items-center gap-2'>
                        <User className='size-4' />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to='/profile' onClick={ensureAuth()} className='flex items-center gap-2'>
                      <User className='size-4' />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className='size-4' />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button
            size='lg'
            className='bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary/20 dark:bg-primary dark:hover:bg-primary/80 cursor-pointer px-4 shadow-sm transition-all duration-200 focus:ring-2 focus:outline-none'
            onClick={() => setAuthOpen(true)}
          >
            Login
          </Button>
        )}
      </div>

      {/* Mobile actions */}
      <div className='flex items-center gap-2 md:hidden'>
        <ThemeSwitchIcon />
        {isAuthenticated && user ? (
          <>
            <Button
              variant='outline'
              size='sm'
              aria-label='Notifications'
              className='border-secondary/30 hover:border-secondary/50 hover:bg-background/30 hover:text-background bg-card/80 dark:border-primary/30 dark:hover:border-primary/50 dark:hover:bg-foreground/30 dark:hover:text-foreground dark:bg-card/80 cursor-pointer p-5'
            >
              <Bell className='h-4 w-4 transition-colors' />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='border-secondary/30 hover:border-secondary/50 hover:bg-background/30 hover:text-background bg-card/80 dark:border-primary/30 dark:hover:border-primary/50 dark:hover:bg-foreground/30 dark:hover:text-foreground dark:bg-card/80 cursor-pointer p-5'
                >
                  <Avatar className='border-primary/20 dark:border-primary/30 h-6 w-6 rounded-lg border'>
                    <AvatarImage src={user?.avatar} alt={getUserDisplayName(user)} />
                    <AvatarFallback className='bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground rounded-lg text-xs font-semibold'>
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='hidden text-left sm:flex sm:flex-col sm:items-start'>
                    <span className='text-foreground text-sm leading-none font-medium'>
                      {getUserDisplayName(user)}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                    <Avatar className='border-primary/20 dark:border-primary/30 h-8 w-8 rounded-lg border'>
                      <AvatarImage src={user?.avatar} alt={getUserDisplayName(user)} />
                      <AvatarFallback className='bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground rounded-lg font-semibold'>
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='grid flex-1 text-left text-sm leading-tight'>
                      <span className='truncate font-medium'>{getUserDisplayName(user)}</span>
                      <span className='text-muted-foreground truncate text-xs'>{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {(location.pathname === '/' ||
                    location.pathname === '/events' ||
                    location.pathname === '/roadmap') && (
                    <DropdownMenuItem asChild>
                      <Link to='/dashboard' className='flex items-center gap-2'>
                        <User className='size-4' />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to='/profile' onClick={ensureAuth()} className='flex items-center gap-2'>
                      <User className='size-4' />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className='size-4' />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button
            size='lg'
            className='bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary/20 dark:bg-primary dark:hover:bg-primary/80 cursor-pointer px-4 shadow-sm transition-all duration-200 focus:ring-2 focus:outline-none'
            onClick={() => setAuthOpen(true)}
          >
            Login
          </Button>
        )}
        <Button
          variant='outline'
          size='icon'
          aria-label='Toggle menu'
          onClick={() => setOpen((o) => !o)}
          className='border-secondary/30 hover:border-secondary/50 hover:bg-background/30 hover:text-background bg-card/80 dark:border-primary/30 dark:hover:border-primary/50 dark:hover:bg-foreground/30 dark:hover:text-foreground dark:bg-card/80 p-5'
        >
          {open ? (
            <X className='text-muted-foreground h-5 w-5 transition-colors' />
          ) : (
            <Menu className='text-muted-foreground h-5 w-5 transition-colors' />
          )}
        </Button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className='supports-[backdrop-filter]:bg-background/100 absolute top-full right-0 left-0 border-b backdrop-blur md:hidden'>
          <ul className='space-y-1 p-4'>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'}`}
                  >
                    <Icon className='h-4 w-4' />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <AuthDialog
        open={authOpen}
        onOpenChange={(next) => {
          // When forced, prevent closing from outside. Let AuthDialog enforce too.
          // Allow closing if user is now authenticated, even if it was forced earlier
          if (forceAuth && next === false && !isAuthenticated) return;
          setAuthOpen(next);
        }}
        forced={forceAuth}
        onAuthSuccess={() => {
          // Ensure the dialog closes on successful auth, regardless of prior forced state
          setAuthOpen(false);
          setForceAuth(false);
          setSessionExpiredOpen(false);
        }}
      />
      <InfoModal
        open={sessionExpiredOpen}
        onOpenChange={setSessionExpiredOpen}
        title='Session expired!'
        onAction={() => setSessionExpiredOpen(false)}
      >
        <p className='text-muted-foreground text-sm'>Please sign in again to continue.</p>
      </InfoModal>
    </nav>
  );
};

export default NavBar;
