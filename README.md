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
| **HU06** | Register a pet | `/pets/new` | Implemented |
| HU07 | Advanced pet search | `/pets` | Pending |
| HU08 | Pet profile | `/pets/:petId` | Pending |

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

### HU06 – Register a Pet

**Route:** `/pets/new` · **Role:** Shelter administrator.

The administrator registers a pet under their shelter, including at least one **arrival event** (date, type, and description).

All pet fields are required except for description, temperament, and specific needs. The admission date cannot be in the future. Fixed option lists (species, sex, size, etc.) are defined in `src/constants/petOptions.js` and are also used by the HU07 filters.

- **Back-end:** `POST /api/pets`, with the shelter sent as `shelter.id` and arrival events included in `medicalEvents`.
- **Validation:** First performed on the client side (errors displayed next to each field and focus moved to the first invalid field), then validated by the back-end. Back-end error messages are displayed next to the corresponding field or in an alert, and the form preserves the entered data.
- **Result:** A confirmation message is displayed, and the user is redirected to `/pets/{id}` (pet profile pending implementation, HU08).
- **Permissions:** Only the shelter administrator can see **Register Pet** in the navigation bar.

> Optional: If your version includes the photo feature, the photo is optional and is submitted as a link using `POST /api/pets/{id}/photos`, since the back-end stores the link rather than the actual file. If the photo upload fails, the pet registration is not rolled back. Remove this note if it does not apply.

**Manual Testing:**

1. Create a shelter in the back-end (a responsible user is required; see [Troubleshooting](#troubleshooting)). If its ID is not `1`, configure `VITE_SHELTER_ID`.
2. Open `/pets/new` and submit the empty form. Validation errors should appear, and focus should move to the first invalid field.
3. Enter a future admission date. The form should reject it.
4. Register a pet with all required information. A confirmation message should appear, and the application should navigate to `/pets/{id}`.
5. Check `GET /api/pets` to verify that the pet was saved with its shelter and arrival event.
6. Try registering the same pet again. A duplicate error should be displayed.

## Testing

The project includes both **automated** and **manual tests**.

```bash
npm test                       # Run all tests
npm run test:coverage           # Run tests with coverage
npx vitest src/pages/PetRegisterPage   # Run tests for a specific folder, e.g. HU06
```

**Automated Tests** (Vitest + React Testing Library) are located alongside their corresponding modules:

- **HU70:** `VeterinariansPage.test.jsx`, `VeterinarianProfilePage.test.jsx`, and `veterinarianService.test.js`.
- **HU06:** `PetRegisterPage.test.jsx` (full screen), `petForm.test.js` (validation and request body), and `petService.test.js`.
- **Shared:** `FormField.test.jsx`, `Navbar.test.jsx`, `ScreenState.test.jsx`, and `dates.test.js`.

**Manual Tests:** The steps are described in each user story section.

## Quality: Jenkins and SonarQube

Screenshots from **[30/10/2026]**, commit **[76fdc11]**.

**Jenkins**

![Jenkins pipeline results](/img/jenkis3010.png)

**SonarQube**

![SonarQube analysis results](/img/sonar3010.png)
