import { useAuth } from '@contexts/auth-context';
import { WifiOff } from 'lucide-react';
import React from 'react';

// ===== LOCAL (SIBLING) IMPORTS =====
import AdminDashboard from './AdminDashboard';
import OrganizerDashboard from './OrganizerDashboard';
import StudentDashboard from './StudentDashboard';

// ===== INTERNAL ALIASES =====
import USCLogo from '@/assets/images/USC-Logo2.png';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { DashboardDataProvider } from '@/contexts/dashboard-data-context';
import DevLogger from '@/lib/dev-logger';
import apiService from '@/services/api-service';

const WelcomeCard = ({ user, profile }) => {
  const fullName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.name || 'User';

  // Build a safe info line for students without showing 'undefined'
  const studentBits = [];
  // Prefer fetched profile data; do not chain many fallbacks to keep logic simple
  const studentId = profile?.student_id || '';
  const departmentName = profile?.department_name || '';
  if (studentId) studentBits.push(`Student ID: ${studentId}`);
  if (departmentName) studentBits.push(departmentName);
  const studentInfo = studentBits.join(' • ');

  return (
    <Card className='col-span-full'>
      <CardHeader>
        <div className='flex items-center gap-3'>
          <img
            src={user?.avatar || USCLogo}
            alt={fullName}
            className='border-primary/20 h-16 w-16 rounded-full border-2'
          />
          <div>
            <CardTitle className='text-2xl'>Welcome back, {fullName}!</CardTitle>
            <CardDescription className='text-base'>
              {user?.role === 'student' && (studentInfo || '')}
              {user?.role === 'admin' && 'Administrator Dashboard • Full System Access'}
              {user?.role === 'organizer' && `Event Organizer • ${user?.department}`}
            </CardDescription>
          </div>
          <div className='ml-auto'>
            <Badge
              variant={
                user?.role === 'admin'
                  ? 'destructive'
                  : user?.role === 'organizer'
                    ? 'default'
                    : 'secondary'
              }
              className='text-sm'
            >
              {user?.role?.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState(null);
  const [profileLoaded, setProfileLoaded] = React.useState(false);
  const [profileError, setProfileError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    // ===== BACKEND COMMUNICATION =====
    // Fetches current user's profile from API
    (async () => {
      try {
        if (mounted) {
          setProfileLoaded(false);
          setProfileError('');
        }
        DevLogger.info('DashboardPage', 'fetchProfile:start', { userId: user?.id });
        const p = await apiService.getProfile();
        if (mounted) setProfile(p || null);
        DevLogger.success('DashboardPage', 'fetchProfile:success');
      } catch (err) {
        const message = err?.response?.data?.error || err?.message || 'Failed to load profile';
        if (mounted) {
          setProfile(null);
          setProfileError(message);
        }
        DevLogger.error('DashboardPage', 'fetchProfile:error', err);
      } finally {
        if (mounted) setProfileLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const DashboardContent = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'organizer':
        return <OrganizerDashboard user={user} />;
      case 'student':
        return <StudentDashboard user={user} />;
      default:
        return <StudentDashboard user={user} />;
    }
  };

  return (
    <DashboardLayout title='EAS Dashboard' currentPage='Overview'>
      <WelcomeCard user={user} profile={profileLoaded ? profile : null} />
      {profileError && (
        <div className='mb-4'>
          <Alert variant='destructive'>
            <WifiOff className='h-4 w-4' />
            <AlertDescription>Failed to load your profile: {profileError}</AlertDescription>
          </Alert>
        </div>
      )}
      {/* ===== BACKEND COMMUNICATION (DASHBOARD DATA) ===== */}
      {/* Provides shared events/attendances to dashboard subviews to avoid duplicate fetching */}
      <DashboardDataProvider>
        {/* ===== FRONTEND INTERACTION ===== */}
        <DashboardContent />
      </DashboardDataProvider>
    </DashboardLayout>
  );
}

export default Dashboard;
