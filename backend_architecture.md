# BloodNet Backend Architecture Master Document

## 1. Core Stack Overview
* **Framework:** Next.js (App Router)
* **Database:** PostgreSQL (Ideal for complex geo-queries and JSONB data)
* **ORM:** Prisma
* **Auth:** Custom JWT (HTTP-only cookies)
* **Mail:** Nodemailer (OTP for login)
* **Hosting Pipeline:** Hostinger VPS (PostgreSQL & Node runtime), with Vercel flexibility.
* **Map API:** Forward/Reverse Geocoding via OpenStreetMap/Mapbox.

## 2. Directory Structure Setup

The backend follows a strictly enforced **Clean Architecture Pattern** within the Next.js `src` tree to ensure high scalability and decouple business logic from the HTTP request lifecycle.

```text
/src
  /app
    /api
      /auth
      /users
      /admin
      /organ-requests
      /reports
      /surveys
      /blogs
      /analytics
      /backup

  /backend
    /config           # Environment checks, DB instances, Maps API tokens
    /controllers      # Route handlers (Validates req, calls service, sends res)
    /services         # Pure business logic (E.g. matching donors)
    /repositories     # Database abstractions (Prisma queries)
    /middlewares      # Custom request verifiers (Auth checks, role guards)
    /utils            # Helpers (JWT signer, OTP gen, Phone formatter)
    /validators       # Zod schemas for payload validation
    /jobs             # Cron jobs (100-day trash cleanups, DB backups)
    /docs             # Internal API markdown documentation

  /prisma
    schema.prisma     # The single source of truth for the Database Engine
```

## 3. Database Schema Design (Prisma)

Here is the structured breakdown for the core database engines.

### 3.1. Users Engine
```prisma
model User {
  id                  String   @id @default(uuid())
  name                String
  email               String   @unique
  mobile              String   @unique // Stored as E.164 (+880XXXXXXXXX)
  blood_group         String
  
  // Location System (Autocomplete populated)
  location_city       String
  location_country    String
  location_lat        Float
  location_lng        Float
  place_id            String?
  
  // Donation Status
  is_active_donor     Boolean  @default(true)
  verification_status String   @default("UNVERIFIED") // "UNVERIFIED", "PENDING", "FULL"
  last_donation_date  DateTime?
  health_data         Json?    // e.g., { "diabetic": "Type 2", "allergies": "None" }
  
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  
  // Relations
  OrganRequest        OrganRequest[]
  SurveyAnswer        SurveyAnswer[]
}
```

### 3.2. Administrative Access Engine
```prisma
model AdminUser {
  id           String   @id @default(uuid())
  admin_id     String   @unique // E.g., admin_x
  password     String   // Bcrypt hashed
  role         String   @default("MANAGER") // "ADMIN", "MANAGER"
  last_login   DateTime?
  created_at   DateTime @default(now())
}
```

### 3.3. Module: Organ Requests & Reports
```prisma
model OrganRequest {
  id                 String   @id @default(uuid())
  user_id            String?  // Nullable for anonymous submissions
  name               String
  contact            String
  organ_type         String
  
  // Location
  location_city      String
  location_country   String
  location_lat       Float
  location_lng       Float
  place_id           String?

  medical_note       String?
  prescription_image String?  // URL to stored image
  status             String   @default("PENDING") // "PENDING", "APPROVED", "COMPLETED"
  
  created_at         DateTime @default(now())
  
  User               User?    @relation(fields: [user_id], references: [id])
}

model Report {
  id               String   @id @default(uuid())
  reporter_id      String?  
  reporter_contact String?
  target_type      String   // E.g., "USER", "BLOG", "ORGAN_REQ"
  target_id        String
  message          String
  status           String   @default("PENDING")
  created_at       DateTime @default(now())
}
```

### 3.4. Dynamic Survey Engine (Future Scalability)
```prisma
model Survey {
  id             String   @id @default(uuid())
  title          String
  description    String?
  is_active      Boolean  @default(true)
  created_at     DateTime @default(now())
  
  Questions      SurveyQuestion[]
  Answers        SurveyAnswer[]
}

model SurveyQuestion {
  id             String   @id @default(uuid())
  survey_id      String
  question_text  String
  input_type     String   // "TEXT", "RADIO", "CHECKBOX"
  
  Survey         Survey   @relation(fields: [survey_id], references: [id])
}

model SurveyAnswer {
  id             String   @id @default(uuid())
  survey_id      String
  user_id        String?  // Supports anonymous mapping
  answers_json   Json     // { "q_id_1": "answer", ... }
  created_at     DateTime @default(now())
  
  Survey         Survey   @relation(fields: [survey_id], references: [id])
  User           User?    @relation(fields: [user_id], references: [id])
}
```

