# UniNode Backend Handover (as of 2026-04-18)

## 1) Project overview
- Project root: `C:\Users\MSI\Desktop\SLIIT\PAF\UniNode`
- Backend: Spring Boot + Maven + Java 21
- Frontend: Vite/React
- DB: Supabase PostgreSQL
- Backend port: `8080`

## 2) Run instructions
```powershell
cd C:\Users\MSI\Desktop\SLIIT\PAF\UniNode\backend
mvn spring-boot:run
```

Health check:
- `GET http://localhost:8080/api/health`

## 3) Config files
- `backend/src/main/resources/application.yml`
- `backend/.env`

Important:
- DB config is loaded from `.env` via `spring.config.import`.
- OAuth2 Google config exists.
- JWT config exists.

## 4) Current DB assumptions (latest)
- `Resource` table has columns:
  - `id`, `type`, `name`, `capacity`, `location`
  - boolean availability column exists as either `available` or `availability` (code supports both names)
- `Resource.name` is unique.
- `OutOfService_Resource` table is removed by user decision.
- `Ds_resource` and `Ds_slot` are active.

## 5) Security behavior (current)
From `SecurityConfig`:
- Public:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `/oauth2/**`, `/login/oauth2/**`
- Protected:
  - `GET /api/users` -> ADMIN
  - `DELETE /api/users/{id}` -> ADMIN
  - `GET /api/users/{id}`, `PUT /api/users/{id}` -> authenticated
- All other routes are currently `permitAll`.

## 6) Facilities module endpoints
Base: `/api/facilities`

### 6.1 Get all resources
- `GET /api/facilities`
- Response: array of resource objects:
```json
[
  {
    "id": 1,
    "type": "LecHall",
    "name": "B1203",
    "capacity": 200,
    "location": "FOC Old Building"
  }
]
```

### 6.2 Get resources by type
- `GET /api/facilities/getResourceByType?type=Lab`
- Returns same object shape.

### 6.3 Get resources by name (contains, case-insensitive)
- `GET /api/facilities/getResourceByName?name=Canon`

### 6.4 Create resource
- `POST /api/facilities/createResource`
- Body:
```json
{
  "type": "Lab",
  "name": "E302",
  "capacity": 45,
  "location": "FOC New Building"
}
```
- `capacity` optional.
- Required: `type`, `name`, `location`.
- Availability is NOT passed in body; DB default should set true.
- Duplicate name -> `409`.

### 6.5 Update resource (only capacity/location)
- `PUT /api/facilities/updateResource/{id}`
- Body examples:
```json
{ "capacity": 80 }
```
```json
{ "location": "FOE Building - Floor 2" }
```
```json
{ "capacity": 80, "location": "FOE Building - Floor 2" }
```
- `type` and `name` are not updatable via this API.

### 6.6 Delete resource by id
- `DELETE /api/facilities/deleteResource/{id}`
- Success: `204`

### 6.7 Add resource to slot
- `POST /api/facilities/addresourcetoSlot`
- Body:
```json
{
  "slot_id": 1,
  "resource_id": 4
}
```
- Rules:
  - `slot_id` must exist
  - `resource_id` must exist
  - resource type must be `Lab` or `LecHall`
  - same pair `(slot_id, resource_id)` cannot duplicate
  - same slot can have multiple different resources
- Success response:
```json
{
  "slot_id": 1,
  "resource_id": 4
}
```

### 6.8 Remove resource from slot
- `DELETE /api/facilities/removeResourceFromSlot`
- Body:
```json
{
  "slot_id": 1,
  "resource_id": 4
}
```
- Deletes exact mapping row from `Ds_resource`.

### 6.9 Check whether resource is in slot
- `POST /api/facilities/isResourceInSlot`
- Body:
```json
{
  "slot_id": 1,
  "resource_id": 4
}
```
- Response: `true` or `false`

### 6.10 Change resource availability
- `POST /api/facilities/changeResourceAvailability`
- Body:
```json
{
  "resource_id": 4,
  "available": false
}
```
- `available` supports:
  - boolean: `true/false`
  - numeric: `1/0`
  - string: `"true"/"false"/"1"/"0"`
- Behavior:
  - Updates boolean availability column in `Resource` only.
  - Auto-detects column name `available` or `availability`.
- Success response:
```json
{
  "resource_id": 4,
  "available": false,
  "message": "Resource availability updated successfully."
}
```

## 7) Booking module endpoint (member 2 support)
Base: `/api/bookings`

### Get slot id by day + time slot
- `GET /api/bookings/getSlot_idByTimeDay?day=Monday&slot=8`
- Success:
```json
{
  "slot_id": 1
}
```

## 8) Auth/User endpoints (merged member 4)
Base: `/api/auth`, `/api/users`

### Register
- `POST /api/auth/register`

### Login
- `POST /api/auth/login`
- Body:
```json
{
  "email": "testuser01@gmail.com",
  "password": "Test1234A"
}
```
- Response includes JWT token and user object.

### OAuth login
- Browser flow endpoint:
  - `GET /oauth2/authorization/google`
- Success handler redirects to frontend callback with query params:
  - `token`, `userId`, `email`, `role`

### User APIs
- `GET /api/users` (ADMIN)
- `GET /api/users/{id}` (authenticated)
- `PUT /api/users/{id}` (authenticated)
- `PUT /api/users/oAuthUpdate/{id}` (self or admin)
- `DELETE /api/users/{id}` (ADMIN)

## 9) Exception response notes
- Facilities module has module-specific exception handler returning:
  - `timestamp`, `status`, `error`, `message`, `path`
- Global exception handler covers auth/user/security exceptions.

## 10) Notes for next chat / frontend integration
- New chat does not remember old chat history; it should read this file.
- For frontend integration, start with:
  1. auth (login/register and token storage)
  2. facilities listing/create/update/delete
  3. slot-resource mapping APIs
  4. change availability API wiring

--this hd new--