/**
 * Mapbox Location Service
 * Provides secure token management for Mapbox integration
 */
class MapboxLocationService {
  constructor() {
    this.mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || null;
    this.mapboxgl = null;
    this._stylesInstalled = false;
  }

  /**
   * Initialize Mapbox GL library with secure token from backend
   */
  async initializeMapbox() {
    if (typeof window !== 'undefined' && window.mapboxgl && !this.mapboxgl) {
      this.mapboxgl = window.mapboxgl;
    }
    if (this.mapboxgl && !this.mapboxgl.accessToken) {
      // Try to use configured token, else fetch from backend
      const { apiService } = await import('@/services/api-service.js');
      const token = this.mapboxToken || (await apiService.getMapboxToken());
      if (token) {
        this.mapboxToken = token;
        this.mapboxgl.accessToken = token;
      }
    }
    // Ensure animation styles are available globally (safe to call multiple times)
    this.installLocatingStyles();
    return this.mapboxgl;
  }

  /**
   * Deprecated: token retrieval is handled by apiService.getMapboxToken()
   */
  async fetchTokenFromBackend() {
    const { apiService } = await import('@/services/api-service.js');
    return apiService.getMapboxToken();
  }

  /**
   * Inject minimal CSS for pulsing map markers and locating overlay once per page
   */
  installLocatingStyles() {
    if (this._stylesInstalled || typeof document === 'undefined') return;

    const css = `
/* Map locating animations */
@keyframes eas-pulse {
  0% { transform: scale(0.7); opacity: 0.85; }
  70% { transform: scale(1.9); opacity: 0; }
  100% { opacity: 0; }
}
.eas-map-pulse {
  position: relative;
  width: 14px; height: 14px;
}
.eas-map-pulse .dot { position:absolute; inset:0; border-radius:9999px; }
.eas-map-pulse .ring { position:absolute; inset:-6px; border-radius:9999px; border:2px solid currentColor; opacity:0.7; animation: eas-pulse 1.6s ease-out infinite; }
.eas-map-pulse.blue { color: rgb(59,130,246); /* tailwind blue-500 */ }
.eas-map-pulse.green { color: rgb(34,197,94); /* tailwind green-500 */ }
.eas-map-pulse .dot { background-color: currentColor; }

.eas-map-overlay {
  position: absolute; inset: 0; display:flex; align-items:center; justify-content:center;
}
.eas-map-overlay .panel { background: rgba(17, 24, 39, 0.6); color: #fff; /* gray-900 */
  padding: 8px 12px; border-radius: 8px; display:flex; align-items:center; gap:8px; font-size:12px;
}
.eas-spinner { width:16px; height:16px; border-radius:9999px; border:2px solid currentColor; border-bottom-color: transparent; animation: eas-spin 0.8s linear infinite; }
@keyframes eas-spin { to { transform: rotate(360deg); } }
`;

    const style = document.createElement('style');
    style.setAttribute('data-eas-mapbox-styles', 'true');
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
    this._stylesInstalled = true;
  }
}

// Export singleton instance
export const mapboxLocationService = new MapboxLocationService();
export default mapboxLocationService;
