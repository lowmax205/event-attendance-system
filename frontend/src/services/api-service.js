const _envBase =
  import.meta.env.VITE_API_BASE_URL && String(import.meta.env.VITE_API_BASE_URL).trim();
const _BASE_ORIGIN = _envBase ? _envBase.replace(/\/+$/, '') : null; // trim trailing slashes

import DevLogger from '@/lib/dev-logger';

class ApiService {
  constructor() {
    // Store origin (without /api/v1) and computed API root
    this.originBase = _BASE_ORIGIN || null;
    this.baseURL = this.originBase ? `${this.originBase}/api/v1` : null;
    this._baseResolved = false; // lazy runtime probe to pick a reachable origin

    // Simple cache for Mapbox token
    this._mapboxToken = null;
    // Simple cache for event data to prevent repeated requests
    this.eventCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Internal helper: fetch with timeout
  async _fetchWithTimeout(resource, options = {}, timeoutMs = 2500) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(resource, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  // Ensure baseURL points to a reachable API by probing candidates once per session
  async ensureBaseURL() {
    if (this._baseResolved && this.baseURL) return;

    // If we already have a base and no alternates, just mark resolved
    // With a single configured origin, just mark resolved
    this._baseResolved = true;
  }

  // Get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('eas_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Cache management
  clearEventCache(id = null) {
    if (id) {
      this.eventCache.delete(`event_${id}`);
    } else {
      this.eventCache.clear();
    }
  }

  // Generic request method
  async request(endpoint, options = {}) {
    await this.ensureBaseURL();
    if (!this.baseURL) {
      throw new Error('API base URL is not configured. Set VITE_API_BASE_URL.');
    }
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Token expired or invalid: clear session and notify app
        localStorage.removeItem('eas_auth_token');
        localStorage.removeItem('eas_auth_refresh');
        localStorage.removeItem('eas_auth_user');
        try {
          window.dispatchEvent(new CustomEvent('eas:session-expired'));
        } catch {
          /* noop */
        }
        const error = new Error('Unauthorized');
        error.response = { status: 401 };
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.text();
        let parsedError;
        try {
          parsedError = JSON.parse(errorData);
        } catch {
          parsedError = { message: errorData };
        }

        DevLogger.error('apiService', 'request:errorResponse', {
          status: response.status,
          statusText: response.statusText,
          data: parsedError,
        });

        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: parsedError,
        };
        throw error;
      }

      // Handle empty responses (e.g., DELETE requests)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        const json = text ? JSON.parse(text) : {};
        // Normalize envelope: if { success, data } shape, return data
        if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
          return json.data;
        }
        return json;
      } else {
        // For non-JSON responses or empty responses, return empty object
        return {};
      }
    } catch (error) {
      DevLogger.error('apiService', 'request:failed', error);
      throw error;
    }
  }

  // Generic request method using an absolute URL (used for following pagination "next" links)
  async requestAbsolute(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Token expired or invalid: clear session and notify app
        localStorage.removeItem('eas_auth_token');
        localStorage.removeItem('eas_auth_refresh');
        localStorage.removeItem('eas_auth_user');
        try {
          window.dispatchEvent(new CustomEvent('eas:session-expired'));
        } catch {
          /* noop */
        }
        const error = new Error('Unauthorized');
        error.response = { status: 401 };
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.text();
        let parsedError;
        try {
          parsedError = JSON.parse(errorData);
        } catch {
          /* noop */
        }

        DevLogger.error('apiService', 'requestAbsolute:errorResponse', {
          status: response.status,
          statusText: response.statusText,
          data: parsedError,
        });

        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: parsedError,
        };
        throw error;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        const json = text ? JSON.parse(text) : {};
        if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
          return json.data;
        }
        return json;
      } else {
        return {};
      }
    } catch (error) {
      DevLogger.error('apiService', 'requestAbsolute:failed', error);
      throw error;
    }
  }

  // Generic request method for FormData (don't set Content-Type so browser adds boundary)
  async requestForm(endpoint, formData, options = {}) {
    await this.ensureBaseURL();
    if (!this.baseURL) {
      throw new Error('API base URL is not configured. Set VITE_API_BASE_URL.');
    }
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        // Intentionally omit 'Content-Type' for FormData
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      method: options.method || 'POST',
      body: formData,
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        localStorage.removeItem('eas_auth_token');
        localStorage.removeItem('eas_auth_refresh');
        localStorage.removeItem('eas_auth_user');
        try {
          window.dispatchEvent(new CustomEvent('eas:session-expired'));
        } catch {
          /* noop */
        }
        const error = new Error('Unauthorized');
        error.response = { status: 401 };
        throw error;
      }

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError;
        try {
          parsedError = JSON.parse(errorText);
        } catch {
          parsedError = { message: errorText };
        }
        DevLogger.error('apiService', 'requestForm:errorResponse', {
          status: response.status,
          statusText: response.statusText,
          data: parsedError,
        });
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: parsedError,
        };
        throw error;
      }

      // Expect JSON where relevant; otherwise return empty object
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        const json = text ? JSON.parse(text) : {};
        if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
          return json.data;
        }
        return json;
      }
      return {};
    } catch (error) {
      DevLogger.error('apiService', 'requestForm:failed', error);
      throw error;
    }
  }

  // Mapbox token retrieval (env first, then backend). Caches result in-memory.
  async getMapboxToken() {
    // Return cached token if available
    if (this._mapboxToken) return this._mapboxToken;

    // Backend API only
    try {
      await this.ensureBaseURL();
      if (!this.baseURL) {
        DevLogger.warn('apiService', 'mapboxToken:noBaseUrl', 'No API base URL configured');
        return null;
      }

      // Add authentication headers if user is logged in
      const headers = this.getAuthHeaders();

      const res = await this._fetchWithTimeout(
        `${this.baseURL}/core/config/mapbox/`,
        {
          credentials: 'include',
          headers,
        },
        4000,
      );

      if (!res) {
        DevLogger.warn(
          'apiService',
          'mapboxToken:noResponse',
          'No response from Mapbox token endpoint',
        );
        return null;
      }

      if (!res.ok) {
        DevLogger.warn(
          'apiService',
          'mapboxToken:badResponse',
          `HTTP ${res.status}: ${res.statusText}`,
        );
        return null;
      }

      const data = await res.json();
      const token = (data && data.token) || null;

      if (token) {
        this._mapboxToken = token;
        DevLogger.info(
          'apiService',
          'mapboxToken:fromApi',
          'Successfully retrieved Mapbox token from API',
        );
        return token;
      } else {
        DevLogger.warn('apiService', 'mapboxToken:emptyToken', 'API returned empty Mapbox token');
        return null;
      }
    } catch (e) {
      DevLogger.warn('apiService', 'mapboxToken:failed', e && e.message ? e.message : e);
      return null;
    }
  }

  // Helper to fetch all pages from a paginated DRF endpoint
  async getAll(endpoint) {
    // First request using relative endpoint
    const firstPage = await this.get(endpoint);

    // If it's already an array (non-paginated), return as-is
    if (Array.isArray(firstPage)) return firstPage;

    // If it's a paginated object with results
    if (firstPage && Array.isArray(firstPage.results)) {
      const allResults = [...firstPage.results];
      let nextUrl = firstPage.next;

      // Resolve and follow "next" links until exhausted
      while (nextUrl) {
        // Resolve relative/absolute next URL against baseURL
        const resolved = new URL(nextUrl, this.baseURL).toString();
        const nextPage = await this.requestAbsolute(resolved, { method: 'GET' });
        if (nextPage && Array.isArray(nextPage.results)) {
          allResults.push(...nextPage.results);
          nextUrl = nextPage.next;
        } else if (Array.isArray(nextPage)) {
          // Defensive: if API returns array on subsequent pages
          allResults.push(...nextPage);
          nextUrl = null;
        } else {
          nextUrl = null;
        }
      }

      return allResults;
    }

    // Fallback: return object or empty array
    return firstPage || [];
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // POST multipart/form-data
  async postForm(endpoint, formData) {
    return this.requestForm(endpoint, formData, { method: 'POST' });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Auth specific methods
  async login(credentials) {
    return this.post('/account/auth/login/', credentials);
  }

  async register(userData) {
    return this.post('/account/auth/register/', userData);
  }

  async refreshToken(refreshToken) {
    return this.post('/account/auth/refresh/', { refresh: refreshToken });
  }

  // User methods
  async getCurrentUser() {
    const res = await this.get('/account/users/me/');
    // Already normalized in request(); return as-is
    return res;
  }

  async getProfile() {
    const res = await this.get('/account/profiles/me/');
    // Already normalized in request(); return as-is
    return res;
  }

  async searchUsers(query) {
    return this.get(`/account/users/search/?q=${encodeURIComponent(query)}`);
  }

  async updateProfile(data) {
    return this.patch('/account/profiles/me/', data);
  }

  // User management methods
  async getUsers() {
    return this.getAll('/account/users/');
  }

  async createUser(data) {
    return this.post('/account/users/', data);
  }

  async updateUser(id, data) {
    return this.put(`/account/users/${id}/`, data);
  }

  async deleteUser(id) {
    return this.delete(`/account/users/${id}/`);
  }

  // Events methods
  async getEvents() {
    // Return all events across pages for management views
    return this.getAll('/events/events/');
  }

  async getEvent(id) {
    // Check cache first
    const cacheKey = `event_${id}`;
    const cached = this.eventCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      DevLogger.info('apiService', 'events:getEvent:cacheHit', { id });
      return cached.data;
    }

    DevLogger.info('apiService', 'events:getEvent:fetch', { id });
    const eventData = await this.get(`/events/events/${id}/`);

    // Cache the result
    this.eventCache.set(cacheKey, {
      data: eventData,
      timestamp: Date.now(),
    });

    return eventData;
  }

  async createEvent(data) {
    return this.post('/events/events/', data);
  }

  async updateEvent(id, data) {
    return this.put(`/events/events/${id}/`, data);
  }

  async deleteEvent(id) {
    return this.delete(`/events/events/${id}/`);
  }

  // Attendance methods
  async getAttendances() {
    // Return all attendance records across pages for management views
    return this.getAll('/attendances/attendances/');
  }

  async getAttendancesForExport(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return this.get(`/attendances/attendances/export/?${params.toString()}`);
  }

  async getAttendance(id) {
    return this.get(`/attendances/attendances/${id}/`);
  }

  async createAttendance(data) {
    return this.post('/attendances/attendances/', data);
  }

  async createManualAttendance(data) {
    return this.post('/attendances/attendances/manual-entry/', data);
  }

  async updateAttendance(id, data) {
    return this.put(`/attendances/attendances/${id}/`, data);
  }

  async deleteAttendance(id) {
    return this.delete(`/attendances/attendances/${id}/`);
  }

  async checkIn(id, data) {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return this.postForm(`/attendances/attendances/${id}/check-in/`, data);
    }
    return this.post(`/attendances/attendances/${id}/check-in/`, data);
  }

  async checkOut(id, data) {
    return this.post(`/attendances/attendances/${id}/check-out/`, data);
  }

  async markAttendance(data) {
    return this.post('/attendances/attendances/', data);
  }

  // Verify an attendance record (organizer/admin only): PATCH verify and notes
  async verifyAttendance(id, { notes } = {}) {
    const data = { verify: true };
    if (notes) data.notes = notes;
    return this.patch(`/attendances/attendances/${id}/`, data);
  }

  // Campus methods
  async getCampuses() {
    return this.getAll('/campuses/campuses/');
  }

  async createCampus(data) {
    return this.post('/campuses/campuses/', data);
  }

  async updateCampus(id, data) {
    return this.put(`/campuses/campuses/${id}/`, data);
  }

  async deleteCampus(id) {
    return this.delete(`/campuses/campuses/${id}/`);
  }

  async getDepartments() {
    return this.getAll('/campuses/departments/');
  }

  async createDepartment(data) {
    return this.post('/campuses/departments/', data);
  }

  async updateDepartment(id, data) {
    return this.put(`/campuses/departments/${id}/`, data);
  }

  async deleteDepartment(id) {
    return this.delete(`/campuses/departments/${id}/`);
  }

  async getCourses() {
    return this.getAll('/campuses/courses/');
  }

  async createCourse(data) {
    return this.post('/campuses/courses/', data);
  }

  async updateCourse(id, data) {
    return this.put(`/campuses/courses/${id}/`, data);
  }

  async deleteCourse(id) {
    return this.delete(`/campuses/courses/${id}/`);
  }

  // System metrics methods
  async getDashboardMetrics() {
    return this.get('/core/dashboard/metrics/');
  }

  async getSystemMetrics() {
    return this.get('/core/metrics/');
  }

  async recalculateMetrics() {
    return this.post('/core/metrics/recalculate/');
  }

  // Media upload (multipart)
  async uploadMedia(formData) {
    return this.postForm('/core/upload/media/', formData);
  }
}

export const apiService = new ApiService();
export default apiService;
