import { AlertCircle, Edit, Trash2 } from 'lucide-react';
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ViewUserModal({ open, onOpenChange, user, getRoleBadge, onEdit, onDelete }) {
  return (
    <Modal title='User Details' open={open} onOpenChange={onOpenChange} size='lg'>
      {user && (
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>First Name</Label>
              <p className='text-sm'>{user.first_name}</p>
            </div>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Last Name</Label>
              <p className='text-sm'>{user.last_name}</p>
            </div>
          </div>
          <div>
            <Label className='text-muted-foreground text-sm font-medium'>Email</Label>
            <p className='text-sm'>{user.email}</p>
          </div>
          <div>
            <Label className='text-muted-foreground text-sm font-medium'>Role</Label>
            <div className='mt-1'>{getRoleBadge(user.role)}</div>
          </div>
          <div>
            <Label className='text-muted-foreground text-sm font-medium'>Status</Label>
            <div className='mt-1'>
              <Badge variant={user.is_active ? 'default' : 'secondary'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Created</Label>
              <p className='text-sm'>
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                {user.created_at && (
                  <span className='text-muted-foreground block text-xs'>
                    {new Date(user.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </p>
            </div>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Last Updated</Label>
              <p className='text-sm'>
                {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                {user.updated_at && (
                  <span className='text-muted-foreground block text-xs'>
                    {new Date(user.updated_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className='flex justify-end gap-2 pt-4'>
            <Button variant='outline' onClick={onEdit} className='flex items-center gap-2'>
              <Edit className='h-4 w-4' />
              Edit
            </Button>
            <Button variant='destructive' onClick={onDelete} className='flex items-center gap-2'>
              <Trash2 className='h-4 w-4' />
              Delete
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function CreateUserModal({
  open,
  onOpenChange,
  formData,
  setFormData,
  validationErrors,
  onSubmit,
  onCancel,
}) {
  return (
    <Modal title='Create New User' open={open} onOpenChange={onOpenChange} size='lg'>
      <div className='space-y-4'>
        {/* Basic Information Section */}
        <div className='space-y-4'>
          <h4 className='text-sm font-medium'>Basic Information</h4>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='first_name' className='text-muted-foreground'>
                First Name *
              </Label>
              <Input
                id='first_name'
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder='Enter first name'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='last_name' className='text-muted-foreground'>
                Last Name *
              </Label>
              <Input
                id='last_name'
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder='Enter last name'
                required
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email' className='text-muted-foreground'>
              Email Address *
            </Label>
            <Input
              id='email'
              type='email'
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder='Enter email address'
              required
            />
          </div>
        </div>

        {/* Role Section */}
        <div className='space-y-4'>
          <div className='rounded-md border p-4'>
            <Label className='text-muted-foreground text-sm font-medium'>
              User Role & Permissions
            </Label>
            <div className='mt-3 space-y-2'>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select user role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='student'>
                    Student - Event attendance and participation
                  </SelectItem>
                  <SelectItem value='organizer'>
                    Organizer - Event creation and management
                  </SelectItem>
                  <SelectItem value='admin'>Administrator - Full system access</SelectItem>
                </SelectContent>
              </Select>
              <div className='text-muted-foreground text-xs'>
                {formData.role === 'student' &&
                  'Students can register for events, check in/out, and view their attendance history.'}
                {formData.role === 'organizer' &&
                  'Organizers can create and manage events, view attendance reports, and manage participants.'}
                {formData.role === 'admin' &&
                  'Administrators have full access to all system features including user management.'}
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className='space-y-4'>
          <h4 className='text-sm font-medium'>Security</h4>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='password' className='text-muted-foreground'>
                Password *
              </Label>
              <Input
                id='password'
                type='password'
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder='Enter password'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirm_password' className='text-muted-foreground'>
                Confirm Password *
              </Label>
              <Input
                id='confirm_password'
                type='password'
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                placeholder='Confirm password'
                required
              />
            </div>
          </div>
          {formData.password &&
            formData.confirm_password &&
            formData.password !== formData.confirm_password && (
              <div className='border-destructive/20 bg-destructive/5 rounded-md border p-3'>
                <p className='text-destructive text-sm'>Passwords do not match</p>
              </div>
            )}
        </div>

        {/* Validation Alert */}
        {validationErrors?.length > 0 && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              <div className='space-y-1'>
                <div className='font-medium'>Please fix the following errors:</div>
                <ul className='list-inside list-disc'>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className='flex justify-end gap-2 pt-4'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              !formData.first_name ||
              !formData.last_name ||
              !formData.email ||
              !formData.password ||
              formData.password !== formData.confirm_password
            }
          >
            Create User
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function EditUserModal({ open, onOpenChange, formData, setFormData, onSubmit, onCancel }) {
  return (
    <Modal title='Edit User' open={open} onOpenChange={onOpenChange} size='lg'>
      <div className='space-y-4'>
        {/* Basic Information Section */}
        <div className='space-y-4'>
          <h4 className='text-sm font-medium'>Basic Information</h4>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit_first_name' className='text-muted-foreground'>
                First Name *
              </Label>
              <Input
                id='edit_first_name'
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder='Enter first name'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit_last_name' className='text-muted-foreground'>
                Last Name *
              </Label>
              <Input
                id='edit_last_name'
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder='Enter last name'
                required
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit_email' className='text-muted-foreground'>
              Email Address *
            </Label>
            <Input
              id='edit_email'
              type='email'
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder='Enter email address'
              required
            />
          </div>
        </div>

        {/* Role Section */}
        <div className='space-y-4'>
          <div className='rounded-md border p-4'>
            <Label className='text-muted-foreground text-sm font-medium'>
              User Role & Permissions
            </Label>
            <div className='mt-3 space-y-2'>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select user role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='student'>
                    Student - Event attendance and participation
                  </SelectItem>
                  <SelectItem value='organizer'>
                    Organizer - Event creation and management
                  </SelectItem>
                  <SelectItem value='admin'>Administrator - Full system access</SelectItem>
                </SelectContent>
              </Select>
              <div className='text-muted-foreground text-xs'>
                {formData.role === 'student' &&
                  'Students can register for events, check in/out, and view their attendance history.'}
                {formData.role === 'organizer' &&
                  'Organizers can create and manage events, view attendance reports, and manage participants.'}
                {formData.role === 'admin' &&
                  'Administrators have full access to all system features including user management.'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end gap-2 pt-4'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.first_name || !formData.last_name || !formData.email}
          >
            Update User
          </Button>
        </div>
      </div>
    </Modal>
  );
}
