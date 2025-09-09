import { useAuth } from '@contexts/auth-context';
import React from 'react';
import { Navigate } from 'react-router-dom';
import StatusPage from '@/pages/error/StatusPage';

const RoleProtectedRoute = ({
  children,
  allowedRoles = [],
  fallbackPath = '/',
  showStatusPage = true,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <div className='text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm'>
        Loading...
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check if user role is allowed
  const userRole = user?.role;
  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole);

  if (!hasAccess) {
    if (showStatusPage) {
      return (
        <StatusPage
          title='Access Restricted'
          description={`You don't have permission to access this feature. This section is available only for ${allowedRoles.join(' and ')} users.`}
          status='error'
          features={[
            'This feature requires elevated permissions',
            'Contact your administrator for access',
            `Your current role: ${userRole || 'Unknown'}`,
            `Required roles: ${allowedRoles.join(', ')}`,
          ]}
          onRetry={() => (window.location.href = fallbackPath)}
          showReturnButton={true}
        />
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default RoleProtectedRoute;
