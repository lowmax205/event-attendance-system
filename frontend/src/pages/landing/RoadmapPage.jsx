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
      title: 'Phase 1: Frontend Foundation & UI Design',
      timeline: 'Completed - May 25 - June 10, 2025',
      status: 'completed',
      description:
        'Established the complete frontend foundation with modern React architecture, theme system, and comprehensive UI components.',
      features: [
        'React 18 + Vite development environment setup',
        'TailwindCSS theme system (Light/Dark/System modes)',
        'Responsive component architecture',
        'Authentication UI components and flows',
        'Complete page layouts and navigation system',
      ],
    },
    {
      title: 'Phase 2: Mock Data Integration & UI Testing',
      timeline: 'Completed - June 11 - July 5, 2025',
      status: 'completed',
      description:
        'Full frontend functionality implementation using mock data for comprehensive UI testing and user experience validation.',
      features: [
        'Mock data services for all major features',
        'Event management interface with mock data',
        'Attendance tracking UI with simulated data',
        'User profile and management interfaces',
        'Analytics and reporting dashboard mockups',
      ],
    },
    {
      title: 'Phase 3: Django Backend Development',
      timeline: 'In Progress - July 6 - July 25, 2025',
      status: 'in-progress',
      description:
        'Development of robust Django REST API backend to replace mock data with real database operations and business logic.',
      features: [
        'Django REST Framework API setup',
        'User authentication and authorization system',
        'Event management backend models and APIs',
        'Attendance tracking system with database persistence',
        'Role-based access control implementation',
      ],
    },
    {
      title: 'Phase 4: Frontend-Backend Integration',
      timeline: 'July 26 - August 5, 2025',
      status: 'upcoming',
      description:
        'Replace mock data services with real API calls to Django backend, ensuring seamless data flow and error handling.',
      features: [
        'API service layer implementation',
        'Real-time data synchronization',
        'Error handling and loading states',
        'Authentication token management',
        'Data caching and optimization strategies',
      ],
    },
    {
      title: 'Phase 5: Testing & Production Deployment',
      timeline: 'August 6 - August 17, 2025',
      status: 'upcoming',
      description:
        'Final testing, bug fixes, and production deployment with SNSU system integration and security implementation.',
      features: [
        'Comprehensive system testing and QA',
        'Bug fixes and performance optimization',
        'Production server deployment and configuration',
        'SSL certificates and security implementation',
        'Final user acceptance testing',
      ],
    },
    {
      title: 'Phase 6: Future Enhancements (Post-Launch)',
      timeline: 'September 2025 onwards',
      status: 'upcoming',
      description:
        'Post-launch improvements including analytics and reporting, SNSU system integration, and additional features.',
      features: [
        'Analytics and reporting dashboard',
        'SNSU Student Information System integration',
        'LDAP authentication integration',
        'Email notifications and reminder system',
        'Search and filtering capabilities',
      ],
    },
    {
      title: 'Phase 7: Mobile Application Development',
      timeline: 'Q4 2025',
      status: 'upcoming',
      description:
        'Mobile application development for better accessibility and user engagement on mobile devices.',
      features: [
        'React Native mobile application',
        'Push notifications for events and updates',
        'QR code scanner for mobile attendance',
        'Accessibility features',
      ],
    },
  ];

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
              Track the accelerated 11-week journey bringing the SNSU Event Attendance System from
              design foundation to full production deployment.
            </p>
            <div className='mx-auto grid max-w-md grid-cols-3 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold'>2</div>
                <div className='text-xs opacity-80'>Completed</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold'>1</div>
                <div className='text-xs opacity-80'>In Progress</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold'>4</div>
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
              <CardTitle className='text-2xl'>2</CardTitle>
              <CardDescription className='text-sm'>Phases Completed</CardDescription>
            </CardHeader>
          </Card>
          <Card className='text-center'>
            <CardHeader className='pb-4'>
              <div className='bg-warning/15 text-warning mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                <Clock className='h-8 w-8' />
              </div>
              <CardTitle className='text-2xl'>1</CardTitle>
              <CardDescription className='text-sm'>Phase In Progress</CardDescription>
            </CardHeader>
          </Card>
          <Card className='text-center'>
            <CardHeader className='pb-4'>
              <div className='bg-info/15 text-info mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                <Target className='h-8 w-8' />
              </div>
              <CardTitle className='text-2xl'>4</CardTitle>
              <CardDescription className='text-sm'>Core Phases Remaining</CardDescription>
            </CardHeader>
          </Card>
          <Card className='text-center'>
            <CardHeader className='pb-4'>
              <div className='bg-accent/40 text-accent-foreground mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                <AlertCircle className='h-8 w-8' />
              </div>
              <CardTitle className='text-2xl'>Aug 17</CardTitle>
              <CardDescription className='text-sm'>Target Completion</CardDescription>
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
            <CardTitle className='text-xl'>Current Sprint: Django Backend Development</CardTitle>
            <CardDescription className='mx-auto max-w-2xl'>
              Transitioning from mock interfaces to a fully integrated Django REST API with secure
              auth, event management, and attendance recording.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <div className='bg-success/5 rounded-md border p-4 text-left'>
                <h3 className='text-success mb-1 font-semibold'>✅ Frontend Complete</h3>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  UI & mock data layers finalized (May 25 - Jul 5)
                </p>
              </div>
              <div className='bg-warning/5 rounded-md border p-4 text-left'>
                <h3 className='text-warning mb-1 font-semibold'>🚧 Backend In Progress</h3>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  Django REST implementation (Jul 6 - Jul 25)
                </p>
              </div>
              <div className='bg-info/5 rounded-md border p-4 text-left'>
                <h3 className='text-info mb-1 font-semibold'>🎯 Target: Aug 17</h3>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  Prod deployment & QA completion
                </p>
              </div>
            </div>
            <div className='text-muted-foreground space-y-1 text-xs'>
              <p>Project Timeline: May 25 - Aug 17, 2025 (11 weeks)</p>
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
