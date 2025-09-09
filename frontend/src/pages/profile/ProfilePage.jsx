import React from 'react';
import BasicInfoTab from './BasicInfoTab.jsx';
import DocumentTab from './DocumentTab.jsx';
import PreferenceTab from './PreferenceTab.jsx';
import SecurityTab from './SecurityTab.jsx';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = React.useState('basic');

  return (
    <DashboardLayout currentPage='Profile' showSearch={false} showNotifications>
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold tracking-tight'>Your Profile</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Manage your personal information, documents, preferences, and security settings.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='basic'>Basic Info</TabsTrigger>
            <TabsTrigger value='documents'>Documents</TabsTrigger>
            <TabsTrigger value='preferences'>Preferences</TabsTrigger>
            <TabsTrigger value='security'>Security</TabsTrigger>
          </TabsList>

          <TabsContent value='basic' className='mt-6'>
            <BasicInfoTab />
          </TabsContent>
          <TabsContent value='documents' className='mt-6'>
            <DocumentTab />
          </TabsContent>
          <TabsContent value='preferences' className='mt-6'>
            <PreferenceTab />
          </TabsContent>
          <TabsContent value='security' className='mt-6'>
            <SecurityTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
