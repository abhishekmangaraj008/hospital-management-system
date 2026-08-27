# 🏥 MediCare — Hospital Management System

Full-stack fresher project: **React** frontend, **Spring Boot** backend, **MySQL** database, **JWT** auth.

```
hospital-management/   → Spring Boot backend (Maven)
frontend/               → React + Vite frontend
```

## 1. Backend setup

**Requirements:** Java 17, Maven, MySQL running locally.

1. Create nothing manually — the app auto-creates the `hospital_db` schema on first run
   (see `createDatabaseIfNotExist=true` in `application.properties`).
2. Edit `src/main/resources/application.properties` if your MySQL username/password differ
   from the defaults (`root` / `root`).
3. Run:
   ```bash
   cd hospital-management
   mvn spring-boot:run
   ```
4. The API starts on **http://localhost:8080**. Tables are created automatically via
   `spring.jpa.hibernate.ddl-auto=update`.
5. A default admin account is seeded on first run, read from `ADMIN_EMAIL` /
   `ADMIN_PASSWORD` env vars if set, otherwise falling back to dev defaults:
   - **Email:** `admin@hospital.com`
   - **Password:** `admin123`
6. `jwt.secret` similarly reads from a `JWT_SECRET` env var, falling back to a
   dev-only default so it runs out of the box locally.

   **Always set real `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `JWT_SECRET` values in any
   deployed environment** — the fallbacks exist purely so `mvn spring-boot:run`
   works immediately on a fresh clone.

> No MySQL handy? Swap the `mysql-connector-j` datasource for the bundled H2 dependency
> (already in `pom.xml`) by pointing `spring.datasource.url` at
> `jdbc:h2:mem:hospitaldb` and `spring.datasource.driver-class-name` at
> `org.h2.Driver` — useful for a quick local demo.

## 2. Frontend setup

**Requirements:** Node.js 18+.

```bash
cd frontend
npm install
cp .env.example .env      # points the app at http://localhost:8080/api
npm run dev
```

The app runs on **http://localhost:5173**.

## 3. Trying it out

1. Register a **Patient** and a **Doctor** account from the Register page (pick a
   department for the doctor — add one first as admin if the list is empty).
2. Log in as admin (`admin@hospital.com` / `admin123`) → **Departments** tab → add a
   department (e.g. "Cardiology") before registering doctors, since doctors pick a
   department at signup.
3. Log in as the patient → **Find a doctor** → book an appointment (must be a future
   date/time, between 9:00 AM and 5:00 PM, on a slot the doctor doesn't already have).
4. Log in as the doctor → **Appointments** → accept it → mark it **completed** →
   **Write prescription** for that visit (only available once completed).
5. Log back in as the patient → **Prescriptions** tab to see it appear, or
   **My profile** to edit contact/medical details.

## 4. Deployment notes

- **Frontend → Vercel:** set `VITE_API_BASE_URL` as an environment variable pointing
  at your deployed backend's `/api` path.
- **Backend → Render/Railway:** set `spring.datasource.*`, `JWT_SECRET`, `ADMIN_EMAIL`,
  and `ADMIN_PASSWORD` as environment variables rather than committing real credentials;
  update `CORS_ALLOWED_ORIGINS` to your deployed frontend's URL.

## 5. Project structure

See `hospital-management/` for the layered backend (`controller` → `service` →
`repository` → `entity`, plus `dto`, `security`, `exception`, `config` packages) and
`frontend/src/` for pages, shared components, the `AuthContext`, and the `api.js`
service layer that wraps every backend endpoint.

### Authorization model

Role checks (`@PreAuthorize`) gate access by *role*; several endpoints also enforce
*ownership* inside the service layer, since "any authenticated user" isn't enough
for record-level data like a specific patient's appointments:

| Endpoint | Who can actually access it |
|---|---|
| `GET /api/patients/{id}` | The patient themselves, an admin, or a doctor who has treated them |
| `GET /api/appointments/patient/{id}` | Same as above |
| `GET /api/appointments/doctor/{id}` | The doctor themselves, or an admin |
| `GET /api/prescriptions/patient/{id}` | The patient themselves, an admin, or a treating doctor |

Everything else uses coarse role checks (`PATIENT` / `DOCTOR` / `ADMIN`) since the
resource is already scoped to "my own data" (e.g. `/api/patients/me`).

### Appointment rules

- Can't book a date/time in the past, or outside 9:00 AM–5:00 PM clinic hours.
- Can't double-book the same doctor at the same date and time.
- Status transitions are restricted: `PENDING → ACCEPTED/REJECTED`,
  `ACCEPTED → COMPLETED` only. Cancelled/rejected/completed appointments are terminal.
- A prescription can only be created once an appointment's status is `COMPLETED`.

### REST API summary

```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/doctors
GET    /api/doctors/{id}
GET    /api/doctors/me/appointments        (DOCTOR)

GET    /api/patients/me                    (PATIENT)
PUT    /api/patients/me                    (PATIENT — update own profile)
GET    /api/patients/{id}                  (self / ADMIN / treating DOCTOR)
GET    /api/patients/me/prescriptions      (PATIENT)

POST   /api/appointments                   (PATIENT — validated: future slot, clinic hours, no double-booking)
DELETE /api/appointments/{id}              (PATIENT — cancel; blocked once completed/cancelled/rejected)
PUT    /api/appointments/{id}/status       (DOCTOR — accept/reject/complete; enforces valid transitions)
GET    /api/appointments/me                (PATIENT)
GET    /api/appointments/patient/{id}      (self / ADMIN / treating DOCTOR)
GET    /api/appointments/doctor/{id}       (self / ADMIN)

POST   /api/prescriptions                  (DOCTOR — only for COMPLETED appointments)
GET    /api/prescriptions/patient/{id}     (self / ADMIN / treating DOCTOR)

GET    /api/departments
POST   /api/departments                    (ADMIN)
DELETE /api/departments/{id}                (ADMIN)

POST   /api/admin/doctors                  (ADMIN)
DELETE /api/admin/doctors/{id}              (ADMIN)
GET    /api/admin/patients                  (ADMIN)
DELETE /api/admin/patients/{id}             (ADMIN)
GET    /api/admin/appointments              (ADMIN)
GET    /api/admin/dashboard                 (ADMIN)
```
