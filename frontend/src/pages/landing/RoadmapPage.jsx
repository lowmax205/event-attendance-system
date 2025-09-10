import { Check, Clock, AlertCircle, Target } from 'lucide-react';
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// NOTE: Refactored to align visual language with HomePage & EventPage: gradient hero, semantic color tokens, Card primitives, no raw Tailwind palette (green-500, etc.).

/**
 * Roadmap milestone component
 */
const MilestoneCard = ({ milestone }) => {
  const statusConfig = {
    completed: {
      icon: <Check className='text-success h-5 w-5' />,
      badge: 'bg-success/15 text-success',
      surface: 'border-success/30 bg-success/5 dark:bg-success/10',
    },
    'in-progress': {
      icon: <Clock className='text-warning h-5 w-5' />,
      badge: 'bg-warning/15 text-warning',
      surface: 'border-warning/30 bg-warning/5 dark:bg-warning/10',
    },
    upcoming: {
      icon: <Target className='text-info h-5 w-5' />,
      badge: 'bg-info/15 text-info',
      surface: 'border-info/30 bg-info/5 dark:bg-info/10',
    },
    default: {
      icon: <AlertCircle className='text-muted-foreground h-5 w-5' />,
      badge: 'bg-muted text-muted-foreground',
      surface: 'border-border bg-card',
    },
  };
  const cfg = statusConfig[milestone.status] || statusConfig.default;

  return (
    <Card className={`relative overflow-hidden border ${cfg.surface}`}>
      {' '}
      {/* tinted surface */}
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='flex-shrink-0'>{cfg.icon}</div>
            <div>
              <CardTitle className='text-base'>{milestone.title}</CardTitle>
              <p className='text-muted-foreground mt-0.5 text-xs'>{milestone.timeline}</p>
            </div>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-medium tracking-wide capitalize ${cfg.badge}`}
          >
            {milestone.status.replace('-', ' ')}
          </span>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <CardDescription className='mb-3 text-sm leading-relaxed'>
          {milestone.description}
        </CardDescription>
        {milestone.features?.length > 0 && (
          <div className='space-y-1'>
            <p className='text-foreground/80 text-xs font-medium'>Key Features:</p>
            <ul className='space-y-1'>
              {milestone.features.map((f, i) => (
                <li key={i} className='text-muted-foreground flex items-start gap-2 text-xs'>
                  <span className='bg-primary/60 mt-1 inline-block h-1.5 w-1.5 rounded-full' />
                  <span className='leading-relaxed'>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Main Roadmap Page Component
 */
const RoadmapPage = () => {
  // Roadmap data
  const roadmapData = [
    {
      title: 'Planning & Discovery',
      timeline: 'Feb – Apr 2025',
      status: 'completed',
      description:
        'Initial planning, requirements gathering, architecture outline, and success criteria definition.',
      features: [
        'Use cases and roles mapping (student, organizer, admin)',
        'Data model sketch for users, events, attendance, campuses',
        'API surface and authentication approach (JWT)',
        'UI sitemap and navigation flows',
      ],
    },
    {
      title: 'Phase 1: Project Scaffold & UI Primitives',
      timeline: 'May 2025',
      status: 'completed',
      description:
        'Established the frontend foundation with modern React architecture and shared UI building blocks.',
      features: [
        'React 18 + Vite + alias-based imports (@)',
        'Tailwind theme tokens (light/dark) with shadcn/ui primitives',
        'Routing, layouts, and shared components (cards, tables, forms)',
        'Auth UI (login/register) and app shell (sidebar, headers)',
      ],
    },
    {
      title: 'Attendance Demo Flow',
      timeline: 'May 2025',
      status: 'completed',
      description:
        'Built an early demo for attendance flow to validate UX and data needs before full verification features.',
      features: [
        'Basic check-in demo with QR timing concept',
        'Preliminary proximity messaging and validations',
        'Demo wiring into event details page',
      ],
    },
    {
      title: 'Theming & Architecture Refinement',
      timeline: 'Jun 2025',
      status: 'completed',
      description:
        'Improved frontend foundation with dynamic theme switching and system preference support.',
      features: [
        'System preference theme (light/dark) with smooth transitions',
        'Component structure cleanup and hook extraction',
        'Consistent tokenized colors; removed hardcoded palette usage',
      ],
    },
    {
      title: 'Phase 2: Backend API & Auth (DRF + JWT)',
      timeline: 'Jun 2025',
      status: 'completed',
      description:
        'Django REST Framework with JWT, role-based permissions, and core domain apps wired with tests.',
      features: [
        'JWT auth (access/refresh) and RBAC permissions',
        'Apps complete: account, campuses, events, attendances, core, health',
        'CRUD endpoints with pagination; consistent error handling',
        'SQLite (dev) / PostgreSQL (prod) configuration & migrations',
      ],
    },
    {
      title: 'Phase 3: Management CRUD (Users, Events, Attendance, Profile)',
      timeline: 'Jun 2025',
      status: 'completed',
      description:
        'End-to-end CRUD flows using paginated tables, filters, and modals — aligned to backend API and RBAC.',
      features: [
        'Management pages: Users, Events, Attendance, User Profile',
        'PaginatedTable, FilterBar, Metrics cards, role-guarded actions',
        'Create/Edit/Delete dialogs with validation and toasts',
        'Consistent loading/empty/error states across lists',
      ],
    },
    {
      title: 'Phase 4: Attendance Verification Flow',
      timeline: 'Jul 2025',
      status: 'completed',
      description:
        'Student check-in/out with GPS proximity, QR timing, photo capture (front/back), and signature — with admin/organizer overrides.',
      features: [
        'QR expiry handling and event time-window checks',
        'Geolocation verification with distance badge and override path',
        'Camera capture with countdown, file fallback, and upload progress',
        'Signature pad with responsive canvas sizing and SVG preview',
      ],
    },
    {
      title: 'Phase 5: Frontend–Backend Integration',
      timeline: 'Aug 2025',
      status: 'completed',
      description:
        'Replaced mock paths with real API calls, unified error/loading states, and finalized token handling.',
      features: [
        'apiService wiring for lists/detail/create/update/delete',
        'Auth token attach/refresh and 401 handling (logout/redirect)',
        'Client pagination, filtering, and empty/error states',
        'Normalization of API responses used in UI',
      ],
    },
    {
      title: 'Phase 6: Deployment & Runtime Readiness',
      timeline: 'In Progress · Sep 2025',
      status: 'in-progress',
      description:
        'Harden environments and ship using Vercel (frontend) and Render (backend): CORS, env vars, and observability.',
      features: [
        'Vercel deploy (frontend) and Render deploy (backend)',
        'CORS tightening and secure cookie/session settings',
        'Environment variables for secrets and endpoints',
        'Basic CI for tests and lint; health endpoints wired',
        'Release checklist, smoke tests, and rollback plan',
      ],
    },
    {
      title: 'Phase 7: Post‑MVP Enhancements',
      timeline: 'Planned · Q4 2025+',
      status: 'upcoming',
      description:
        'Optional modules after MVP: analytics, reports, and mobile experiences driven by real usage.',
      features: [
        'Analytics and reporting dashboards',
        'CSV exports and advanced filters',
        'SIS/LDAP integration (subject to approval)',
        'Mobile QR scanning flows (React Native) — exploratory',
      ],
    },
    // Feature tracks sourced from existing pages (admin dashboard, analytics, help, data-library, reports, settings)
    {
      title: 'Admin Dashboard & Insights',
      timeline: 'Planned · Q4 2025',
      status: 'upcoming',
      description:
        'Centralized visibility for administrators with live metrics and quick controls.',
      features: [
        'Real-time metrics with auto-refresh tiles',
        'Quick actions: user management, event approvals, audits',
        'Health indicators: API latency, DB status, background jobs',
        'Role insights: counts by role, active sessions, recent signups',
        'Export & reports from overview',
      ],
    },
    {
      title: 'Analytics & Website Insights',
      timeline: 'Planned · Q4 2025',
      status: 'upcoming',
      description: 'High-level analytics for usage patterns and site traffic to inform operations.',
      features: [
        'Website analytics overview',
        'Hardware usage insights (device/browser breakdown)',
        'Time-series charts with filters',
        'Export charts as images/CSV',
      ],
    },
    {
      title: 'Help & Support Center',
      timeline: 'Planned · Q4 2025',
      status: 'upcoming',
      description: 'Self-serve help with searchable FAQ, tutorials, and feedback channel.',
      features: [
        'Searchable FAQ with categories',
        'Step-by-step tutorials and user guides',
        'Video tutorials for key flows',
        'Troubleshooting guides',
        'Feedback / feature request submission',
      ],
    },
    {
      title: 'Data Library & System Logs',
      timeline: 'Planned · Q4 2025',
      status: 'upcoming',
      description: 'Operational data access with export capabilities and audit-friendly views.',
      features: [
        'System logs viewer with filters and pagination',
        'Export logs (CSV) with basic search',
        'Retention policy notes and download disclaimers',
      ],
    },
    {
      title: 'Reports & Exports',
      timeline: 'Planned · Q4 2025',
      status: 'upcoming',
      description: 'Structured exports for Attendance and Campuses with date/range filters.',
      features: [
        'Attendance export (CSV) with filters',
        'Campuses export and reference data dumps',
        'Consistent download UX and progress feedback',
      ],
    },
    {
      title: 'Settings (User & System)',
      timeline: 'Planned · Q4 2025',
      status: 'upcoming',
      description: 'Consolidated configuration area for personal preferences and system options.',
      features: [
        'User settings: preferences, profile, security',
        'System settings: toggles for features and theming',
        'Role-gated access with audit trail for critical changes',
      ],
    },
  ];

  // Derived metrics
  const completedCount = roadmapData.filter((m) => m.status === 'completed').length;
  const inProgressCount = roadmapData.filter((m) => m.status === 'in-progress').length;
  const remainingCount = roadmapData.filter((m) => m.status === 'upcoming').length;

  return (
    <div className='bg-background text-foreground min-h-screen'>
      {/* Hero (consistent gradient + messaging) */}
      <section className='text-primary-foreground from-primary to-primary/50 bg-gradient-to-r'>
        <div className='mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-3xl text-center'>
            <h1 className='mb-6 text-4xl font-bold tracking-tight md:text-5xl'>
              Development Roadmap
            </h1>
            <p className='text-primary-foreground/90 mx-auto mb-8 max-w-2xl text-lg leading-relaxed md:text-xl'>
              Track the journey bringing the SNSU Event Attendance System from initial planning to
              MVP and deployment readiness.
            </p>
            <div className='mx-auto grid max-w-md grid-cols-3 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold'>{completedCount}</div>
                <div className='text-xs opacity-80'>Completed</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold'>{inProgressCount}</div>
                <div className='text-xs opacity-80'>In Progress</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold'>{remainingCount}</div>
                <div className='text-xs opacity-80'>Remaining</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Metrics */}
      <div className='mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8'>
        <div className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-4'>
          <Card className='text-center'>
            <CardHeader className='pb-4'>
              <div className='bg-success/15 text-success mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                <Check className='h-8 w-8' />
              </div>
              <CardTitle className='text-2xl'>{completedCount}</CardTitle>
              <CardDescription className='text-sm'>Phases Completed</CardDescription>
            </CardHeader>
          </Card>
          <Card className='text-center'>
            <CardHeader className='pb-4'>
              <div className='bg-warning/15 text-warning mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                <Clock className='h-8 w-8' />
              </div>
              <CardTitle className='text-2xl'>{inProgressCount}</CardTitle>
              <CardDescription className='text-sm'>Phase In Progress</CardDescription>
            </CardHeader>
          </Card>
          <Card className='text-center'>
            <CardHeader className='pb-4'>
              <div className='bg-info/15 text-info mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                <Target className='h-8 w-8' />
              </div>
              <CardTitle className='text-2xl'>{remainingCount}</CardTitle>
              <CardDescription className='text-sm'>Core Phases Remaining</CardDescription>
            </CardHeader>
          </Card>
          <Card className='text-center'>
            <CardHeader className='pb-4'>
              <div className='bg-accent/40 text-accent-foreground mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                <AlertCircle className='h-8 w-8' />
              </div>
              <CardTitle className='text-2xl'>Q4 2025</CardTitle>
              <CardDescription className='text-sm'>MVP Target</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Timeline Section */}
        <div className='mb-10 text-center'>
          <h2 className='mb-4 text-3xl font-bold md:text-4xl'>Development Timeline</h2>
          <p className='text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed'>
            Week-by-week progression of major milestones and feature delivery for the SNSU Event
            Attendance System.
          </p>
        </div>

        <div className='space-y-6'>
          {roadmapData.map((milestone, i) => (
            <MilestoneCard key={i} milestone={milestone} />
          ))}
        </div>

        {/* Current Sprint Highlight */}
        <Card className='mt-16 text-center'>
          <CardHeader className='pb-4'>
            <CardTitle className='text-xl'>
              Current Sprint: Deployment & Runtime Readiness
            </CardTitle>
            <CardDescription className='mx-auto max-w-2xl'>
              Shipping to production with Vercel (frontend) and Render (backend): environment
              configuration, CORS/security hardening, and release checks.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div className='bg-success/5 rounded-md border p-4 text-left'>
                <h3 className='text-success mb-1 font-semibold'>✅ Integration Done</h3>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  Client ↔ API integration complete with auth handling and normalized states.
                </p>
              </div>
              <div className='bg-warning/5 rounded-md border p-4 text-left'>
                <h3 className='text-warning mb-1 font-semibold'>🚧 Runtime Hardening</h3>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  CORS, env vars, CI checks, and smoke tests prior to release.
                </p>
              </div>
              <div className='bg-info/5 rounded-md border p-4 text-left'>
                <h3 className='text-info mb-1 font-semibold'>🎯 MVP Target: Sep 2025</h3>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  Deploy via Vercel & Render with basic observability and rollback plan.
                </p>
              </div>
            </div>
            <div className='text-muted-foreground space-y-1 text-xs'>
              <p>Scope: Integration complete → deployment hardening & release checks</p>
              <p>
                Built & maintained by Nilo Jr. Olang —
                <a
                  href='https://github.com/lowmax205'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary ml-1 underline-offset-4 hover:underline'
                >
                  GitHub Profile
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { RoadmapPage };
export default RoadmapPage;
