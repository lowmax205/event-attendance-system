import React from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import StatusPage from '@/pages/error/StatusPage';

const HelpPage = () => {
  const features = [
    'Comprehensive FAQ section with searchable content',
    'Step-by-step tutorials and user guides',
    'Video tutorials for key features',
    'Troubleshooting guides',
    'Feature request and feedback submission',
  ];

  return (
    <DashboardLayout currentPage='Get Help' showSearch={true} showNotifications={true}>
      <StatusPage
        title='Help & Support Center'
        description='A comprehensive help system is being developed to provide users with documentation, tutorials, and support resources.'
        status='coming-soon'
        features={features}
        showReturnButton={false}
      />
    </DashboardLayout>
  );
};

export default HelpPage;
