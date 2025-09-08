import { AlertCircle, Calendar, CheckCircle, Clock, Eye, MapPin, Star, TrendingUp, Users } from 'lucide-react';
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardData } from '@/contexts/dashboard-data-context';

const StudentStats = () => {
  const { attendances, events, attendancesLoading, eventsLoading, attendancesError, eventsError } = useDashboardData();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [metrics, setMetrics] = React.useState({
    attended: null,
    attendanceRate: null,
    upcoming: null,
    totalHours: null,
  });

  React.useEffect(() => {
    // ===== BACKEND COMMUNICATION =====
    // Derive student metrics from shared datasets
    setLoading(attendancesLoading || eventsLoading);
    const err = attendancesError || eventsError;
    setError(err ? (err || 'Failed to load metrics') : '');

    // ===== FRONTEND INTERACTION =====
    // Compute metrics from context data
    const records = Array.isArray(attendances) ? attendances : [];
    const evts = Array.isArray(events) ? events : [];
    const attendedCount = records.filter((r) =>
      ['checked_in', 'checked_out', 'present'].includes(String(r.status || '').toLowerCase()),
    ).length;
    const totalRecords = records.length;
    const attendanceRate = totalRecords > 0 ? Math.round((attendedCount / totalRecords) * 100) : null;

    const now = new Date();
    const upcoming = evts.filter((e) => {
      const startAt = e.start_at ? new Date(e.start_at) : null;
      return startAt && startAt > now;
    }).length;
    setMetrics({ attended: attendedCount, attendanceRate, upcoming, totalHours: null });
  }, [attendances, events, attendancesLoading, eventsLoading, attendancesError, eventsError]);

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
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>Failed to load your metrics: {error}</AlertDescription>
      </Alert>
    );
  }

  const stats = [
    {
      title: 'Events Attended',
      value: metrics.attended ?? 'N/A',
      trend: 'neutral',
      icon: CheckCircle,
      description: 'Derived from your attendance records',
    },
    {
      title: 'Attendance Rate',
      value: metrics.attendanceRate !== null ? `${metrics.attendanceRate}%` : 'N/A',
      trend: 'neutral',
      icon: TrendingUp,
      description: 'Attendance vs total records',
    },
    {
      title: 'Upcoming Events',
      value: metrics.upcoming ?? 'N/A',
      trend: 'neutral',
      icon: Calendar,
      description: 'Events scheduled in the future',
    },
    {
      title: 'Total Hours',
      value: metrics.totalHours !== null ? metrics.totalHours : 'N/A',
      trend: 'neutral',
      icon: Clock,
      description: 'Hours not tracked yet',
    },
  ];

  // ===== FRONTEND INTERACTION =====
  // Purely presentational rendering of metric cards
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>{stat.title}</CardTitle>
            <stat.icon className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stat.value}</div>
            <p className='text-muted-foreground text-xs'>{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const UpcomingEvents = () => {
  const { events, eventsLoading, eventsError } = useDashboardData();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setLoading(eventsLoading);
    setError(eventsError || '');
  }, [eventsLoading, eventsError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Calendar className='h-5 w-5' />
          Upcoming Events
        </CardTitle>
        <CardDescription>Public and accessible events</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className='text-sm'>
            <Skeleton className='mb-2 h-5 w-40' />
            <Skeleton className='h-4 w-64' />
          </div>
        )}
        {error && !loading && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>Error loading events: {error}</AlertDescription>
          </Alert>
        )}
        {!loading && !error && events.length === 0 && (
          <div className='text-muted-foreground text-sm'>No events available.</div>
        )}
        {!loading && !error && (
          <div className='space-y-4'>
            {events.map((event) => (
              <div key={event.id} className='flex items-start justify-between rounded-lg border p-4'>
                <div className='flex-1'>
                  <div className='mb-2 flex items-center gap-2'>
                    <h4 className='font-medium'>{event.title}</h4>
                    {/* Placeholder badge: backend doesn't track per-user registration status here */}
                    <Badge variant='outline'>{event.category || 'Event'}</Badge>
                  </div>
                  <div className='text-muted-foreground space-y-1 text-sm'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4' />
                      {(event.date || '') + (event.time ? ` • ${event.time}` : '')}
                    </div>
                    <div className='flex items-center gap-2'>
                      <MapPin className='h-4 w-4' />
                      {event.location_name || event.venue_address || 'TBA'}
                    </div>
                    {event.organizer_name && (
                      <div className='flex items-center gap-2'>
                        <Users className='h-4 w-4' />
                        {event.organizer_name}
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex flex-col gap-2'>
                  {/* Actions would depend on registration/attendance state; placeholders for now */}
                  <Button size='sm' variant='outline'>
                    <Eye className='mr-2 h-4 w-4' />
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AttendanceHistory = () => {
  const { attendances, attendancesLoading, attendancesError } = useDashboardData();
  const [records, setRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setLoading(attendancesLoading);
    setError(attendancesError || '');
    setRecords(Array.isArray(attendances) ? attendances : []);
  }, [attendances, attendancesLoading, attendancesError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <CheckCircle className='h-5 w-5' />
          Recent Attendance
        </CardTitle>
        <CardDescription>Your attendance history for recent events</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className='text-sm'>
            <Skeleton className='mb-2 h-5 w-48' />
            <Skeleton className='h-4 w-64' />
          </div>
        )}
        {error && !loading && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>Error loading attendance: {error}</AlertDescription>
          </Alert>
        )}
        {!loading && !error && records.length === 0 && (
          <div className='text-muted-foreground text-sm'>No attendance records.</div>
        )}
        {!loading && !error && (
          <div className='space-y-3'>
            {records.map((rec) => (
              <div key={rec.id} className='flex items-center justify-between rounded-lg border p-3'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`rounded-full p-2 ${
                      rec.status === 'checked_in' || rec.status === 'checked_out'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {(rec.status === 'checked_in' || rec.status === 'checked_out') ? (
                      <CheckCircle className='h-4 w-4' />
                    ) : (
                      <AlertCircle className='h-4 w-4' />
                    )}
                  </div>
                  <div>
                    <p className='text-sm font-medium'>{rec.event_title || `Event #${rec.event}`}</p>
                    <p className='text-muted-foreground text-xs'>
                      {/* Prefer checkin_time; fall back to created_at */}
                      {(rec.checkin_time || rec.created_at || '').toString().replace('T', ' ').slice(0, 16)}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline'>{rec.method || 'N/A'}</Badge>
                  <Badge variant={
                    (rec.status === 'checked_in' || rec.status === 'checked_out') ? 'default' : 'secondary'
                  }>
                    {rec.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ProgressOverview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <TrendingUp className='h-5 w-5' />
          Learning Progress
        </CardTitle>
        <CardDescription>Progress data will appear when available</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='text-muted-foreground text-sm'>No progress data available.</div>
      </CardContent>
    </Card>
  );
};

export function StudentDashboard() {
  return (
    <div className='space-y-6'>
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='events'>Events</TabsTrigger>
          <TabsTrigger value='attendance'>Attendance</TabsTrigger>
          <TabsTrigger value='progress'>Progress</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <StudentStats />
        </TabsContent>

        <TabsContent value='events' className='space-y-4'>
          <UpcomingEvents />
        </TabsContent>

        <TabsContent value='attendance' className='space-y-4'>
          <AttendanceHistory />
        </TabsContent>

        <TabsContent value='progress' className='space-y-4'>
          <div className='grid gap-4 lg:grid-cols-2'>
            <ProgressOverview />
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Your earned certificates and badges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='py-8 text-center'>
                  <Star className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                  <p className='text-muted-foreground'>No achievements yet</p>
                  <p className='text-muted-foreground mt-2 text-sm'>
                    Attend more events to earn certificates and badges
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        
      </Tabs>

      {/* Features development (below tabs) */}
      <Card>
        <CardHeader>
          <CardTitle>Features development</CardTitle>
          <CardDescription>Planned additions for students</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-muted-foreground space-y-3'>
            <p className='font-medium'>Features in development:</p>
            <ul className='space-y-2 text-sm'>
              <li>
                • <strong>Personalized Feed:</strong> Recommended events based on interests and history
              </li>
              <li>
                • <strong>Attendance Tools:</strong> Clear check-in guidance, QR help, and reminders
              </li>
              <li>
                • <strong>Certificates:</strong> Downloadable proofs for completed attendance hours
              </li>
              <li>
                • <strong>Goals & Progress:</strong> Set targets and visualize milestones by category
              </li>
              <li>
                • <strong>Saved Events:</strong> Bookmark and receive updates for events of interest
              </li>
            </ul>
            <p className='border-t pt-4 text-xs'>
              These additions aim to make planning and tracking your engagement simpler and clearer.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentDashboard;
