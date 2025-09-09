# Frontend Architecture

React 19 + Vite + Tailwind + shadcn/ui primitives (JavaScript only).

## Structure

```
src/
  assets/          # Static assets (images, icons)
    icons/         # Icon assets (USC-Logo2.png)
    images/        # Image assets (default-cover.jpg, SNSU-Logo.jpg, etc.)
  components/
    ui/           # shadcn/ui design primitives (button, modal, card, etc.)
    auth/         # Authentication forms & modals
    layout/       # Layout components (header, sidebar, footer)
    common/       # Common components and constants
  contexts/       # React Context providers (AuthContext, DashboardDataContext, etc.)
  hooks/          # Project-specific React hooks (useAuth, useDeviceDetection, etc.)
  pages/          # Route-level page components
    analytics/    # Analytics and reporting
    attendance/   # Attendance management pages
    dashboard/    # Main dashboard and overview
    data-library/ # Data library and management
    error/        # Error pages
    fqa/          # FAQ pages
    landing/      # Landing page
    management/   # Management interface
    profile/      # User profile management
    reports/      # Reporting interface
    settings/     # Settings pages
  services/       # API service layer (api-service.js, location services)
  lib/            # Utility functions and helpers
  styles/         # Global CSS and Tailwind config
```

## Component Organization Principles

### Path Alias Usage (MANDATORY)

```js
// ✅ Correct - Always use @ aliases
import { apiService } from "@/services/api-service";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/auth/login-form";
import { useAuth } from "@/hooks/use-auth";

// ❌ Wrong - Never use relative imports
import { apiService } from "../../services/api-service";
import LoginForm from "../auth/login-form";
```

### Naming Conventions

- **Files**: kebab-case (`login-form.jsx`, `user-profile.jsx`)
- **Components**: PascalCase exports (`LoginForm`, `UserProfile`)
- **No Technical Prefixes**: Avoid "Enhanced", "Custom", "Advanced"

## Routing & UX

### Route Structure

```js
// Public routes
/login
/register
/verify-email
/

// Protected routes
/dashboard
/attendance
/profile
/reports
/settings
/analytics
/data-library
/fqa

// Management routes (organizer/admin)
/management
/management/events
/management/users
/management/campuses
```

### Navigation Features

- **Scroll Management**: Shared `scroll-to-top.jsx` component (no per-page duplicates)
- **Route Protection**: HOC/hook for authentication checks
- **Lazy Loading**: Large feature routes loaded on-demand via `React.lazy`
- **Breadcrumbs**: Consistent navigation context using breadcrumb primitive

## State Management

### Authentication State

```js
const AuthContext = {
  user: User | null,
  isAuthenticated: boolean,
  login: (credentials) => Promise<void>,
  logout: () => void,
  refreshToken: () => Promise<void>
};

// Additional context providers
const DashboardDataContext = {
  metrics: Object,
  events: Array,
  loading: boolean,
  error: string | null,
  refreshData: () => Promise<void>
};

const ManagementDataContext = {
  users: Array,
  campuses: Array,
  departments: Array,
  courses: Array,
  loading: boolean,
  error: string | null
};

const ManualEntryContext = {
  selectedEvent: Object | null,
  selectedUsers: Array,
  setSelectedEvent: Function,
  setSelectedUsers: Function
};
```

### Data Fetching Patterns

```js
// Project-specific hook pattern for API calls
const useEvents = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiService
      .get("/events/events/")
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
};

// Additional custom hooks
const useDeviceDetection = () => {
  // Device detection logic
};

const useMobile = () => {
  // Mobile detection logic
};

const usePermissions = () => {
  // Role-based permission checking
};
```

### Theme Management

- Dark/light mode toggle via `ThemeContext`
- Tailwind classes with CSS variable support
- Persistent theme preference in localStorage

## Component Library Status

### shadcn/ui Primitives (Current)

✅ **Implemented**: button, card, input, modal, alert, badge, dropdown-menu, table, tabs
🚧 **In Progress**: calendar, select, sheet, sidebar
📋 **Planned**: menubar, collapsible, navigation-menu

### Business Components

- **Modal System**: Comprehensive modal system with responsive fonts, scroll lock, ESC key support
- **Form Components**: Validation-aware inputs with error states
- **Data Tables**: Sortable, filterable tables with pagination
- **Dashboard Widgets**: Metrics cards, charts, activity feeds

## Performance Considerations

### Code Splitting

```js
// Route-level splitting
const EventsPage = React.lazy(() => import("@/pages/events/events-page"));
const AnalyticsPage = React.lazy(() =>
  import("@/pages/analytics/analytics-page")
);

// Component-level splitting for heavy features
const DataVisualization = React.lazy(() =>
  import("@/components/charts/data-visualization")
);
```

### Optimization Techniques

- **Memoization**: `React.memo` for pure components, `useMemo`/`useCallback` for expensive calculations
- **Virtual Scrolling**: For large lists (events, users) when needed
- **Image Optimization**: Lazy loading with intersection observer
- **API Caching**: Request deduplication in apiService

## Legacy Migration Notes

### Naming Convention Migration

- **Current**: Some primitives use PascalCase filenames (`Button.jsx`)
- **Target**: All new files use kebab-case (`button.jsx`)
- **Timeline**: Gradual migration without breaking changes

### Component Architecture Evolution

- **Phase 1**: ✅ Primitive library establishment
- **Phase 2**: 🚧 Legacy component refactoring to use primitives
- **Phase 3**: 📋 Composition patterns and optimization

## Development Workflow

### Component Creation Checklist

1. Use kebab-case filename
2. Export PascalCase component name
3. Import only via `@/` aliases
4. Compose with existing primitives
5. Include proper TypeScript-style prop validation (via PropTypes if needed)
6. Add accessibility attributes (ARIA)
7. Test with loading/error/empty states

### Testing Strategy

- **Unit Tests**: Individual component behavior
- **Integration Tests**: Component interaction with API
- **E2E Tests**: Critical user workflows
- **Accessibility Tests**: Screen reader and keyboard navigation
