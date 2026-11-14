# 🐾 Pet Adoption Front-end

Web application for managing pet adoptions: shelters, pets, and veterinarians. Developed for the **Programming Models** course at **Universidad Distrital Francisco José de Caldas**, group **G81**, team **E2**.

The front-end consumes the REST API of the back-end (Spring Boot) built during Cycle 1.
<p align="center"> <img src="https://github.com/user-attachments/assets/8a880330-1299-4d18-999e-66b010f4a404" alt="Screenshot 1" width="620"> </p> <p align="center"> <img src="https://github.com/user-attachments/assets/ba714621-3a3e-4160-bf7b-e42c660fac34" alt="Screenshot 2" width="620"> </p> <p align="center"> <img src="https://github.com/user-attachments/assets/3a060567-ecc5-45ea-9a28-0e0a06261b02" alt="Screenshot 3" width="620"> </p>

## Table of Contents

1. [Team](#team)
2. [Technologies](#technologies)
3. [Features at a Glance](#features-at-a-glance)
4. [Requirements](#requirements)
5. [Quick Start](#quick-start)
6. [Environment Variables](#environment-variables)
7. [Scripts](#scripts)
8. [Project Structure](#project-structure)
9. [Application Routes](#application-routes)
10. [Back-end API Used](#back-end-api-used)
11. [Simulated User and Role](#simulated-user-and-role)
12. [User Stories](#user-stories)
13. [Reusable Components](#reusable-components)
14. [Testing](#testing)
15. [Quality: Jenkins and SonarQube](#quality-jenkins-and-sonarqube)
16. [Git Workflow](#git-workflow)
17. [Troubleshooting](#troubleshooting)

## Team

| Team Member |
|---|
| Ardila Duran, Camilo Andrés |
| Escobar Barrios, Alejandro |
| Leal Rivera, Anggel Felipe |
| Nossa Orjuela, Isabella |
| Sandoval Rodríguez, Luna Alejandra |

## Technologies

| Area | Tool |
|---|---|
| UI | **React 19** (JSX) with **Vite** |
| Navigation | **React Router 7** |
| Styling | **CSS Modules** + global design tokens in `src/index.css` |
| Testing | **Vitest**, **React Testing Library**, `user-event`, `jsdom` |
| Code style | **ESLint** (recommended + React Hooks + React Refresh) |
| CI / quality | **Jenkins** and **SonarQube** |

## Features at a Glance

- **Veterinarians:** list with filters (specialization / availability), profile with follow-ups and medical events, and registration.
- **Shelters:** registration with client-side and back-end validation.
- **Pets:** registration with arrival events and photo links.
- **Role-based UI:** shelter-administrator-only options, using a simulated session until the back-end has authentication.
- **Quality:** 31 test files / 319 tests, ESLint, and a Jenkins pipeline with a SonarQube quality gate.

## Requirements

- **Node.js 20 or higher** with npm (the Jenkins pipeline uses **Node 22**, which is the recommended version).
- **Git**.
- The platform's **back-end** running (Spring Boot, requires JDK 21).
- Optional: **Postman** to create test data in the back-end.

## Quick Start

1. **Start the back-end.** The API context path is `/api`. Data is stored in an **in-memory H2 database**, so it is lost every time the back-end restarts.
2. **Create the test data** required by the user story you want to try, such as a shelter or some veterinarians (see [Troubleshooting](#troubleshooting)).
3. **Clone the repository and install dependencies:**

   ```bash
   git clone <FRONT-END REPOSITORY URL>
   cd MP_202630_G81_E2_Front
   npm ci
   ```

4. **Point the front-end to your back-end** (see [Environment Variables](#environment-variables)). The `.env` file included in the project uses `http://localhost:8999/api`; adjust or remove it if your back-end runs elsewhere.
5. **Start the development server:**

   ```bash
   npm run dev
   ```

6. Open the URL displayed by Vite (usually `http://localhost:5173`).

> If `VITE_API_BASE_URL` is **not** defined, requests to `/api` are proxied by Vite to `http://localhost:8080` (see `vite.config.js`).

## Environment Variables

Variables are read from the local `.env` file. **Do not commit secrets** to it.

| Variable | Purpose | Default Value |
|---|---|---|
| `VITE_API_BASE_URL` | Full API URL, e.g. `http://localhost:8999/api` if the back-end runs on port 8999 | `/api` (proxied to `localhost:8080`) |
| `VITE_SHELTER_ID` | ID of the shelter assigned to the simulated administrator. **It must exist in the back-end.** | `1` |
| `VITE_USER_ID` | ID of the simulated user (sent as the shelter's responsible user) | `1` |

Automated tests ignore these variables (see `test.env` in `vite.config.js`), so they pass regardless of your `.env`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Generates the production build in `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs code style analysis with ESLint |
| `npm test` | Runs unit and component tests once |
| `npm run test:coverage` | Runs tests and generates a coverage report (`coverage/lcov.info`), which SonarQube reads |

## Project Structure

```text
.
├── Jenkinsfile                 # CI pipeline (lint, build, tests, SonarQube)
├── sonar-project.properties    # SonarQube configuration
├── vite.config.js              # Vite, API proxy and Vitest configuration
├── eslint.config.js
├── img/                        # CI/quality screenshots used in this README
├── public/
└── src/
    ├── App.jsx                 # Route definitions
    ├── main.jsx                # Entry point (BrowserRouter)
    ├── components/             # Reusable UI components (each with CSS Module and tests)
    ├── config/
    │   └── session.js          # Simulated user and role
    ├── constants/              # Option lists (species, cities, specializations, ...)
    ├── pages/                  # One folder per screen
    │   ├── PetRegisterPage/
    │   ├── RegisterVeterinarianPage/
    │   ├── ShelterRegisterPage/
    │   ├── VeterinarianProfilePage/
    │   └── VeterinariansPage/
    ├── services/               # API client and one module per resource
    └── utils/                  # Pure helpers (dates, photo form)
```

Each screen lives in its own folder next to its CSS Module and tests. Logic that does not depend on React (validation and request-body construction) is kept in separate modules, such as `PetRegisterPage/petForm.js` or `RegisterVeterinarianPage/validateVeterinarian.js`, so it can be tested on its own.

## Application Routes

| Route | Screen | Role | Status |
|---|---|---|---|
| `/` | Redirects to `/veterinarians` | Any | ✅ |
| `/veterinarians` | Veterinarian list with filters (HU70) | Any | ✅ Implemented |
| `/veterinarians/new` | Register a veterinarian | Any | ✅ Implemented |
| `/veterinarians/:veterinarianId` | Veterinarian profile (HU70) | Any | ✅ Implemented |
| `/shelters/new` | Register a shelter (HU01) | Shelter admin | ✅ Implemented |
| `/shelters/:shelterId` | Shelter detail | Any | 🚧 Placeholder |
| `/pets/new` | Register a pet (HU06) | Shelter admin | ✅ Implemented |
| `/medical-events` | Medical events list with filters (HU28) | Any | ✅ Implemented |
| `/medical-events/new` | Register a medical event (HU23) | Shelter staff | ✅ Implemented |
| `/pets/:petId/medical-events` | Pet medical history (HU24) | Any | ✅ Implemented |
| `/medical-events/:medicalEventId` | Medical event detail (HU25) | Any | ✅ Implemented |
| `/medical-events/:medicalEventId/edit` | Edit a medical event (HU26) | Shelter staff | ✅ Implemented |
| `/pets` | Pet search (HU07) | Any | 🚧 Placeholder |
| `/pets/:petId` | Pet profile (HU08) | Any | 🚧 Placeholder |

## Back-end API Used

All requests go through `src/services/apiClient.js`, which prepends `VITE_API_BASE_URL` (or `/api`), sends JSON, and converts failures into an `ApiError` (message taken from `apierror.message` in the response body, or a generic connection error).

| Method | Endpoint | Used by | Service |
|---|---|---|---|
| `GET` | `/veterinarians?specialization=&availability=` | Veterinarian list | `getVeterinarians` |
| `GET` | `/veterinarians/{id}` | Veterinarian profile | `getVeterinarian` |
| `POST` | `/veterinarians` | Register a veterinarian | `createVeterinarian` |
| `POST` | `/shelters` | HU01 | `createShelter` |
| `POST` | `/pets` | HU06 | `createPet` |
| `POST` | `/pets/{petId}/photos` | HU06 (pet photos) | `addPetPhoto` |
| `GET` | `/pets` | HU23 (pet list) | `getPets` |
| `GET` | `/pets/{id}` | HU24 (pet header) | `getPet` |
| `GET` | `/medicalEvents?petId=` | HU24 (medical history) | `getMedicalEvents` |
| `GET` | `/medicalEvents/{id}` | HU25 (event detail) | `getMedicalEvent` |
| `PUT` | `/medicalEvents/{id}` | HU26 (edit event) | `updateMedicalEvent` |
| `DELETE` | `/medicalEvents/{id}` | HU27 (delete event) | `deleteMedicalEvent` |
| `GET` | `/medicalEvents?petId=&type=&date=` | HU28 (list with filters) | `getMedicalEvents` |
| `GET` | `/pets` | HU28 (pet filter options) | `getPets` |
| `POST` | `/medicalEvents` | HU23 (register event) | `createMedicalEvent` |

## Simulated User and Role

The back-end does not implement authentication yet, so the user and role are simulated in `src/config/session.js`. The default user is **AdminUser**, a shelter administrator, whose shelter and ID come from `VITE_SHELTER_ID` and `VITE_USER_ID`.

- Available roles: `SHELTER_ADMIN`, `VETERINARIAN`, `ADOPTER`, `VISITOR`.
- Only the **shelter administrator** sees **Registrar refugio** and **Registrar mascota** in the navigation bar and can use `/shelters/new` and `/pets/new`. Any other role gets a message explaining that they do not have permission.
- Veterinarian screens are not restricted by role.
- Once real authentication exists, only the `getSession()` function needs to be replaced.

## User Stories

| User Story | Description | Route | Status |
|---|---|---|---|
| **HU70** | Veterinarian list with filters and profile | `/veterinarians` | ✅ Implemented |
| **HU01** | Register a shelter | `/shelters/new` | ✅ Implemented |
| **HU06** | Register a pet | `/pets/new` | ✅ Implemented |
| **HU23** | Register a medical event | `/medical-events/new` | ✅ Implemented |
| **HU24** | View the medical history of a pet | `/pets/:petId/medical-events` | ✅ Implemented |
| **HU25** | View the detail of a medical event | `/medical-events/:medicalEventId` | ✅ Implemented |
| **HU26** | Edit a medical event | `/medical-events/:medicalEventId/edit` | ✅ Implemented |
| **HU27** | Delete a medical event | `/medical-events/:medicalEventId` | ✅ Implemented |
| **HU28** | View medical events with filters | `/medical-events` | ✅ Implemented |
| *(extra)* | Register a veterinarian | `/veterinarians/new` | ✅ Implemented |
| **HU07** | Pet search | `/pets` | 🚧 Pending |
| **HU08** | Pet profile | `/pets/:petId` | 🚧 Pending |

### HU70 – Veterinarian List with Filters

**Routes:** `/veterinarians` · `/veterinarians/:veterinarianId`

Shelter users can view veterinarians with their **name, specialization, and availability**. They can filter by specialization and/or availability with the **Buscar** button (case-insensitive). The filter options are built from the veterinarians returned by the back-end. If nothing matches, a message says so.

Opening a profile also shows the veterinarian's contact data, **follow-ups**, and **medical events** (dates are shown as a day, e.g. `21 oct 2026`).

- **Back-end:** `GET /api/veterinarians?specialization=&availability=` and `GET /api/veterinarians/{id}`.
- **States:** loading, error with its cause, and empty list (different message with and without filters). Out-of-order responses are discarded, so a slow request never overwrites a newer search.

**Manual testing:**

1. Open `/veterinarians` and verify that all registered veterinarians are displayed.
2. Select a specialization and/or availability, click **Buscar**, and verify the list is filtered.
3. Select a combination with no results and verify the "no results" message.
4. Open a profile and verify that follow-ups and medical events are displayed.
5. Stop the back-end and verify that an error message is displayed.

### Register a Veterinarian

**Route:** `/veterinarians/new` (reachable from the **Registrar veterinario** button on the list)

Form with first name, last name, email, phone, specialization, and availability. All fields are required; the email must be valid and the phone must have 7–15 digits (spaces, parentheses, `+`, and `-` are ignored). On success, the user returns to `/veterinarians` with a confirmation message.

- **Back-end:** `POST /api/veterinarians`.
- **Errors:** back-end messages are shown in an error state inside the form, keeping the entered data.

**Manual testing:**

1. Open `/veterinarians/new` and submit the empty form: errors should appear for every field.
2. Enter an invalid email and a short phone number: both should be rejected.
3. Fill in valid data and submit: you should return to the list with a confirmation message and see the new veterinarian.

### HU23 – Register a Medical Event

**Route:** `/medical-events/new` · **Role:** shelter staff (`SHELTER_ADMIN` or `VETERINARIAN`)

The form records a medical event (consultation, surgery, treatment, ...) in the medical history of an **active** pet. The pet and the veterinarian are selected from the lists returned by the back-end, the date cannot be in the future, and every field is required. Inactive pets are not offered.

- **Back-end:** `POST /api/medicalEvents`, with the pet and the veterinarian sent as `{ id }` references.
- **Dates:** the form sends `YYYY-MM-DDT00:00:00±hh:mm` (`dayStartISO` in `utils/dates.js`). The back-end stores a `java.util.Date`; with a date-only string it shifts the day for negative offsets (2026-09-12 is stored as 2026-09-11).
- **Validation:** first on the client (errors next to each field, focus moved to the first invalid field), then by the back-end. Back-end messages appear in a dialog and, when they belong to a field, next to it as well.
- **Result:** a confirmation dialog shows the pet, veterinarian, date, and type, and offers a link to `/pets/{id}`.

**Manual testing:**

1. Start the back-end and create a shelter, an active pet, and a veterinarian.
2. Open `/medical-events/new` and submit the empty form: errors should appear, and focus should move to the pet list.
3. Enter a future date: the form should reject it.
4. Register an event: a confirmation should appear, and **Ver la mascota** should navigate to `/pets/{id}`.
5. Register the same event again: the duplicate message from the back-end should be displayed.

### HU24 – View the Medical History of a Pet

**Route:** `/pets/:petId/medical-events` · **Role:** any user

The screen shows the pet's data (name, species, and breed) and the medical events registered for it, newest first. Each event displays its date, type, description, and veterinarian (or a message when no veterinarian was assigned).

- **Back-end:** `GET /api/pets/{id}` and `GET /api/medicalEvents?petId=`.
- **States:** loading, error with its cause (and a **Reintentar** button), and an empty history message.
- **Shortcut:** the **Registrar evento médico** button opens `/medical-events/new` (HU23).

**Manual testing:**

1. Start the back-end and register a pet with at least one medical event.
2. Open `/pets/{id}/medical-events` and verify that the events are shown newest first.
3. Open the history of a pet without events and verify the empty message.
4. Stop the back-end and verify that the error and the retry button are displayed.

### HU25 – View the Detail of a Medical Event

**Route:** `/medical-events/:medicalEventId` · **Role:** any user

Shows a single medical event with its type, date, pet (linked to the pet's medical history), veterinarian, and description. Each event title in the history list (HU24) links to this screen.

- **Back-end:** `GET /api/medicalEvents/{id}` (404 when the event does not exist, 412 when the id is invalid).
- **States:** loading, error with its cause (and a **Reintentar** button), and a link back to the pet history (or to `/pets` when the event could not be loaded).

**Manual testing:**

1. Open `/pets/{id}/medical-events` and click the title of an event.
2. Verify that the type, date, pet, veterinarian, and description are displayed.
3. Use **Volver a la historia médica** to return to the pet history.
4. Open `/medical-events/999` and verify that the error and the retry button are displayed.

### HU26 – Edit a Medical Event

**Route:** `/medical-events/:medicalEventId/edit` · **Role:** shelter staff (`SHELTER_ADMIN` or `VETERINARIAN`)

The form is prefilled with the current event and changes its date, type, description, or veterinarian. The pet cannot be changed: it is shown as read-only text, as the back-end rejects a different pet after creation. The same validation as HU23 applies (every field is required, the date cannot be in the future, and the veterinarian must be selected). On success, a confirmation dialog offers to go to the detail (**Ver detalle**) or back to the pet's history.

- **Back-end:** `GET /api/medicalEvents/{id}` to load the event, and `PUT /api/medicalEvents/{id}` with the same payload as HU23 (the pet is sent with its current id).
- **Dates:** sent as `dayStartISO` (see HU23), so the day does not shift.
- **Errors:** back-end messages are shown in an error dialog and, when they belong to a field, next to it. The form keeps the entered data.
- **States:** loading, error with its cause (and a **Reintentar** button), and a message when there are no veterinarians to choose from.
- **Shortcut:** the **Editar evento** button on the detail page (HU25) opens this form.

**Manual testing:**

1. Open `/medical-events/{id}` and click **Editar evento**.
2. Verify that the form shows the current date, type, description, and veterinarian, and that the pet is not editable.
3. Change the description and the veterinarian, and save. The confirmation should show the new values.
4. Click **Ver detalle** and verify the changes on the detail page.
5. Enter a future date and verify that the form rejects it.
6. Open `/medical-events/999/edit` and verify that the error and the retry button are displayed.

### HU27 – Delete a Medical Event

**Route:** `/medical-events/:medicalEventId` (action on the detail page) · **Role:** shelter staff (`SHELTER_ADMIN` or `VETERINARIAN`)

The **Eliminar evento** button appears on the detail page (HU25) next to **Editar evento**, only for the shelter staff. It opens a confirmation dialog that names the event and warns that the action cannot be undone; **Cancelar** has the focus by default, so an accidental Enter does not delete anything. While the deletion runs, the dialog cannot be dismissed. On success the user goes to the pet's medical history, which confirms the deletion.

- **Back-end:** `DELETE /api/medicalEvents/{id}` (204 with no content; 404 when the event does not exist; 412 when the id is invalid).
- **Errors:** the back-end message is shown in an error dialog, and the event stays on screen.
- **Shared component:** `ConfirmDialog` (built on `ModalDialog`), reusable for future delete actions.

**Manual testing:**

1. Open `/medical-events/{id}` as the shelter staff and verify that **Editar evento** and **Eliminar evento** are shown.
2. Click **Eliminar evento**: the dialog should name the event, and **Cancelar** should have the focus.
3. Cancel and verify that the event is still displayed.
4. Click **Eliminar evento** again and confirm. The user should go to the pet's history with the message "Se eliminó el evento médico de …", and the event should no longer be listed.
5. Open the deleted event's URL: the error from the back-end should be displayed.

### HU28 – View Medical Events with Filters

**Route:** `/medical-events` · **Role:** any user

Lists the medical events of every pet, newest first, and filters them by **Mascota**, **Tipo de evento**, and **Fecha del evento** (the exact day). The filters can be combined and are applied when the user presses **Buscar**, as in the veterinarian list (HU70). **Limpiar filtros** restores the full list. Each event links to its detail (HU25).

- **Back-end:** `GET /api/medicalEvents?petId=&type=&date=`. Blank filters are left out, the type is matched without regard to case, and the date must be `yyyy-MM-dd` (a malformed date is rejected with 412).
- **Options:** the pets come from `GET /api/pets`, including inactive pets so that their history can still be consulted; the types come from `MEDICAL_EVENT_TYPES`.
- **States:** loading, error with the back-end message, and an empty list with a different message with and without filters.
- **Race handling:** only the answer to the latest search is shown, so a slow earlier answer never overwrites a newer one.
- **Navigation:** the **Eventos médicos** item in the navigation bar opens this screen for every role.

**Manual testing:**

1. Open `/medical-events` and verify that every event is listed, newest first, with its pet and veterinarian.
2. Select a pet and a type and press **Buscar**: only the matching events should be listed.
3. Select a day with events and verify that only the events of that day are listed.
4. Combine filters with no matches and verify the "no matches" message.
5. Press **Limpiar filtros** and verify that every event is listed again.
6. Click the title of an event and verify that its detail opens.

### HU06 – Register a Pet

**Route:** `/pets/new` · **Role:** shelter administrator

The administrator registers a pet under their shelter, including at least one **arrival event** (date, type, and description). All fields are required except description, temperament, and specific needs. The admission date cannot be in the future. Fixed option lists (species, sex, size, etc.) live in `src/constants/petOptions.js` and will also be used by the HU07 filters. Photos are sent as links (see [Known limitation](#known-limitation--no-shelter-photos)).

- **Back-end:** `POST /api/pets`, with the shelter sent as `shelter.id` and arrival events included in `medicalEvents`; photos through `POST /api/pets/{petId}/photos`.
- **Validation:** first on the client (errors next to each field, focus moved to the first invalid field), then by the back-end. Back-end errors appear next to the matching field or in an alert, and the form keeps the entered data.
- **Result:** confirmation message and redirect to `/pets/{id}` (profile pending, HU08).

**Manual testing:**

1. Create a shelter in the back-end (a responsible user is required; see [Troubleshooting](#troubleshooting)). If its ID is not `1`, set `VITE_SHELTER_ID`.
2. Open `/pets/new` and submit the empty form. Validation errors should appear, and focus should move to the first invalid field.
3. Enter a future admission date. The form should reject it.
4. Register a pet with all required data. A confirmation should appear, and the app should navigate to `/pets/{id}`.
5. Check `GET /api/pets` to verify the pet was saved with its shelter and arrival event.
6. Register the same pet again. A duplicate error should be displayed.

### HU01 – Register a Shelter

**Route:** `/shelters/new` · **Role:** shelter administrator

The administrator registers a shelter with its **name, city, NIT, and address**. All fields are required. They are validated on the client first and then by the back-end (for example, an NIT already registered is reported next to the NIT field). On success, the user is redirected to `/shelters/{id}` (detail page pending). The creator is sent as `users: [{ id }]` and becomes the shelter's administrator.

- **Back-end:** `POST /api/shelters`.
- **Errors:** field-related back-end errors (missing city, duplicated NIT) are shown next to the field, with focus moved to it. Any other error (same name, city, and location, or a connection failure) is shown in an error dialog. In both cases the form keeps the entered data.

**Manual testing:**

1. Open `/shelters/new` and submit the empty form. Validation errors should appear, and focus should move to the first invalid field.
2. Fill in name, city, NIT, and address, and submit. A confirmation should appear, and the app should navigate to `/shelters/{id}`.
3. Check `GET /api/shelters` to verify the shelter was saved with its responsible user.
4. Register the same shelter again. The back-end error should be displayed.
5. Stop the back-end and submit. A connection error dialog should be displayed.

#### Known limitation – no shelter photos

The shelter form does not upload photos. The project description mentions photos and videos of the premises, but the back-end does not expose an endpoint to attach photos to a shelter:

- The data model supports it (`PhotoEntity` has a `shelter` relation, `PhotoService` can attach a photo to a shelter, and `GET /api/shelters` returns a `photos` list), but no controller publishes that capability.
- The only photo endpoint is `/api/pets/{petId}/photos` (`PetPhotoController`), which is why photos work for pets (HU06) but not for shelters. The `/api/photos` routes in the `Photo` Postman collection have no controller in the back-end code.
- `POST /api/shelters` receives a `ShelterDTO` (`name`, `city`, `nit`, `location`, `users`) with no photo field.
- The back-end stores a photo as a link (`url`, `type`, `description`), not as a file, so the front-end sends a photo link, the same as in HU06.

Once the back-end publishes a shelter photo endpoint, the feature can be added by reusing `PhotoField` and `utils/photoForm.js` and adding the matching function to `shelterService.js`.

## Reusable Components

| Component | Purpose |
|---|---|
| `Layout` | Page shell with the navigation bar and routed content |
| `Navbar` | Main navigation; shows admin-only links according to the session role |
| `FormSection`, `FormField`, `FormActions` | Building blocks for accessible forms (labels, errors, submit/cancel) |
| `PhotoField` | Photo link input (URL, format, description) shared by pet forms |
| `ScreenState` | Loading, error, and empty states |
| `ModalDialog` | Base accessible modal |
| `SuccessDialog`, `ErrorDialog` | Confirmation and error dialogs built on `ModalDialog` |

## Testing

The project has **automated tests** (Vitest + React Testing Library) and **manual test guides** (in each user story above).

```bash
npm test                                      # Run all tests
npm run test:coverage                         # Run tests with coverage
npx vitest src/pages/PetRegisterPage          # A specific folder, e.g. HU06
npx vitest src/pages/ShelterRegisterPage      # HU01
npx vitest src/pages/VeterinariansPage        # HU70
npx vitest src/pages/MedicalEventRegisterPage # HU23
npx vitest src/pages/MedicalEventHistoryPage  # HU24
npx vitest src/pages/MedicalEventDetailPage   # HU25
npx vitest src/pages/MedicalEventEditPage     # HU26
npx vitest src/components/ConfirmDialog       # HU27 (shared dialog)
npx vitest src/pages/MedicalEventsPage        # HU28
```

Current state: **31 test files, 319 tests, all passing**, with `npm run lint` and `npm run build` clean.

Tests live next to the module they cover:

| Area | Test files |
|---|---|
| **HU70** | `VeterinariansPage.test.jsx`, `VeterinarianProfilePage.test.jsx`, `veterinarianService.test.js` |
| **Veterinarian registration** | `RegisterVeterinarianPage.test.jsx`, `validateVeterinarian.test.js` |
| **HU01** | `ShelterRegisterPage.test.jsx`, `shelterForm.test.js`, `shelterService.test.js` |
| **HU06** | `PetRegisterPage.test.jsx`, `petForm.test.js`, `petService.test.js` |
| **HU23** | `MedicalEventRegisterPage.test.jsx`, `medicalEventForm.test.js` |
| **HU24** | `MedicalEventHistoryPage.test.jsx` |
| **HU25** | `MedicalEventDetailPage.test.jsx`, `medicalEvents.test.js` |
| **HU26** | `MedicalEventEditPage.test.jsx` (and the `statusLabel` case in `SuccessDialog.test.jsx`) |
| **HU27** | `ConfirmDialog.test.jsx`, `MedicalEventDetailPage.test.jsx` (delete and roles), `MedicalEventHistoryPage.test.jsx` (notice), `medicalEvents.test.js` (role rule) |
| **HU28** | `MedicalEventsPage.test.jsx`, `medicalEventService.test.js` (filters and query string) |
| **Shared** | `App.test.jsx`, `FormField`, `FormActions`, `FormSection`, `ModalDialog`, `SuccessDialog`, `ErrorDialog`, `Navbar`, `ScreenState` tests, `photoForm.test.js`, `dates.test.js` |

## Quality: Jenkins and SonarQube

The `Jenkinsfile` defines a pipeline that runs on a Windows agent (`bat` steps) with the Jenkins Node.js tool named `node22`:

| Stage | Command | Purpose |
|---|---|---|
| Checkout | `checkout scm` | Gets the source |
| Install | `npm ci` | Reproducible dependency install |
| Lint | `npm run lint` | ESLint |
| Build | `npm run build` | Verifies that the production build works |
| Testing | `npm run test:coverage` | Runs tests and creates `coverage/lcov.info` |
| Static Analysis | `sonar-scanner` | Sends sources and coverage to SonarQube |

The workspace is deleted at the end of every run (`deleteDir()`).

**SonarQube** (`sonar-project.properties`): project key `MP_202630_G81_E2_Front`, sources in `src`, test files excluded from analysis but used as tests, and coverage read from `coverage/lcov.info`. The server is expected at `http://localhost:9000`.

**Jenkins prerequisites:** a Node.js tool named `node22`, a SonarScanner tool named `sonar-scanner`, and a SonarQube server named `sonarqube` configured in *Manage Jenkins*. The SonarQube **token must be stored as a Jenkins credential**, never in the repository.

### Latest status
<img width="1842" height="878" alt="Captura de pantalla 2026-11-01 212245" src="https://github.com/user-attachments/assets/5260413d-5e80-4f27-9fa5-6a750884d51a" />

### Important Note:
The specifications of state of Jenkis and Sonar of each History User are specified on the Wiki of this repository.

```
