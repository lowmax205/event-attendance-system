import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import DevLogger from '@/lib/dev-logger';
import { cn } from '@/lib/utils';
import { mapboxLocationService } from '@/services/mapbox-location-service';

const MapboxMap = ({
  latitude = 14.5995, // Default to Manila, Philippines
  longitude = 120.9842,
  zoom = 13,
  interactive = true,
  showMarker = true,
  // New: show user location as a second marker
  showUserMarker = false,
  userLatitude,
  userLongitude,
  // New: when both event and user markers are present, fit bounds to include both
  fitToMarkers = false,
  showRadius = false,
  radiusInMeters = 100,
  onLocationSelect,
  // New: locating state overlay and marker pulse toggles
  locating = false,
  locatingMessage = 'Locating…',
  animateMarker = false,
  animateUserMarker = false,
  className,
  ...props
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const userMarker = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  // Keep latest props in refs to avoid recreating the map/event listeners
  const onSelectRef = useRef(onLocationSelect);
  const interactiveRef = useRef(interactive);

  useEffect(() => {
    onSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    interactiveRef.current = interactive;
  }, [interactive]);

  // Initialize Mapbox token
  useEffect(() => {
    const initializeMapbox = async () => {
      try {
        await mapboxLocationService.initializeMapbox();
        setIsTokenLoaded(true);
        setTokenError(null);
      } catch (error) {
        DevLogger.error('MapboxMap', 'Failed to initialize Mapbox', error);
        setTokenError(error.message);
        setIsTokenLoaded(false);
      }
    };

    initializeMapbox();
  }, []);

  // Helper to create custom pulsing marker element
  const createPulsingMarkerEl = useCallback((color = 'blue', animate = false, title = '') => {
    const el = document.createElement('div');
    el.className = `eas-map-pulse ${color}`;
    el.title = title || '';
    const dot = document.createElement('div');
    dot.className = 'dot';
    const ring = document.createElement('div');
    ring.className = 'ring';
    el.appendChild(dot);
    if (animate) el.appendChild(ring);
    return el;
  }, []);

  // Initialize map (only once when token is ready)
  useEffect(() => {
    if (map.current || !isTokenLoaded) return; // Initialize map only once and when token is loaded

    // Defensive: ensure token exists on module to avoid vendor-side uncaught error
    if (!mapboxgl || !mapboxgl.accessToken) {
      setTokenError('Mapbox access token not available');
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: zoom,
      interactive: interactiveRef.current,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setIsLoaded(true);
    });

    // Add click handler for location selection (uses refs to avoid effect deps)
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      if (!interactiveRef.current || !onSelectRef.current) return;
      onSelectRef.current({ latitude: lat, longitude: lng });
    });

    return () => {
      if (map.current) {
        // Clean up radius layers if they exist
        const sourceId = 'verification-radius';
        const fillLayerId = 'verification-radius-fill';
        const strokeLayerId = 'verification-radius-stroke';

        try {
          if (map.current.getLayer(strokeLayerId)) {
            map.current.removeLayer(strokeLayerId);
          }
          if (map.current.getLayer(fillLayerId)) {
            map.current.removeLayer(fillLayerId);
          }
          if (map.current.getSource(sourceId)) {
            map.current.removeSource(sourceId);
          }
        } catch {
          // Ignore cleanup errors
        }

        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTokenLoaded]);

  // Toggle interactive behaviors without recreating the map
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    const setInteraction = (enabled) => {
      const m = map.current;
      if (!m) return;
      const method = enabled ? 'enable' : 'disable';
      try {
        m.boxZoom[method]();
        m.scrollZoom[method]();
        m.dragPan[method]();
        m.dragRotate[method]();
        m.keyboard[method]();
        m.doubleClickZoom[method]();
        m.touchZoomRotate[method]();
      } catch {
        // ignore interaction toggle errors
      }
    };

    setInteraction(interactive);
  }, [interactive, isLoaded]);

  // Update marker position when coordinates or flags change (use ref for handlers)
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }

    // Add new marker if coordinates are provided and showMarker is true
    if (showMarker && latitude && longitude) {
      const el = createPulsingMarkerEl('blue', !!animateMarker, 'Event location');
      marker.current = new mapboxgl.Marker({
        element: el,
        draggable: interactiveRef.current && !!onSelectRef.current, // Make draggable when interactive and callback is provided
      })
        .setLngLat([longitude, latitude])
        .addTo(map.current);

      // Handle marker drag
      if (interactiveRef.current && onSelectRef.current) {
        marker.current.on('dragend', () => {
          const lngLat = marker.current.getLngLat();
          onSelectRef.current &&
            onSelectRef.current({
              latitude: lngLat.lat,
              longitude: lngLat.lng,
            });
        });
      }

      // Center map on marker (will be overridden by bounds logic if enabled)
      if (!fitToMarkers) {
        map.current.setCenter([longitude, latitude]);
      }
    }
  }, [
    latitude,
    longitude,
    isLoaded,
    showMarker,
    interactive,
    fitToMarkers,
    animateMarker,
    createPulsingMarkerEl,
  ]);

  // Update map center when coordinates change (without marker)
  useEffect(() => {
    if (!map.current || !isLoaded || showMarker) return;

    if (latitude && longitude) {
      map.current.setCenter([longitude, latitude]);
    }
  }, [latitude, longitude, isLoaded, showMarker]);

  // Update or add user marker
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Remove existing user marker
    if (userMarker.current) {
      userMarker.current.remove();
      userMarker.current = null;
    }

    if (showUserMarker && userLatitude && userLongitude) {
      const el = createPulsingMarkerEl('green', !!animateUserMarker, 'Your location');
      userMarker.current = new mapboxgl.Marker({ element: el }) // green-500
        .setLngLat([userLongitude, userLatitude])
        .addTo(map.current);
    }

    // Fit bounds to include both markers if requested
    if (fitToMarkers) {
      const coords = [];
      if (latitude && longitude) coords.push([longitude, latitude]);
      if (showUserMarker && userLatitude && userLongitude)
        coords.push([userLongitude, userLatitude]);
      if (coords.length >= 2) {
        try {
          const bounds = coords.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(coords[0], coords[0]),
          );
          map.current.fitBounds(bounds, { padding: 40, maxZoom: 17, duration: 500 });
        } catch {
          // ignore bounds errors
        }
      } else if (latitude && longitude && !showUserMarker) {
        map.current.setCenter([longitude, latitude]);
      }
    }
  }, [
    isLoaded,
    showUserMarker,
    userLatitude,
    userLongitude,
    fitToMarkers,
    latitude,
    longitude,
    animateUserMarker,
    createPulsingMarkerEl,
  ]);

  // Function to create radius circle
  const createRadiusCircle = useCallback((centerLat, centerLng, radiusMeters) => {
    const radiusInKm = radiusMeters / 1000;
    const points = [];
    const numPoints = 64;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const lat = centerLat + (radiusInKm / 111) * Math.cos(angle);
      const lng =
        centerLng + (radiusInKm / (111 * Math.cos((centerLat * Math.PI) / 180))) * Math.sin(angle);
      points.push([lng, lat]);
    }
    points.push(points[0]); // Close the polygon

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [points],
      },
    };
  }, []);

  // Update radius display when showRadius or coordinates change
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    const sourceId = 'verification-radius';
    const fillLayerId = 'verification-radius-fill';
    const strokeLayerId = 'verification-radius-stroke';

    // Remove existing radius layers
    if (map.current.getLayer(strokeLayerId)) {
      map.current.removeLayer(strokeLayerId);
    }
    if (map.current.getLayer(fillLayerId)) {
      map.current.removeLayer(fillLayerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Add radius if showRadius is true and coordinates are provided
    if (showRadius && latitude && longitude) {
      const radiusFeature = createRadiusCircle(latitude, longitude, radiusInMeters);

      // Add source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: radiusFeature,
      });

      // Add fill layer
      map.current.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': 'rgb(16, 185, 129)', // green-500
          'fill-opacity': 0.1,
        },
      });

      // Add stroke layer
      map.current.addLayer({
        id: strokeLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': 'rgb(16, 185, 129)', // green-500
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });
    }
  }, [latitude, longitude, isLoaded, showRadius, radiusInMeters, createRadiusCircle]);

  // Display error state if token failed to load
  if (tokenError) {
    return (
      <div
        className={cn('bg-muted relative h-64 w-full overflow-hidden rounded-lg border', className)}
        {...props}
      >
        <div className='absolute inset-0 flex flex-col items-center justify-center p-4'>
          <div className='text-destructive mb-2 text-sm font-medium'>Map Error</div>
          <div className='text-muted-foreground text-center text-xs'>
            Unable to load map: {tokenError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('bg-muted relative h-64 w-full overflow-hidden rounded-lg border', className)}
      {...props}
    >
      <div ref={mapContainer} className='h-full w-full' />

      {/* Loading indicator */}
      {(!isTokenLoaded || !isLoaded) && (
        <div className='bg-muted absolute inset-0 flex items-center justify-center'>
          <div className='text-muted-foreground flex items-center gap-2'>
            <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-current'></div>
            <span className='text-sm'>
              {!isTokenLoaded ? 'Loading map token...' : 'Loading map...'}
            </span>
          </div>
        </div>
      )}

      {/* Locating overlay */}
      {isLoaded && locating && (
        <div className='eas-map-overlay pointer-events-none'>
          <div className='panel'>
            <div className='eas-spinner' />
            <span>{locatingMessage || 'Locating…'}</span>
          </div>
        </div>
      )}

      {/* Interactive instructions */}
      {interactive && onLocationSelect && isLoaded && (
        <div className='bg-background/90 text-muted-foreground absolute top-2 left-2 rounded px-2 py-1 text-xs shadow-sm'>
          {showMarker ? 'Drag marker or click to select location' : 'Click to select location'}
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
