import React from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import StatusPage from '@/pages/error/StatusPage';

const ReportPage = () => {
  const features = [
    'Automated attendance report generation',
    'Multi-format export options (PDF, Excel, Word)',
    'Real-time and historical reporting',
  ];

  return (
    <DashboardLayout currentPage='Reports' showSearch={true} showNotifications={true}>
      <StatusPage
        title='Reports Center'
        description='A powerful reporting system is being developed to generate comprehensive attendance reports and insights for administrators and organizers.'
        status='coming-soon'
        features={features}
        showReturnButton={false}
      />
    </DashboardLayout>
  );
};

export default ReportPage;
