import React from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import StatusPage from '@/pages/error/StatusPage';

const DataLibraryPage = () => {
  const features = [
    'Centralized data repository for all attendance records',
    'Search and filtering capabilities',
    'Historical data archiving and management',
    'Bulk data import/export functionality',
  ];

  return (
    <DashboardLayout currentPage='Data Library' showSearch={true} showNotifications={true}>
      <StatusPage
        title='Data Library'
        description='A comprehensive data management system is being developed to provide centralized access to all attendance and event data.'
        status='coming-soon'
        features={features}
        showReturnButton={false}
      />
    </DashboardLayout>
  );
};

export default DataLibraryPage;
