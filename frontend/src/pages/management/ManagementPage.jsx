import { Users, Calendar, UserCheck } from 'lucide-react';
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AttendanceManagement from './AttendanceTab';
import EventManagement from './EventTab';
import UserManagement from './UserTab';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { ManagementDataProvider } from '@/contexts/management-data-context';
import { ManualEntryProvider, useManualEntry } from '@/contexts/manual-entry-context';

const ManagementOverviewInner = () => {
  useAuth();
  const [activeTab, setActiveTab] = useState('attendance');
  const { registerTabController } = useManualEntry();

  // register tab switcher so other components can switch to attendance
  React.useEffect(() => {
    registerTabController(setActiveTab);
  }, [registerTabController]);

  return (
    <div className='space-y-6'>
      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='attendance' className='flex items-center gap-2'>
            <UserCheck className='h-4 w-4' />
            Attendance
          </TabsTrigger>
          <TabsTrigger value='users' className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Users
          </TabsTrigger>
          <TabsTrigger value='events' className='flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value='attendance' className='mt-6'>
          <AttendanceManagement />
        </TabsContent>

        <TabsContent value='users' className='mt-6'>
          <UserManagement />
        </TabsContent>

        <TabsContent value='events' className='mt-6'>
          <EventManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ManagementOverview = () => (
  <ManualEntryProvider>
    <ManagementDataProvider>
      <ManagementOverviewInner />
    </ManagementDataProvider>
  </ManualEntryProvider>
);

const Management = () => {
  return (
    <Routes>
      <Route
        path='/*'
        element={
          <DashboardLayout currentPage='Management'>
            <ManagementOverview />
          </DashboardLayout>
        }
      />
    </Routes>
  );
};

export default Management;
export { Management };
