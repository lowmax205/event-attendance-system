# EAS – Event Attendance System

Central entry point for all documentation. A comprehensive, mobile-friendly platform for managing events and attendance with role-based access control.

## Purpose

Mobile‑friendly role‑based platform for managing events and recording attendance (Students, Organizers, Admins) with a simplified academic linkage (Campus → Department → Course + year/section attributes on users).

## Current Implementation Status

### ✅ Core Features Complete

- **Authentication System**: JWT-based with refresh tokens, role-based access
- **User Management**: Registration, email verification, profile management
- **Academic Hierarchy**: Campus → Department → Course structure
- **Event Management**: Full CRUD with organizer/admin permissions
- **Attendance System**: Check-in/out functionality with timestamp tracking
- **Dashboard Metrics**: System health and usage statistics
- **Management Interface**: Comprehensive admin panel for users, events, and academics
- **Reporting System**: Attendance reports and data export functionality
- **Multi-Context State Management**: Separated contexts for dashboard, management, and manual entry
- **Location Services**: Mapbox integration for location-based features
- **Media Upload**: File upload system with secure handling

### 🚧 In Progress

- **Response Envelope Standardization**: Unifying API response format across all endpoints
- **Comprehensive Error Handling**: Enhanced validation and user-friendly error messages
- **Performance Optimization**: Query optimization and caching implementation
- **Mobile Responsiveness**: Optimizing UI components for mobile devices

### 📋 Planned Enhancements

- **Advanced Attendance Verification**: Enhanced QR codes, GPS validation, photo verification
- **Event Lifecycle Management**: Draft, published, archived states with workflow
- **Enhanced Analytics**: Advanced dashboard with interactive charts and insights
- **Notification System**: Real-time notifications for attendance and events

## Modules

### Backend Apps

- **account** - Authentication, users, profiles, role management
- **campuses** - Campus/department/course hierarchy management
- **events** - Event CRUD operations with lifecycle management
- **attendances** - Attendance records with check-in/out actions
- **core** - Shared mixins, permissions, utilities, metrics system

### Frontend Structure

- **Components**: shadcn/ui primitives with business-specific components (auth, layout, management)
- **Pages**: Role-based routing with authentication guards (dashboard, attendance, management, reports, etc.)
- **Services**: Centralized API communication layer with location services
- **Contexts**: Global state management for auth, dashboard data, management data, and manual entry
- **Hooks**: Custom hooks for device detection, permissions, and mobile responsiveness

## Technical Architecture

### Backend (Django REST Framework)

- **Framework**: Django 5.2+ with DRF 3.16+
- **Authentication**: JWT with djangorestframework-simplejwt
- **Database**: SQLite (development), PostgreSQL (production)
- **Testing**: pytest with comprehensive coverage
- **Settings**: Environment-based configuration (development/production)

### Frontend (React SPA)

- **Framework**: React 19 with Vite build system
- **Styling**: Tailwind CSS 4.x with shadcn/ui component library
- **State**: React Context + project-specific hooks for data fetching
- **Routing**: React Router v7 with protected route guards
- **Testing**: Vitest for unit and integration testing
- **Additional Libraries**:
  - Mapbox GL for location services
  - React Webcam for camera functionality
  - QR code generation and scanning
  - Date/time pickers and calendars
  - Data tables with sorting and filtering

## Development Principles

1. **CRUD First Policy**: Complete all basic operations before complex features
2. **Security by Design**: JWT authentication, input validation, role-based permissions
3. **Component Reusability**: shadcn/ui primitives with consistent design system
4. **Performance Focus**: Query optimization, pagination, code splitting
5. **Accessibility**: ARIA compliance, keyboard navigation, screen reader support
6. **Mobile-First**: Responsive design optimized for mobile devices

## Documentation Map

| Topic                          | File                     |
| ------------------------------ | ------------------------ |
| System Architecture            | architecture.md          |
| API Endpoints Documentation    | api.md                   |
| Frontend Architecture          | frontend/architecture.md |
| Frontend Development Standards | frontend/development.md  |
| Frontend Deployment            | frontend/deployment.md   |
| Contributing Guide             | contributing.md          |

Global AI / automation rules live in `.github/instructions/`.
