import React from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import StatusPage from '@/pages/error/StatusPage';

const AnalyticsPage = () => {
  const features = [
    'Real-time attendance analytics and insights',
    'Interactive charts and data visualizations',
    'Student engagement metrics',
    'Date range filtering',
  ];

  return (
    <DashboardLayout currentPage='Analytics' showSearch={true} showNotifications={true}>
      <StatusPage
        title='Analytics Dashboard'
        description='Analytics and insights for event attendance data are being developed to provide you with comprehensive reporting capabilities.'
        status='coming-soon'
        features={features}
        showReturnButton={false}
      />
    </DashboardLayout>
  );
};

export default AnalyticsPage;
