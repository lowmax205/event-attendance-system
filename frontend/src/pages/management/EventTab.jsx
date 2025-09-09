import {
  Calendar,
  Search,
  Plus,
  Eye,
  MapPin,
  Users,
  Clock,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
} from 'lucide-react';
import QRCode from 'qrcode';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Shared components first (import-order)
// ... keep shared components
import ErrorState from '@/components/error-state';
import FilterBar from '@/components/filter-bar';
import ManagementHeader from '@/components/management-header';
import MetricsCards from '@/components/metrics-cards';
import PaginatedTable from '@/components/paginated-table';
// UI primitives
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingCard } from '@/components/ui/loading-card';
import { ConfirmationModal } from '@/components/ui/modal';
import { TableRow, TableCell } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
// Contexts, modals, services, utils
import { useManagementData } from '@/contexts/management-data-context';
import { useManualEntry } from '@/contexts/manual-entry-context';
import DevLogger from '@/lib/dev-logger';
import { parseDateTimeLocal, datetimeLocalToUTC, utcToDatetimeLocal } from '@/lib/formatting';
import {
  paginate,
  totalPages as calcTotalPages,
  sortByDate,
  compare,
} from '@/lib/management-helpers';
import {
  ViewEventModal,
  CreateEventModal,
  EditEventModal,
} from '@/pages/management/modal/EventModals';
import { apiService } from '@/services/api-service';

// Formatting helpers moved to '@/lib/formatting'

