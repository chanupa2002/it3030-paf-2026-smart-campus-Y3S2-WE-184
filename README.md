# UniNode

UniNode is a smart campus operations hub built for the SLIIT PAF project. The repository currently contains a React frontend, a Spring Boot backend, and supporting database reference files for user management, resource booking, ticket handling, notifications, analytics, and admin operations.

This README reflects the repository state on 2026-04-28.

## Project Overview

The system is split into three main areas:

- `frontend/` - React 18 + Vite single-page application
- `backend/` - Spring Boot 3.4 REST API with JWT auth, Google OAuth, Flyway, and PostgreSQL
- `Database/` - schema reference files and diagrams used with the existing Supabase/PostgreSQL database

## Current Feature Set

### Authentication and users

- Email and password login
- Self-registration for `Student`, `Lecturer`, `Instructor`, and `Technician`
- Google OAuth login
- Password reset by email verification code
- JWT-based authenticated sessions
- Admin user management with user search, filtering, edit, and soft delete

### Role-based dashboards

- `Student`, `Lecturer`, and `Instructor` share the academic workspace
- `Technician` gets a technician-focused dashboard
- `Admin` gets control panels for resources, bookings, tickets, users, timetable, and analytics
- Notification bell with ticket and booking updates
- Profile/settings area

### Resource management

- Browse all campus resources
- Filter resources by name, type, and availability
- Admin CRUD for resources
- Admin availability toggling
- Admin static timetable slot assignment and removal

### Booking system

- Book resources by exact name
- Book resources by resource type
- Multi-slot bookings from `08:00` to `20:00`
- Personal booking views for `Pending`, `Approved`, `Rejected`, and `Cancelled`
- Pending booking cancellation flow
- Admin approval and rejection workflow
- Automatic expiry of pending bookings after 72 hours
- Automatic reminders for approved bookings
- Booking notifications written to the notifications module
- Student-specific restrictions when booking some resource types such as `Lab` and `LecHall`

### Ticketing system

- Raise support tickets against campus resources
- Priority levels: `LOW`, `MEDIUM`, `HIGH`
- Categories such as facilities, maintenance, hardware, infrastructure, and IT support
- Up to 3 image attachments from the frontend
- Admin technician assignment
- Ticket workflow: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`, `CLOSED`
- Ticket discussion/comments with edit support
- Ticket notifications for assignment, status changes, and comments

### Analytics

- Admin analytics dashboard for bookings, tickets, and resource availability
- Time-window filtering
- Resource-type filtering
- CSV export
- JSON export

## Tech Stack

### Frontend

- React 18
- Vite 5
- Plain CSS
- Hash-based client routing inside `App.jsx`

### Backend

- Java 21
- Spring Boot 3.4.3
- Spring Web
- Spring Security
- Spring OAuth2 Client
- Spring Data JPA
- Flyway
- PostgreSQL
- JWT via `jjwt`
- JavaMailSender
- OkHttp for Supabase storage calls

### Infrastructure and integrations

- PostgreSQL / Supabase database
- Supabase Storage for ticket attachments
- SMTP mail provider for password reset emails
- Google OAuth credentials for Google sign-in

## Repository Structure

```text
.
|-- backend/
|   |-- pom.xml
|   |-- .env
|   `-- src/main/
|       |-- java/com/uninode/smartcampus/
|       |   |-- config/
|       |   |-- common/security/
|       |   `-- modules/
|       |       |-- booking/
|       |       |-- facilities/
|       |       |-- health/
|       |       |-- notifications/
|       |       |-- tickets/
|       |       `-- users/
|       `-- resources/
|           |-- application.yml
|           `-- db/migration/
|-- frontend/
|   |-- package.json
|   |-- vite.config.js
|   `-- src/
|       |-- App.jsx
|       |-- styles.css
|       `-- components/
|-- Database/
|   |-- Supabase_DB_creation_forBackup.txt
|   `-- schema_sample.svg
|-- cleanup-missing-images.sql
`-- README.md
```

## Prerequisites

Before starting the project locally, make sure you have:

- Java 21
- Maven 3.9+
- Node.js 18+ and npm
- A PostgreSQL or Supabase database
- A Supabase storage bucket for ticket attachments
- SMTP credentials for password reset emails
- Google OAuth client credentials if you want Google sign-in enabled

## Important Database Note

The current repository is not a fully clean-slate database bootstrap.

- `backend/src/main/resources/db/migration/V1__init.sql` is still only a placeholder.
- `Database/Supabase_DB_creation_forBackup.txt` is a schema reference file, not a guaranteed ready-to-run migration.
- The project expects the core database tables to already exist before the backend starts.

At minimum, the database should already contain the legacy/core tables used by the app, including:

- `Users`
- `User_types`
- `Resource`
- `Ds_slot`
- `Ds_resource`
- `Resource_booking`
- `Rejected_Resource_booking`
- `Cancelled_Resource_booking`
- `Tickets`
- `Ticket_comments`
- `Notifications`
- `ticket_attachments`

### Required seed data

Make sure `User_types` contains these role names:

- `Student`
- `Lecturer`
- `Instructor`
- `Technician`
- `Admin`

For the current ticket comment notification SQL and service logic, it is safest to keep the legacy ID mapping aligned with the existing project assumptions:

- `Technician` -> `usertype_id = 4`
- `Admin` -> `usertype_id = 5`

