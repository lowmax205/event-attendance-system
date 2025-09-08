import {
  Search,
  Grid as GridIcon,
  List as ListIcon,
  Calendar,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiService } from '@/services/api-service.js';

// Placeholder university name constant (could be moved to config)
const UNIVERSITY_NAME = 'SNSU';

// Basic Event Card for grid view
const EventCard = ({ event }) => (
  <Card className='flex flex-col'>
    <CardHeader className='flex flex-row items-start justify-between gap-4 pb-4'>
      <div className='space-y-1'>
        <CardTitle className='line-clamp-2 text-base'>{event.title}</CardTitle>
      </div>
      <span className='border-primary/30 bg-primary/10 text-primary rounded border px-2 py-1 text-xs whitespace-nowrap'>
        {new Date(event.start_at || event.date).toLocaleDateString()}
      </span>
    </CardHeader>
    <CardContent className='flex-1 pt-0'>
      <CardDescription className='line-clamp-4 text-sm leading-relaxed'>
        {event.description}
      </CardDescription>
    </CardContent>
    <CardFooter className='pt-0'>
      {/* onView handler will be injected by parent via cloned props */}
      {event.onView ? (
        <Button
          size='sm'
          variant='outline'
          className='text-xs'
          onClick={event.onView}
          aria-label='View details'
        >
          Details
        </Button>
      ) : (
        <Button size='sm' variant='outline' className='text-xs' disabled>
          Details
        </Button>
      )}
    </CardFooter>
  </Card>
);

// List view item
const ListEventItem = ({ event }) => (
  <Card className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
    <CardContent className='flex-1'>
      <CardTitle className='mb-1 text-base'>{event.title}</CardTitle>
      <CardDescription className='line-clamp-2 text-sm'>{event.description}</CardDescription>
    </CardContent>
    <CardFooter className='flex shrink-0 items-center gap-3 md:justify-end'>
      <span className='border-primary/30 bg-primary/10 text-primary rounded border px-2 py-1 text-xs'>
        {new Date(event.start_at || event.date).toLocaleDateString()}
      </span>
      {event.onView ? (
        <Button
          size='sm'
          variant='outline'
          className='text-xs'
          onClick={event.onView}
          aria-label='View details'
        >
          Details
        </Button>
      ) : (
        <Button size='sm' variant='outline' className='text-xs' disabled>
          Details
        </Button>
      )}
    </CardFooter>
  </Card>
);

