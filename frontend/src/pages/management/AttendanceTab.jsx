import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Loader2,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
} from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Shared components first (import-order)
// placeholder for ordering
import ErrorState from '@/components/error-state';
import FilterBar from '@/components/filter-bar';
import ManagementHeader from '@/components/management-header';
import MetricsCards from '@/components/metrics-cards';
import PaginatedTable from '@/components/paginated-table';
// UI primitives and shared utilities
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingCard } from '@/components/ui/loading-card';
import { TableRow, TableCell } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
// Contexts, modals, services
import { useManagementData } from '@/contexts/management-data-context';
import { useManualEntry } from '@/contexts/manual-entry-context';
import DevLogger from '@/lib/dev-logger';
import { paginate, totalPages as calcTotalPages, compare, sortByDate } from '@/lib/management-helpers';
import {
  ViewAttendanceModal,
  EvidenceModal,
  ManualEntryModal,
  VerifyAttendanceModal,
} from '@/pages/management/modal/AttendanceModals';
import DeleteConfirmModal from '@/pages/management/modal/DeleteConfirmModal';
import { apiService } from '@/services/api-service';

// Note: using shared formatting utilities

const AttendanceManagement = () => {
  // Using shared MapboxMap component
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  // Verify modal state
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Evidence modal state
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceRecord, setEvidenceRecord] = useState(null);
  // Popover open states for manual entry time pickers
  const [checkinPopoverOpen, setCheckinPopoverOpen] = useState(false);
  const [checkoutPopoverOpen, setCheckoutPopoverOpen] = useState(false);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  // Manual entry form state
  const [manualEntryForm, setManualEntryForm] = useState({
    user_name: '',
    email: '',
    event: '',
    campus: '',
    department: '',
    course: '',
    status: 'present',
    checkin_time: '',
    checkout_time: '',
    notes: '',
  });
  const [manualEntryLoading, setManualEntryLoading] = useState(false);

  // User search and verification state
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Shared datasets from context (avoids duplicate fetching across tabs)
  const {
    events,
    campuses,
    departments,
    courses,
    users,
  } = useManagementData();

  // Form validation state
  const [validationErrors, setValidationErrors] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Manual Entry context wiring (open from other tabs)
  const { pending, request, consumeManualEntryRequest } = useManualEntry();

  useEffect(() => {
    if (pending) {
      // Open modal and seed event if provided
      setIsManualEntryModalOpen(true);
      if (request?.eventId) {
        setManualEntryForm((prev) => ({
          ...prev,
          event: String(request.eventId),
        }));
      }
      consumeManualEntryRequest();
    }
  }, [pending, request, consumeManualEntryRequest]);

  // Memoized fetch function to prevent recreation on every render
  // ===== BACKEND COMMUNICATION =====
  // Fetch attendance locally; other lookup datasets come from context
  const fetchData = useCallback(async () => {
    try {
      DevLogger.info('Management', 'AttendanceTab:fetchData:start');
      setLoading(true);
      setError(null);

      const attendanceData = await apiService.getAttendances();

      // Build a quick lookup for users by id
      const usersById = new Map((Array.isArray(users) ? users : []).map((u) => [u.id, u]));

      // Enrich attendance records with resolved user info (email/name) when only user_id is present
      const enriched = (Array.isArray(attendanceData) ? attendanceData : []).map((rec) => {
        // Determine user id from various shapes: rec.user (number|string|object) or rec.user_id
        let userId = null;
        if (typeof rec.user === 'number') {
          userId = rec.user;
        } else if (typeof rec.user === 'string' && /^\d+$/.test(rec.user)) {
          userId = parseInt(rec.user, 10);
        } else if (typeof rec.user_id === 'number') {
          userId = rec.user_id;
        } else if (typeof rec.user_id === 'string' && /^\d+$/.test(rec.user_id)) {
          userId = parseInt(rec.user_id, 10);
        }

        const userObj =
          rec.user && typeof rec.user === 'object'
            ? rec.user
            : userId
              ? usersById.get(userId)
              : null;
        const base = {
          ...rec,
          _resolved_user: userObj,
          _resolved_user_email: userObj?.email || rec.user_email || null,
          _resolved_user_name:
            userObj?.name ||
            [userObj?.first_name, userObj?.last_name].filter(Boolean).join(' ').trim() ||
            rec.user_name ||
            null,
        };
        // Normalize verification display
        const verifyLabel =
          rec.verify_by_display ||
          (rec.verify ? 'System Verified' : rec.method === 'manual' ? 'Not Yet!' : 'Not Verified');
        return { ...base, _verify_display: verifyLabel };
      });

      setAttendanceRecords(enriched);
      DevLogger.success('Management', 'AttendanceTab:fetchData:success');
    } catch (error) {
      DevLogger.error('Management', 'AttendanceTab:fetchData:error', error);
      setError('Failed to load attendance records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [users]); // Depends on users from context for enrichment

  // Fetch data only once on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteRecord = async () => {
    try {
      DevLogger.info('Management', 'AttendanceTab:delete:start', { id: selectedRecord.id });
      await apiService.deleteAttendance(selectedRecord.id);
      setIsDeleteModalOpen(false);
      setSelectedRecord(null);

      // Show success message and refresh data
      toast.delete('Attendance record deleted successfully!', {
        description: 'The attendance record has been permanently removed from the system.',
      });
      DevLogger.success('Management', 'AttendanceTab:delete:success', { id: selectedRecord.id });
      fetchData();
    } catch (error) {
      DevLogger.error('Management', 'AttendanceTab:delete:error', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        Object.values(error.response?.data || {})
          .flat()
          .join(', ') ||
        error.message ||
        'Failed to delete attendance record';
      toast.error(errorMessage);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className='text-warning h-4 w-4' />;
      case 'checked_in':
        return <CheckCircle className='text-success h-4 w-4' />;
      case 'checked_out':
        return <CheckCircle className='text-info h-4 w-4' />;
      case 'present':
        return <CheckCircle className='text-success h-4 w-4' />;
      case 'absent':
        return <XCircle className='text-destructive h-4 w-4' />;
      case 'late':
        return <Clock className='text-warning h-4 w-4' />;
      case 'excused':
        return <AlertCircle className='text-info h-4 w-4' />;
      case 'invalid':
        return <XCircle className='text-destructive h-4 w-4' />;
      default:
        return <AlertCircle className='text-muted-foreground h-4 w-4' />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant='secondary' className='bg-warning/10 text-warning-foreground'>
            Pending
          </Badge>
        );
      case 'checked_in':
        return <Badge className='bg-success/10 text-success-foreground'>Checked In</Badge>;
      case 'checked_out':
        return <Badge className='bg-info/10 text-info-foreground'>Checked Out</Badge>;
      case 'present':
        return <Badge className='bg-success/10 text-success-foreground'>Present</Badge>;
      case 'absent':
        return <Badge variant='destructive'>Absent</Badge>;
      case 'late':
        return <Badge className='bg-warning/10 text-info-foreground'>Late</Badge>;
      case 'excused':
        return <Badge className='bg-info/10 text-info-foreground'>Excused</Badge>;
      case 'invalid':
        return <Badge variant='destructive'>Invalid</Badge>;
      default:
        return <Badge variant='secondary'>Unknown</Badge>;
    }
  };

  const openViewModal = (record) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (record) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  const openManualEntryModal = () => {
    setManualEntryForm({
      user_name: '',
      email: '',
      event: '',
      campus: '',
      department: '',
      course: '',
      status: 'pending',
      checkin_time: '',
      checkout_time: '',
      notes: '',
    });
    setVerifiedUser(null);
    setUserSearchResults([]);
    setShowUserDropdown(false);
    setIsManualEntryModalOpen(true);
  };

  // Open evidence modal, fetch full record to ensure all media/fields are present
  const openEvidenceModal = async (record) => {
    try {
      setEvidenceLoading(true);
      setIsEvidenceModalOpen(true);
      // Prefer fetching by id to ensure we have latest fields
      const full = await apiService.getAttendance(record.id);
      setEvidenceRecord(full || record);
    } catch (e) {
      DevLogger.error('Management', 'AttendanceTab:evidence:error', e);
      setEvidenceRecord(record);
      toast.error('Unable to load full evidence for this record. Showing available data.');
    } finally {
      setEvidenceLoading(false);
    }
  };

  // No longer needed: signatures are dedicated fields

  // User search functionality
  const searchUsers = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setUserSearchResults([]);
      setShowUserDropdown(false);
      return;
    }

    try {
      setUserSearchLoading(true);
      const response = await apiService.searchUsers(searchTerm);
      // Extract data from the success response wrapper
      const results = response?.data || response || [];
      setUserSearchResults(results);
      setShowUserDropdown(true);
    } catch (error) {
      DevLogger.error('Management', 'AttendanceTab:userSearch:error', error);
      setUserSearchResults([]);
      setShowUserDropdown(false);
    } finally {
      setUserSearchLoading(false);
    }
  };

  // Handle user selection from search results
  const selectUser = (user) => {
    setVerifiedUser(user);
    setManualEntryForm((prev) => ({
      ...prev,
      user_name: user.full_name,
      email: user.email || '',
      campus: user.campus_id ? user.campus_id.toString() : '',
      department: user.department_id ? user.department_id.toString() : '',
      course: user.course_id ? user.course_id.toString() : '',
    }));
    setShowUserDropdown(false);
    setUserSearchResults([]);
  };

  // Handle manual user name input changes
  const handleUserNameChange = (value) => {
    setManualEntryForm((prev) => ({ ...prev, user_name: value }));

    // Clear verification if user changes the name manually
    if (verifiedUser && value !== verifiedUser.full_name) {
      setVerifiedUser(null);
      setManualEntryForm((prev) => ({
        ...prev,
        email: '',
        campus: '',
        department: '',
        course: '',
      }));
    }

    // Debounced search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  // Ref for search timeout
  const searchTimeoutRef = React.useRef(null);

  const handleManualEntrySubmit = async () => {
    try {
      setManualEntryLoading(true);

      // Check if we have a verified user or need to handle manual entry
      const errors = [];
      if (!verifiedUser) {
        errors.push('Please select a valid user from the search results');
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        setManualEntryLoading(false);
        return;
      }

      // Clear validation errors if all fields are valid
      setValidationErrors([]);

      // Prepare the data for submission
      const attendanceData = {
        user: verifiedUser.id,
        event: manualEntryForm.event,
        // Force pending for manual entry per requirement; reason can be added later via Verify action
        status: 'pending',
        notes: manualEntryForm.notes,
      };

      // Add time fields based on status
      if (manualEntryForm.status === 'present' || manualEntryForm.status === 'late') {
        if (manualEntryForm.checkin_time) {
          attendanceData.checkin_time = manualEntryForm.checkin_time;
        }
        if (manualEntryForm.checkout_time) {
          attendanceData.checkout_time = manualEntryForm.checkout_time;
        }
      }

      await apiService.createManualAttendance(attendanceData);
      setIsManualEntryModalOpen(false);
      toast.success('Manual attendance entry created successfully!', {
        description: 'The attendance record has been added to the system.',
      });
      DevLogger.success('Management', 'AttendanceTab:manualEntry:success');
      fetchData();
    } catch (error) {
      DevLogger.error('Management', 'AttendanceTab:manualEntry:error', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        Object.values(error.response?.data || {})
          .flat()
          .join(', ') ||
        error.message ||
        'Failed to create manual attendance entry';
      toast.error(errorMessage);
    } finally {
      setManualEntryLoading(false);
    }
  };

  const handleManualEntryFormChange = (field, value) => {
    if (field === 'user_name') {
      handleUserNameChange(value);
      return;
    }

    setManualEntryForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const sortRecords = useCallback(
    (records) => {
      if (sortField === 'created_at') {
        return sortByDate(records, 'created_at', sortDirection);
      }
      if (sortField === 'student_name') {
        return [...records].sort((a, b) => {
          const aName = (
            a.user?.name ||
            a.user_name ||
            `${a.user?.first_name || ''} ${a.user?.last_name || ''}`.trim() ||
            'Unknown User'
          ).toLowerCase();
          const bName = (
            b.user?.name ||
            b.user_name ||
            `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.trim() ||
            'Unknown User'
          ).toLowerCase();
          return compare(aName, bName, sortDirection);
        });
      }
      if (sortField === 'event_title') {
        return [...records].sort((a, b) => compare((a.event?.title || a.event_title || '').toLowerCase(), (b.event?.title || b.event_title || '').toLowerCase(), sortDirection));
      }
      if (sortField === 'status') {
        return [...records].sort((a, b) => compare(a.status || '', b.status || '', sortDirection));
      }
      return sortByDate(records, 'created_at', sortDirection);
    },
    [sortField, sortDirection],
  );

  // Filtering logic
  const filteredRecords = useMemo(() => {
    return sortRecords(
      attendanceRecords.filter((record) => {
        const matchesSearch =
          !searchTerm ||
          [
            record._resolved_user_name,
            record._resolved_user_email,
            record.user?.name,
            record.user?.first_name,
            record.user?.last_name,
            record.user?.email,
            record.user?.student_id,
            record.event?.title,
            record.user_name, // From serializer
            record.event_title, // From serializer
          ].some((field) => field?.toString().toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;

        return matchesSearch && matchesStatus;
      }),
    );
  }, [attendanceRecords, searchTerm, selectedStatus, sortRecords]);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  // Metrics calculations
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecords = attendanceRecords.filter((record) => {
      const recordDate = new Date(record.checkin_time || record.created_at);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });

    return {
      totalRecords: attendanceRecords.length,
      presentToday: todayRecords.filter(
        (r) => r.status === 'checked_in' || r.status === 'checked_out' || r.status === 'present',
      ).length,
      checkedIn: attendanceRecords.filter((r) => r.status === 'checked_in').length,
      completed: attendanceRecords.filter((r) => r.status === 'checked_out').length,
      present: attendanceRecords.filter((r) => r.status === 'present').length,
      absent: attendanceRecords.filter((r) => r.status === 'absent').length,
      late: attendanceRecords.filter((r) => r.status === 'late').length,
      excused: attendanceRecords.filter((r) => r.status === 'excused').length,
    };
  }, [attendanceRecords]);

  // Pagination logic
  const paginatedRecords = useMemo(() => paginate(filteredRecords, currentPage, itemsPerPage), [filteredRecords, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => calcTotalPages(filteredRecords.length, itemsPerPage), [filteredRecords.length, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  const exportToCSV = async () => {
    if (exportLoading) return; // Prevent multiple clicks

    try {
      setExportLoading(true);

      // Calculate date range for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      // Format dates for API
      const endDateStr = endDate.toISOString().split('T')[0];
      const startDateStr = startDate.toISOString().split('T')[0];

      DevLogger.info('Management', 'AttendanceTab:export:start', { startDateStr, endDateStr });

      // Fetch all attendance data for the last 30 days
      const response = await apiService.getAttendancesForExport(startDateStr, endDateStr);
      const exportData = response.results || [];

      DevLogger.info('Management', 'AttendanceTab:export:count', { count: exportData.length });

      if (exportData.length === 0) {
        toast.info('No attendance records found for the last 30 days.');
        return;
      }

      const csvData = exportData.map((record) => ({
        'Student ID': record.user_student_id || 'N/A',
        Name: record.user_name || 'Unknown User',
        'First Name': record.user_first_name || 'N/A',
        'Last Name': record.user_last_name || 'N/A',
        Email: record.user_email || 'N/A',
        Campus: record.campus_name || 'N/A',
        Department: record.department_name || 'N/A',
        Course: record.course_name || 'N/A',
        Event: record.event_title || 'N/A',
        'Event Date': record.event_date ? new Date(record.event_date).toLocaleDateString() : 'N/A',
        'Event Location': record.event_location || 'N/A',
        Method: record.method === 'qr' ? 'QR Code' : 'Manual',
        Status: record.status || 'N/A',
        'Check-in Time': record.checkin_time
          ? new Date(record.checkin_time).toLocaleString()
          : 'N/A',
        'Check-out Time': record.checkout_time
          ? new Date(record.checkout_time).toLocaleString()
          : 'N/A',
        'Check-in Location':
          record.checkin_latitude && record.checkin_longitude
            ? `${record.checkin_latitude}, ${record.checkin_longitude}`
            : 'N/A',
        'Check-out Location':
          record.checkout_latitude && record.checkout_longitude
            ? `${record.checkout_latitude}, ${record.checkout_longitude}`
            : 'N/A',
        Notes: record.notes || 'N/A',
        'Date Created': new Date(record.created_at).toLocaleString(),
      }));

      // Convert to CSV format
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map((row) => headers.map((header) => `"${row[header] || ''}"`).join(',')),
      ].join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance-records-${startDateStr}-to-${endDateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the URL
        URL.revokeObjectURL(url);
      }

      // Show success message
      toast.success('Export complete', {
        description: `Exported ${csvData.length} attendance records from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}.`,
      });
      DevLogger.success('Management', 'AttendanceTab:export:success', { count: csvData.length });
    } catch (error) {
      DevLogger.error('Management', 'AttendanceTab:export:error', error);
      const errorMessage =
        error?.response?.data?.detail || error?.message || 'Unknown error occurred';
      toast.error('Failed to export attendance data', { description: `${errorMessage}. Please try again.` });
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingCard
        title='Loading attendance records…'
        description='Please wait while we load the latest attendance data.'
      />
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <ManagementHeader
        title='Attendance Management'
        subtitle='Monitor and manage student attendance across all events'
      >
        <Button onClick={openManualEntryModal} className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          Manual Entry
        </Button>
        <Button onClick={exportToCSV} className='flex items-center gap-2' disabled={exportLoading}>
          {exportLoading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Download className='h-4 w-4' />
          )}
          {exportLoading ? 'Exporting...' : 'Export CSV'}
        </Button>
      </ManagementHeader>

      {/* Stats Cards */}
      <MetricsCards
        items={[
          {
            label: 'Total Records',
            value: metrics.totalRecords,
            icon: Users,
            hint:
              filteredRecords.length !== metrics.totalRecords
                ? `${filteredRecords.length} filtered attendance records tracked`
                : 'attendance records tracked',
          },
          {
            label: 'Present Today',
            value: metrics.presentToday,
            icon: CheckCircle,
            hint: 'Students attended today',
          },
          {
            label: 'Checked In',
            value: metrics.checkedIn,
            icon: AlertCircle,
            hint: 'Currently at events',
          },
          {
            label: 'Completed',
            value: metrics.completed,
            icon: Clock,
            hint: 'Fully attended events',
          },
        ]}
      />

      {/* Filters */}
      <FilterBar
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Search by student name, email, ID, or event...',
          icon: <Search className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />,
        }}
        selects={[
          {
            value: selectedStatus,
            onChange: setSelectedStatus,
            placeholder: 'Filter by status',
            items: [
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'checked_in', label: 'Checked In' },
              { value: 'checked_out', label: 'Checked Out' },
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
              { value: 'late', label: 'Late' },
              { value: 'excused', label: 'Excused' },
              { value: 'invalid', label: 'Invalid' },
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
            { value: 'created_at', label: 'Created' },
            { value: 'student_name', label: 'Student Name' },
            { value: 'event_title', label: 'Event Title' },
            { value: 'status', label: 'Status' },
          ],
        }}
        clear={{ show: !!(searchTerm || selectedStatus !== 'all'), onClear: resetFilters }}
      />

      {/* Attendance Table */}
      <PaginatedTable
        title={
          <>
            <Users className='h-5 w-5' />
            Attendance Records ({filteredRecords.length})
            {filteredRecords.length !== attendanceRecords.length && (
              <span className='text-muted-foreground text-sm font-normal'>
                of {attendanceRecords.length} total
              </span>
            )}
          </>
        }
        columns={[
          { key: 'student', header: 'Student' },
          { key: 'event', header: 'Event' },
          { key: 'method', header: 'Method' },
          { key: 'status', header: 'Status' },
          { key: 'checkin', header: 'Check-in Time' },
          { key: 'checkout', header: 'Check-out Time' },
          { key: 'created', header: 'Created' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={paginatedRecords}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        renderRow={(record) => (
          <TableRow key={record.id}>
            <TableCell>
              <div>
                <div className='font-medium'>
                  {record._resolved_user_name ||
                    record.user?.name ||
                    record.user_name ||
                    `${record.user?.first_name || ''} ${record.user?.last_name || ''}`.trim() ||
                    'Unknown User'}
                </div>
                <div className='text-muted-foreground text-sm'>
                  {record._resolved_user_email ||
                    record.user?.email ||
                    record.user_email ||
                    'No Email'}
                </div>
                {record.user?.student_id && (
                  <div className='text-muted-foreground text-xs'>ID: {record.user.student_id}</div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className='font-medium'>
                  {record.event?.title || record.event_title || 'Unknown Event'}
                </div>
                {record.event?.location && (
                  <div className='text-muted-foreground flex items-center gap-1 text-sm'>
                    <MapPin className='h-3 w-3' />
                    {record.event.location}
                  </div>
                )}
                <div className='text-muted-foreground flex items-center gap-1 text-sm'>
                  <Calendar className='h-3 w-3' />
                  {record.event?.date
                    ? new Date(record.event.date).toLocaleDateString()
                    : record.created_at
                      ? new Date(record.created_at).toLocaleDateString()
                      : 'Unknown date'}
                </div>
              </div>
            </TableCell>
            <TableCell>
              {record.method === 'qr' ? (
                <Badge className='bg-primary/10 text-primary-foreground'>QR Code</Badge>
              ) : (
                <Badge variant='secondary'>Manual</Badge>
              )}
            </TableCell>
            <TableCell>
              <div className='flex items-center gap-2'>
                {getStatusIcon(record.status)}
                {getStatusBadge(record.status)}
              </div>
            </TableCell>
            <TableCell>
              {record.checkin_time ? (
                <div>
                  <div className='text-sm'>
                    {new Date(record.checkin_time).toLocaleDateString()}
                  </div>
                  <div className='text-muted-foreground text-xs'>
                    {new Date(record.checkin_time).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <span className='text-muted-foreground'>-</span>
              )}
            </TableCell>
            <TableCell>
              {record.checkout_time ? (
                <div>
                  <div className='text-sm'>
                    {new Date(record.checkout_time).toLocaleDateString()}
                  </div>
                  <div className='text-muted-foreground text-xs'>
                    {new Date(record.checkout_time).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <span className='text-muted-foreground'>-</span>
              )}
            </TableCell>
            <TableCell>
              <div className='text-sm'>
                {record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'}
                <div className='text-muted-foreground text-xs'>
                  {record.created_at
                    ? new Date(record.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className='flex items-center gap-2'>
                <Button variant='ghost' size='sm' onClick={() => openViewModal(record)}>
                  <Eye className='h-4 w-4' />
                </Button>
                {/* Verify action for manual/unverified records */}
                {record.method === 'manual' && !record.verify && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSelectedRecord(record);
                      setVerifyNotes('');
                      setVerifyOpen(true);
                    }}
                    className='border-success text-success'
                  >
                    Verify
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {/* View Record Modal */}
      <ViewAttendanceModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        record={selectedRecord}
        getStatusBadge={getStatusBadge}
        onOpenEvidence={openEvidenceModal}
        onVerify={(rec) => {
          setSelectedRecord(rec);
          setVerifyNotes('');
          setVerifyOpen(true);
        }}
        onDelete={(rec) => {
          setIsViewModalOpen(false);
          openDeleteModal(rec);
        }}
      />

      {/* Verify Modal */}
      <VerifyAttendanceModal
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        notes={verifyNotes}
        onNotesChange={setVerifyNotes}
        loading={verifyLoading}
        onConfirm={async () => {
          if (!selectedRecord) return;
          try {
            setVerifyLoading(true);
            await apiService.verifyAttendance(selectedRecord.id, { notes: verifyNotes });
            setVerifyOpen(false);
            toast.success('Attendance verified');
            // Refresh data and also update local selected record
            await fetchData();
            setIsViewModalOpen(false);
            setSelectedRecord(null);
          } catch (e) {
            DevLogger.error('Management', 'AttendanceTab:verify:error', e);
            const msg = e?.response?.data?.detail || e?.message || 'Failed to verify';
            toast.error(msg);
          } finally {
            setVerifyLoading(false);
          }
        }}
      />

      {/* Evidence Modal */}
      <EvidenceModal
        open={isEvidenceModalOpen}
        onOpenChange={setIsEvidenceModalOpen}
        record={evidenceRecord || selectedRecord}
        loading={evidenceLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        title='Delete Attendance Record'
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteRecord}
      >
        <p>
          Are you sure you want to delete this attendance record for{' '}
          <strong>
            {selectedRecord?._resolved_user_name ||
              selectedRecord?.user?.name ||
              selectedRecord?.user_name ||
              `${selectedRecord?.user?.first_name || ''} ${selectedRecord?.user?.last_name || ''}`.trim() ||
              'Unknown User'}
          </strong>{' '}
          at{' '}
          <strong>
            {selectedRecord?.event?.title || selectedRecord?.event_title || 'Unknown Event'}
          </strong>
          ? This action cannot be undone.
        </p>
      </DeleteConfirmModal>

      {/* Manual Entry Modal */}
      <ManualEntryModal
        open={isManualEntryModalOpen}
        onOpenChange={setIsManualEntryModalOpen}
        manualEntryForm={manualEntryForm}
        onChange={handleManualEntryFormChange}
        verifiedUser={verifiedUser}
        userSearchLoading={userSearchLoading}
        userSearchResults={userSearchResults}
        showUserDropdown={showUserDropdown}
        onSelectUser={selectUser}
        campuses={campuses}
        departments={departments}
        courses={courses}
        events={events}
        checkinPopoverOpen={checkinPopoverOpen}
        setCheckinPopoverOpen={setCheckinPopoverOpen}
        checkoutPopoverOpen={checkoutPopoverOpen}
        setCheckoutPopoverOpen={setCheckoutPopoverOpen}
        validationErrors={validationErrors}
        loading={manualEntryLoading}
        onSubmit={handleManualEntrySubmit}
        onCancel={() => setIsManualEntryModalOpen(false)}
      />
    </div>
  );
};

export default AttendanceManagement;