If your role IDs differ, review:

- `backend/src/main/resources/db/migration/V3__ticket_comment_notifications.sql`
- `backend/src/main/resources/db/migration/V4__backfill_ticket_comment_notifications.sql`
- `backend/src/main/java/com/uninode/smartcampus/modules/notifications/service/TicketCommentNotificationService.java`

### Flyway migrations that do exist

Once the base schema exists, the backend will apply:

- `V2__password_reset.sql`
- `V3__ticket_comment_notifications.sql`
- `V4__backfill_ticket_comment_notifications.sql`

## Backend Environment Setup

Create or update `backend/.env`.

Example:

```env
DB_URL=jdbc:postgresql://<host>:<port>/<database>?sslmode=require
DB_USER=<database-user>
DB_PASSWORD=<database-password>
DB_POOL_MAX=10
DB_POOL_MIN_IDLE=1

JWT_SECRET=<long-random-secret>
JWT_EXPIRATION=86400000

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<smtp-username>
MAIL_PASSWORD=<smtp-password>
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS=true
MAIL_FROM=no-reply@example.com

GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
OAUTH2_REDIRECT_URI=http://localhost:5173/oauth2/callback

SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_KEY=<supabase-key>
SUPABASE_BUCKET=smart-campus-ticket-attachments
SUPABASE_EXPIRY=31536000
```

Notes:

- Start the backend from the `backend/` directory so Spring can import `./.env`.
- `application.yml` contains fallback defaults, but they are placeholders or team-specific values and should not be relied on for production use.
- Password reset will fail if mail credentials are not configured.
- Google sign-in will fail if Google OAuth credentials are not configured.
- Ticket image upload depends on a working Supabase URL, key, and bucket.

## Frontend Environment Setup

The frontend works with the Vite dev proxy by default, so `frontend/.env` is optional.

If you want to point the frontend directly at a backend URL, create `frontend/.env` with:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Notes:

- Without `VITE_API_BASE_URL`, Vite proxies `/api` requests to `http://localhost:8080`.
- Google OAuth login uses `VITE_API_BASE_URL` if present; otherwise it falls back to `http://<current-host>:8080`.

## Running the Project

### 1. Start the backend

```powershell
cd backend
mvn spring-boot:run
```

The backend starts on:

- `http://localhost:8080`

Health check:

- `http://localhost:8080/api/health`

### 2. Start the frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend starts on:

- `http://localhost:5173`

## Main Functional Areas by Role

### Academic users

Applies to:

- `Student`
- `Lecturer`
- `Instructor`

Current abilities:

- Log in and manage own session
- Browse campus resources
- Create bookings by name or by type
- View pending, approved, rejected, and cancelled bookings
- Raise support tickets with optional images
- View ticket status and participate in ticket discussions
- Receive notifications

### Technician

Current abilities:

- Log in to technician dashboard
- Browse resources
- View assigned or relevant tickets
- Move tickets through allowed workflow steps
- Add comments and resolution notes
- Receive notifications related to assignments and ticket activity

### Admin

Current abilities:

- Manage resources
- Manage timetable slot assignments
- Approve and reject booking groups
- Assign technicians to tickets
- Manage ticket workflow and closure
- View and manage users
- Review analytics and export reports

## Backend API Areas

The current backend is organized around these route groups:

- `/api/auth` - register, login, password reset
- `/api/users` - user lookup, update, admin list/delete, OAuth profile completion
- `/api/facilities` - resource browsing and admin resource operations
- `/api/bookings` - booking search, create, cancel, approve, reject, history
- `/api/admin-timetable` - static timetable grid
- `/api/tickets` - ticket CRUD, workflow, assignment, attachments
- `/api/tickets/{ticketId}/comments` - comment create/list
- `/api/comments/{id}` - comment edit/delete operations
- `/api/notifications` - notification read/create/delete
- `/api/health` - service health check

## Supabase and Attachment Handling

The current ticket attachment flow is:

- Frontend sends multipart form data to `/api/tickets`
- Backend validates attachment count and type
- Backend uploads images to a private Supabase bucket
- Backend stores attachment metadata in the database
- Backend generates signed URLs for display and download

Current backend attachment rules:

- Max 3 files from the frontend flow
- PNG and JPEG only
- 5 MB max per file in storage validation

There is also a legacy local folder at `backend/uploads/tickets`, but the active attachment flow in the current codebase uses Supabase signed URLs.

## Known Implementation Notes

- Some dashboard copy still contains placeholder wording even though the underlying modules are wired.
- Admin registration is intentionally blocked in the public registration form.
- New Google OAuth users are created as `Student` users first and then complete their profile by choosing a username.
- No automated test suite is currently checked into the repository.
- `cleanup-missing-images.sql` appears to be a maintenance script for older attachment/image data.

## Useful Reference Files

- `Database/Supabase_DB_creation_forBackup.txt` - database reference schema
- `Database/schema_sample.svg` - schema visual reference
- `backend/src/main/java/com/uninode/smartcampus/modules/users/USER_API_ENDPOINTS.txt` - user API notes
- `backend/src/main/java/com/uninode/smartcampus/modules/notifications/NOTIFICATION_API_ENDPOINTS.txt` - notification API notes

## Default Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Backend health check: `http://localhost:8080/api/health`
- Google OAuth start: `http://localhost:8080/oauth2/authorization/google`
