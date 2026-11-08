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
| `VITE_USER_ID` | ID of the active user for simulated session | `1` |

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

Each screen lives in its own folder alongside its CSS Module and tests. Logic that does not depend on React (such as validation and request body construction) is kept in separate modules, such as `UserRegisterPage/userForm.js` or `PetRegisterPage/petForm.js`, so it can be tested independently.

## Application Routes

| Route | Screen | Status |
|---|---|---|
| `/register` | Register a new user (HU73) | Implemented |
| `/profile` | View and edit user profile (HU74) | Implemented |
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
- The **Registrarse** link in the navigation bar allows any visitor to create an account (`/register`).
- Clicking on the user avatar in the navigation bar navigates to `/profile`, where personal information can be reviewed and edited.
- Once authentication is implemented, only the `getSession()` function needs to be replaced.

## Implemented User Stories

| User Story | Description | Route | Status |
|---|---|---|---|
| **HU73** | Register a new user | `/register` | Implemented |
| **HU74** | View and update user profile | `/profile` | Implemented |
| **HU70** | Veterinarian list with filters | `/veterinarians` | Implemented |
| **HU01** | Register a shelter | `/shelters/new` | Implemented |
| **HU02** | View the list of shelters | `/shelters` | Implemented |
| **HU06** | Register a pet | `/pets/new` | Implemented |

### HU73 – Register a New User

**Route:** `/register` · **Role:** Any visitor.

Allows new users to create an account on the pet adoption platform. The form collects **first name, last name, email, phone, password, and password confirmation**.

- **Back-end:** `POST /api/users`.
- **Validation:** Required fields are validated on the client side before submitting. The password must contain at least 8 characters and match the confirmation field.
- **Errors:** Unique email enforcement is validated both locally and by the server (`The email address must be unique in the system`). Server errors display an informative dialog while keeping the user's input.
- **Automated tests:** `UserRegisterPage.test.jsx`, `userForm.test.js`, and `userService.test.js`.

**Manual Testing:**

1. Open `/register` and submit the empty form: validation errors should appear for all required fields.
2. Enter mismatched passwords or a password with fewer than 8 characters: error messages should guide the user.
3. Fill in valid data and submit: a confirmation modal should appear, and upon acceptance, redirect to the platform.
4. Try registering again with the same email address: the server error dialog will inform that the email is already in use.

### HU74 – View and Update User Profile

**Route:** `/profile` · **Role:** Any authenticated user.

Displays the current user's profile information (**name, email, phone, and role**). Allows editing contact information in-place.

- **Back-end:** `GET /api/users/{id}` and `PUT /api/users/{id}`.
- **Editing:** Clicking "Editar Perfil" enables input fields for first name, last name, email, and phone. The user can save updates or cancel to discard unsaved changes.
- **Errors:** If the email address is updated to one that already belongs to another user, an error notification is displayed without overwriting existing data.
- **Automated tests:** `UserProfilePage.test.jsx`, `profileForm.test.js`, and `userService.test.js`.

**Manual Testing:**

1. Navigate to `/profile` by clicking on the user card in the navigation bar.
2. Verify that your name, email, phone, and assigned role are displayed.
3. Click "Editar Perfil", modify contact details, and click "Cancelar": changes are safely discarded.
4. Click "Editar Perfil", make valid updates, and click "Guardar Cambios": a confirmation modal verifies that changes were saved successfully.

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

**Route:** `/shelters` · **Role:** Any user.

Displays all registered shelters. Allows filtering by **city** and **location** simultaneously.

- **Back-end:** `GET /api/shelters?city=&location=`.
- **States:** Loading, error, and empty state with option to clear filters.

### HU01 – Register a Shelter

**Route:** `/shelters/new` · **Role:** Shelter administrator.

The administrator registers a shelter by providing its **name, city, NIT, and address**. All fields are required. They are validated on the client side first and then by the back-end.

- **Back-end:** `POST /api/shelters`.

### HU06 – Register a Pet

**Route:** `/pets/new` · **Role:** Shelter administrator.

Registers a pet under the administrator's shelter, including its arrival event and photo links.

- **Back-end:** `POST /api/pets` and `POST /api/pets/{petId}/photos`.

## Testing

The project includes both **automated** and **manual tests**.

```bash
npm test                       # Run all tests
npm run test:coverage          # Run tests with coverage
npx vitest src/pages/UserRegisterPage     # Run tests for HU73
npx vitest src/pages/UserProfilePage      # Run tests for HU74
npx vitest src/pages/PetRegisterPage      # HU06
npx vitest src/pages/ShelterRegisterPage  # HU01
```

**Automated Tests** (Vitest + React Testing Library) are located alongside their corresponding modules:

- **HU73:** `UserRegisterPage.test.jsx`, `userForm.test.js`, and `userService.test.js`.
- **HU74:** `UserProfilePage.test.jsx`, `profileForm.test.js`, and `userService.test.js`.
- **HU70:** `VeterinariansPage.test.jsx`, `VeterinarianProfilePage.test.jsx`, and `veterinarianService.test.js`.
- **HU01:** `ShelterRegisterPage.test.jsx`, `shelterForm.test.js`, and `shelterService.test.js`.
- **HU02:** `ShleterListPage.test.jsx` and `shelterService.test.js`.
- **HU06:** `PetRegisterPage.test.jsx`, `petForm.test.js`, and `petService.test.js`.
- **Shared:** `FormField.test.jsx`, `Navbar.test.jsx`, `ScreenState.test.jsx`, and `dates.test.js`.

**Manual Tests:** The steps are described in each user story section.