### 3.5. Platform CMS & Moderation 
```prisma
model ManualDonor {
  id               String   @id @default(uuid())
  type             String   // "BLOOD" or "ORGAN"
  name             String
  contact          String
  blood_group      String?
  organ_type       String?  // JSON Array of pledged organs if type="ORGAN"
  
  // Location
  location_city    String
  location_country String
  location_lat     Float
  location_lng     Float
  
  source           String   // E.g., "Offline Camp", "Hospital Partner"
  added_by_admin   String
  created_at       DateTime @default(now())
}

model TrashRecord {
  id             String   @id @default(uuid())
  original_table String   // E.g., "User", "Blog"
  deleted_data   Json     // Payload of the entire deleted row
  deleted_at     DateTime @default(now())
  // Cron removes records where deleted_at < now() - 100 days
}
```

## 4. Authentication Architecture (JWT via HTTP-Only Cookies)

### User Authentication Flow (Passwordless via Nodemailer OTP)
1. **Request Phase (`POST /api/auth/otp/request`)**: User inputs Email. Backend generates a 6-digit OTP, stores it temporarily (in-memory caching or a lightweight DB model like `VerificationToken`), and dispatches via Nodemailer.
2. **Verification Phase (`POST /api/auth/otp/verify`)**: User inputs OTP. Backend checks validity.
3. **Issue Phase**: If valid, backend queries User table. If User exists, issue JWT. If not, auto-create User using registration payload, then issue JWT.
4. **Cookie Attachment**: JWT is injected directly into `Set-Cookie` headers with `HttpOnly`, `Secure` (in prod), `SameSite=Strict`, preventing XSS extraction.

### Admin Authentication Flow (ID + Password)
1. **Login Phase (`POST /api/auth/admin/login`)**: Takes custom admin ID and password block.
2. **Verification**: Bcrypt check against `AdminUser` table.
3. **Issue Phase**: Mints an Admin-level JWT including `{ user_id, role: "ADMIN" | "MANAGER" }`.
4. **Guards**: API routes underneath `/api/admin/*` utilize a layout middleware that rips the JWT from the cookie, decrypts it, and rejects unauthorized execution.

## 5. Mobile & Location Logic Integrity

### Number Formatting
* Middleware validation will forcefully strip leading zeros and inject country calling codes before database insertion.
* Example Strategy (`/backend/utils/phoneFormatter.ts`):
  * Input: Country Bangladesh (+880), Phone `1525252525`
  * Processed Output: `+8801525252525`

### Geographic Engine Setup
* The frontend UI must utilize an autocomplete service natively.
* The API payload demands: `country`, `city`, `lat`, `lng`.
* **Matching Algo (`/backend/services/matchingService.ts`)**: Base logic will initially string-match `city`. Advanced endpoints will calculate Haversine formulas explicitly across `location_lat` and `location_lng` to discover radius-based availability (`SELECT * WHERE distance < 15km`).

## 6. Security, Backups, and Data Safety

### Automated Backup Cron System (`/backend/jobs/databaseBackup.js`)
* Uses `node-cron` running at `0 0 * * *` (Midnight).
* Triggers a `pg_dump` CLI process directly on the Hostinger VPS.
* Archives the `.sql` output with a timestamp and saves it to a persistent block storage volume.

### Admin Database Export Endpoint (`GET /api/admin/system/dump`)
* High-security route guarded strictly by `role === "ADMIN"`.
* Invokes `pg_dump`, streams the buffer back directly to the client dashboard as a `.sql` download.

### Safe Trash (Soft Delete Protocol)
* Deletion requests inside the system route through the `TrashService`.
* `DELETE /api/users/:id` -> Reads row -> Inserts payload into `TrashRecord` -> Hard deletes row from `User`. 
* A secondary chronological background job sweeps `TrashRecord` daily for payloads > 100 days old.

## 7. Unified API Routing Expectations

All files created under `/app/api` will adopt a streamlined Controller mapping:

```typescript
// /app/api/users/route.ts
import { NextResponse } from 'next/server';
import { UserController } from '@/backend/controllers/userController';

export async function GET(req: Request) {
  // Pass to purely decoupled controller handling
  return await UserController.fetchUsersHandler(req);
}
```

### Module Code Comment Code Style
Every single method inside `/backend` must adhere to strict JSDoc standard referencing the pipeline:

```typescript
/**
 * Fetches prioritized active blood donors directly bound by city matches.
 * Expected Data Input: ?city=Dhaka&blood_group=A+
 * Target Integrations: User Management Dashboard, Public Donor Search.
 * Future Extension Note: Upgrade to accept Lat/Lng coords with Haversine distance limit queries natively.
 * 
 * @param {string} city - Evaluated target hub string
 * @param {string} bloodGroup - Exact group syntax
 * @returns {Promise<Array>} Donor Pool Array
 */
export const fetchActiveDonorsByLocation = async (city, bloodGroup) => {
   // ... Prisma Logic ...
};
```
