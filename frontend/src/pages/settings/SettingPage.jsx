import React from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import StatusPage from '@/pages/error/StatusPage';

const SettingPage = () => {
  const features = [
    'System configuration and preference options',
    'Security settings and password management',
    'Theme and appearance preferences',
    'Language and localization settings',
    'Data privacy and export controls',
    'Integration settings for external services',
  ];

  return (
    <DashboardLayout currentPage='Settings' showSearch={false} showNotifications={true}>
      <StatusPage
        title='System Settings'
        description='Comprehensive settings panel is being developed to allow users to configure their experience and manage system preferences.'
        status='coming-soon'
        features={features}
        showReturnButton={false}
      />
    </DashboardLayout>
  );
};

export default SettingPage;
