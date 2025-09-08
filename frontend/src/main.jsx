import mapboxgl from 'mapbox-gl';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App.jsx';
import HealthPing from '@/components/health-ping';
import '@styles/index.css';
import 'mapbox-gl/dist/mapbox-gl.css';

// Initialize Mapbox GL for services that expect a global
if (typeof window !== 'undefined') {
  // Set token if provided
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  if (token) {
    mapboxgl.accessToken = token;
  }
  window.mapboxgl = mapboxgl;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HealthPing />
    <App />
  </StrictMode>,
);
