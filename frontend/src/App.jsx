import ScrollToTop from '@components/scroll-to-top';
import { AuthProvider, useAuth } from '@contexts/auth-context';
import React from 'react';
import { BrowserRouter, Route, Routes, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Header, Footer } from '@/components/layout';
import { ToastProvider } from '@/components/ui/toast';
import {
  Dashboard,
  Management,
  Analytics,
  DataLibrary,
  Report,
  Settings,
  Help,
  Profile,
} from '@/pages';
import AttendanceVerifyPage from '@/pages/attendance/AttendanceVerifyPage.jsx';
import RoleProtectedRoute from '@/pages/error/role-protected-route';
import { HomePage, EventPage, RoadmapPage } from '@/pages/landing';

const Layout = ({ children }) => (
  <div className='bg-background text-foreground flex min-h-screen flex-col'>
    <Header />
    <main className='flex-1'>{children}</main>
    <Footer />
  </div>
);

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className='text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm'>
        Loading dashboard...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to='/' replace />;
  }
  return <Outlet />;
};

// Gate to enforce profile completion after login
const ProfileCompletionGate = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [checking, setChecking] = React.useState(true);
  const [needsProfile, setNeedsProfile] = React.useState(false);
  const inFlightRef = React.useRef(false);

  const checkProfile = React.useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setChecking(true);
    try {
      const apiService = (await import('@/services/api-service')).default;
  const p = await apiService.getProfile();
  setNeedsProfile(!p?.is_complete_profile);
    } catch {
      // If profile fetch fails, require completion
      setNeedsProfile(true);
    } finally {
      setChecking(false);
      inFlightRef.current = false;
    }
  }, []);

  // Initial check and re-check whenever trying to navigate away from /profile
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      // Don't block staying on /profile
      if (pathname === '/profile') {
        setChecking(false);
        return;
      }
      if (!cancelled) {
        await checkProfile();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, checkProfile]);

  if (checking) {
    return (
      <div className='text-muted-foreground flex min-h-[30vh] items-center justify-center text-sm'>
        Preparing your account…
      </div>
    );
  }

  // Allow staying on /profile even if incomplete; block other routes when incomplete
  if (needsProfile && pathname !== '/profile') {
    return <Navigate to='/profile' replace />;
  }
  return <Outlet />;
};

// Scroll to top on route change
const App = () => (
  <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route
            element={
              <Layout>
                <Outlet />
              </Layout>
            }
          >
            <Route path='/' element={<HomePage />} />
            <Route path='/events' element={<EventPage />} />
            <Route path='/roadmap' element={<RoadmapPage />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Enforce profile completion for all protected routes */}
            <Route element={<ProfileCompletionGate />}>
              {/* Available to all authenticated users */}
              <Route path='/dashboard/*' element={<Dashboard />} />
              <Route path='/help' element={<Help />} />
              <Route path='/profile' element={<Profile />} />

              {/* Admin and Organizer only routes */}
              <Route
                path='/management/*'
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'organizer']}>
                    <Management />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path='/analytics/*'
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'organizer']}>
                    <Analytics />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path='/data-library/*'
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'organizer']}>
                    <DataLibrary />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path='/reports'
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'organizer', 'student']}>
                    <Report />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path='/settings/*'
                element={
                  <RoleProtectedRoute allowedRoles={['admin', 'organizer']}>
                    <Settings />
                  </RoleProtectedRoute>
                }
              />
            </Route>
          </Route>

          {/* Public, standalone (no Layout) */}
          <Route path='/attendance/verify' element={<AttendanceVerifyPage />} />

          {/* Fallback */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ToastProvider>
);

export default App;
