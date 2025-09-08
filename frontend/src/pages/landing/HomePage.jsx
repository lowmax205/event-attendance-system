/**
 * HomePage - Landing page component with features showcase and call-to-action
 */

import SNSULogo from '@assets/images/SNSU-Logo.png';
import { APP_NAME, APP_DESCRIPTION, UNIVERSITY_NAME } from '@components/common/constants';
import {
  CheckCircle,
  Smartphone,
  MapPin,
  Camera,
  BarChart3,
  Shield,
  ArrowRight,
  QrCode,
  UserCheck,
  ClipboardCheck,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { logUserInteraction } from '@/lib/dev-logger';

/** Feature Card (refactored to Card primitive + token classes) */
const FeatureCard = ({ icon, title, description }) => {
  const iconMap = {
    CheckCircle: <CheckCircle className='text-primary h-8 w-8' />,
    Smartphone: <Smartphone className='text-primary h-8 w-8' />,
    MapPin: <MapPin className='text-primary h-8 w-8' />,
    Camera: <Camera className='text-primary h-8 w-8' />,
    BarChart3: <BarChart3 className='text-primary h-8 w-8' />,
    Shield: <Shield className='text-primary h-8 w-8' />,
  };
  return (
    <Card className='h-full transition-shadow hover:shadow-md'>
      <CardHeader className='pb-4'>
        <div className='bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg'>
          {iconMap[icon]}
        </div>
        <CardTitle className='text-lg'>{title}</CardTitle>
        <CardDescription className='leading-relaxed'>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
};

/** Step Card (refactored to Card) */
const StepCard = ({ iconKey, title, description }) => {
  const iconWrap = 'relative flex items-center justify-center h-16 w-16';
  const badgeIcon =
    'absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground p-0.5';
  const iconColor = 'text-primary';
  const iconMap = {
    scan: (
      <div className={iconWrap}>
        <QrCode className={`h-11 w-11 ${iconColor}`} />
        <Camera className={badgeIcon} />
      </div>
    ),
    verify: (
      <div className={iconWrap}>
        <MapPin className={`h-11 w-11 ${iconColor}`} />
        <UserCheck className={badgeIcon} />
      </div>
    ),
    record: (
      <div className='flex h-16 w-16 items-center justify-center'>
        <ClipboardCheck className={`h-11 w-11 ${iconColor}`} />
      </div>
    ),
  };
  return (
    <Card className='text-center'>
      <CardHeader className='pb-4'>
        <div className='bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
          {iconMap[iconKey]}
        </div>
        <CardTitle className='text-lg'>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
};

const HomePage = () => {
  const handleNavigation = (destination) => {
    logUserInteraction('HomePage', 'navigation', {
      destination,
      timestamp: new Date().toISOString(),
    });
  };

  const features = [
    {
      icon: 'CheckCircle',
      title: 'Digital Attendance',
      description: 'QR code-based check-in and check-out system for accurate attendance tracking.',
    },
    {
      icon: 'Smartphone',
      title: 'Mobile Friendly',
      description: 'Responsive design that works seamlessly on all devices and screen sizes.',
    },
    {
      icon: 'MapPin',
      title: 'Location Verification',
      description:
        'GPS-based location verification ensures students are physically present at events.',
    },
    {
      icon: 'Camera',
      title: 'Photo Verification',
      description:
        'Optional photo capture during check-in for additional security and verification.',
    },
    {
      icon: 'BarChart3',
      title: 'Analytics Dashboard',
      description: 'Comprehensive reporting and analytics for administrators and organizers.',
    },
    {
      icon: 'Shield',
      title: 'Secure & Private',
      description: 'Enterprise-grade security with role-based access control and data protection.',
    },
  ];

  const steps = [
    {
      iconKey: 'scan',
      title: 'Scan QR Code',
      description:
        'Students scan the unique QR code displayed at the event venue using their mobile device.',
    },
    {
      iconKey: 'verify',
      title: 'Verify Location & Identity',
      description:
        'System verifies GPS location and captures selfie with event background for authentication.',
    },
    {
      iconKey: 'record',
      title: 'Record Attendance',
      description:
        'Attendance is automatically recorded and real-time reports are updated instantly.',
    },
  ];

  return (
    <div className='bg-background text-foreground min-h-screen'>
      {/* Hero */}
      <section className='text-primary-foreground from-primary to-primary/50 flex min-h-screen items-center bg-gradient-to-r'>
        <div className='mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8'>
          <div className='grid w-full grid-cols-1 items-center justify-items-center gap-12 lg:grid-cols-2'>
            <div className='text-center lg:text-left'>
              <h1 className='mx-auto mb-6 max-w-lg text-4xl font-bold tracking-tight lg:mx-0'>
                {APP_NAME}
              </h1>
              <p className='text-primary-foreground/90 mx-auto mb-8 max-w-lg text-lg leading-relaxed lg:mx-0'>
                {APP_DESCRIPTION}
              </p>
              <div className='flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start'>
                <Button asChild size='lg' className='tracking-wide'>
                  <Link to='/events' onClick={() => handleNavigation('/events')}>
                    Browse Events <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
                <Button asChild variant='secondary' size='lg' className='tracking-wide'>
                  <Link to='/roadmap' onClick={() => handleNavigation('/roadmap')}>
                    View Roadmap
                  </Link>
                </Button>
              </div>
            </div>
            <div className='flex justify-center'>
              <div className='bg-primary-foreground ring-border rounded-full p-2 shadow-sm ring-1'>
                <img src={SNSULogo} alt={UNIVERSITY_NAME} className='h-56 w-auto md:h-64' />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mb-16 text-center'>
            <h2 className='mb-4 text-3xl font-bold md:text-4xl'>Powerful Features</h2>
            <p className='text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed md:text-xl'>
              Everything you need for efficient event attendance management.
            </p>
          </div>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {features.map((f, i) => (
              <FeatureCard key={i} icon={f.icon} title={f.title} description={f.description} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='bg-muted/30 border-t py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mb-16 text-center'>
            <h2 className='mb-4 text-3xl font-bold md:text-4xl'>How It Works</h2>
            <p className='text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed md:text-xl'>
              Simple and secure attendance process in just three steps.
            </p>
          </div>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            {steps.map((step, idx) => (
              <StepCard
                key={idx}
                iconKey={step.iconKey}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export { HomePage };
export default HomePage;
