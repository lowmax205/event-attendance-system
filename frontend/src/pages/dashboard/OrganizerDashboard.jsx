import { AlertCircle, BarChart3, Calendar, CheckCircle, Clock, Edit, Eye, FileText, MapPin, Plus, QrCode, Users } from 'lucide-react';
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardData } from '@/contexts/dashboard-data-context';

const OrganizerStats = () => {
  const { events, attendances, eventsLoading, attendancesLoading, eventsError, attendancesError } = useDashboardData();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    // ===== BACKEND COMMUNICATION =====
    // Compute organizer stats from shared context data
    setLoading(eventsLoading || attendancesLoading);
    const err = eventsError || attendancesError;
    setError(err || '');

    const evts = Array.isArray(events) ? events : [];
    const recs = Array.isArray(attendances) ? attendances : [];
    const eventsOrganized = evts.length;
    const active = evts.filter((e) => e.is_active).length;
    const totalAttendees = recs.length;
    const attended = recs.filter((r) => ['checked_in', 'checked_out', 'present'].includes(r.status)).length;
    const avgRate = recs.length ? Math.round((attended / recs.length) * 100) : null;
    setStats({ eventsOrganized, active, totalAttendees, avgRate });
  }, [events, attendances, eventsLoading, attendancesLoading, eventsError, attendancesError]);

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
        <AlertDescription>Failed to load organizer stats: {error}</AlertDescription>
      </Alert>
    );
  }

  const cards = [
    { title: 'Events Organized', value: stats?.eventsOrganized ?? 'N/A', icon: Calendar, description: 'Total events created' },
    { title: 'Total Attendees', value: stats?.totalAttendees ?? 'N/A', icon: Users, description: 'Across all events' },
    { title: 'Avg Attendance Rate', value: stats?.avgRate !== null ? `${stats.avgRate}%` : 'N/A', icon: CheckCircle, description: 'Attendance vs total records' },
    { title: 'Active Events', value: stats?.active ?? 'N/A', icon: Clock, description: 'Currently active events' },
  ];

  // ===== FRONTEND INTERACTION =====
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {cards.map((stat) => (
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

const MyEvents = () => {
  const { events, eventsLoading, eventsError } = useDashboardData();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    // ===== BACKEND COMMUNICATION =====
    setLoading(eventsLoading);
    setError(eventsError || '');
  }, [eventsLoading, eventsError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            My Events
          </span>
          <Button size='sm'>
            <Plus className='mr-2 h-4 w-4' />
            Create Event
          </Button>
        </CardTitle>
        <CardDescription>Events you've organized and are managing</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className='space-y-2'>
            {[1,2,3].map((i)=> (
              <div key={i} className='rounded-lg border p-4'>
                <Skeleton className='mb-2 h-5 w-48' />
                <Skeleton className='mb-2 h-4 w-64' />
                <Skeleton className='h-3 w-56' />
              </div>
            ))}
          </div>
        )}
        {error && !loading && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>Error loading events: {error}</AlertDescription>
          </Alert>
        )}
        {!loading && !error && (
          <div className='space-y-4'>
          {events.map((event) => (
            <div key={event.id} className='flex items-start justify-between rounded-lg border p-4'>
              <div className='flex-1'>
                <div className='mb-2 flex items-center gap-2'>
                  <h4 className='font-medium'>{event.title}</h4>
                  <Badge
                    variant={
                      event.is_active === false
                        ? 'destructive'
                        : 'default'
                    }
                  >
                    {event.is_active === false ? 'Cancelled' : 'Active'}
                  </Badge>
                </div>
                <div className='text-muted-foreground mb-2 space-y-1 text-sm'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4' />
                    {(event.start_at ? new Date(event.start_at).toLocaleDateString() : event.date || 'TBA')}
                    {event.start_at && (
                      <>
                        {' '}
                        •
                        {' '}
                        {new Date(event.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4' />
                    {event.location_name || event.venue_address || 'TBA'}
                  </div>
                </div>
                <div className='flex items-center gap-4'>
                  <div className='text-sm'>
                    <span className='font-medium'>{event.attendance_count || 0}</span>
                    {event.capacity && (
                      <span className='text-muted-foreground'>/{event.capacity} attendees</span>
                    )}
                  </div>
                  <Progress
                    value={event.capacity ? Math.min(100, ((event.attendance_count || 0) / event.capacity) * 100) : 0}
                    className='max-w-[100px] flex-1'
                  />
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <Button size='sm' variant='outline'>
                  <Eye className='mr-2 h-4 w-4' />
                  View
                </Button>
                <Button size='sm' variant='outline'>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit
                </Button>
                {event.status === 'upcoming' && (
                  <Button size='sm' variant='outline'>
                    <QrCode className='mr-2 h-4 w-4' />
                    QR Code
                  </Button>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AttendanceOverview = () => {
  const { events, attendances, eventsLoading, attendancesLoading, eventsError, attendancesError } = useDashboardData();
  const [analytics, setAnalytics] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    // ===== BACKEND COMMUNICATION =====
    setLoading(eventsLoading || attendancesLoading);
    const err = eventsError || attendancesError;
    setError(err || '');
    // ===== FRONTEND INTERACTION =====
    const records = Array.isArray(attendances) ? attendances : [];
    const evts = Array.isArray(events) ? events : [];
    const byEvent = new Map();
    records.forEach((r) => {
      const eventId = r.event?.id || r.event || r.event_id;
      if (!eventId) return;
      const entry = byEvent.get(eventId) || { attended: 0, registered: 0 };
      entry.registered += 1;
      if (['checked_in', 'checked_out', 'present'].includes(r.status)) entry.attended += 1;
      byEvent.set(eventId, entry);
    });
    const data = evts.slice(0, 6).map((e) => {
      const agg = byEvent.get(e.id) || { attended: 0, registered: 0 };
      const rate = agg.registered ? Math.round((agg.attended / agg.registered) * 100) : 0;
      const status = rate >= 90 ? 'excellent' : rate >= 75 ? 'good' : rate >= 60 ? 'fair' : 'poor';
      return { event: e.title, registered: agg.registered, attended: agg.attended, rate, status };
    });
    setAnalytics(data);
  }, [events, attendances, eventsLoading, attendancesLoading, eventsError, attendancesError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <BarChart3 className='h-5 w-5' />
          Attendance Analytics
        </CardTitle>
        <CardDescription>Attendance rates for your recent events</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className='space-y-2'>
            {[1,2,3,4].map((i)=> <Skeleton key={i} className='h-6 w-full' />)}
          </div>
        )}
        {error && !loading && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>Error loading analytics: {error}</AlertDescription>
          </Alert>
        )}
        {!loading && !error && (
        <div className='space-y-4'>
          {analytics.map((data, index) => (
            <div key={index} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>{data.event}</span>
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground text-sm'>
                    {data.attended}/{data.registered}
                  </span>
                  <Badge
                    variant={
                      data.status === 'excellent'
                        ? 'default'
                        : data.status === 'good'
                          ? 'secondary'
                          : data.status === 'fair'
                            ? 'outline'
                            : 'destructive'
                    }
                  >
                    {data.rate}%
                  </Badge>
                </div>
              </div>
              <Progress
                value={data.rate}
                className={`h-2 ${
                  data.status === 'excellent'
                    ? 'text-green-600'
                    : data.status === 'good'
                      ? 'text-blue-600'
                      : data.status === 'fair'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                }`}
              />
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
};

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'registration',
      message: 'New registration for Tech Innovation Summit',
      timestamp: '5 minutes ago',
      icon: Users,
      severity: 'info',
    },
    {
      id: 2,
      type: 'event_updated',
      message: 'Career Workshop details updated',
      timestamp: '1 hour ago',
      icon: Edit,
      severity: 'success',
    },
    {
      id: 3,
      type: 'attendance_marked',
      message: 'Attendance recorded for AI Workshop',
      timestamp: '2 hours ago',
      icon: CheckCircle,
      severity: 'success',
    },
    {
      id: 4,
      type: 'low_attendance',
      message: 'Low attendance alert for Leadership Training',
      timestamp: '1 day ago',
      icon: AlertCircle,
      severity: 'warning',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Clock className='h-5 w-5' />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest updates on your events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {activities.map((activity) => (
            <div key={activity.id} className='flex items-start gap-3'>
              <div
                className={`rounded-full p-2 ${
                  activity.severity === 'success'
                    ? 'bg-green-100 text-green-600'
                    : activity.severity === 'warning'
                      ? 'bg-yellow-100 text-yellow-600'
                      : activity.severity === 'error'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                }`}
              >
                <activity.icon className='h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-medium'>{activity.message}</p>
                <p className='text-muted-foreground text-xs'>{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const EventTemplates = () => {
  // No templates available yet; backend integration pending

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileText className='h-5 w-5' />
          Event Templates
        </CardTitle>
        <CardDescription>Reusable templates for quick event creation</CardDescription>
      </CardHeader>
        <CardContent>
          <div className='text-muted-foreground text-sm'>No templates available.</div>
        </CardContent>
    </Card>
  );
};

export function OrganizerDashboard({ user }) {
  return (
    <div className='space-y-6'>
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='events'>My Events</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
          <TabsTrigger value='templates'>Templates</TabsTrigger>
          <TabsTrigger value='settings'>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <OrganizerStats />
        </TabsContent>

        <TabsContent value='events' className='space-y-4'>
          <MyEvents />
        </TabsContent>

        <TabsContent value='analytics' className='space-y-4'>
          <div className='grid gap-4 lg:grid-cols-2'>
            <AttendanceOverview />
            <RecentActivity />
          </div>
        </TabsContent>

        <TabsContent value='templates' className='space-y-4'>
          <EventTemplates />
        </TabsContent>

        <TabsContent value='settings' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Organizer Settings</CardTitle>
              <CardDescription>Manage your event organization preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <label className='text-sm font-medium'>Organization</label>
                  <p className='text-muted-foreground'>{user?.department}</p>
                </div>
                <div>
                  <label className='text-sm font-medium'>Role</label>
                  <p className='text-muted-foreground capitalize'>{user?.role}</p>
                </div>
                <div>
                  <label className='text-sm font-medium'>Email</label>
                  <p className='text-muted-foreground'>{user?.email}</p>
                </div>
                <div>
                  <label className='text-sm font-medium'>Events Created</label>
                  <p className='text-muted-foreground'>12 total events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Features development (below tabs) */}
      <Card>
        <CardHeader>
          <CardTitle>Features development</CardTitle>
          <CardDescription>Planned additions for organizers</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-muted-foreground space-y-3'>
            <p className='font-medium'>Features in development:</p>
            <ul className='space-y-2 text-sm'>
              <li>
                • <strong>Event Wizards:</strong> Guided creation with templates, checklists, and validations
              </li>
              <li>
                • <strong>QR Operations:</strong> Batch QR generation and secure sharing for sessions
              </li>
              <li>
                • <strong>Registration Controls:</strong> Waitlists, caps, and automated notifications
              </li>
              <li>
                • <strong>Analytics at a glance:</strong> Trends, no-shows, and engagement breakdowns
              </li>
              <li>
                • <strong>Bulk Actions:</strong> Duplicate events, schedule series, and export attendees
              </li>
            </ul>
            <p className='border-t pt-4 text-xs'>
              These organizer-focused tools streamline planning and monitoring across events.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OrganizerDashboard;
