import React from 'react';
import { Navigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/layout/Heading';
import { AccessDenied } from '@/components/ui/access-denied';
import { DashboardHeader } from '@/components/ui/dashboard-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';

const DashboardLayout = ({
  children,
  title = 'EAS Dashboard',
  currentPage = 'Overview',
  requiredRoles = null,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent'></div>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated: redirect silently (avoid AccessDenied flash during logout)
  if (!isLoading && (!isAuthenticated || !user)) {
    return <Navigate to='/' replace />;
  }

  // Authenticated but lacking required role
  if (
    !isLoading &&
    requiredRoles &&
    Array.isArray(requiredRoles) &&
    user &&
    !requiredRoles.includes(user.role)
  ) {
    return (
      <AccessDenied
        title='Access Restricted'
        message={`Your role (${user.role}) does not have permission to access this section.`}
        actionLabel='Return Home'
        redirectTo='/'
      />
    );
  }

  return (
    <>
      {/* Main Navigation Header - Sticky */}
      <Header className='z-50' variant='dashboard' />

      {/* Dashboard Layout with top padding to account for fixed header */}
      <div className='pt-16'>
        <SidebarProvider>
          <AppSidebar user={user} />
          <SidebarInset>
            <DashboardHeader user={user} title={title} currentPage={currentPage} />
            <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </>
  );
};

export { DashboardLayout };
