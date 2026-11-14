# Pets – Front-end

Web application for managing pet adoptions. This project was developed for the **Programming Models** course at Universidad Distrital Francisco José de Caldas, group **G81**, team **E2**.

The front-end consumes the REST API provided by the back-end (Spring Boot), developed during Cycle 1.

## Table of Contents

1. [Team](#team)
2. [Technologies](#technologies)
3. [Requirements](#requirements)
4. [Installation and Setup](#installation-and-setup)
5. [Environment Variables](#environment-variables)
6. [Scripts](#scripts)
7. [Project Structure](#project-structure)
8. [Application Routes](#application-routes)
9. [Simulated User and Role](#simulated-user-and-role)
10. [Implemented User Stories](#implemented-user-stories)
11. [Testing](#testing)
12. [Quality: Jenkins and SonarQube](#quality-jenkins-and-sonarqube)
13. [Git Workflow](#git-workflow)
14. [Troubleshooting](#troubleshooting)

## Team

| Team Member |
|---|
| Ardila Duran, Camilo Andrés |
| Escobar Barrios, Alejandro |
| Leal Rivera, Anggel Felipe |
| Nossa Orjuela, Isabella |
| Sandoval Rodríguez, Luna Alejandra |

## Technologies

- **React** with **Vite**
- JavaScript (JSX)
- **React Router** for navigation
- **CSS Modules** for styling
- **Vitest** and **React Testing Library** for automated testing
- **ESLint** for code style analysis
- **Jenkins** and **SonarQube** for continuous integration and code quality analysis

## Requirements

- **Node.js 20 or higher** (with npm)
- **Git**
- The platform's **back-end** running (Spring Boot, requires JDK 21)
- Optional: **Postman** for creating test data in the back-end

## Installation and Setup

1. Start the back-end. The API context path is `/api`; by default, it runs at `http://localhost:8080/api`. Data is stored in an **in-memory H2 database**, so it is lost whenever the application restarts.
2. Create the test data required by the user story you want to test, such as a shelter or some veterinarians (see [Troubleshooting](#troubleshooting)).
3. Clone the repository and install the front-end dependencies:

   ```bash
   git clone <FRONT-END REPOSITORY URL>
   cd MP_202630_G81_E2_Front
   npm ci
   ```

4. If your back-end is **not** running at `http://localhost:8080`, create a `.env` file (see [Environment Variables](#environment-variables)).
5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the URL displayed by Vite (usually `http://localhost:5173`).

As long as `VITE_API_BASE_URL` is not defined, Vite forwards requests from `/api` to `http://localhost:8080` (see `vite.config.js`).

## Environment Variables

Copy `.env` and adjust the values as needed. The `.env` file is local and **must not be committed to Git**.

| Variable | Purpose | Default Value |
|---|---|---|
| `VITE_API_BASE_URL` | Full API URL, for example `http://localhost:8999/api` if the back-end runs on port 8999 | `/api` (proxied to `localhost:8080`) |
| `VITE_SHELTER_ID` | ID of the shelter assigned to the simulated administrator. **It must exist in the back-end.** | `1` |

Automated tests ignore these variables (see `vite.config.js`), so they run successfully regardless of the `.env` configuration.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Generates the production build in `dist/` |
| `npm run lint` | Runs code style analysis with ESLint |
| `npm test` | Runs unit and component tests |
| `npm run test:coverage` | Runs tests and generates a coverage report (`coverage/lcov.info`), which is read by SonarQube |

## Project Structure

```text
src/
├── components/        Reusable components
├── config/
├── constants/
├── pages/             One folder per screen (component, styles, and tests)
├── services/
└── utils/
```

Each screen lives in its own folder alongside its CSS Module and tests. Logic that does not depend on React (such as validation and request body construction) is kept in separate modules, such as `PetRegisterPage/petForm.js`, so it can be tested independently.

## Application Routes

| Route | Screen | Status |
|---|---|---|
| `/veterinarians` | Veterinarian list with filters (HU70) | Implemented |
| `/veterinarians/:veterinarianId` | Veterinarian profile (HU70) | Implemented |
| `/shelters` | Shelter list with filters (HU02) | Implemented |
| `/shelters/new` | Register a shelter (HU01) | Implemented |
| `/shelters/:shelterId` | Shelter detail (HU03) | Placeholder, pending |
| `/pets/new` | Register a pet (HU06) | Implemented |
| `/pets` | Pet search (HU07) | Placeholder, pending |
| `/pets/:petId` | Pet profile (HU08) | Placeholder, pending |
| `/notifications` | Notifications | Placeholder, pending |

The `/` route redirects to `/veterinarians`.

## Simulated User and Role

The back-end does not yet implement authentication. For now, the user and their role are simulated in `src/config/session.js`: the default user is **AdminUser**, a shelter administrator, and their shelter is configured through `VITE_SHELTER_ID`.

- Only the **shelter administrator** can see the **Register Pet** option in the navigation bar and access `/pets/new`. Any other role receives a message explaining that they do not have permission.
- Once authentication is implemented, only the `getSession()` function needs to be replaced.

## Implemented User Stories

| User Story | Description | Route | Status |
|---|---|---|---|
| **HU70** | Veterinarian list with filters | `/veterinarians` | Implemented |
| **HU01** | Register a shelter | `/shelters/new` | Implemented |
| **HU02** | View the list of shelters | `/shelters` | Implemented |
| **HU06** | Register a pet | `/pets/new` | Implemented |

### HU70 – Veterinarian List with Filters

**Route:** `/veterinarians` · **Profile:** `/veterinarians/:veterinarianId`

Shelter users can view veterinarians along with their **name, specialization, and availability**. They can filter the list by specialization and/or availability using the **Search** button (case-insensitive). If no veterinarians match the selected filters, a message informs the user that no results were found.

Opening a veterinarian's profile also displays their **follow-ups** and **medical events**.

- **Back-end:** `GET /api/veterinarians?specialization=&availability=` and `GET /api/veterinarians/{id}`.
- **States:** loading, error with its cause, and empty list.

**Manual Testing:**

1. Open `/veterinarians` and verify that all registered veterinarians are displayed.
2. Select a specialization and/or availability, click **Search**, and verify that the list is filtered.
3. Select a combination with no matching results and verify that the appropriate message is displayed.
4. Open a veterinarian's profile and verify that their follow-ups and medical events are displayed.
5. Stop the back-end and verify that an error message is displayed.

### HU02 – View the List of Shelters

**Route:** `/shelters` · **Role:** any (visitor, adopter, veterinarian, or shelter administrator).

Shows every registered shelter with its **name, NIT, city, and address**. Selecting a shelter opens its detail page `/shelters/{id}` (HU03, pending implementation).

- **Filters:** two optional filters, **city** and **address**, which can be combined (a shelter must meet every filter provided). They are applied with the **Search** button.
- **Exact match:** the back-end compares the exact text ignoring upper/lower case, not partial matches (for example, `carrera 15 # 85 - 32` finds that address, but `carrera 15` does not). The screen explains this with a help text. Empty filters are not sent to the back-end.
- **Empty states:** `Aún no hay refugios registrados` when there are no shelters, and `No se encontraron refugios con esos filtros` with a **Limpiar filtros** button when the filters match none.
- **Back-end:** `GET /api/shelters?city=&location=`.
- **States:** loading, error with its cause, empty list, and empty result.
- **Automated tests:** `ShelterListPage.test.jsx` and `shelterService.test.js`.

**Manual Testing:**

1. Register two shelters in different cities (HU01) and open `/shelters`. Both should be listed with name, NIT, city, and address.
2. Select a city and click **Search**. Only the shelters in that city should remain.
3. Type an address exactly as registered (any casing) and click **Search**. Only that shelter should remain. Type only part of it: no shelter should be found.
4. Combine city and address with a mismatch. The message `No se encontraron refugios con esos filtros` and the **Limpiar filtros** button should appear; clicking it restores the full list.
5. With an empty database, the message `Aún no hay refugios registrados` should appear.
6. Click a shelter. The application should navigate to `/shelters/{id}`.
7. Stop the back-end and search again. An error message should be displayed.

### HU06 – Register a Pet

**Route:** `/pets/new` · **Role:** Shelter administrator.

The administrator registers a pet under their shelter, including at least one **arrival event** (date, type, and description).

All pet fields are required except for description, temperament, and specific needs. The admission date cannot be in the future. Fixed option lists (species, sex, size, etc.) are defined in `src/constants/petOptions.js` and are also used by the HU07 filters.

- **Back-end:** `POST /api/pets`, with the shelter sent as `shelter.id` and arrival events included in `medicalEvents`.
- **Validation:** First performed on the client side (errors displayed next to each field and focus moved to the first invalid field), then validated by the back-end. Back-end error messages are displayed next to the corresponding field or in an alert, and the form preserves the entered data.
- **Result:** A confirmation message is displayed, and the user is redirected to `/pets/{id}` (pet profile pending implementation, HU08).
- **Permissions:** Only the shelter administrator can see **Register Pet** in the navigation bar.


**Manual Testing:**

1. Create a shelter in the back-end (a responsible user is required; see [Troubleshooting](#troubleshooting)). If its ID is not `1`, configure `VITE_SHELTER_ID`.
2. Open `/pets/new` and submit the empty form. Validation errors should appear, and focus should move to the first invalid field.
3. Enter a future admission date. The form should reject it.
4. Register a pet with all required information. A confirmation message should appear, and the application should navigate to `/pets/{id}`.
5. Check `GET /api/pets` to verify that the pet was saved with its shelter and arrival event.
6. Try registering the same pet again. A duplicate error should be displayed.

### HU01 – Register a Shelter

**Route:** `/shelters/new` · **Role:** Shelter administrator.

The administrator registers a shelter by providing its **name, city, NIT, and address**. All fields are required. They are validated on the client side first and then by the back-end (for example, an NIT already registered for another shelter is reported next to the NIT field). On success, the user is redirected to `/shelters/{id}` (detail page pending). The creator is sent as `users: [{ id }]` and becomes the shelter's administrator.

- **Back-end:** `POST /api/shelters`.
- **Errors:** Back-end errors tied to a field (for example, a missing city or an NIT already registered) are shown next to that field and the focus moves to it. Any other error, such as a shelter with the same name, city, and location or a connection failure, is shown in an error dialog; in both cases the form keeps the entered data.
- **Automated tests:** `ShelterRegisterPage.test.jsx`, `shelterForm.test.js`, and `shelterService.test.js` (see [Testing](#testing)).

**Manual Testing:**

1. Open `/shelters/new` and submit the empty form. Validation errors should appear, and focus should move to the first invalid field.
2. Fill in name, city, NIT, and address, and submit. A confirmation message should appear, and the application should navigate to `/shelters/{id}`.
3. Check `GET /api/shelters` to verify that the shelter was saved with its responsible user.
4. Register the same shelter again. The back-end error should be displayed.
5. Stop the back-end and submit. A connection error dialog should be displayed.

**Known limitation – no photo upload:** The shelter registration form does not allow uploading photos. The project description mentions photos and videos of the premises, but this is not available in the current iteration because the back-end does not expose an endpoint to attach photos to a shelter:

- The data model supports it: `PhotoEntity` has a `shelter` relation, `PhotoService` can attach a photo to a shelter, and `GET /api/shelters` and `GET /api/shelters/{id}` return a `photos` list. However, no controller publishes that capability.
- The only photo endpoint available is `/api/pets/{petId}/photos` (`PetPhotoController`), which is why photos work for pets (HU06) but not for shelters. The `/api/photos` routes that appear in the `Photo` Postman collection have no controller in the back-end code.
- `POST /api/shelters` receives a `ShelterDTO` (`name`, `city`, `nit`, `location`, and `users`), which has no photo field, so photos cannot be sent while creating the shelter either.
- The back-end stores a photo as a link (`url`, `type`, `description`) and not as a file, so even when the endpoint exists, the front-end would send a photo link, the same as in HU06.

Once the back-end publishes a shelter photo endpoint, the feature can be added by reusing `PhotoField` and `photoForm.js` and creating the corresponding function in `shelterService.js`.

## Testing

The project includes both **automated** and **manual tests**.

```bash
npm test                       # Run all tests
npm run test:coverage           # Run tests with coverage
npx vitest src/pages/PetRegisterPage   # Run tests for a specific folder, e.g. HU06
npx vitest src/pages/ShelterRegisterPage   # HU01
```

**Automated Tests** (Vitest + React Testing Library) are located alongside their corresponding modules:

- **HU70:** `VeterinariansPage.test.jsx`, `VeterinarianProfilePage.test.jsx`, and `veterinarianService.test.js`.
- **HU01:** `ShelterRegisterPage.test.jsx` (full screen), `shelterForm.test.js` (validation and request body), and `shelterService.test.js`.
- **HU06:** `PetRegisterPage.test.jsx` (full screen), `petForm.test.js` (validation and request body), and `petService.test.js`.
- **Shared:** `FormField.test.jsx`, `Navbar.test.jsx`, `ScreenState.test.jsx`, and `dates.test.js`.

**Manual Tests:** The steps are described in each user story section.
