# API Documentation

## Base URL

All API endpoints are hosted at: **https://eas-university.site/api/v1/**

## Authentication

The API uses JWT (JSON Web Token) authentication with access and refresh tokens.

### Authentication Headers

Include the following header in authenticated requests:

```
Authorization: Bearer <access_token>
```

### Token Management

- Access tokens expire after ~60 minutes in development (shorter in production)
- Refresh tokens are used to obtain new access tokens
- On 401 responses, tokens are cleared and user is redirected to login

## Response Format

Most endpoints return responses in the following format:

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

Some endpoints may return data directly as an array or object.

## Authentication Endpoints

### POST /account/auth/login/

Login user with credentials.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "student"
  }
}
```

### POST /account/auth/register/

Register a new user.

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "role": "student",
  "first_name": "John",
  "last_name": "Doe"
}
```

### POST /account/auth/refresh/

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## User Management Endpoints

### GET /account/users/me/

Get current authenticated user details.

**Response:**

```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",
  "is_verified": true
}
```

### GET /account/profiles/me/

Get current user's profile information.

**Response:**

```json
{
  "student_id": "2021-123456",
  "year_level": 2,
  "section": "A",
  "campus": {
    "id": 1,
    "name": "Main Campus"
  },
  "department": {
    "id": 1,
    "name": "Computer Science"
  },
  "course": {
    "id": 1,
    "name": "Bachelor of Science in Computer Science"
  }
}
```

### PATCH /account/profiles/me/

Update current user's profile.

**Request Body:**

```json
{
  "student_id": "2021-123456",
  "year_level": 3,
  "section": "B"
}
```

### GET /account/users/search/

Search users by query.

**Query Parameters:**

- `q` - Search query

**Example:** `/account/users/search/?q=john`

### GET /account/users/

Get all users (admin/organizer only).

**Response:** Paginated list of users.

### POST /account/users/

Create a new user (admin only).

### PUT /account/users/{id}/

Update user by ID (admin only).

### DELETE /account/users/{id}/

Delete user by ID (admin only).

## Event Management Endpoints

### GET /events/events/

Get all events (paginated).

**Response:**

```json
{
  "count": 50,
  "next": "https://eas-university.site/api/v1/events/events/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Programming Workshop",
      "description": "Learn the basics of programming",
      "start_time": "2025-09-15T10:00:00Z",
      "end_time": "2025-09-15T15:00:00Z",
      "location": "Room 101",
      "capacity": 50,
      "organizer": {
        "id": 2,
        "name": "Jane Smith"
      }
    }
  ]
}
```

### GET /events/events/{id}/

Get event details by ID.

### POST /events/events/

Create a new event (organizer/admin only).

**Request Body:**

```json
{
  "title": "New Workshop",
  "description": "Workshop description",
  "start_time": "2025-09-20T10:00:00Z",
  "end_time": "2025-09-20T15:00:00Z",
  "location": "Room 202",
  "capacity": 30
}
```

### PUT /events/events/{id}/

Update event by ID (organizer/admin only).

### DELETE /events/events/{id}/

Delete event by ID (organizer/admin only).

## Attendance Management Endpoints

### GET /attendances/attendances/

Get all attendance records (paginated).

### GET /attendances/attendances/export/

Export attendance records for a date range.

**Query Parameters:**

- `start_date` - Start date (YYYY-MM-DD)
- `end_date` - End date (YYYY-MM-DD)

**Example:** `/attendances/attendances/export/?start_date=2025-09-01&end_date=2025-09-30`

### GET /attendances/attendances/{id}/

Get attendance record by ID.

### POST /attendances/attendances/

Create attendance record.

**Request Body:**

```json
{
  "event": 1,
  "user": 1,
  "check_in_time": "2025-09-15T10:05:00Z"
}
```

### POST /attendances/attendances/manual-entry/

Create manual attendance entry (organizer/admin only).

### PUT /attendances/attendances/{id}/

Update attendance record.

### DELETE /attendances/attendances/{id}/

Delete attendance record.

### POST /attendances/attendances/{id}/check-in/

Check in to an event.

**Request Body (JSON or FormData):**

```json
{
  "location": {
    "latitude": 14.5995,
    "longitude": 120.9842
  },
  "timestamp": "2025-09-15T10:05:00Z"
}
```

### POST /attendances/attendances/{id}/check-out/

Check out from an event.

**Request Body:**

```json
{
  "location": {
    "latitude": 14.5995,
    "longitude": 120.9842
  },
  "timestamp": "2025-09-15T15:30:00Z"
}
```

### PATCH /attendances/attendances/{id}/

Verify attendance record (organizer/admin only).

**Request Body:**

```json
{
  "verify": true,
  "notes": "Attendance verified manually"
}
```

## Campus Management Endpoints

### GET /campuses/campuses/

Get all campuses.

**Response:**

```json
[
  {
    "id": 1,
    "name": "Main Campus",
    "address": "123 University Ave",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### POST /campuses/campuses/

Create a new campus (admin only).

### PUT /campuses/campuses/{id}/

Update campus by ID (admin only).

### DELETE /campuses/campuses/{id}/

Delete campus by ID (admin only).

### GET /campuses/departments/

Get all departments.

### POST /campuses/departments/

Create a new department (admin only).

### PUT /campuses/departments/{id}/

Update department by ID (admin only).

### DELETE /campuses/departments/{id}/

Delete department by ID (admin only).

### GET /campuses/courses/

Get all courses.

### POST /campuses/courses/

Create a new course (admin only).

### PUT /campuses/courses/{id}/

Update course by ID (admin only).

### DELETE /campuses/courses/{id}/

Delete course by ID (admin only).

## System Metrics Endpoints

### GET /core/dashboard/metrics/

Get dashboard metrics.

**Response:**

```json
{
  "total_users": 150,
  "total_events": 25,
  "total_attendances": 1200,
  "recent_events": 5,
  "active_users": 80
}
```

### GET /core/metrics/

Get detailed system metrics.

### POST /core/metrics/recalculate/

Recalculate system metrics (admin only).

## File Upload Endpoints

### POST /core/upload/media/

Upload media file.

**Request:** Multipart form data with file field.

**Response:**

```json
{
  "url": "https://eas-university.site/media/uploads/file.jpg",
  "filename": "file.jpg",
  "size": 1024
}
```

## Configuration Endpoints

### GET /core/config/mapbox/

Get Mapbox configuration token.

**Response:**

```json
{
  "token": "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjazk..."
}
```

## Error Responses

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses include details:

```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "INVALID_CREDENTIALS"
  }
}
```

## Pagination

List endpoints support pagination with the following parameters:

- `page` - Page number
- `page_size` - Number of items per page

Response includes:

- `count` - Total number of items
- `next` - URL for next page
- `previous` - URL for previous page
- `results` - Array of items

## Rate Limiting

API requests are rate-limited to prevent abuse. Current limits:

- Authenticated users: 1000 requests per hour
- Anonymous users: 100 requests per hour

## CORS Policy

Cross-Origin Resource Sharing (CORS) is configured to allow requests from:

- `https://easuniversity.site` (production frontend)
- `http://localhost:5173` (development frontend)

## Security Considerations

- All production traffic uses HTTPS
- Sensitive endpoints require authentication
- Input validation is performed on all endpoints
- SQL injection protection via ORM
- CSRF protection for state-changing operations
