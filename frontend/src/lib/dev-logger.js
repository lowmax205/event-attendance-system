// Centralized development logger
// - Only logs in development or when VITE_DEBUG=true or sessionStorage 'eas_debug' is true
// - Provides level helpers: info (default), success, warn, error
// - Keeps a lightweight legacy helper: logUserInteraction(component, action, payload)

const getIsDebugEnabled = () => {
  try {
    const envDebug = String(import.meta.env?.VITE_DEBUG ?? '').toLowerCase() === 'true';
    const sessionDebug =
      typeof window !== 'undefined' && sessionStorage.getItem('eas_debug') === 'true';
    return Boolean(import.meta.env?.DEV) || envDebug || sessionDebug;
  } catch {
    // Safe fallback if storage is unavailable
    return Boolean(import.meta.env?.DEV);
  }
};

const basePrefix = '[EAS]';

const formatParts = (level, component, action) => {
  const ts = new Date().toISOString();
  const scope = component ? ` ${component}` : '';
  const act = action ? ` • ${action}` : '';
  return [`${basePrefix}[${level.toUpperCase()}]${scope}${act} @ ${ts}`];
};

const print = (method, level, component, action, payload) => {
  if (!getIsDebugEnabled()) return;

  const parts = formatParts(level, component, action);

  if (payload !== undefined) {
    console[method](parts[0], payload);
  } else {
    console[method](parts[0]);
  }
};

export const DevLogger = {
  // Generic info/default
  info(component, action, payload) {
    print('info', 'info', component, action, payload);
  },

  // UI interaction convenience (button clicks, etc.)
  event(component, action, payload) {
    print('log', 'event', component, action, payload);
  },

  // Success state
  success(component, action, payload) {
    print('log', 'success', component, action, payload);
  },

  // Warning state
  warn(component, action, payload) {
    print('warn', 'warn', component, action, payload);
  },

  // Error state
  error(component, action, payload) {
    print('error', 'error', component, action, payload);
  },

  // Enable/disable debug at runtime via sessionStorage flag
  setDebug(enabled) {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('eas_debug', enabled ? 'true' : 'false');
        // Give immediate feedback
        console.info(`${basePrefix}[DEBUG] session flag set to`, enabled);
      }
    } catch {
      /* noop */
    }
  },

  get enabled() {
    return getIsDebugEnabled();
  },
};

// Backwards compatibility helper used around the codebase
export const logUserInteraction = (component, action, payload = {}) => {
  DevLogger.event(component, action, payload);
};

export default DevLogger;
