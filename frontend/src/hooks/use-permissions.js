import { useAuth } from '@contexts/auth-context';

/**
 * Hook to check user permissions and roles
 */
export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (roles) => {
    if (!user?.role) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const canAccess = (feature) => {
    const permissions = {
      dashboard: ['admin', 'organizer', 'student'],
      management: ['admin', 'organizer'],
      analytics: ['admin', 'organizer'],
      dataLibrary: ['admin', 'organizer'],
      reports: ['admin', 'organizer', 'student'],
      settings: ['admin', 'organizer'],
      help: ['admin', 'organizer', 'student'],
      profile: ['admin', 'organizer', 'student'],
    };

    return hasRole(permissions[feature] || []);
  };

  const isAdmin = () => hasRole('admin');
  const isOrganizer = () => hasRole('organizer');
  const isStudent = () => hasRole('student');
  const isAdminOrOrganizer = () => hasRole(['admin', 'organizer']);

  return {
    user,
    hasRole,
    canAccess,
    isAdmin,
    isOrganizer,
    isStudent,
    isAdminOrOrganizer,
  };
};

export default usePermissions;
