import React from 'react';
import { apiService } from '@/services/api-service';

const DashboardDataContext = React.createContext(null);

export function DashboardDataProvider({ children }) {
  // ===== BACKEND COMMUNICATION =====
  // Shared datasets for dashboard views
  const [events, setEvents] = React.useState([]);
  const [eventsLoading, setEventsLoading] = React.useState(false);
  const [eventsError, setEventsError] = React.useState('');

  const [attendances, setAttendances] = React.useState([]);
  const [attLoading, setAttLoading] = React.useState(false);
  const [attError, setAttError] = React.useState('');

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

  const refreshAttendances = React.useCallback(async () => {
    try {
      setAttLoading(true);
      setAttError('');
      const res = await apiService.getAttendances();
      setAttendances(Array.isArray(res) ? res : res?.results || []);
    } catch (e) {
      setAttError(e?.response?.data?.error || e?.message || 'Failed to load attendance');
    } finally {
      setAttLoading(false);
    }
  }, []);

  const refreshAll = React.useCallback(async () => {
    await Promise.all([refreshEvents(), refreshAttendances()]);
  }, [refreshAttendances, refreshEvents]);

  React.useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const value = React.useMemo(
    () => ({
      events,
      eventsLoading,
      eventsError,
      attendances,
      attendancesLoading: attLoading,
      attendancesError: attError,
      refreshEvents,
      refreshAttendances,
      refreshAll,
    }),
    [events, eventsLoading, eventsError, attendances, attLoading, attError, refreshEvents, refreshAttendances, refreshAll],
  );

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData() {
  const ctx = React.useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return ctx;
}
