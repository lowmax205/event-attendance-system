import { Eye, Trash2 } from 'lucide-react';
import React from 'react';
import DateTimePicker from '@/components/date-time-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MapboxMap from '@/components/ui/mapbox-map';
import { Modal } from '@/components/ui/modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// View modal with full attendance details
export function ViewAttendanceModal({
  open,
  onOpenChange,
  record,
  getStatusBadge,
  onOpenEvidence,
  onVerify,
  onDelete,
}) {
  return (
    <Modal title='Attendance Record Details' open={open} onOpenChange={onOpenChange} size='lg'>
      {record && (
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <h4 className='mb-2 font-medium'>Student Information</h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-muted-foreground text-sm font-medium'>Name:</span>
                  <p className='text-sm'>
                    {record._resolved_user_name ||
                      record.user?.name ||
                      record.user_name ||
                      `${record.user?.first_name || ''} ${record.user?.last_name || ''}`.trim() ||
                      'Unknown User'}
                  </p>
                </div>
                <div>
                  <span className='text-muted-foreground text-sm font-medium'>Email:</span>
                  <p className='text-sm'>
                    {record._resolved_user_email ||
                      record.user?.email ||
                      record.user_email ||
                      'No Email'}
                  </p>
                </div>
                {record.user?.student_id && (
                  <div>
                    <span className='text-muted-foreground text-sm font-medium'>Student ID:</span>
                    <p className='text-sm'>{record.user.student_id}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className='mb-2 font-medium'>Event Information</h4>
              <div className='space-y-2'>
                <div>
                  <span className='text-muted-foreground text-sm font-medium'>Title:</span>
                  <p className='text-sm'>
                    {record.event?.title || record.event_title || 'Unknown Event'}
                  </p>
                </div>
                <div>
                  <span className='text-muted-foreground text-sm font-medium'>Date:</span>
                  <p className='text-sm'>
                    {record.event?.date
                      ? new Date(record.event.date).toLocaleDateString()
                      : record.created_at
                        ? new Date(record.created_at).toLocaleDateString()
                        : 'Unknown date'}
                  </p>
                </div>
                {record.event?.location && (
                  <div>
                    <span className='text-muted-foreground text-sm font-medium'>Location:</span>
                    <p className='text-sm'>{record.event.location}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className='mb-2 font-medium'>Attendance Details</h4>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <span className='text-muted-foreground text-sm font-medium'>Method:</span>
                <p className='text-sm'>{record.method === 'qr' ? 'QR Code' : 'Manual'}</p>
              </div>
              <div>
                <span className='text-muted-foreground text-sm font-medium'>Status:</span>
                <div className='mt-1'>{getStatusBadge(record.status)}</div>
              </div>
              <div>
                <span className='text-muted-foreground text-sm font-medium'>Verified:</span>
                <p className='text-sm'>
                  {record.verify ? 'Yes' : 'No'}
                  {` — ${record._verify_display || ''}`}
                </p>
              </div>
              <div>
                <span className='text-muted-foreground text-sm font-medium'>Check-in Time:</span>
                <p className='text-sm'>
                  {record.checkin_time
                    ? new Date(record.checkin_time).toLocaleString()
                    : 'Not checked in'}
                </p>
              </div>
              <div>
                <span className='text-muted-foreground text-sm font-medium'>Check-out Time:</span>
                <p className='text-sm'>
                  {record.checkout_time
                    ? new Date(record.checkout_time).toLocaleString()
                    : 'Not checked out'}
                </p>
              </div>
              <div>
                <span className='text-muted-foreground text-sm font-medium'>Created:</span>
                <p className='text-sm'>{new Date(record.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {(record.checkin_latitude ||
            record.checkin_longitude ||
            record.checkout_latitude ||
            record.checkout_longitude) && (
            <div>
              <h4 className='mb-2 font-medium'>Location Data</h4>
              <div className='grid grid-cols-2 gap-4'>
                {(record.checkin_latitude || record.checkin_longitude) && (
                  <div>
                    <span className='text-muted-foreground text-sm font-medium'>
                      Check-in Location:
                    </span>
                    <p className='text-sm'>
                      Lat: {record.checkin_latitude || 'N/A'}, Lng:{' '}
                      {record.checkin_longitude || 'N/A'}
                    </p>
                    {record.checkin_latitude && record.checkin_longitude && (
                      <div className='mt-2'>
                        <MapboxMap
                          latitude={Number(record.checkin_latitude)}
                          longitude={Number(record.checkin_longitude)}
                          interactive={false}
                          zoom={16}
                          className='h-40'
                        />
                      </div>
                    )}
                  </div>
                )}
                {(record.checkout_latitude || record.checkout_longitude) && (
                  <div>
                    <span className='text-muted-foreground text-sm font-medium'>
                      Check-out Location:
                    </span>
                    <p className='text-sm'>
                      Lat: {record.checkout_latitude || 'N/A'}, Lng:{' '}
                      {record.checkout_longitude || 'N/A'}
                    </p>
                    {record.checkout_latitude && record.checkout_longitude && (
                      <div className='mt-2'>
                        <MapboxMap
                          latitude={Number(record.checkout_latitude)}
                          longitude={Number(record.checkout_longitude)}
                          interactive={false}
                          zoom={16}
                          className='h-40'
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {(record.checkin_photo_front || record.checkin_photo_back) && (
            <div>
              <h4 className='mb-2 font-medium'>Photos</h4>
              <div className='grid grid-cols-2 gap-4'>
                {record.checkin_photo_front && (
                  <div>
                    <span className='text-muted-foreground text-sm font-medium'>
                      Check-in Photo:
                    </span>
                    <img
                      src={record.checkin_photo_front}
                      alt='Check-in'
                      className='mt-1 h-32 w-full rounded border object-cover'
                    />
                  </div>
                )}
                {record.checkin_photo_back && (
                  <div>
                    <span className='text-muted-foreground text-sm font-medium'>
                      Additional Photo:
                    </span>
                    <img
                      src={record.checkin_photo_back}
                      alt='Additional'
                      className='mt-1 h-32 w-full rounded border object-cover'
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {record.notes && (
            <div>
              <h4 className='mb-2 font-medium'>Notes</h4>
              <p className='bg-muted rounded border p-3 text-sm'>{record.notes}</p>
            </div>
          )}

          <div className='flex justify-end gap-2 pt-4'>
            <Button
              variant='outline'
              onClick={() => onOpenEvidence?.(record)}
              className='flex items-center gap-2'
            >
              <Eye className='h-4 w-4' />
              View Evidence
            </Button>
            {record.method === 'manual' && !record.verify && (
              <Button onClick={() => onVerify?.(record)} className='bg-success hover:bg-success/90'>
                Verify
              </Button>
            )}
            <Button
              variant='destructive'
              onClick={() => onDelete?.(record)}
              className='flex items-center gap-2'
            >
              <Trash2 className='h-4 w-4' />
              Delete
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// Evidence modal rendering maps, photos, and signatures
export function EvidenceModal({ open, onOpenChange, record, loading }) {
  if (!record) {
    return (
      <Modal title='Attendance Evidence' open={open} onOpenChange={onOpenChange} size='lg'>
        <div />
      </Modal>
    );
  }
  const rec = record;
  return (
    <Modal title='Attendance Evidence' open={open} onOpenChange={onOpenChange} size='lg'>
      <div className='space-y-4'>
        {loading && <div className='text-muted-foreground text-sm'>Loading evidence…</div>}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div>
            <h4 className='mb-2 font-medium'>Check-in</h4>
            <div className='space-y-2'>
              <div className='text-sm'>
                Time: {rec.checkin_time ? new Date(rec.checkin_time).toLocaleString() : '—'}
              </div>
              {(rec.checkin_latitude || rec.checkin_longitude) && (
                <div className='text-sm'>
                  Location: Lat {rec.checkin_latitude ?? 'N/A'}, Lng{' '}
                  {rec.checkin_longitude ?? 'N/A'}{' '}
                  {rec.checkin_latitude && rec.checkin_longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${rec.checkin_latitude},${rec.checkin_longitude}`}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary ml-2 underline'
                    >
                      Open in Maps
                    </a>
                  )}
                </div>
              )}
              {rec.checkin_latitude && rec.checkin_longitude && (
                <MapboxMap
                  latitude={Number(rec.checkin_latitude)}
                  longitude={Number(rec.checkin_longitude)}
                  interactive={false}
                  zoom={16}
                  className='h-40'
                />
              )}
              {rec.checkin_photo_front || rec.checkin_photo_back ? (
                <div className='grid grid-cols-2 gap-2'>
                  {rec.checkin_photo_front && (
                    <a href={rec.checkin_photo_front} target='_blank' rel='noreferrer'>
                      <img
                        src={rec.checkin_photo_front}
                        alt='Check-in front'
                        className='h-32 w-full rounded border object-cover'
                      />
                    </a>
                  )}
                  {rec.checkin_photo_back && (
                    <a href={rec.checkin_photo_back} target='_blank' rel='noreferrer'>
                      <img
                        src={rec.checkin_photo_back}
                        alt='Check-in back'
                        className='h-32 w-full rounded border object-cover'
                      />
                    </a>
                  )}
                </div>
              ) : (
                <div className='text-muted-foreground text-sm'>No check-in photos</div>
              )}
            </div>
          </div>
          <div>
            <h4 className='mb-2 font-medium'>Check-out</h4>
            <div className='space-y-2'>
              <div className='text-sm'>
                Time: {rec.checkout_time ? new Date(rec.checkout_time).toLocaleString() : '—'}
              </div>
              {(rec.checkout_latitude || rec.checkout_longitude) && (
                <div className='text-sm'>
                  Location: Lat {rec.checkout_latitude ?? 'N/A'}, Lng{' '}
                  {rec.checkout_longitude ?? 'N/A'}{' '}
                  {rec.checkout_latitude && rec.checkout_longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${rec.checkout_latitude},${rec.checkout_longitude}`}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary ml-2 underline'
                    >
                      Open in Maps
                    </a>
                  )}
                </div>
              )}
              {rec.checkout_latitude && rec.checkout_longitude && (
                <MapboxMap
                  latitude={Number(rec.checkout_latitude)}
                  longitude={Number(rec.checkout_longitude)}
                  interactive={false}
                  zoom={16}
                  className='h-40'
                />
              )}
              {rec.checkout_photo_front || rec.checkout_photo_back ? (
                <div className='grid grid-cols-2 gap-2'>
                  {rec.checkout_photo_front && (
                    <a href={rec.checkout_photo_front} target='_blank' rel='noreferrer'>
                      <img
                        src={rec.checkout_photo_front}
                        alt='Check-out front'
                        className='h-32 w-full rounded border object-cover'
                      />
                    </a>
                  )}
                  {rec.checkout_photo_back && (
                    <a href={rec.checkout_photo_back} target='_blank' rel='noreferrer'>
                      <img
                        src={rec.checkout_photo_back}
                        alt='Check-out back'
                        className='h-32 w-full rounded border object-cover'
                      />
                    </a>
                  )}
                </div>
              ) : (
                <div className='text-muted-foreground text-sm'>No check-out photos</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 className='mb-2 font-medium'>Signature</h4>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <div className='text-sm font-medium'>Check-in Signature</div>
              {rec.signature_check_in ? (
                <a
                  href={rec.signature_check_in}
                  target='_blank'
                  rel='noreferrer'
                  className='mt-1 block'
                >
                  <div className='rounded border bg-white p-3'>
                    <div className='flex h-48 w-full items-end justify-center overflow-hidden rounded-md bg-white'>
                      <img
                        src={rec.signature_check_in}
                        alt='Check-in Signature'
                        className='max-h-full w-auto object-contain object-bottom'
                      />
                    </div>
                  </div>
                </a>
              ) : (
                <div className='text-muted-foreground text-sm'>No check-in signature</div>
              )}
            </div>
            <div>
              <div className='text-sm font-medium'>Check-out Signature</div>
              {rec.signature_check_out ? (
                <a
                  href={rec.signature_check_out}
                  target='_blank'
                  rel='noreferrer'
                  className='mt-1 block'
                >
                  <div className='rounded border bg-white p-3'>
                    <div className='flex h-48 w-full items-end justify-center overflow-hidden rounded-md bg-white'>
                      <img
                        src={rec.signature_check_out}
                        alt='Check-out Signature'
                        className='max-h-full w-auto object-contain object-bottom'
                      />
                    </div>
                  </div>
                </a>
              ) : (
                <div className='text-muted-foreground text-sm'>No check-out signature</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Manual entry modal with form controls
export function ManualEntryModal({
  open,
  onOpenChange,
  manualEntryForm,
  onChange,
  verifiedUser,
  userSearchLoading,
  userSearchResults,
  showUserDropdown,
  onSelectUser,
  campuses,
  departments,
  courses,
  events,
  checkinPopoverOpen,
  setCheckinPopoverOpen,
  checkoutPopoverOpen,
  setCheckoutPopoverOpen,
  validationErrors,
  loading,
  onSubmit,
  onCancel,
}) {
  return (
    <Modal
      title='Manual Attendance Entry'
      open={open}
      onOpenChange={onOpenChange}
      className='max-w-4xl'
    >
      <div className='space-y-4'>
        <div className='grid grid-cols-1 gap-4'>
          {/* Student Name */}
          <div className='relative space-y-2'>
            <Label htmlFor='user_name'>Student Name / Student ID *</Label>
            <div className='relative'>
              <Input
                id='user_name'
                type='text'
                placeholder='Enter student name or student ID'
                value={manualEntryForm.user_name}
                onChange={(e) => onChange('user_name', e.target.value)}
                className={`pr-20 ${verifiedUser ? 'border-success bg-success/5' : ''}`}
                required
              />
              <div className='absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-2'>
                {userSearchLoading && (
                  <span className='border-primary h-4 w-4 animate-spin rounded-full border-b-2' />
                )}
                {verifiedUser && <span className='text-success text-xs font-medium'>Verified</span>}
              </div>
            </div>

            {/* Search Results Dropdown */}
            {showUserDropdown && userSearchResults.length > 0 && (
              <div className='bg-popover absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-lg'>
                {userSearchResults.map((user) => (
                  <div
                    key={user.id}
                    className='border-border hover:bg-accent cursor-pointer border-b px-4 py-3 last:border-b-0'
                    onClick={() => onSelectUser(user)}
                  >
                    <div className='text-sm font-medium'>{user.full_name}</div>
                    <div className='text-muted-foreground mt-1 text-xs'>
                      {user.student_id && <span>ID: {user.student_id}</span>}
                      {user.student_id && user.email && <span> • </span>}
                      {user.email && <span>{user.email}</span>}
                    </div>
                    {(user.campus_name || user.department_name || user.course_name) && (
                      <div className='text-muted-foreground/80 mt-1 text-xs'>
                        {[user.campus_name, user.department_name, user.course_name]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Verification Status */}
            {verifiedUser && (
              <div className='border-success/20 bg-success/5 mt-2 rounded-md border p-3'>
                <div className='text-success-foreground/80 mt-1 text-xs'>
                  {verifiedUser.student_id && <div>Student ID: {verifiedUser.student_id}</div>}
                  <div>Email: {verifiedUser.email}</div>
                  {verifiedUser.campus_name && <div>Campus: {verifiedUser.campus_name}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Email */}
          <div className='space-y-2'>
            <Label htmlFor='email'>
              Email {verifiedUser && <span className='text-success'>(Auto-filled)</span>}
            </Label>
            <Input
              id='email'
              type='email'
              placeholder='Enter email address'
              value={manualEntryForm.email}
              onChange={(e) => onChange('email', e.target.value)}
              className={verifiedUser ? 'border-success/20 bg-success/5' : ''}
              disabled={verifiedUser}
            />
          </div>

          {/* Campus */}
          <div className='space-y-2'>
            <Label htmlFor='campus'>
              Campus * {verifiedUser && <span className='text-success'>(Auto-filled)</span>}
            </Label>
            <Select
              value={manualEntryForm.campus}
              onValueChange={(value) => onChange('campus', value)}
              disabled={verifiedUser}
            >
              <SelectTrigger
                className={`w-full ${verifiedUser ? 'border-success/20 bg-success/5' : ''}`}
              >
                <SelectValue placeholder='Select a campus' />
              </SelectTrigger>
              <SelectContent>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id.toString()}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department */}
          <div className='space-y-2'>
            <Label htmlFor='department'>
              Department * {verifiedUser && <span className='text-success'>(Auto-filled)</span>}
            </Label>
            <Select
              value={manualEntryForm.department}
              onValueChange={(value) => onChange('department', value)}
              disabled={verifiedUser}
            >
              <SelectTrigger
                className={`w-full ${verifiedUser ? 'border-success/20 bg-success/5' : ''}`}
              >
                <SelectValue placeholder='Select a department' />
              </SelectTrigger>
              <SelectContent>
                {departments
                  .filter(
                    (dept) =>
                      !manualEntryForm.campus || dept.campus.toString() === manualEntryForm.campus,
                  )
                  .map((department) => (
                    <SelectItem key={department.id} value={department.id.toString()}>
                      {department.name} ({department.abbreviation})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course */}
          <div className='space-y-2'>
            <Label htmlFor='course'>
              Course * {verifiedUser && <span className='text-success'>(Auto-filled)</span>}
            </Label>
            <Select
              value={manualEntryForm.course}
              onValueChange={(value) => onChange('course', value)}
              disabled={verifiedUser}
            >
              <SelectTrigger
                className={`w-full ${verifiedUser ? 'border-success/20 bg-success/5' : ''}`}
              >
                <SelectValue placeholder='Select a course' />
              </SelectTrigger>
              <SelectContent>
                {courses
                  .filter(
                    (course) =>
                      !manualEntryForm.department ||
                      course.department.toString() === manualEntryForm.department,
                  )
                  .map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name} ({course.abbreviation})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event */}
          <div className='space-y-2'>
            <Label htmlFor='event'>Event *</Label>
            <Select
              value={manualEntryForm.event}
              onValueChange={(value) => onChange('event', value)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select an event' />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className='space-y-2'>
            <Label htmlFor='status'>Status *</Label>
            <Select
              value={manualEntryForm.status}
              onValueChange={(value) => onChange('status', value)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='present'>Present</SelectItem>
                <SelectItem value='late'>Late</SelectItem>
                <SelectItem value='absent'>Absent</SelectItem>
                <SelectItem value='excused'>Excused</SelectItem>
                <SelectItem value='invalid'>Invalid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status, Check-in Time, and Check-out Time - Two columns */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {manualEntryForm.status === 'present' || manualEntryForm.status === 'late' ? (
              <DateTimePicker
                label='Check-in Time'
                value={manualEntryForm.checkin_time}
                onChange={(val) => onChange('checkin_time', val)}
                open={checkinPopoverOpen}
                onOpenChange={setCheckinPopoverOpen}
                placeholder='Check In'
              />
            ) : (
              <div />
            )}

            {manualEntryForm.status === 'present' || manualEntryForm.status === 'late' ? (
              <DateTimePicker
                label='Check-out Time'
                value={manualEntryForm.checkout_time}
                onChange={(val) => onChange('checkout_time', val)}
                open={checkoutPopoverOpen}
                onOpenChange={setCheckoutPopoverOpen}
                placeholder='Check Out'
              />
            ) : (
              <div />
            )}
          </div>

          {/* Notes/Reason */}
          <div className='space-y-2'>
            <Label htmlFor='notes'>
              {manualEntryForm.status === 'absent' || manualEntryForm.status === 'excused'
                ? 'Reason *'
                : 'Notes'}
            </Label>
            <Textarea
              id='notes'
              placeholder={
                manualEntryForm.status === 'absent'
                  ? 'Please provide reason for absence'
                  : manualEntryForm.status === 'excused'
                    ? 'Please provide reason for excuse'
                    : 'Additional notes (optional)'
              }
              value={manualEntryForm.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Status Information */}
        <div className='rounded-md border p-4'>
          <h4 className='mb-2 text-sm font-medium'>Status Information:</h4>
          <div className='text-sm'>
            {manualEntryForm.status === 'present' && (
              <p>
                • Present: Student attended the event. Check-in and check-out times will be
                recorded.
              </p>
            )}
            {manualEntryForm.status === 'late' && (
              <p>
                • Late: Student arrived late to the event. Check-in and check-out times will be
                recorded.
              </p>
            )}
            {manualEntryForm.status === 'absent' && (
              <p>
                • Absent: Student did not attend the event. Check-in/out times will show
                &quot;Absent&quot;.
              </p>
            )}
            {manualEntryForm.status === 'excused' && (
              <p>
                • Excused: Student had a valid reason for not attending. Check-in/out times will
                show &quot;Excused&quot;.
              </p>
            )}
            {manualEntryForm.status === 'invalid' && (
              <p>
                • Invalid: Attendance record is invalid or disputed. Check-in/out times will show
                &quot;Invalid&quot;.
              </p>
            )}
          </div>
        </div>

        {/* Validation Alert */}
        {validationErrors?.length > 0 && (
          <Alert variant='destructive'>
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
          <Button variant='outline' onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              loading ||
              !manualEntryForm.user_name ||
              !manualEntryForm.event ||
              (!verifiedUser &&
                (!manualEntryForm.campus ||
                  !manualEntryForm.department ||
                  !manualEntryForm.course)) ||
              ((manualEntryForm.status === 'absent' || manualEntryForm.status === 'excused') &&
                !manualEntryForm.notes)
            }
            className='bg-success hover:bg-success/90'
          >
            {loading ? 'Creating...' : 'Create Entry'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Verify modal remains simple
export function VerifyAttendanceModal({
  open,
  onOpenChange,
  notes,
  onNotesChange,
  onConfirm,
  loading,
}) {
  return (
    <Modal title='Verify Attendance' open={open} onOpenChange={onOpenChange}>
      <div className='space-y-4'>
        <p className='text-muted-foreground text-sm'>
          Add a short note describing why this record is verified manually (e.g., device issue, late
          arrival, special permission). This note is stored in the attendance record.
        </p>
        <div className='space-y-2'>
          <Label htmlFor='verify-notes'>Notes (optional)</Label>
          <Textarea
            id='verify-notes'
            placeholder='Reason for manual verification'
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={4}
          />
        </div>
        <div className='flex justify-end gap-2 pt-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading} className='bg-success hover:bg-success/90'>
            {loading ? 'Verifying…' : 'Verify'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