export function EventPage() {
  // Local state for API-backed events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [sortBy, setSortBy] = useState('date');
  // Filters panel removed; only sorting remains
  const [sortOrder, setSortOrder] = useState('asc'); // asc | desc
  // Removed category/date filters
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3); // grid: 3x3 default on lg
  // View modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleSearchTermChange = (val) => setSearchTerm(val);
  // Removed active filters badge

  // Fetch events on mount
  useEffect(() => {
    let isActive = true;
    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        // Fetch only ongoing and upcoming active events to avoid completed/cancelled
        const [ongoing, upcoming] = await Promise.all([
          apiService.getAll('/events/events/?status=ongoing&is_active=true'),
          apiService.getAll('/events/events/?status=upcoming&is_active=true'),
        ]);
        if (!isActive) return;
        const byId = new Map();
        [...(ongoing || []), ...(upcoming || [])].forEach((e) => {
          if (e && e.id != null) byId.set(e.id, e);
        });
        setEvents(Array.from(byId.values()));
      } catch (err) {
        if (!isActive) return;
        setError(err?.response?.data?.detail || err?.message || 'Failed to load events');
      } finally {
        if (isActive) setLoading(false);
      }
    }
    fetchEvents();
    return () => {
      isActive = false;
    };
  }, []);

  // Base visibility filters: show only ongoing/upcoming and not cancelled (inactive)
  const visibilityFiltered = useMemo(() => {
    return events.filter((e) => {
      const status = (e.status || '').toLowerCase();
      const active = e.is_active !== false; // treat false as cancelled
      return active && (status === 'ongoing' || status === 'upcoming');
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    const base = visibilityFiltered;
    if (!searchTerm) return base;
    const q = searchTerm.toLowerCase();
    return base.filter((e) => {
      const title = (e.title || '').toLowerCase();
      const desc = (e.description || '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [searchTerm, visibilityFiltered]);

  // Category/date filters removed

  const sortedEvents = useMemo(() => {
    const direction = sortOrder === 'asc' ? 1 : -1;
    const arr = [...filteredEvents];
    if (sortBy === 'date') {
      arr.sort(
        (a, b) => (new Date(a.start_at || a.date) - new Date(b.start_at || b.date)) * direction,
      );
    } else if (sortBy === 'alphabetical') {
      arr.sort((a, b) => (a.title || '').localeCompare(b.title || '') * direction);
    }
    return arr;
  }, [filteredEvents, sortBy, sortOrder]);

  // Reset page when filters/sort/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  // Paginate results
  const paginatedEvents = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return sortedEvents.slice(startIdx, endIdx);
  }, [sortedEvents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage) || 1;
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openViewModal = (ev) => {
    setSelectedEvent(ev);
    setIsViewModalOpen(true);
  };

  // No categories needed without filters

  // Stats (basic derivation)
  const eventStats = {
    total: visibilityFiltered.length,
    upcoming: visibilityFiltered.filter((e) => (e.status || '').toLowerCase() === 'upcoming')
      .length,
    thisWeek: visibilityFiltered.filter((e) => {
      const now = new Date();
      const in7 = new Date();
      in7.setDate(now.getDate() + 7);
      const d = new Date(e.start_at || e.date);
      return d >= now && d <= in7;
    }).length,
  };

  return (
    <div className='bg-background text-foreground min-h-screen'>
      {/* Hero (not full viewport; reduced top padding; flush with header) */}
      <section className='text-primary-foreground from-primary to-primary/50 bg-gradient-to-r'>
        <div className='mx-auto w-full max-w-7xl px-4 pt-18 pb-4 sm:px-6 lg:px-8'>
          <div className='mx-auto mb-10 max-w-3xl text-center'>
            <h1 className='mb-6 text-4xl font-bold tracking-tight md:text-6xl'>
              University Events
            </h1>
            <p className='text-primary-foreground/90 mx-auto mb-10 max-w-2xl text-lg leading-relaxed md:text-2xl'>
              Discover amazing events, connect with your community, and create unforgettable
              experiences at {UNIVERSITY_NAME}
            </p>
            <div className='mx-auto mb-8 grid max-w-md grid-cols-3 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold'>{eventStats.total}</div>
                <div className='text-xs opacity-80'>Total Events</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold'>{eventStats.upcoming}</div>
                <div className='text-xs opacity-80'>Upcoming</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold'>{eventStats.thisWeek}</div>
                <div className='text-xs opacity-80'>This Week</div>
              </div>
            </div>
            <div className='mx-auto max-w-xl'>
              <div className='relative'>
                <Search className='text-primary-foreground/70 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search events, categories, or locations...'
                  value={searchTerm}
                  onChange={(e) => handleSearchTermChange(e.target.value)}
                  className='bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:ring-primary-foreground/50 h-11 rounded-md pl-9'
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className='mx-auto max-w-7xl px-4 pt-4 pb-12 sm:px-6 lg:px-8'>
        <div className='mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex flex-wrap items-center gap-4'>
            <h2 className='text-xl font-semibold'>All Events ({sortedEvents.length})</h2>
            <div className='bg-card flex items-center gap-1 rounded-md border p-1'>
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-sm p-2 text-xs transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                title='Grid View'
                aria-label='Grid view'
              >
                <GridIcon className='h-4 w-4' />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-sm p-2 text-xs transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                title='List View'
                aria-label='List view'
              >
                <ListIcon className='h-4 w-4' />
              </button>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                className='bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring rounded-md border p-2 focus-visible:ring-2 focus-visible:outline-none'
                title={`Toggle sort order (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
                aria-label='Toggle sort order'
              >
                {sortOrder === 'asc' ? (
                  <ArrowUpNarrowWide className='h-4 w-4' />
                ) : (
                  <ArrowDownNarrowWide className='h-4 w-4' />
                )}
              </button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger aria-label='Select sort field'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='date'>Date</SelectItem>
                  <SelectItem value='alphabetical'>Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <Card className='py-12 text-center'>
            <CardContent className='flex flex-col items-center gap-4'>
              <Calendar className='text-muted-foreground h-16 w-16 animate-pulse' />
              <CardTitle className='text-xl'>Loading events…</CardTitle>
              <CardDescription className='mx-auto max-w-md'>
                Please wait while we fetch the latest events.
              </CardDescription>
            </CardContent>
          </Card>
        ) : error ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <AlertCircle className='text-destructive mx-auto h-8 w-8' />
              <p className='text-destructive mt-2 font-medium'>Could not load events</p>
              <p className='text-muted-foreground mx-auto mt-1 max-w-md text-sm'>{String(error)}</p>
              <Button
                onClick={() => {
                  // retry
                  setLoading(true);
                  setError(null);
                  (async () => {
                    try {
                      const [ongoing, upcoming] = await Promise.all([
                        apiService.getAll('/events/events/?status=ongoing&is_active=true'),
                        apiService.getAll('/events/events/?status=upcoming&is_active=true'),
                      ]);
                      const byId = new Map();
                      [...(ongoing || []), ...(upcoming || [])].forEach((e) => {
                        if (e && e.id != null) byId.set(e.id, e);
                      });
                      setEvents(Array.from(byId.values()));
                    } catch (err) {
                      setError(
                        err?.response?.data?.detail || err?.message || 'Failed to load events',
                      );
                    } finally {
                      setLoading(false);
                    }
                  })();
                }}
                variant='outline'
                className='mt-4'
              >
                <RefreshCw className='mr-2 h-4 w-4' /> Retry
              </Button>
            </div>
          </div>
        ) : sortedEvents.length === 0 ? (
          <Card className='py-12 text-center'>
            <CardContent className='flex flex-col items-center gap-4'>
              <Calendar className='text-muted-foreground h-16 w-16' />
              <CardTitle className='text-xl'>No Events Found</CardTitle>
              <CardDescription className='mx-auto max-w-md'>
                We couldn&apos;t find any events matching your criteria. Try adjusting your search.
              </CardDescription>
              <Button
                variant='outline'
                onClick={() => {
                  setSearchTerm('');
                  setSortBy('date');
                  setSortOrder('asc');
                }}
              >
                Reset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {paginatedEvents.map((ev) => (
                  <EventCard key={ev.id} event={{ ...ev, onView: () => openViewModal(ev) }} />
                ))}
              </div>
            )}
            {viewMode === 'list' && (
              <div className='mb-8 space-y-4'>
                {paginatedEvents.map((ev) => (
                  <ListEventItem key={ev.id} event={{ ...ev, onView: () => openViewModal(ev) }} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className='mt-4 flex justify-center'>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={
                          currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }).map((_, index) => {
                      const pageNumber = index + 1;
                      const showPage =
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);

                      if (!showPage) {
                        if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      }

                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNumber)}
                            isActive={pageNumber === currentPage}
                            className='cursor-pointer'
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={
                          currentPage === totalPages
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        {/* View Event Modal */}
        <Modal
          title={selectedEvent ? selectedEvent.title || 'Event Details' : 'Event Details'}
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          size='lg'
        >
          {selectedEvent && (
            <div className='space-y-4'>
              {selectedEvent.description && (
                <div>
                  <Label className='text-muted-foreground text-sm font-medium'>Description</Label>
                  <p className='mt-1 text-sm'>{selectedEvent.description}</p>
                </div>
              )}
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <Label className='text-muted-foreground text-sm font-medium'>Date</Label>
                  <p className='mt-1 text-sm'>
                    {new Date(selectedEvent.start_at || selectedEvent.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className='text-muted-foreground text-sm font-medium'>Time</Label>
                  <p className='mt-1 text-sm'>
                    {selectedEvent.start_at
                      ? new Date(selectedEvent.start_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                    {selectedEvent.end_at && (
                      <>
                        {' '}
                        –{' '}
                        {new Date(selectedEvent.end_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <Label className='text-muted-foreground text-sm font-medium'>Location</Label>
                  <p className='mt-1 text-sm'>
                    {selectedEvent.location_name || selectedEvent.location || '—'}
                  </p>
                </div>
                {selectedEvent.category && (
                  <div>
                    <Label className='text-muted-foreground text-sm font-medium'>Category</Label>
                    <p className='mt-1 text-sm'>{selectedEvent.category}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default EventPage;
