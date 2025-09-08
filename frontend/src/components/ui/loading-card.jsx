import { Calendar } from 'lucide-react';
import React from 'react';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';

function LoadingCard({ title = 'Loading…', description = 'Please wait while we load the data.' }) {
  return (
    <Card className='py-12 text-center'>
      <CardContent className='flex flex-col items-center gap-4'>
        <Calendar className='text-muted-foreground h-16 w-16 animate-pulse' />
        <CardTitle className='text-xl'>{title}</CardTitle>
        {description && (
          <CardDescription className='mx-auto max-w-md'>{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}

export default LoadingCard;
export { LoadingCard };
