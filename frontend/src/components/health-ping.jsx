import { useEffect } from 'react';
import DevLogger from '@/lib/dev-logger';
import apiService from '@/services/api-service';

// Pings the backend health endpoint to keep the API warm.
// - Public endpoint: GET /api/v1/health/
// - Fires on mount and every 10 minutes.
export default function HealthPing() {
  useEffect(() => {
    let disposed = false;

    const ping = async () => {
      try {
        await apiService.get('/health/');
        DevLogger.info('HealthPing', 'ok');
      } catch (e) {
        // Avoid noisy logs in production; keep low level
        DevLogger.warn('HealthPing', e && e.message ? e.message : e);
      }
    };

    // Fire once immediately
    ping();

    // Then every 10 minutes
    const id = setInterval(() => {
      if (!disposed) ping();
    }, 10 * 60 * 1000);

    return () => {
      disposed = true;
      clearInterval(id);
    };
  }, []);

    // This component renders nothing
  return null;
}