const EventManagement = () => {
  const { events, eventsLoading, eventsError, refreshEvents } = useManagementData();
  // Local UI flags derived from context for simplicity
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Location input method state (Create modal specific)
  const [useManualCoords, setUseManualCoords] = useState(false);
  const [useMapSelection, setUseMapSelection] = useState(true);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  // Track if user actually acquired current location via geolocation
  const [hasLocatedCurrent, setHasLocatedCurrent] = useState(false);

  // QR state for View Modal
  const [qrSvg, setQrSvg] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  // Direct verification URL for laptop testing by admins/organizers
  const [verifyUrlStr, setVerifyUrlStr] = useState('');
  // Manual entry context
  const { openManualEntry } = useManualEntry();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form validation state
  const [validationErrors, setValidationErrors] = useState([]);
  // Popover open states for schedule pickers
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    // For Edit modal (legacy split fields)
    date: '',
    start_time: '',
    end_time: '',
    // For Create modal (unified datetime-local fields similar to AttendanceTab)
    start_at_local: '',
    end_at_local: '',
    location_name: '',
    latitude: '',
    longitude: '',
    capacity: '',
    is_active: true,
    category: '',
    allow_entry: true,
    is_public: true,
    requires_registration: true,
    qr_code: '',
    venue_address: '',
    buffer_window_minutes: '30',
  });

  // ===== BACKEND COMMUNICATION =====
  // Mirror context states locally to keep existing LoadingCard/ErrorState without large changes
  useEffect(() => {
    setLoading(eventsLoading);
    setError(eventsError ? 'Failed to load events. Please try again.' : null);
  }, [eventsLoading, eventsError]);

  // ===== FRONTEND INTERACTION =====
  // Handles event create form submission
  const handleCreateEvent = async () => {
    try {
      DevLogger.info('Management', 'EventTab:create:start');
      // Validate required fields
      const errors = [];
      if (!formData.title.trim()) {
        errors.push('Event title is required');
      }
      // Use unified datetime-local fields for creation
      if (!formData.start_at_local) errors.push('Start date & time is required');
      if (!formData.end_at_local) errors.push('End date & time is required');

      const startDt = parseDateTimeLocal(formData.start_at_local);
      const endDt = parseDateTimeLocal(formData.end_at_local);
      if (startDt && endDt && endDt < startDt) {
        errors.push('End date & time must be after start date & time');
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Clear validation errors if all fields are valid
      setValidationErrors([]);

      // Create proper ISO datetime strings from datetime-local without timezone conversion
      const startDateTime = datetimeLocalToUTC(formData.start_at_local);
      const endDateTime = datetimeLocalToUTC(formData.end_at_local);

      DevLogger.info('Management', 'EventTab:create:datetime', {
        startLocal: formData.start_at_local,
        endLocal: formData.end_at_local,
        startUtc: startDateTime,
        endUtc: endDateTime,
      });

      // Convert frontend form data to backend API format
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_at: startDateTime,
        end_at: endDateTime,
        location_name: formData.location_name.trim(),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        is_active: formData.is_active,
        category: formData.category.trim(),
        allow_entry: formData.allow_entry,
        is_public: formData.is_public,
        requires_registration: formData.requires_registration,
        qr_code: formData.qr_code.trim(),
        venue_address: formData.venue_address.trim(),
        buffer_window_minutes: Number.isNaN(parseInt(formData.buffer_window_minutes))
          ? undefined
          : parseInt(formData.buffer_window_minutes),
      };

      DevLogger.info('Management', 'EventTab:create:request', { title: eventData.title });
      const response = await apiService.createEvent(eventData);
      DevLogger.success('Management', 'EventTab:create:success', {
        id: response?.id,
        title: response?.title,
      });
      setIsCreateModalOpen(false);
      resetForm();
      await refreshEvents();
      toast.success('Event created successfully!', {
        description: 'Your event has been created and is now available for registration.',
      });
    } catch (error) {
      DevLogger.error('Management', 'EventTab:create:error', error);

      // Show more detailed error message
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        Object.values(error.response?.data || {})
          .flat()
          .join(', ') ||
        error.message ||
        'Failed to create event';
      toast.error('Failed to create event', {
        description: errorMessage,
      });
    }
  };
  // Handles event edit form submission
  const handleUpdateEvent = async () => {
    try {
      DevLogger.info('Management', 'EventTab:update:start', { id: selectedEvent?.id });
      // Validate required fields (mirror Create modal behavior)
      const errors = [];
      if (!formData.title.trim()) {
        errors.push('Event title is required');
      }
      if (!formData.start_at_local) errors.push('Start date & time is required');
      if (!formData.end_at_local) errors.push('End date & time is required');

      const startDt = parseDateTimeLocal(formData.start_at_local);
      const endDt = parseDateTimeLocal(formData.end_at_local);
      if (startDt && endDt && endDt < startDt) {
        errors.push('End date & time must be after start date & time');
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Clear validation errors if all fields are valid
      setValidationErrors([]);

      // Create proper ISO datetime strings from datetime-local with UTC conversion
      const startDateTime = datetimeLocalToUTC(formData.start_at_local);
      const endDateTime = datetimeLocalToUTC(formData.end_at_local);

      // Convert frontend form data to backend API format
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_at: startDateTime,
        end_at: endDateTime,
        location_name: formData.location_name.trim(),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        is_active: formData.is_active,
        category: formData.category.trim(),
        allow_entry: formData.allow_entry,
        is_public: formData.is_public,
        requires_registration: formData.requires_registration,
        qr_code: formData.qr_code.trim(),
        venue_address: formData.venue_address.trim(),
        buffer_window_minutes: Number.isNaN(parseInt(formData.buffer_window_minutes))
          ? undefined
          : parseInt(formData.buffer_window_minutes),
      };

      await apiService.updateEvent(selectedEvent.id, eventData);
      setIsEditModalOpen(false);
      resetForm();
      await refreshEvents();
      toast.update('Event updated successfully!', {
        description: 'All changes have been saved and applied.',
      });
      DevLogger.success('Management', 'EventTab:update:success', { id: selectedEvent?.id });
    } catch (error) {
      DevLogger.error('Management', 'EventTab:update:error', error);

      // Show more detailed error message
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        Object.values(error.response?.data || {})
          .flat()
          .join(', ') ||
        error.message ||
        'Failed to update event';
      toast.error('Failed to update event', {
        description: errorMessage,
      });
    }
  };

  // Handles event deletion confirmation
  const handleDeleteEvent = async () => {
    try {
      DevLogger.info('Management', 'EventTab:delete:start', { id: selectedEvent.id });
      await apiService.deleteEvent(selectedEvent.id);
      DevLogger.success('Management', 'EventTab:delete:success', { id: selectedEvent.id });
      setIsDeleteModalOpen(false);
      setSelectedEvent(null);
      await refreshEvents();
      toast.delete('Event deleted successfully!', {
        description: 'The event and all associated records have been permanently removed.',
      });
    } catch (error) {
      DevLogger.error('Management', 'EventTab:delete:error', error);

      // Show more detailed error message
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        Object.values(error.response?.data || {})
          .flat()
          .join(', ') ||
        error.message ||
        'Failed to delete event';
      toast.error('Failed to delete event', {
        description: errorMessage,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      start_at_local: '',
      end_at_local: '',
      location_name: '',
      latitude: '',
      longitude: '',
      capacity: '',
      is_active: true,
      category: '',
      allow_entry: true,
      is_public: true,
      requires_registration: true,
      qr_code: '',
      venue_address: '',
      buffer_window_minutes: '30',
    });
    setSelectedEvent(null);
    // Reset location method toggles and geolocation states
    setUseManualCoords(false);
    setUseMapSelection(true);
    setUseCurrentLocation(false);
    setGeoLoading(false);
    setGeoError('');
    setHasLocatedCurrent(false);
    // Clear validation errors
    setValidationErrors([]);
  };

  // Geolocation helper (used by Create modal)
  const locateCurrent = async () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser.');
      return;
    }
    try {
      setGeoLoading(true);
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setFormData((prev) => ({
              ...prev,
              latitude: latitude.toFixed(8),
              longitude: longitude.toFixed(8),
            }));
            setHasLocatedCurrent(true);
            resolve();
          },
          (err) => {
            let message = 'Failed to detect current location.';
            if (err.code === 1) message = 'Location permission denied.';
            if (err.code === 2) message = 'Location unavailable.';
            if (err.code === 3) message = 'Location request timed out.';
            setGeoError(message);
            reject(err);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      });
    } finally {
      setGeoLoading(false);
    }
  };

  // Map coordinate setter for Edit modal
  const setFormCoordsFromMap = (latitude, longitude) => {
    setFormData((prev) => ({
      ...prev,
      latitude: latitude.toFixed(8),
      longitude: longitude.toFixed(8),
    }));
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    // Populate unified datetime-local fields for edit (mirror Create modal)
    const eventDate = event.start_at ? event.start_at.split('T')[0] : '';
    const startTime = event.start_at ? event.start_at.split('T')[1]?.slice(0, 5) : '';
    const endTime = event.end_at ? event.end_at.split('T')[1]?.slice(0, 5) : '';

    setFormData({
      title: event.title || '',
      description: event.description || '',
      // Keep legacy split fields for backward compatibility (not used by UI now)
      date: eventDate,
      start_time: startTime,
      end_time: endTime,
      start_at_local: utcToDatetimeLocal(event.start_at),
      end_at_local: utcToDatetimeLocal(event.end_at),
      location_name: event.location_name || '',
      latitude: event.latitude?.toString() || '',
      longitude: event.longitude?.toString() || '',
      capacity: event.capacity?.toString() || '',
      is_active: event.is_active ?? true,
      category: event.category || '',
      allow_entry: event.allow_entry ?? true,
      is_public: event.is_public ?? true,
      requires_registration: event.requires_registration ?? true,
      qr_code: event.qr_code || '',
      venue_address: event.venue_address || '',
      buffer_window_minutes:
        event.buffer_window_minutes !== undefined && event.buffer_window_minutes !== null
          ? String(event.buffer_window_minutes)
          : '30',
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = async (event) => {
    setSelectedEvent(event);
    setIsViewModalOpen(true);

    // Generate QR code for attendance verification
    try {
      setQrLoading(true);
      setQrError('');
      setQrSvg('');
      setVerifyUrlStr('');

      // Build verification URL with eventId and a nonce
      const baseUrl = window.location.origin;
      const verifyUrl = new URL(`${baseUrl}/attendance/verify`);
      verifyUrl.searchParams.set('eventId', event.id);
      // Add a short-lived nonce to avoid static screenshots reuse (validated server-side if desired)
      verifyUrl.searchParams.set('n', `${Date.now()}`);
      // Set QR expiry to ensure it remains valid throughout both verification windows
      // Check-in window: start_at to (start_at + buffer)
      // Check-out window: (end_at - buffer) to end_at
      // QR should expire at the very end of the last possible verification window
      const endAtMs = event.end_at ? new Date(event.end_at).getTime() : 0;
      // QR code expires at the end of the event (end of check-out window)
      const expDate = new Date(endAtMs);
      const exp = expDate.toISOString();
      verifyUrl.searchParams.set('exp', exp);

      // Save URL string for admins to click on laptops
      setVerifyUrlStr(verifyUrl.toString());

      const svgString = await QRCode.toString(verifyUrl.toString(), {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 2,
        scale: 6,
      });
      setQrSvg(svgString);
    } catch (err) {
      DevLogger.error('Management', 'EventTab:qr:error', err);
      setQrError(err.message || 'Failed to generate QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const openDeleteModal = (event) => {
    setSelectedEvent(event);
    setIsDeleteModalOpen(true);
  };

  // Actions in View Modal
  const handleUrlRedirectClick = useCallback(() => {
    if (verifyUrlStr) {
      window.open(verifyUrlStr, '_blank', 'noopener,noreferrer');
    }
  }, [verifyUrlStr]);

  const handleManualEntryClick = useCallback(() => {
    if (selectedEvent?.id) {
      openManualEntry({ eventId: selectedEvent.id });
      toast.info('Opening Manual Entry…');
    } else {
      openManualEntry();
    }
  }, [openManualEntry, selectedEvent]);

  const handlePrintQrClick = useCallback(() => {
    if (!qrSvg) {
      toast.error('QR code is not ready to print yet.');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const title = selectedEvent?.title || 'Event QR';
    const styles = `
      <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px}
        h1{font-size:18px;text-align:center;margin:0 0 8px}
        .qr{display:flex;justify-content:center;margin:20px 0}
        .meta{font-size:12px;text-align:center;word-break:break-all}
        @media print { .no-print { display:none !important; } }
      </style>
    `;
    const content = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title} - QR</title>
          ${styles}
        </head>
        <body>
          <h1>${title}</h1>
          <div class="qr"><div style="width:260px;height:260px">${qrSvg}</div></div>
          ${verifyUrlStr ? `<p class="meta">${verifyUrlStr}</p>` : ''}
          <div class="no-print" style="text-align:center;margin-top:12px">
            <button onclick="window.print()">Print</button>
          </div>
        </body>
      </html>`;
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        /* ignore: Some browsers may block programmatic print */
      }
    };
  }, [qrSvg, selectedEvent, verifyUrlStr]);

  const getStatusBadge = (event) => {
    const now = new Date();

    // Prefer backend UTC fields; fall back to date/time strings if needed
    const startAt = event.start_at
      ? new Date(event.start_at)
      : event.date && event.time
        ? new Date(`${event.date}T${event.time}`)
        : null;
    const endAt = event.end_at
      ? new Date(event.end_at)
      : event.date && event.end_time
        ? new Date(`${event.date}T${event.end_time}`)
        : null;

    // Cancelled takes precedence regardless of schedule (mapped from !is_active)
    if (!event.is_active) {
      return <Badge variant='destructive'>Cancelled</Badge>;
    }

    // If we can't determine timing, show Unknown
    if (!startAt && !endAt) {
      return <Badge variant='outline'>Unknown</Badge>;
    }

    // Status rules:
    // - Cancelled: !is_active (handled above)
    // - In Progress: startAt <= now <= endAt (or if no endAt, now >= startAt)
    // - Today: date is today and now < startAt
    // - Upcoming: now < startAt (and not today)
    // - Completed: now > endAt (or fallback when only endAt exists)

    if (startAt && now < startAt) {
      if (startAt.toDateString() === now.toDateString()) {
        return <Badge variant='default'>Today</Badge>;
      }
      return <Badge variant='secondary'>Upcoming</Badge>;
    }

    if (startAt && endAt) {
      if (now >= startAt && now <= endAt) {
        return <Badge variant='default'>In Progress</Badge>;
      }
      if (now > endAt) {
        return <Badge variant='outline'>Completed</Badge>;
      }
    }

    if (!startAt && endAt) {
      // No start time, but has an end time
      return now <= endAt ? (
        <Badge variant='default'>In Progress</Badge>
      ) : (
        <Badge variant='outline'>Completed</Badge>
      );
    }

    if (startAt && !endAt) {
      // Started and no end time defined -> treat as in progress once started
      return now >= startAt ? (
        <Badge variant='default'>In Progress</Badge>
      ) : (
        <Badge variant='secondary'>Upcoming</Badge>
      );
    }

    // Fallback
    return <Badge variant='outline'>Unknown</Badge>;
  };

  const sortEvents = useCallback(
    (list) => {
      if (sortField === 'start_at' || sortField === 'created_at' || sortField === 'updated_at') {
        return sortByDate(list, sortField, sortDirection);
      }
      if (sortField === 'title') {
        return [...list].sort((a, b) =>
          compare(a.title?.toLowerCase() || '', b.title?.toLowerCase() || '', sortDirection),
        );
      }
      return sortByDate(list, 'created_at', sortDirection);
    },
    [sortDirection, sortField],
  );

  const filteredEvents = useMemo(() => {
    return sortEvents(
      events.filter((event) => {
        const matchesSearch =
          !searchTerm ||
          [
            event.title,
            event.description,
            event.location_name || event.location,
            event.id?.toString(),
            event.date
              ? new Date(event.date).toLocaleDateString()
              : event.start_at
                ? new Date(event.start_at).toLocaleDateString()
                : '',
            event.time || (event.start_at ? new Date(event.start_at).toLocaleTimeString() : ''),
            event.end_time || (event.end_at ? new Date(event.end_at).toLocaleTimeString() : ''),
          ].some((field) => field?.toString().toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesStatus = true;
        if (selectedStatus !== 'all') {
          const now = new Date();
          const startAt = event.start_at
            ? new Date(event.start_at)
            : event.date && event.time
              ? new Date(`${event.date}T${event.time}`)
              : null;
          const endAt = event.end_at
            ? new Date(event.end_at)
            : event.date && event.end_time
              ? new Date(`${event.date}T${event.end_time}`)
              : null;

          switch (selectedStatus) {
            case 'cancelled':
              matchesStatus = !event.is_active;
              break;
            case 'upcoming':
              matchesStatus =
                !!startAt &&
                now < startAt &&
                startAt.toDateString() !== now.toDateString() &&
                event.is_active;
              break;
            case 'today':
              if (!startAt) return false;
              matchesStatus =
                startAt.toDateString() === now.toDateString() && now < startAt && event.is_active;
              break;
            case 'inprogress':
              // Not exposed in UI currently, but supported
              if (startAt && endAt) {
                matchesStatus = now >= startAt && now <= endAt && event.is_active;
              } else if (startAt && !endAt) {
                matchesStatus = now >= startAt && event.is_active;
              } else if (!startAt && endAt) {
                matchesStatus = now <= endAt && event.is_active;
              } else {
                matchesStatus = false;
              }
              break;
            case 'completed':
              if (endAt) {
                matchesStatus = now > endAt;
              } else if (startAt) {
                // No end time; treat as completed only if strictly before start and we don't consider in-progress
                matchesStatus = now > startAt; // fallback behavior
              } else {
                matchesStatus = false;
              }
              break;
            default:
              matchesStatus = true;
          }
        }

        return matchesSearch && matchesStatus;
      }),
    );
  }, [events, searchTerm, selectedStatus, sortEvents]);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  // Metrics calculations
  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEvents = events.filter((event) => {
      const startAt = event.start_at
        ? new Date(event.start_at)
        : event.date && event.time
          ? new Date(`${event.date}T${event.time}`)
          : null;
      if (!startAt) return false;
      // Today and later than now
      return startAt.toDateString() === now.toDateString() && now < startAt;
    });

    const upcomingEvents = events.filter((event) => {
      const startAt = event.start_at
        ? new Date(event.start_at)
        : event.date && event.time
          ? new Date(`${event.date}T${event.time}`)
          : null;
      return (
        !!startAt &&
        now < startAt &&
        startAt.toDateString() !== now.toDateString() &&
        event.is_active
      );
    });

    const activeEvents = events.filter((event) => event.is_active);
    const completedEvents = events.filter((event) => {
      const endAt = event.end_at
        ? new Date(event.end_at)
        : event.date && event.end_time
          ? new Date(`${event.date}T${event.end_time}`)
          : null;
      return !!endAt && now > endAt;
    });

    return {
      totalEvents: events.length,
      activeEvents: activeEvents.length,
      eventsToday: todayEvents.length,
      upcomingEvents: upcomingEvents.length,
      completedEvents: completedEvents.length,
    };
  }, [events]);

  // Pagination logic
  const paginatedEvents = useMemo(
    () => paginate(filteredEvents, currentPage, itemsPerPage),
    [filteredEvents, currentPage, itemsPerPage],
  );

  const totalPages = calcTotalPages(filteredEvents.length, itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <LoadingCard
        title='Loading events…'
        description='Please wait while we load the latest events.'
      />
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={refreshEvents} />;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <ManagementHeader
        title='Event Management'
        subtitle='Create, edit, and manage events and schedules'
      >
        <Button onClick={() => setIsCreateModalOpen(true)} className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          Create Event
        </Button>
      </ManagementHeader>

      {/* Stats Cards */}
      <MetricsCards
        items={[
          {
            label: 'Total Events',
            value: metrics.totalEvents,
            icon: Calendar,
            hint:
              filteredEvents.length !== metrics.totalEvents
                ? `${filteredEvents.length} filtered events in system`
                : 'events in system',
          },
          {
            label: 'Events Today',
            value: metrics.eventsToday,
            icon: Clock,
            hint: 'Scheduled for today',
          },
          {
            label: 'Upcoming',
            value: metrics.upcomingEvents,
            icon: MapPin,
            hint: 'Future active events',
          },
          { label: 'Completed', value: metrics.completedEvents, icon: Users, hint: 'Past events' },
        ]}
      />

      {/* Filters */}
      <FilterBar
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Search by title, description, location, ID, date, or time...',
          icon: <Search className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />,
        }}
        selects={[
          {
            value: selectedStatus,
            onChange: setSelectedStatus,
            placeholder: 'Filter by status',
            items: [
              { value: 'all', label: 'All Events' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'inprogress', label: 'In Progress' },
              { value: 'today', label: 'Today' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'completed', label: 'Completed' },
            ],
          },
        ]}
        sort={{
          direction: sortDirection,
          onToggleDirection: () => setSortDirection((o) => (o === 'asc' ? 'desc' : 'asc')),
          icon:
            sortDirection === 'asc' ? (
              <ArrowUpNarrowWide className='h-4 w-4' />
            ) : (
              <ArrowDownNarrowWide className='h-4 w-4' />
            ),
          field: sortField,
          onFieldChange: setSortField,
          fields: [
            { value: 'start_at', label: 'Date' },
            { value: 'title', label: 'Title' },
            { value: 'created_at', label: 'Created' },
            { value: 'updated_at', label: 'Updated' },
          ],
        }}
      />

      {/* Events Table */}
      <PaginatedTable
        title={
          <>
            <Calendar className='h-5 w-5' />
            Events ({filteredEvents.length})
          </>
        }
        columns={[
          { key: 'event', header: 'Event' },
          { key: 'schedule', header: 'Date & Time' },
          { key: 'location', header: 'Location' },
          { key: 'status', header: 'Status' },
          { key: 'participants', header: 'Participants' },
          { key: 'created', header: 'Created' },
          { key: 'updated', header: 'Updated' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={paginatedEvents}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        renderRow={(event) => (
          <TableRow key={event.id}>
            <TableCell>
              <div>
                <div className='font-medium'>{event.title}</div>
                <div className='text-muted-foreground text-sm'>
                  {event.description?.substring(0, 50)}
                  {event.description?.length > 50 && '...'}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className='font-medium'>
                  {event.date ||
                    (event.start_at ? new Date(event.start_at).toLocaleDateString() : 'N/A')}
                </div>
                <div className='text-muted-foreground text-sm'>
                  {event.time ||
                    (event.start_at
                      ? new Date(event.start_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A')}{' '}
                  -{' '}
                  {event.end_time ||
                    (event.end_at
                      ? new Date(event.end_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A')}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className='flex items-center gap-2'>
                <MapPin className='text-muted-foreground h-4 w-4' />
                <span className='text-sm'>{event.location_name || event.location || 'N/A'}</span>
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(event)}</TableCell>
            <TableCell>
              <div className='flex items-center gap-2'>
                <Users className='text-muted-foreground h-4 w-4' />
                <span className='text-sm'>
                  {event.current_attendees || event.attendance_count || 0}
                  {(event.capacity || event.max_participants) &&
                    ` / ${event.capacity || event.max_participants}`}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className='text-sm'>
                {event.created_at ? new Date(event.created_at).toLocaleDateString() : 'N/A'}
                <div className='text-muted-foreground text-xs'>
                  {event.created_at
                    ? new Date(event.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className='text-sm'>
                {event.updated_at ? new Date(event.updated_at).toLocaleDateString() : 'N/A'}
                <div className='text-muted-foreground text-xs'>
                  {event.updated_at
                    ? new Date(event.updated_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className='flex items-center gap-2'>
                <Button variant='ghost' size='sm' onClick={() => openViewModal(event)}>
                  <Eye className='h-4 w-4' />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) resetForm();
        }}
        formData={formData}
        setFormData={setFormData}
        startPopoverOpen={startPopoverOpen}
        setStartPopoverOpen={setStartPopoverOpen}
        endPopoverOpen={endPopoverOpen}
        setEndPopoverOpen={setEndPopoverOpen}
        useManualCoords={useManualCoords}
        setUseManualCoords={(v) => setUseManualCoords(!!v)}
        useMapSelection={useMapSelection}
        setUseMapSelection={(v) => setUseMapSelection(!!v)}
        useCurrentLocation={useCurrentLocation}
        setUseCurrentLocation={(v) => {
          const val = !!v;
          setUseCurrentLocation(val);
          setHasLocatedCurrent(false);
          setGeoError('');
        }}
        geoLoading={geoLoading}
        geoError={geoError}
        hasLocatedCurrent={hasLocatedCurrent}
        onLocateCurrent={locateCurrent}
        validationErrors={validationErrors}
        onSubmit={handleCreateEvent}
        onCancel={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) resetForm();
        }}
        formData={formData}
        setFormData={setFormData}
        startPopoverOpen={startPopoverOpen}
        setStartPopoverOpen={setStartPopoverOpen}
        endPopoverOpen={endPopoverOpen}
        setEndPopoverOpen={setEndPopoverOpen}
        geoLoading={geoLoading}
        setFormCoordsFromMap={setFormCoordsFromMap}
        validationErrors={validationErrors}
        onSubmit={handleUpdateEvent}
        onCancel={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
      />

      {/* View Event Modal */}
      <ViewEventModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        event={selectedEvent}
        getStatusBadge={getStatusBadge}
        qrSvg={qrSvg}
        qrLoading={qrLoading}
        qrError={qrError}
        verifyUrlStr={verifyUrlStr}
        onEdit={() => {
          setIsViewModalOpen(false);
          if (selectedEvent) openEditModal(selectedEvent);
        }}
        onDelete={() => {
          setIsViewModalOpen(false);
          if (selectedEvent) openDeleteModal(selectedEvent);
        }}
        onUrlRedirect={handleUrlRedirectClick}
        onManualEntry={handleManualEntryClick}
        onPrintQr={handlePrintQrClick}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        title='Delete Event'
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteEvent}
        variant='destructive'
      >
        <p>
          Are you sure you want to delete the event <strong>{selectedEvent?.title}</strong>? This
          action cannot be undone and will also remove all associated attendance records.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default EventManagement;
