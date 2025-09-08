import {
  Users,
  Calendar,
  UserCheck,
  Activity,
  AlertTriangle,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DevLogger from '@/lib/dev-logger';
import { apiService } from '@/services/api-service';

const AdminStats = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    // Load auto-refresh setting from localStorage
    const saved = localStorage.getItem('adminDashboard_autoRefresh');
    return saved !== null ? JSON.parse(saved) : true; // Default to enabled
  });

  const fetchMetrics = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await apiService.getDashboardMetrics();
      // apiService normalizes { success, data } envelopes to return data directly
      setMetrics(data);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to load dashboard metrics';
      setError(msg);
      DevLogger.error('AdminDashboard', 'fetchMetrics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Set up auto-refresh every 5 minutes, but only if autoRefresh is enabled
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(
        () => {
          fetchMetrics(true);
        },
        5 * 60 * 1000,
      );
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]); // Add autoRefresh as dependency

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // First, trigger backend metrics recalculation
      const recalculateResponse = await apiService.recalculateMetrics();
      if (recalculateResponse?.message) {
        DevLogger.info('AdminDashboard', 'recalculateMetrics', { message: recalculateResponse.message });
      }

      // Then fetch the updated metrics
      await fetchMetrics(false); // Don't set refreshing again since we're already handling it
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to refresh dashboard metrics';
      setError(msg);
      DevLogger.error('AdminDashboard', 'handleRefresh', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAutoRefreshToggle = (checked) => {
    setAutoRefresh(checked);
    // Persist the setting in localStorage
    localStorage.setItem('adminDashboard_autoRefresh', JSON.stringify(checked));
  };

  const getDisplayValue = (value, fallback = 'N/A') => {
    if (value === null || value === undefined || value === 'N/A') {
      return fallback;
    }
    return value;
  };

  const formatAttendanceRate = (rate) => {
    if (rate === null || rate === undefined || rate === 'N/A') {
      return 'N/A';
    }
    return `${rate}%`;
  };

  const formatSystemHealth = (health) => {
    if (health === null || health === undefined || health === 'N/A') {
      return 'N/A';
    }
    return `${health}%`;
  };

  const stats = [
    {
      title: 'Total Users',
      value: getDisplayValue(metrics?.total_users),
      change: metrics?.is_data_available ? 'Live Data' : 'Stale Data',
      trend: metrics?.is_data_available ? 'up' : 'warning',
      icon: Users,
      description: 'Active users in system',
    },
    {
      title: 'Total Events',
      value: getDisplayValue(metrics?.total_events),
      change: metrics?.is_data_available ? 'Live Data' : 'Stale Data',
      trend: metrics?.is_data_available ? 'up' : 'warning',
      icon: Calendar,
      description: 'Events in system',
    },
    {
      title: 'Attendance Rate',
      value: formatAttendanceRate(metrics?.attendance_rate),
      change: metrics?.is_data_available ? 'Live Data' : 'Stale Data',
      trend: metrics?.is_data_available ? 'up' : 'warning',
      icon: UserCheck,
      description: 'Overall attendance rate',
    },
    {
      title: 'System Health',
      value: formatSystemHealth(metrics?.system_health_score),
      change: metrics?.is_data_available ? 'Live Data' : 'Stale Data',
      trend: metrics?.is_data_available ? 'up' : 'warning',
      icon: Activity,
      description: 'System health score',
    },
  ];

  if (loading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-4' />
            </CardHeader>
            <CardContent>
              <Skeleton className='mb-2 h-8 w-16' />
              <Skeleton className='h-4 w-32' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className='grid gap-4 md:grid-cols-1'>
        <Alert variant='destructive'>
          <WifiOff className='h-4 w-4' />
          <AlertDescription className='flex items-center justify-between'>
            <span>Failed to load dashboard metrics: {error}</span>
            <Button variant='outline' size='sm' onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Dashboard Metrics</h2>
        <div className='flex items-center gap-4'>
          {metrics?.last_updated && (
            <span className='text-muted-foreground text-sm'>
              Updated: {new Date(metrics.last_updated).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleAutoRefreshToggle(!autoRefresh)}
            className={`flex items-center gap-2 ${
              autoRefresh
                ? 'border-success bg-success/10 hover:bg-success/40'
                : 'border-muted bg-muted hover:bg-muted/80'
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-success' : 'bg-muted-foreground'}`}
            />
            Auto-refresh
          </Button>
          <Button variant='outline' size='sm' onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {stats.map((stat) => (
          <Card key={stat.title} className={stat.value === 'N/A' ? 'opacity-75' : ''}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>{stat.title}</CardTitle>
              <stat.icon className='text-muted-foreground h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {stat.value === 'N/A' ? (
                  <span className='text-muted-foreground'>Data Unavailable</span>
                ) : (
                  stat.value
                )}
              </div>
              <p className='text-muted-foreground text-xs'>
                <span
                  className={`inline-flex items-center ${
                    stat.trend === 'up'
                      ? 'text-green-600'
                      : stat.trend === 'warning'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </span>{' '}
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!metrics?.is_data_available && metrics && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            Dashboard metrics may be outdated. Last calculated:{' '}
            {metrics.last_updated ? new Date(metrics.last_updated).toLocaleString() : 'Unknown'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export function AdminDashboard() {
  return (
    <div className='space-y-6'>
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='users'>Users Logs</TabsTrigger>
          <TabsTrigger value='events'>Events Logs</TabsTrigger>
          <TabsTrigger value='system'>Attendance Logs</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <AdminStats />
          
      {/* Features development (below tabs) */}
      <Card>
        <CardHeader>
          <CardTitle>Features development</CardTitle>
          <CardDescription>Planned additions for the admin dashboard overview</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-muted-foreground space-y-3'>
            <p className='font-medium'>Features in development:</p>
            <ul className='space-y-2 text-sm'>
              <li>
                • <strong>Real-time Metrics:</strong> Auto-refreshing tiles with live system and usage data
              </li>
              <li>
                • <strong>Quick Actions:</strong> One-click access to user management, event approvals, and audits
              </li>
              <li>
                • <strong>Health Indicators:</strong> Surface API latency, DB status, and background jobs summary
              </li>
              <li>
                • <strong>Role Insights:</strong> At-a-glance counts by role, active sessions, and recent signups
              </li>
              <li>
                • <strong>Export & Reports:</strong> Download system-wide summaries as CSV/PDF for compliance
              </li>
            </ul>
            <p className='border-t pt-4 text-xs'>
              This section highlights upcoming visibility and control tools tailored for administrators.
            </p>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value='users' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                User Activity Logs
              </CardTitle>
              <CardDescription>
                Comprehensive user activity tracking and audit logs - Coming Soon
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-muted-foreground space-y-3'>
                <p className='font-medium'>Features in development:</p>
                <ul className='space-y-2 text-sm'>
                  <li>
                    • <strong>Login/Logout History:</strong> Track user authentication events with
                    timestamps and IP addresses
                  </li>
                  <li>
                    • <strong>Profile Changes:</strong> Monitor updates to user profiles, role
                    changes, and permission modifications
                  </li>
                  <li>
                    • <strong>Registration Activity:</strong> View new user registrations and
                    account activations
                  </li>
                  <li>
                    • <strong>Security Events:</strong> Monitor failed login attempts, password
                    resets, and suspicious activities
                  </li>
                  <li>
                    • <strong>Session Management:</strong> Track active sessions, concurrent logins,
                    and session timeouts
                  </li>
                  <li>
                    • <strong>Data Export:</strong> Export user activity logs for compliance and
                    auditing purposes
                  </li>
                </ul>
                <p className='border-t pt-4 text-xs'>
                  This feature will provide administrators with detailed insights into user behavior
                  and help maintain system security through comprehensive audit trails.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='events' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                Event Activity Logs
              </CardTitle>
              <CardDescription>
                Complete event lifecycle tracking and management logs - Coming Soon
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-muted-foreground space-y-3'>
                <p className='font-medium'>Features in development:</p>
                <ul className='space-y-2 text-sm'>
                  <li>
                    • <strong>Event Creation/Updates:</strong> Track who created, updated, or
                    deleted events with detailed change logs
                  </li>
                  <li>
                    • <strong>Registration Tracking:</strong> Monitor event registrations,
                    cancellations, and waitlist activities
                  </li>
                  <li>
                    • <strong>QR Code Generation:</strong> Log QR code creation and regeneration
                    events for attendance tracking
                  </li>
                  <li>
                    • <strong>Venue Changes:</strong> Track location updates, capacity
                    modifications, and scheduling conflicts
                  </li>
                  <li>
                    • <strong>Organizer Activities:</strong> Monitor organizer assignments,
                    permissions, and event management actions
                  </li>
                  <li>
                    • <strong>Event Analytics:</strong> Generate reports on event popularity,
                    attendance patterns, and success metrics
                  </li>
                </ul>
                <p className='border-t pt-4 text-xs'>
                  This comprehensive logging system will help organizers and administrators track
                  the complete lifecycle of events and make data-driven decisions for future event
                  planning.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='system' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <UserCheck className='h-5 w-5' />
                Attendance Tracking Logs
              </CardTitle>
              <CardDescription>
                Comprehensive attendance monitoring and verification system - Coming Soon
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-muted-foreground space-y-3'>
                <p className='font-medium'>Features in development:</p>
                <ul className='space-y-2 text-sm'>
                  <li>
                    • <strong>Check-in/Check-out Records:</strong> Detailed logs of attendance
                    marking with timestamps and methods used
                  </li>
                  <li>
                    • <strong>QR Code Scanning:</strong> Track QR code scan attempts, successful
                    validations, and duplicate scan prevention
                  </li>
                  <li>
                    • <strong>Location Verification:</strong> GPS-based attendance validation to
                    ensure on-site presence
                  </li>
                  <li>
                    • <strong>Photo Verification:</strong> Optional photo capture during check-in
                    for comprehensive verification
                  </li>
                  <li>
                    • <strong>Attendance Patterns:</strong> Analyze student attendance trends,
                    punctuality, and participation rates
                  </li>
                  <li>
                    • <strong>Fraud Detection:</strong> Monitor suspicious attendance patterns and
                    potential system abuse
                  </li>
                  <li>
                    • <strong>Export & Reports:</strong> Generate attendance reports for academic
                    records and compliance
                  </li>
                </ul>
                <p className='border-t pt-4 text-xs'>
                  This comprehensive attendance system will provide robust tracking capabilities
                  with multiple verification methods to ensure accurate and reliable attendance
                  recording for all events.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;
