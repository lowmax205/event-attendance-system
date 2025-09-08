import { Edit, Trash2 } from 'lucide-react';
import React from 'react';
import DateTimePicker from '@/components/date-time-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MapboxMap from '@/components/ui/mapbox-map';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';

export function ViewEventModal({
  open,
  onOpenChange,
  event,
  getStatusBadge,
  qrSvg,
  qrLoading,
  qrError,
  verifyUrlStr,
  onEdit,
  onDelete,
  onUrlRedirect,
  onManualEntry,
  onPrintQr,
}) {
  return (
    <Modal title='Event Details' open={open} onOpenChange={onOpenChange} size='xl'>
      {event && (
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Event ID</Label>
              <p className='font-mono text-sm'>{event.id}</p>
            </div>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Status</Label>
              <div className='mt-1'>{getStatusBadge(event)}</div>
            </div>
          </div>
          <div>
            <Label className='text-muted-foreground text-sm font-medium'>Title</Label>
            <p className='text-sm font-semibold'>{event.title}</p>
          </div>
          {event.description && (
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Description</Label>
              <p className='text-sm'>{event.description}</p>
            </div>
          )}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Date</Label>
              <p className='text-sm'>
                {event.date ||
                  (event.start_at ? new Date(event.start_at).toLocaleDateString() : 'N/A')}
              </p>
            </div>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Time</Label>
              <p className='text-sm'>
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
              </p>
            </div>
          </div>
          {event.category && (
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Category</Label>
              <p className='text-sm'>{event.category}</p>
            </div>
          )}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Location Name</Label>
              <p className='text-sm'>{event.location_name || event.location || 'N/A'}</p>
            </div>
            {event.venue_address && (
              <div>
                <Label className='text-muted-foreground text-sm font-medium'>Venue Address</Label>
                <p className='text-sm'>{event.venue_address}</p>
              </div>
            )}
          </div>
          {event.latitude && event.longitude && (
            <div className='space-y-2'>
              <Label className='text-muted-foreground text-sm font-medium'>Location Map</Label>
              <MapboxMap
                latitude={parseFloat(event.latitude)}
                longitude={parseFloat(event.longitude)}
                interactive={false}
                showMarker={true}
                className='h-48'
              />
              <div className='text-muted-foreground grid grid-cols-2 gap-4 text-xs'>
                <div>Latitude: {event.latitude}</div>
                <div>Longitude: {event.longitude}</div>
              </div>
            </div>
          )}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Participants</Label>
              <p className='text-sm'>
                {event.current_attendees || event.attendance_count || 0}
                {(event.capacity || event.max_participants) &&
                  ` / ${event.capacity || event.max_participants}`}{' '}
                registered
              </p>
            </div>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Attendance %</Label>
              <p className='text-sm'>{event.attendance_percentage || 0}%</p>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label className='text-muted-foreground text-sm font-medium'>Settings</Label>
              <div className='flex flex-wrap gap-2'>
                {event.is_active && <Badge variant='secondary'>Active</Badge>}
                {event.is_public && <Badge variant='outline'>Public</Badge>}
                {event.allow_entry && <Badge variant='outline'>Allow Entry</Badge>}
                {event.requires_registration && (
                  <Badge variant='outline'>Registration Required</Badge>
                )}
                <Badge variant='outline'>Buffer {event.buffer_window_minutes ?? 30}m</Badge>
              </div>
            </div>
            {event.qr_code && (
              <div>
                <Label className='text-muted-foreground text-sm font-medium'>QR Code</Label>
                <p className='bg-muted rounded p-2 font-mono text-xs'>{event.qr_code}</p>
              </div>
            )}
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Created</Label>
              <p className='text-sm'>
                {event.created_at ? new Date(event.created_at).toLocaleDateString() : 'N/A'}
                {event.created_at && (
                  <span className='text-muted-foreground block text-xs'>
                    {new Date(event.created_at).toLocaleTimeString([], {
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
                {event.updated_at ? new Date(event.updated_at).toLocaleDateString() : 'N/A'}
                {event.updated_at && (
                  <span className='text-muted-foreground block text-xs'>
                    {new Date(event.updated_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div>
            <Label className='text-muted-foreground text-sm font-medium'>Attendance QR Code</Label>
            <div className='mt-2 flex justify-center'>
              {qrLoading && (
                <div className='text-muted-foreground flex flex-col items-center gap-2'>
                  <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2' />
                  Generating QR...
                </div>
              )}
              {qrError && (
                <div className='text-destructive text-center text-sm'>Error: {qrError}</div>
              )}
              {!qrLoading && !qrError && qrSvg && (
                <div className='rounded-lg bg-white p-4 shadow'>
                  <div
                    className='h-[200px] w-[200px]'
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                </div>
              )}
            </div>
            {!qrLoading && !qrError && qrSvg && (
              <div className='text-muted-foreground mt-2 text-center text-xs'>
                Scan to open the secure attendance verification flow.
              </div>
            )}
            {!qrLoading && !qrError && verifyUrlStr && (
              <div className='mt-3 space-y-2'>
                <div className='flex flex-wrap items-center justify-center gap-2'>
                  <Button onClick={onUrlRedirect}>URL Redirect</Button>
                  <Button variant='secondary' onClick={onManualEntry}>
                    Manual Entry
                  </Button>
                  <Button variant='outline' onClick={onPrintQr}>
                    Print QR Code
                  </Button>
                </div>
                <div className='mx-auto max-w-lg'>
                  <Alert>
                    <AlertDescription>
                      This direct link is provided for admins/organizers to test the flow on a
                      laptop or desktop. Students must use their own mobile phones to scan the QR
                      code and complete attendance.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}
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

export function CreateEventModal({
  open,
  onOpenChange,
  formData,
  setFormData,
  startPopoverOpen,
  setStartPopoverOpen,
  endPopoverOpen,
  setEndPopoverOpen,
  useManualCoords,
  setUseManualCoords,
  useMapSelection,
  setUseMapSelection,
  useCurrentLocation,
  setUseCurrentLocation,
  geoLoading,
  geoError,
  hasLocatedCurrent,
  onLocateCurrent,
  validationErrors,
  onSubmit,
  onCancel,
}) {
  return (
    <Modal title='Create New Event' open={open} onOpenChange={onOpenChange} size='xl'>
      <div className='space-y-4'>
        {/* Basic Event Information */}
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title' className='text-muted-foreground'>
              Event Title *
            </Label>
            <Input
              id='title'
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder='Enter event title'
              required
              aria-describedby='title-error'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description' className='text-muted-foreground'>
              Description
            </Label>
            <Textarea
              id='description'
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder='Enter event description'
              rows={3}
            />
          </div>
        </div>

        {/* Event Schedule Section */}
        <div className='space-y-4'>
          <h4 className='text-sm font-medium'>Event Schedule</h4>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <DateTimePicker
              label='Start Date & Time *'
              value={formData.start_at_local}
              onChange={(val) => setFormData({ ...formData, start_at_local: val })}
              open={startPopoverOpen}
              onOpenChange={setStartPopoverOpen}
              placeholder='Select start date & time'
            />
            <DateTimePicker
              label='End Date & Time *'
              value={formData.end_at_local}
              onChange={(val) => setFormData({ ...formData, end_at_local: val })}
              open={endPopoverOpen}
              onOpenChange={setEndPopoverOpen}
              placeholder='Select end date & time'
              nowLabel={formData.start_at_local ? '+2h' : 'Now'}
              nowFn={() =>
                formData.start_at_local
                  ? new Date(new Date(formData.start_at_local).getTime() + 2 * 60 * 60 * 1000)
                  : new Date()
              }
            />
          </div>
        </div>

        {/* Location Section */}
        <div className='space-y-4'>
          <h4 className='text-sm font-medium'>Location Details</h4>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='location_name' className='text-muted-foreground'>
                Location Name
              </Label>
              <Input
                id='location_name'
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                placeholder='Enter location name'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='category' className='text-muted-foreground'>
                Category
              </Label>
              <Input
                id='category'
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder='e.g., Workshop, Seminar, Meeting'
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='venue_address' className='text-muted-foreground'>
              Venue Address
            </Label>
            <Input
              id='venue_address'
              value={formData.venue_address}
              onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
              placeholder='Enter full venue address'
            />
          </div>
        </div>

        {/* Location Input Methods */}
        <div className='space-y-4'>
          <div className='rounded-md border p-4'>
            <Label className='text-muted-foreground text-sm font-medium'>
              Location Input Methods
            </Label>
            <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='loc_manual'
                  checked={useManualCoords}
                  onCheckedChange={(c) => setUseManualCoords(!!c)}
                />
                <Label htmlFor='loc_manual' className='text-sm'>
                  Manual coordinates
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='loc_map'
                  checked={useMapSelection}
                  onCheckedChange={(c) => setUseMapSelection(!!c)}
                />
                <Label htmlFor='loc_map' className='text-sm'>
                  Map selection
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='loc_geo'
                  checked={useCurrentLocation}
                  onCheckedChange={(c) => setUseCurrentLocation(!!c)}
                />
                <Label htmlFor='loc_geo' className='text-sm'>
                  Current location
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Manual coordinates */}
        {useManualCoords && (
          <div className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='latitude' className='text-muted-foreground'>
                  Latitude
                </Label>
                <Input
                  id='latitude'
                  type='number'
                  step='any'
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder='e.g., 14.5995'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='longitude' className='text-muted-foreground'>
                  Longitude
                </Label>
                <Input
                  id='longitude'
                  type='number'
                  step='any'
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder='e.g., 120.9842'
                />
              </div>
            </div>
          </div>
        )}

        {/* Map for location selection */}
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label className='text-muted-foreground'>Location Map</Label>
            <MapboxMap
              latitude={formData.latitude ? parseFloat(formData.latitude) : 14.5995}
              longitude={formData.longitude ? parseFloat(formData.longitude) : 120.9842}
              interactive={useMapSelection}
              showMarker={!!(formData.latitude && formData.longitude)}
              animateMarker={!!(formData.latitude && formData.longitude)}
              locating={geoLoading}
              locatingMessage={geoLoading ? 'Detecting your location…' : undefined}
              onLocationSelect={({ latitude, longitude }) => {
                if (!useMapSelection) return;
                setFormData((prev) => ({
                  ...prev,
                  latitude: latitude.toFixed(8),
                  longitude: longitude.toFixed(8),
                }));
              }}
              className='h-48'
            />
            <div className='flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div className='text-muted-foreground text-xs'>
                <p>
                  {useMapSelection
                    ? 'Click on the map to select coordinates.'
                    : 'Enable "Map selection" to click on the map.'}
                </p>
                <p className='mt-1'>
                  {useCurrentLocation
                    ? 'Press the button to detect your current position.'
                    : 'Enable "Current location" to use the locate button.'}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  disabled={!useCurrentLocation || geoLoading}
                  onClick={onLocateCurrent}
                >
                  {geoLoading ? (
                    <span className='flex items-center gap-2'>
                      <span className='border-primary inline-block h-4 w-4 animate-spin rounded-full border-b-2' />
                      Locating...
                    </span>
                  ) : (
                    'Locate Current Position'
                  )}
                </Button>
              </div>
            </div>
            {geoError && <p className='text-destructive text-xs'>{geoError}</p>}
          </div>
        </div>

        {/* Event Settings Section */}
        <div className='space-y-4'>
          <h4 className='text-sm font-medium'>Event Settings</h4>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='capacity' className='text-muted-foreground'>
                Maximum Participants
              </Label>
              <Input
                id='capacity'
                type='number'
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder='Enter maximum participants'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='qr_code' className='text-muted-foreground'>
                QR Code
              </Label>
              <Input
                id='qr_code'
                value={formData.qr_code}
                onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
                placeholder='Leave empty for auto-generation'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='buffer_window_minutes' className='text-muted-foreground'>
                Event buffer window (minutes)
              </Label>
              <Input
                id='buffer_window_minutes'
                type='number'
                min={0}
                value={formData.buffer_window_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, buffer_window_minutes: e.target.value })
                }
                placeholder='e.g., 30'
              />
            </div>
          </div>
        </div>
        {/* Event Options */}
        <div className='space-y-4'>
          <div className='rounded-md border p-4'>
            <Label className='text-muted-foreground text-sm font-medium'>Event Options</Label>
            <div className='mt-3 grid grid-cols-2 gap-3'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='is_active'
                  checked={!!formData.is_active}
                  onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
                />
                <Label htmlFor='is_active' className='text-sm'>
                  Active Event
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='is_public'
                  checked={!!formData.is_public}
                  onCheckedChange={(c) => setFormData({ ...formData, is_public: c })}
                />
                <Label htmlFor='is_public' className='text-sm'>
                  Public Event
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='allow_entry'
                  checked={!!formData.allow_entry}
                  onCheckedChange={(c) => setFormData({ ...formData, allow_entry: c })}
                />
                <Label htmlFor='allow_entry' className='text-sm'>
                  Allow Entry
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='requires_registration'
                  checked={!!formData.requires_registration}
                  onCheckedChange={(c) => setFormData({ ...formData, requires_registration: c })}
                />
                <Label htmlFor='requires_registration' className='text-sm'>
                  Requires Registration
                </Label>
              </div>
            </div>
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

        <div className='flex justify-end gap-2 pt-4'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={useCurrentLocation && !hasLocatedCurrent}
            aria-disabled={useCurrentLocation && !hasLocatedCurrent}
            title={
              useCurrentLocation && !hasLocatedCurrent
                ? 'Enable and use "Locate Current Position" first'
                : undefined
            }
          >
            Create Event
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function EditEventModal({
  open,
  onOpenChange,
  formData,
  setFormData,
  startPopoverOpen,
  setStartPopoverOpen,
  endPopoverOpen,
  setEndPopoverOpen,
  geoLoading,
  setFormCoordsFromMap,
  validationErrors,
  onSubmit,
  onCancel,
}) {
  return (
    <Modal title='Edit Event' open={open} onOpenChange={onOpenChange} size='xl'>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='edit_title'>Event Title *</Label>
          <Input
            id='edit_title'
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder='Enter event title'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='edit_description'>Description</Label>
          <Textarea
            id='edit_description'
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder='Enter event description'
            rows={3}
          />
        </div>
        <div className='space-y-4'>
          <h4 className='text-sm font-medium'>Event Schedule</h4>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <DateTimePicker
              label='Start Date & Time *'
              value={formData.start_at_local}
              onChange={(val) => setFormData({ ...formData, start_at_local: val })}
              open={startPopoverOpen}
              onOpenChange={setStartPopoverOpen}
              placeholder='Select start date & time'
            />
            <DateTimePicker
              label='End Date & Time *'
              value={formData.end_at_local}
              onChange={(val) => setFormData({ ...formData, end_at_local: val })}
              open={endPopoverOpen}
              onOpenChange={setEndPopoverOpen}
              placeholder='Select end date & time'
              nowLabel={formData.start_at_local ? '+2h' : 'Now'}
              nowFn={() =>
                formData.start_at_local
                  ? new Date(new Date(formData.start_at_local).getTime() + 2 * 60 * 60 * 1000)
                  : new Date()
              }
            />
          </div>
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='edit_location_name'>Location Name</Label>
            <Input
              id='edit_location_name'
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              placeholder='Enter location name'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit_category'>Category</Label>
            <Input
              id='edit_category'
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder='e.g., Workshop, Seminar, Meeting'
            />
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='edit_venue_address'>Venue Address</Label>
          <Input
            id='edit_venue_address'
            value={formData.venue_address}
            onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
            placeholder='Enter full venue address'
          />
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='edit_latitude'>Latitude</Label>
            <Input
              id='edit_latitude'
              type='number'
              step='any'
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              placeholder='e.g., 14.5995'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit_longitude'>Longitude</Label>
            <Input
              id='edit_longitude'
              type='number'
              step='any'
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              placeholder='e.g., 120.9842'
            />
          </div>
        </div>
        <div className='space-y-2'>
          <Label>Location Map</Label>
          <MapboxMap
            latitude={formData.latitude ? parseFloat(formData.latitude) : 14.5995}
            longitude={formData.longitude ? parseFloat(formData.longitude) : 120.9842}
            interactive={true}
            showMarker={!!(formData.latitude && formData.longitude)}
            animateMarker={!!(formData.latitude && formData.longitude)}
            locating={geoLoading}
            locatingMessage={geoLoading ? 'Detecting your location…' : undefined}
            onLocationSelect={({ latitude, longitude }) =>
              setFormCoordsFromMap(latitude, longitude)
            }
            className='h-48'
          />
          <p className='text-muted-foreground text-xs'>
            Click on the map to update coordinates, or enter them manually above
          </p>
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='edit_capacity'>Maximum Participants</Label>
            <Input
              id='edit_capacity'
              type='number'
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder='Enter maximum participants'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit_qr_code'>QR Code</Label>
            <Input
              id='edit_qr_code'
              value={formData.qr_code}
              onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
              placeholder='Leave empty for auto-generation'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit_buffer_window_minutes'>Event buffer window (minutes)</Label>
            <Input
              id='edit_buffer_window_minutes'
              type='number'
              min={0}
              value={formData.buffer_window_minutes}
              onChange={(e) => setFormData({ ...formData, buffer_window_minutes: e.target.value })}
              placeholder='e.g., 30'
            />
          </div>
        </div>
        <div className='space-y-3'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='edit_is_active'
              checked={!!formData.is_active}
              onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
            />
            <Label htmlFor='edit_is_active' className='text-sm'>
              Active Event
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='edit_is_public'
              checked={!!formData.is_public}
              onCheckedChange={(c) => setFormData({ ...formData, is_public: c })}
            />
            <Label htmlFor='edit_is_public' className='text-sm'>
              Public Event
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='edit_allow_entry'
              checked={!!formData.allow_entry}
              onCheckedChange={(c) => setFormData({ ...formData, allow_entry: c })}
            />
            <Label htmlFor='edit_allow_entry' className='text-sm'>
              Allow Entry
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='edit_requires_registration'
              checked={!!formData.requires_registration}
              onCheckedChange={(c) => setFormData({ ...formData, requires_registration: c })}
            />
            <Label htmlFor='edit_requires_registration' className='text-sm'>
              Requires Registration
            </Label>
          </div>
        </div>
        {validationErrors?.length > 0 && (
          <Alert>
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
        <div className='flex justify-end gap-2 pt-4'>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Update Event</Button>
        </div>
      </div>
    </Modal>
  );
}
