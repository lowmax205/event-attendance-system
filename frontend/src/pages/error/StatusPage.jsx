import { Wrench, Clock, AlertTriangle } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StatusPage = ({
  title = 'Feature Under Development',
  description = 'This feature is currently being developed and will be available soon.',
  status = 'coming-soon', // 'coming-soon', 'maintenance', 'error'
  features = [],
  onRetry = null,
  showReturnButton = true,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'maintenance':
        return {
          icon: Wrench,
          variant: 'default',
          badgeText: 'Under Maintenance',
          badgeVariant: 'secondary',
          alertTitle: 'Scheduled Maintenance',
        };
      case 'error':
        return {
          icon: AlertTriangle,
          variant: 'destructive',
          badgeText: 'Service Error',
          badgeVariant: 'destructive',
          alertTitle: 'Service Temporarily Unavailable',
        };
      default: // coming-soon
        return {
          icon: Clock,
          variant: 'default',
          badgeText: 'Coming Soon',
          badgeVariant: 'default',
          alertTitle: 'Coming Soon',
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className='flex min-h-[60vh] flex-1 flex-col items-center justify-center px-4'>
      <div className='w-full max-w-2xl space-y-6'>
        {/* Main Status Card */}
        <Card className='text-center'>
          <CardHeader className='pb-4'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='bg-muted flex h-16 w-16 items-center justify-center rounded-full'>
                <IconComponent className='text-muted-foreground h-8 w-8' />
              </div>
              <div className='space-y-2'>
                <Badge variant={config.badgeVariant}>{config.badgeText}</Badge>
                <CardTitle className='text-2xl font-bold'>{title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-muted-foreground text-lg'>{description}</p>

            {features.length > 0 && (
              <div className='space-y-3 text-left'>
                <h3 className='text-center font-semibold'>{config.alertTitle}</h3>
                <ul className='space-y-2'>
                  {features.map((feature, index) => (
                    <li key={index} className='flex items-start space-x-2'>
                      <div className='bg-primary mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full' />
                      <span className='text-muted-foreground text-sm'>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className='flex flex-col justify-center gap-3 pt-4 sm:flex-row'>
              {onRetry && (
                <Button onClick={onRetry} variant='outline'>
                  Try Again
                </Button>
              )}
              {showReturnButton && (
                <Button onClick={() => window.history.back()} variant='default'>
                  Return to Previous Page
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatusPage;
