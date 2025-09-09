# System Architecture

## Overview

React (Vite) SPA consumes Django REST Framework API under `/api/v1/`.

```
 Browser (React + shadcn/ui)
        ⇅ JWT (access + refresh)
 Django DRF (apps: account, campuses, events, attendances, core)
        ⇅ ORM
  DB (SQLite dev / PostgreSQL prod)
```

## App Responsibilities

| App         | Responsibility                                 | Status      |
| ----------- | ---------------------------------------------- | ----------- |
| account     | Users, auth flows, profiles, roles             | ✅ Complete |
| campuses    | Campus / department / course hierarchy         | ✅ Complete |
| events      | Event entities (future: lifecycle, capacity)   | ✅ Complete |
| attendances | Attendance records, check-in/out actions       | ✅ Complete |
| core        | Shared models, permissions, utilities, metrics | ✅ Complete |

## Data Model Snapshot (Current Implementation)

### Core Models

**User** (extends AbstractUser)

- Fields: email (unique), role (student/organizer/admin), verification status
- Relationships: One-to-one with UserProfile
- Authentication: JWT-based with access/refresh tokens

**UserProfile**

- Fields: student_id, year_level, section, academic preferences
- Foreign Keys: campus, department, course
- Purpose: Academic information separate from auth data

**Event**

- Fields: title, description, start_time, end_time, location, capacity
- Ownership: Created by organizer or admin users
- Access: Public read, authenticated write with role checks

**Attendance**

- Relationships: User ↔ Event (many-to-many through attendance records)
- Timestamps: check_in_time, check_out_time (nullable)
- Status tracking: Created, checked_in, checked_out, completed

**Campus Hierarchy**

- Campus → Department → Course (nested foreign key relationships)
- All models include created_at/updated_at timestamps
- Admin-controlled creation, authenticated read access

## API Conventions

- Versioned prefix: `/api/v1/` (single active version via `settings.API_VERSION`).
- Per-app routers; format suffixes disabled.
- Public read only where explicitly allowed (currently events list/detail). All writes require JWT.
- Pagination via DRF PageNumberPagination for scalable lists.

## Security

| Concern          | Mechanism                                                    |
| ---------------- | ------------------------------------------------------------ |
| Auth             | simplejwt (access ~60m dev / shorter prod), refresh rotation |
| Permissions      | Role-based permission classes                         |
| Input validation | Serializer + model constraints                               |
| Transport        | HTTPS in production (infrastructure)                         |
| CORS             | Permissive dev / strict allow list prod                      |

## Performance Practices

### Backend Optimization

- **Query Optimization**: `select_related` for foreign keys in list views, `prefetch_related` for M2M relationships
- **Pagination**: DRF PageNumberPagination for all list endpoints with >10 items
- **Database Indexing**: Proper indexes on frequently queried fields (user.email, event.start_time)
- **Response Caching**: Planned for stable endpoints after envelope standardization

### Frontend Optimization

- **Code Splitting**: Route-level lazy loading via `React.lazy` for large feature areas
- **State Management**: Local component state + Context for shared auth/theme data
- **Asset Optimization**: Vite handles bundling, tree-shaking, and asset optimization
- **API Efficiency**: Centralized `apiService` with request deduplication and caching

### Current Performance Targets

- **Page Load**: First meaningful paint < 1.5s on 3G
- **API Response**: 95% of requests < 200ms (development), < 500ms (production)
- **Database Queries**: N+1 elimination, query count monitoring in development

## Planned (Gated) Enhancements

| Feature                                         | Status   | Gate                            |
| ----------------------------------------------- | -------- | ------------------------------- |
| Unified response envelope everywhere            | Partial  | After baseline CRUD test parity |
| Event lifecycle states                          | Planned  | Post adoption metrics           |
| Comprehensive attendance verification (QR/GPS/Photo) | Planned  | After reliable check-in/out     |
| Analytics dashboards                            | Deferred | After envelope & lifecycle      |
