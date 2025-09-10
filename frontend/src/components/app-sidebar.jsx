import {
  BarChart3,
  Gauge,
  HelpCircle,
  FileChartColumn,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import * as React from 'react';

import { NavDocuments } from '@/components/nav-documents';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { Sidebar, SidebarContent } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/use-permissions';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Gauge,
      roles: ['admin', 'organizer', 'student'], // Available to all
    },
    {
      title: 'Management',
      url: '/management',
      icon: SlidersHorizontal,
      roles: ['admin', 'organizer'], // Restricted
    },
    {
      title: 'Analytics',
      url: '/analytics',
      icon: BarChart3,
      roles: ['admin', 'organizer'], // Restricted
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings,
      roles: ['admin', 'organizer'], // Restricted
    },
    {
      title: 'Get Help',
      url: '/help',
      icon: HelpCircle,
      roles: ['admin', 'organizer', 'student'], // Available to all
    },
  ],
  documents: [
    // {
    //   name: 'Data Library',
    //   url: '/data-library',
    //   icon: IconDatabase,
    //   roles: ['admin', 'organizer'], // Restricted
    // },
    {
      name: 'Reports',
      url: '/reports',
      icon: FileChartColumn,
      roles: ['admin', 'organizer', 'student'], // Available to all
    },
  ],
};

export function AppSidebar({ ...props }) {
  const { user } = useAuth();
  const { hasRole } = usePermissions();

  // Filter navigation items based on user role
  const filterItemsByRole = (items) => {
    if (!user?.role) return [];
    return items.filter((item) => !item.roles || hasRole(item.roles));
  };

  const filteredNavMain = filterItemsByRole(data.navMain);
  const filteredNavSecondary = filterItemsByRole(data.navSecondary);
  const filteredDocuments = filterItemsByRole(data.documents);

  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        {/* Only show documents section if there are items to show */}
        {filteredDocuments.length > 0 && <NavDocuments items={filteredDocuments} />}
        {filteredNavSecondary.length > 0 && (
          <NavSecondary items={filteredNavSecondary} className='mt-auto' />
        )}
      </SidebarContent>
    </Sidebar>
  );
}
