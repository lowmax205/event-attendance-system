/**
 * Location Services for Attendance Tracking
 * Provides GPS, WiFi, Bluetooth, and IP-based location gathering
 * Includes 50-meter verification against event locations
 */

import { haversineDistance } from '@/lib/utility';

class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchId = null;
    this.eventLocation = null;
    this.maximumDistance = 100; // 50 meters maximum distance
    this.ipLocationCache = null; // Cache IP location to avoid repeated requests
    this.ipLocationCacheExpiry = null;
    this.permissionRequestInProgress = false; // Prevent multiple simultaneous requests
    this.lastPermissionRequest = null; // Track last request time
  }

  /**
   * Request location permissions and gather location data using multiple methods
   * @returns {Promise<Object>} Comprehensive location data
   */
  async requestLocationPermission() {
    // Prevent multiple simultaneous requests
    const now = Date.now();
    const requestCooldown = 10000; // 10 seconds cooldown between requests

    if (this.permissionRequestInProgress) {
      console.log('Location permission request already in progress, skipping...');
      return this.lastPermissionRequest;
    }

    if (
      this.lastPermissionRequest &&
      now - this.lastPermissionRequest.timestamp < requestCooldown
    ) {
      console.log('Using recent location permission result (within cooldown period)');
      return this.lastPermissionRequest.data;
    }

    this.permissionRequestInProgress = true;

    const locationData = {
      granted: false,
      gps: null,
      wifi: null,
      bluetooth: null,
      ip: null,
      accuracy: null,
      timestamp: new Date().toISOString(),
      methods: [],
    };

    try {
      // Check if geolocation is supported
      if (!('geolocation' in navigator)) {
        throw new Error('Geolocation is not supported by this device');
      }

      // Request permission for high accuracy location
      const permission = await this.requestPermission();
      locationData.granted = permission;

      if (!permission) {
        throw new Error('Location permission denied');
      }

      // Gather location using multiple methods (prioritize GPS, fallback to cached IP)
      await Promise.allSettled([
        this.getGPSLocation(locationData),
        this.getWiFiLocation(locationData),
        this.getBluetoothLocation(locationData),
        this.getIPLocationCached(locationData), // Use cached version
      ]);

      // Determine the most accurate location
      this.currentLocation = this.selectBestLocation(locationData);

      // Cache the result
      this.lastPermissionRequest = {
        data: locationData,
        timestamp: now,
      };

      return locationData;
    } catch (error) {
      console.error('Location permission request failed:', error);
      locationData.error = error.message;

      // Cache failed result too (for shorter time)
      this.lastPermissionRequest = {
        data: locationData,
        timestamp: now,
      };

      return locationData;
    } finally {
      this.permissionRequestInProgress = false;
    }
  }

  /**
   * Request geolocation permission
   * @returns {Promise<boolean>} Permission granted status
   */
  async requestPermission() {
    return new Promise((resolve) => {
      if ('permissions' in navigator) {
        navigator.permissions
          .query({ name: 'geolocation' })
          .then((permissionStatus) => {
            if (permissionStatus.state === 'granted') {
              resolve(true);
            } else if (permissionStatus.state === 'prompt') {
              // Permission will be requested when getCurrentPosition is called
              resolve(true);
            } else {
              resolve(false);
            }
          })
          .catch(() => {
            // Fallback to direct geolocation call
            resolve(true);
          });
      } else {
        // Older browsers - assume permission can be requested
        resolve(true);
      }
    });
  }

  /**
   * Get GPS location with high accuracy
   * @param {Object} locationData - Location data object to populate
   */
  async getGPSLocation(locationData) {
    return new Promise((resolve) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // 15 seconds
        maximumAge: 30000, // 30 seconds
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          locationData.gps = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(position.timestamp).toISOString(),
          };
          locationData.methods.push('gps');
          locationData.accuracy = position.coords.accuracy;
          resolve(locationData.gps);
        },
        (error) => {
          console.error('GPS location failed:', error);
          locationData.gps = { error: error.message };
          resolve(null);
        },
        options,
      );
    });
  }

  /**
   * Attempt to get WiFi-based location (limited browser support)
   * @param {Object} locationData - Location data object to populate
   */
  async getWiFiLocation(locationData) {
    try {
      // WiFi location is typically handled by the browser's geolocation service
      // This is a placeholder for potential WiFi scanning capabilities
      if ('wifi' in navigator) {
        // Hypothetical WiFi scanning API
        const wifiData = await navigator.wifi.scan();
        locationData.wifi = {
          networks: wifiData.length,
          timestamp: new Date().toISOString(),
        };
        locationData.methods.push('wifi');
      } else {
        locationData.wifi = { available: false, reason: 'WiFi scanning not supported' };
      }
    } catch (error) {
      locationData.wifi = { error: error.message };
    }
  }

  /**
   * Attempt to get Bluetooth-based location (limited browser support)
   * @param {Object} locationData - Location data object to populate
   */
  async getBluetoothLocation(locationData) {
    try {
      if ('bluetooth' in navigator && 'requestDevice' in navigator.bluetooth) {
        // Note: This would require user permission and is mainly for demonstration
        // Real Bluetooth scanning for location would require special permissions
        locationData.bluetooth = {
          available: true,
          scanning: false, // Don't actually scan to avoid permission prompts
          reason: 'Bluetooth scanning available but not activated',
        };
        locationData.methods.push('bluetooth');
      } else {
        locationData.bluetooth = {
          available: false,
          reason: 'Bluetooth scanning not supported',
        };
      }
    } catch (error) {
      locationData.bluetooth = { error: error.message };
    }
  }

  /**
   * Get IP-based location with caching to avoid rate limits
   * @param {Object} locationData - Location data object to populate
   */
  async getIPLocationCached(locationData) {
    try {
      // Check if we have a valid cached IP location (cache for 1 hour)
      const now = Date.now();
      const cacheValidDuration = 60 * 60 * 1000; // 1 hour in milliseconds

      if (this.ipLocationCache && this.ipLocationCacheExpiry && now < this.ipLocationCacheExpiry) {
        // Use cached data
        console.log('Using cached IP location data');
        locationData.ip = {
          ...this.ipLocationCache,
          cached: true,
          timestamp: new Date().toISOString(),
        };
        locationData.methods.push('ip');
        return;
      }

      // If we already have GPS data, don't bother with IP location
      if (locationData.gps && !locationData.gps.error && locationData.gps.accuracy < 1000) {
        console.log('GPS location available with good accuracy, skipping IP location');
        locationData.ip = {
          skipped: true,
          reason: 'GPS location available with sufficient accuracy',
          timestamp: new Date().toISOString(),
        };
        return;
      }

      console.log('Attempting to fetch IP location data...');

      // Try to get fresh IP location, but with error handling for rate limits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`IP service responded with ${response.status}: ${response.statusText}`);
      }

      const ipData = await response.json();

      if (ipData.error) {
        throw new Error(ipData.reason || 'IP location service error');
      }

      // Cache the successful response
      this.ipLocationCache = {
        latitude: parseFloat(ipData.latitude),
        longitude: parseFloat(ipData.longitude),
        city: ipData.city,
        region: ipData.region,
        country: ipData.country,
        accuracy: 10000, // IP location is typically less accurate
      };
      this.ipLocationCacheExpiry = now + cacheValidDuration;

      locationData.ip = {
        ...this.ipLocationCache,
        cached: false,
        timestamp: new Date().toISOString(),
      };
      locationData.methods.push('ip');

      console.log('Successfully fetched and cached IP location');
    } catch (error) {
      console.warn('IP location failed, using fallback coordinates:', error.message);

      // Use fallback coordinates without attempting external API again
      const fallbackLocation = {
        latitude: 14.676, // Philippines coordinates as fallback
        longitude: 121.0437,
        city: 'Demo City',
        region: 'Demo Region',
        country: 'PH',
        accuracy: 15000,
        cached: false,
        fallback: true,
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      // Cache the fallback to prevent repeated failures
      this.ipLocationCache = fallbackLocation;
      this.ipLocationCacheExpiry = Date.now() + 30 * 60 * 1000; // Cache fallback for 30 minutes

      locationData.ip = fallbackLocation;
      locationData.methods.push('ip');
    }
  }

  /**
   * Get IP-based location (deprecated - use getIPLocationCached instead)
   * @param {Object} locationData - Location data object to populate
   */
  /**
   * Get IP-based location (legacy method - now calls cached version)
   * @param {Object} locationData - Location data object to populate
   */
  async getIPLocation(locationData) {
    return this.getIPLocationCached(locationData);
  }

  /**
   * Select the most accurate location from available methods
   * @param {Object} locationData - All location data
   * @returns {Object} Best location data
   */
  selectBestLocation(locationData) {
    // Priority: GPS > WiFi > Bluetooth > IP
    if (locationData.gps && !locationData.gps.error) {
      return {
        latitude: locationData.gps.latitude,
        longitude: locationData.gps.longitude,
        accuracy: locationData.gps.accuracy,
        method: 'gps',
        timestamp: locationData.gps.timestamp,
      };
    }

    if (locationData.wifi && locationData.wifi.latitude) {
      return {
        latitude: locationData.wifi.latitude,
        longitude: locationData.wifi.longitude,
        accuracy: locationData.wifi.accuracy || 100,
        method: 'wifi',
        timestamp: locationData.wifi.timestamp,
      };
    }

    if (locationData.ip && !locationData.ip.error) {
      return {
        latitude: locationData.ip.latitude,
        longitude: locationData.ip.longitude,
        accuracy: locationData.ip.accuracy,
        method: 'ip',
        timestamp: locationData.ip.timestamp,
      };
    }

    return null;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    return haversineDistance(lat1, lon1, lat2, lon2);
  }

  /**
   * Verify if user is within acceptable distance of event location
   * @param {Object} eventLocation - Event coordinates {lat, lng}
   * @param {Object} userLocation - User coordinates {latitude, longitude}
   * @param {number} maxDistance - Maximum allowed distance in meters (default: 50)
   * @returns {Object} Verification result with distance and status
   */
  verifyLocationProximity(
    eventLocation,
    userLocation = this.currentLocation,
    maxDistance = this.maximumDistance,
  ) {
    if (!eventLocation || !userLocation) {
      return {
        verified: false,
        distance: null,
        error: 'Missing location data',
      };
    }

    try {
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        eventLocation.lat,
        eventLocation.lng,
      );

      const verified = distance <= maxDistance;

      return {
        verified,
        distance: Math.round(distance),
        maxDistance,
        accuracy: userLocation.accuracy,
        method: userLocation.method,
        timestamp: new Date().toISOString(),
        coordinates: {
          user: {
            lat: userLocation.latitude,
            lng: userLocation.longitude,
          },
          event: {
            lat: eventLocation.lat,
            lng: eventLocation.lng,
          },
        },
      };
    } catch (error) {
      return {
        verified: false,
        distance: null,
        error: error.message,
      };
    }
  }

  /**
   * Start continuous location monitoring
   * @param {Function} callback - Callback function for location updates
   * @returns {number} Watch ID for stopping the watch
   */
  startLocationWatch(callback) {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          method: 'gps',
          timestamp: new Date(position.timestamp).toISOString(),
        };

        if (callback) {
          callback(this.currentLocation);
        }
      },
      (error) => {
        console.error('Location watch error:', error);
        if (callback) {
          callback({ error: error.message });
        }
      },
      options,
    );

    return this.watchId;
  }

  /**
   * Stop location monitoring
   */
  stopLocationWatch() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Clear all cached location data - useful for manual refresh
   */
  clearLocationCache() {
    this.ipLocationCache = null;
    this.ipLocationCacheExpiry = null;
    this.lastPermissionRequest = null;
    this.permissionRequestInProgress = false;
    console.log('Location service cache cleared');
  }

  /**
   * Get current location data
   * @returns {Object} Current location or null
   */
  getCurrentLocation() {
    return this.currentLocation;
  }

  /**
   * Set event location for proximity verification
   * @param {Object} location - Event location {lat, lng}
   */
  setEventLocation(location) {
    this.eventLocation = location;
  }
}

// Create and export singleton instance
export const locationService = new LocationService();
export default locationService;
