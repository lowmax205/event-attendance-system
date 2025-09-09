import React from 'react';
import { apiService } from '@/services/api-service';

const ManagementDataContext = React.createContext(null);

export function ManagementDataProvider({ children }) {
  // ===== BACKEND COMMUNICATION =====
  // Centralized datasets used across management tabs
  const [events, setEvents] = React.useState([]);
  const [eventsLoading, setEventsLoading] = React.useState(false);
  const [eventsError, setEventsError] = React.useState('');

  const [users, setUsers] = React.useState([]);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [usersError, setUsersError] = React.useState('');

  const [campuses, setCampuses] = React.useState([]);
  const [campusesLoading, setCampusesLoading] = React.useState(false);
  const [campusesError, setCampusesError] = React.useState('');

  const [departments, setDepartments] = React.useState([]);
  const [departmentsLoading, setDepartmentsLoading] = React.useState(false);
  const [departmentsError, setDepartmentsError] = React.useState('');

  const [courses, setCourses] = React.useState([]);
  const [coursesLoading, setCoursesLoading] = React.useState(false);
  const [coursesError, setCoursesError] = React.useState('');

  // Fetch helpers (exposed to consumers for explicit refresh)
  const refreshEvents = React.useCallback(async () => {
    try {
      setEventsLoading(true);
      setEventsError('');
      const res = await apiService.getEvents();
      setEvents(Array.isArray(res) ? res : res?.results || []);
    } catch (e) {
      setEventsError(e?.response?.data?.error || e?.message || 'Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const refreshUsers = React.useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError('');
      const res = await apiService.getUsers();
      setUsers(Array.isArray(res) ? res : res?.results || []);
    } catch (e) {
      setUsersError(e?.response?.data?.error || e?.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const refreshCampuses = React.useCallback(async () => {
    try {
      setCampusesLoading(true);
      setCampusesError('');
      const res = await apiService.getCampuses();
      setCampuses(Array.isArray(res) ? res : res?.results || []);
    } catch (e) {
      setCampusesError(e?.response?.data?.error || e?.message || 'Failed to load campuses');
    } finally {
      setCampusesLoading(false);
    }
  }, []);

  const refreshDepartments = React.useCallback(async () => {
    try {
      setDepartmentsLoading(true);
      setDepartmentsError('');
      const res = await apiService.getDepartments();
      setDepartments(Array.isArray(res) ? res : res?.results || []);
    } catch (e) {
      setDepartmentsError(e?.response?.data?.error || e?.message || 'Failed to load departments');
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  const refreshCourses = React.useCallback(async () => {
    try {
      setCoursesLoading(true);
      setCoursesError('');
      const res = await apiService.getCourses();
      setCourses(Array.isArray(res) ? res : res?.results || []);
    } catch (e) {
      setCoursesError(e?.response?.data?.error || e?.message || 'Failed to load courses');
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  const refreshAll = React.useCallback(async () => {
    await Promise.all([
      refreshEvents(),
      refreshUsers(),
      refreshCampuses(),
      refreshDepartments(),
      refreshCourses(),
    ]);
  }, [refreshCampuses, refreshCourses, refreshDepartments, refreshEvents, refreshUsers]);

  // Initial load
  React.useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const value = React.useMemo(
    () => ({
      // Data
      events,
      users,
      campuses,
      departments,
      courses,
      // Loading flags
      eventsLoading,
      usersLoading,
      campusesLoading,
      departmentsLoading,
      coursesLoading,
      // Errors
      eventsError,
      usersError,
      campusesError,
      departmentsError,
      coursesError,
      // Refreshers
      refreshEvents,
      refreshUsers,
      refreshCampuses,
      refreshDepartments,
      refreshCourses,
      refreshAll,
    }),
    [
      events,
      users,
      campuses,
      departments,
      courses,
      eventsLoading,
      usersLoading,
      campusesLoading,
      departmentsLoading,
      coursesLoading,
      eventsError,
      usersError,
      campusesError,
      departmentsError,
      coursesError,
      refreshEvents,
      refreshUsers,
      refreshCampuses,
      refreshDepartments,
      refreshCourses,
      refreshAll,
    ],
  );

  return <ManagementDataContext.Provider value={value}>{children}</ManagementDataContext.Provider>;
}

export function useManagementData() {
  const ctx = React.useContext(ManagementDataContext);
  if (!ctx) {
    throw new Error('useManagementData must be used within a ManagementDataProvider');
  }
  return ctx;
}
