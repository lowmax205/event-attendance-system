import {
  Users,
  Search,
  Eye,
  UserPlus,
  Shield,
  UserCheck,
  Clock,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
} from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Shared components first (import-order)
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
import { useManagementData } from '@/contexts/management-data-context';
import DevLogger from '@/lib/dev-logger';
// Utils, modals, services
import { paginate, totalPages as calcTotalPages, sortByDate } from '@/lib/management-helpers';
import { ViewUserModal, CreateUserModal, EditUserModal } from '@/pages/management/modal/UserModals';
import { apiService } from '@/services/api-service';

const UserManagement = () => {
  // Note: user context currently unused in this tab
  const { users, usersLoading, usersError, refreshUsers } = useManagementData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form validation state
  const [validationErrors, setValidationErrors] = useState([]);

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'student',
    password: '',
    confirm_password: '',
  });

  // ===== BACKEND COMMUNICATION =====
  // Bridge context flags to this component's UI without changing UI structure
  useEffect(() => {
    setLoading(usersLoading);
    setError(usersError ? 'Failed to load users. Please try again.' : null);
  }, [usersLoading, usersError]);

  // ===== FRONTEND INTERACTION =====
  // Handles user creation form submission
  const handleCreateUser = async () => {
    try {
      const errors = [];
      if (formData.password !== formData.confirm_password) {
        errors.push('Passwords do not match');
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Clear validation errors if all fields are valid
      setValidationErrors([]);

      // Generate username from email (before @ symbol) and ensure it's not empty
      let username = formData.email.split('@')[0];
      if (!username) {
        username = formData.email; // fallback to full email if somehow empty
      }

      const userData = {
        username: username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        password: formData.password,
        password_confirm: formData.confirm_password,
      };

      await apiService.createUser(userData);
      setIsCreateModalOpen(false);
      resetForm();
      await refreshUsers();
      toast.success('User created successfully!', {
        description: 'The new user account has been created and is now active.',
      });
    } catch (error) {
      DevLogger.error('Management', 'UserTab:create:error', error);
      // Show more detailed error message
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        Object.values(error.response?.data || {})
          .flat()
          .join(', ') ||
        error.message ||
        'Failed to create user';
      toast.error(errorMessage);
    }
  };

  // Handles user update form submission
  const handleUpdateUser = async () => {
    try {
      const userData = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      };

      await apiService.updateUser(selectedUser.id, userData);
      setIsEditModalOpen(false);
      resetForm();
      await refreshUsers();
      toast.update('User updated successfully!', {
        description: 'User information has been updated in the system.',
      });
    } catch (error) {
      DevLogger.error('Management', 'UserTab:update:error', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        Object.values(error.response?.data || {})
          .flat()
          .join(', ') ||
        error.message ||
        'Failed to update user';
      toast.error(errorMessage);
    }
  };

  // Handles user deletion confirmation
  const handleDeleteUser = async () => {
    try {
      await apiService.deleteUser(selectedUser.id);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      await refreshUsers();
      toast.delete('User deleted successfully!', {
        description: 'The user account has been permanently removed from the system.',
      });
    } catch (error) {
      DevLogger.error('Management', 'UserTab:delete:error', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        Object.values(error.response?.data || {})
          .flat()
          .join(', ') ||
        error.message ||
        'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
      role: 'student',
    });
    setSelectedUser(null);
    // Clear validation errors
    setValidationErrors([]);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      password: '',
      confirm_password: '',
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'destructive',
      organizer: 'secondary',
      student: 'default',
    };
    return (
      <Badge variant={variants[role] || 'default'}>
        {role?.charAt(0).toUpperCase() + role?.slice(1)}
      </Badge>
    );
  };

  const sortUsers = useCallback(
    (list) => {
      // Use shared helper for date sorting; default to created_at
      if (sortField === 'created_at' || sortField === 'updated_at') {
        return sortByDate(list, sortField, sortDirection);
      }
      // Fallback to created_at sorting if unsupported field
      return sortByDate(list, 'created_at', sortDirection);
    },
    [sortField, sortDirection],
  );

  const filteredUsers = useMemo(() => {
    return sortUsers(
      users.filter((user) => {
        const matchesSearch =
          !searchTerm ||
          [
            user.email,
            user.first_name,
            user.last_name,
            user.student_id,
            user.role,
            `${user.first_name} ${user.last_name}`.trim(), // Full name search
          ].some((field) => field?.toString().toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = selectedRole === 'all' || user.role === selectedRole;
        return matchesSearch && matchesRole;
      }),
    );
  }, [users, searchTerm, selectedRole, sortUsers]);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

  // Metrics calculations
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentUsers = users.filter((user) => {
      const createdDate = user.created_at ? new Date(user.created_at) : null;
      if (!createdDate) return false;
      const daysDiff = (today - createdDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7; // Users created in the last 7 days
    });

    const activeUsers = users.filter((user) => user.is_active);
    const adminUsers = users.filter((user) => user.role === 'admin');
    const organizerUsers = users.filter((user) => user.role === 'organizer');
    const studentUsers = users.filter((user) => user.role === 'student');

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      recentUsers: recentUsers.length,
      adminUsers: adminUsers.length,
      organizerUsers: organizerUsers.length,
      studentUsers: studentUsers.length,
    };
  }, [users]);

  // Pagination logic
  const paginatedUsers = useMemo(
    () => paginate(filteredUsers, currentPage, itemsPerPage),
    [filteredUsers, currentPage, itemsPerPage],
  );

  const totalPages = calcTotalPages(filteredUsers.length, itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  if (loading) {
    return (
      <LoadingCard
        title='Loading users…'
        description='Please wait while we load the latest users.'
      />
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={refreshUsers} />;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <ManagementHeader
        title='User Management'
        subtitle='Manage students, organizers, and administrative users'
      >
        <Button onClick={() => setIsCreateModalOpen(true)} className='flex items-center gap-2'>
          <UserPlus className='h-4 w-4' />
          Add User
        </Button>
      </ManagementHeader>

      {/* Stats Cards */}
      <MetricsCards
        items={[
          {
            label: 'Total Users',
            value: metrics.totalUsers,
            icon: Users,
            hint:
              filteredUsers.length !== metrics.totalUsers
                ? `${filteredUsers.length} filtered users in system`
                : 'users in system',
          },
          {
            label: 'Active Users',
            value: metrics.activeUsers,
            icon: UserCheck,
            hint: 'Currently active accounts',
          },
          {
            label: 'Recent Users',
            value: metrics.recentUsers,
            icon: Clock,
            hint: 'Joined in last 7 days',
          },
          {
            label: 'Administrators',
            value: metrics.adminUsers,
            icon: Shield,
            hint: `${metrics.organizerUsers} organizers, ${metrics.studentUsers} students`,
          },
        ]}
      />

      {/* Filters */}
      <FilterBar
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Search by name, email, ID, or role...',
          icon: <Search className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />,
        }}
        selects={[
          {
            value: selectedRole,
            onChange: setSelectedRole,
            placeholder: 'Filter by role',
            items: [
              { value: 'all', label: 'All Roles' },
              { value: 'student', label: 'Students' },
              { value: 'organizer', label: 'Organizers' },
              { value: 'admin', label: 'Administrators' },
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
            { value: 'updated_at', label: 'Updated' },
          ],
        }}
      />

      {/* Users Table */}
      <PaginatedTable
        title={
          <>
            <Users className='h-5 w-5' />
            Users ({filteredUsers.length})
          </>
        }
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'role', header: 'Role' },
          { key: 'status', header: 'Status' },
          { key: 'created', header: 'Created' },
          { key: 'updated', header: 'Updated' },
          { key: 'actions', header: 'Actions' },
        ]}
        rows={paginatedUsers}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        renderRow={(user) => (
          <TableRow key={user.id}>
            <TableCell className='font-medium'>
              {user.first_name} {user.last_name}
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{getRoleBadge(user.role)}</TableCell>
            <TableCell>
              <Badge variant={user.is_active ? 'default' : 'secondary'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className='text-sm'>
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                <div className='text-muted-foreground text-xs'>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className='text-sm'>
                {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                <div className='text-muted-foreground text-xs'>
                  {user.updated_at
                    ? new Date(user.updated_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className='flex items-center gap-2'>
                <Button variant='ghost' size='sm' onClick={() => openViewModal(user)}>
                  <Eye className='h-4 w-4' />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Create User Modal */}
      <CreateUserModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) resetForm();
        }}
        formData={formData}
        setFormData={setFormData}
        validationErrors={validationErrors}
        onSubmit={handleCreateUser}
        onCancel={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) resetForm();
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdateUser}
        onCancel={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
      />

      {/* View User Modal */}
      <ViewUserModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        user={selectedUser}
        getRoleBadge={getRoleBadge}
        onEdit={() => {
          setIsViewModalOpen(false);
          if (selectedUser) openEditModal(selectedUser);
        }}
        onDelete={() => {
          setIsViewModalOpen(false);
          if (selectedUser) openDeleteModal(selectedUser);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        title='Delete User'
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteUser}
        variant='destructive'
      >
        <p>
          Are you sure you want to delete user{' '}
          <strong>
            {selectedUser?.first_name} {selectedUser?.last_name}
          </strong>
          ? This action cannot be undone.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default UserManagement;
