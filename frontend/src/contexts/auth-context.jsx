import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext(null);

// Auth action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  RESTORE_SESSION: 'RESTORE_SESSION',
  INITIALIZE_SESSION: 'INITIALIZE_SESSION',
};

// Initial auth state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };
    case AUTH_ACTIONS.RESTORE_SESSION:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case AUTH_ACTIONS.INITIALIZE_SESSION:
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Real login function using backend API
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      // Import API service dynamically to avoid circular deps
      const apiService = (await import('@/services/api-service')).default;
      // Extract rememberMe option from credentials
      const { rememberMe, ...loginCredentials } = credentials;

      // Normalize credentials: trim and lowercase email for case-insensitive auth
      const payload = { ...loginCredentials };
      if (typeof payload.email === 'string') {
        payload.email = payload.email.trim().toLowerCase();
      }
      if (typeof payload.username === 'string') {
        payload.username = payload.username.trim();
      }
      const response = await apiService.login(payload);
      // Expect: { access, refresh, user: {...} }
      if (response && response.access && response.user) {
        // Store tokens with different strategies based on "Remember Me"
        if (rememberMe) {
          // Store in localStorage for persistent login
          localStorage.setItem('eas_auth_token', response.access);
          localStorage.setItem('eas_auth_refresh', response.refresh || '');
          localStorage.setItem('eas_auth_user', JSON.stringify(response.user));
          localStorage.setItem('eas_auth_remember', 'true');
        } else {
          // Store in sessionStorage for session-only login
          sessionStorage.setItem('eas_auth_token', response.access);
          sessionStorage.setItem('eas_auth_refresh', response.refresh || '');
          sessionStorage.setItem('eas_auth_user', JSON.stringify(response.user));
          // Also store in localStorage as fallback but mark as non-persistent
          localStorage.setItem('eas_auth_token', response.access);
          localStorage.setItem('eas_auth_refresh', response.refresh || '');
          localStorage.setItem('eas_auth_user', JSON.stringify(response.user));
          localStorage.removeItem('eas_auth_remember');
        }

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: response.user, token: response.access },
        });
        // Check profile completeness to guide redirect
        let shouldGoToProfile = false;
        try {
          const p = await apiService.getProfile();
          if (!p?.is_complete_profile) {
            shouldGoToProfile = true;
          }
        } catch {
          // If profile fetch fails, be safe and require profile completion
          shouldGoToProfile = true;
        }
        return { success: true, redirectTo: shouldGoToProfile ? '/profile' : '/dashboard' };
      } else {
        throw new Error(response?.message || 'Invalid email or password');
      }
    } catch (err) {
      // Extract meaningful error message from API response when available
      let msg = err?.message || 'Login failed';
      const data = err?.response?.data;
      if (data) {
        if (typeof data === 'string') {
          msg = data;
        } else if (data.detail) {
          msg = data.detail;
        } else if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
          msg = data.non_field_errors[0];
        } else if (data.error) {
          msg = data.error;
        } else if (data.message) {
          msg = data.message;
        }
      }
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: msg },
      });
      return { success: false, error: msg };
    }
  };

  // Logout function
  const logout = () => {
    // Clear both storage types to ensure complete logout
    localStorage.removeItem('eas_auth_token');
    localStorage.removeItem('eas_auth_refresh');
    localStorage.removeItem('eas_auth_user');
    localStorage.removeItem('eas_auth_remember');
    sessionStorage.removeItem('eas_auth_token');
    sessionStorage.removeItem('eas_auth_refresh');
    sessionStorage.removeItem('eas_auth_user');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Restore session on app start
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check for persistent login first (localStorage)
        let token = localStorage.getItem('eas_auth_token');
        let user = localStorage.getItem('eas_auth_user');
        let isRemembered = localStorage.getItem('eas_auth_remember') === 'true';

        // If not found in localStorage or not remembered, check sessionStorage
        if ((!token || !user) && !isRemembered) {
          token = sessionStorage.getItem('eas_auth_token');
          user = sessionStorage.getItem('eas_auth_user');
        }

        if (token && user) {
          const parsedUser = JSON.parse(user);
          // Tentatively restore state while validating
          dispatch({
            type: AUTH_ACTIONS.RESTORE_SESSION,
            payload: { token, user: parsedUser },
          });
          // Validate token by fetching current user
          try {
            const apiService = (await import('@/services/api-service')).default;
            await apiService.getCurrentUser();
            // If ok, nothing else to do
          } catch {
            // Invalid token: clear and notify
            localStorage.removeItem('eas_auth_token');
            localStorage.removeItem('eas_auth_refresh');
            localStorage.removeItem('eas_auth_user');
            localStorage.removeItem('eas_auth_remember');
            sessionStorage.removeItem('eas_auth_token');
            sessionStorage.removeItem('eas_auth_refresh');
            sessionStorage.removeItem('eas_auth_user');
            dispatch({ type: AUTH_ACTIONS.INITIALIZE_SESSION });
            try {
              window.dispatchEvent(new CustomEvent('eas:session-expired'));
            } catch {
              /* noop */
            }
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.INITIALIZE_SESSION });
        }
      } catch {
        localStorage.removeItem('eas_auth_token');
        localStorage.removeItem('eas_auth_refresh');
        localStorage.removeItem('eas_auth_user');
        dispatch({ type: AUTH_ACTIONS.INITIALIZE_SESSION });
      }
    };

    initializeSession();
  }, []);

  const value = {
    ...state,
    login,
    logout,
  };

  // Keep in-memory state in sync if a 401 occurs elsewhere
  useEffect(() => {
    const onExpired = () => {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    };
    window.addEventListener('eas:session-expired', onExpired);
    return () => window.removeEventListener('eas:session-expired', onExpired);
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
