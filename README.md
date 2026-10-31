# Pets – Front-end (G81 · E2)

Web application to manage pet adoptions. Universidad Distrital, group 81, team 2.

## Technologies

- React + Vite
- JavaScript (JSX)
- React Router
- CSS Modules
- Vitest and React Testing Library

## Requirements

- Node.js compatible with the Vite version defined in `package.json`.
- Spring Boot backend running at `http://localhost:8080`.

## Installation and execution

```bash
npm ci
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`). The Vite configuration forwards `/api` requests to `http://localhost:8080`.

## Scripts

```bash
npm test
npm run test:coverage
npm run lint
npm run build
```

## Automated test evidence

Automated tests run in a Jenkins pipeline (install, lint, build, tests with coverage and static analysis), and the quality results are reviewed in SonarQube.

Screenshots from [DD/MM/YYYY], commit `[hash]`.

### Jenkins

![Jenkins: pipeline stages](docs/jenkins-stages.png)

### SonarQube

![SonarQube: project overview](docs/sonar-resumen.png)

## HU70 – View the list of veterinarians with filters

Routes: `/veterinarians` (list) and `/veterinarians/:veterinarianId` (profile).

The screen shows veterinarians as cards with their name, specialty and availability, and lets the user filter them with the "Especialización" and "Disponibilidad" lists (the "Todas" option is selected by default) and the SEARCH button. If none match, an informative message is shown, and opening a veterinarian's profile shows their follow-ups and medical events.

### Integration status

The service (`veterinarianService.js`) consumes the backend endpoints `GET /api/veterinarians` and `GET /api/veterinarians/{id}`. Backend errors (`apierror.message`) are shown in an alert.

### Running the tests

```bash
npx vitest src/pages/VeterinariansPage src/pages/VeterinarianProfilePage
```

### Manual integration tests

1. `/veterinarians` lists all registered veterinarians.
2. Choosing a specialization and/or an availability and pressing SEARCH shows only the matching ones.
3. A filter with no matches shows "No se encontraron veterinarios con los filtros indicados.".
4. Choosing "Todas" again and pressing SEARCH shows all veterinarians again.
5. **Ver perfil** opens the detail with follow-ups and medical events.
6. With a non-existent id (`/veterinarians/999999`), "Veterinarian not found" is shown.

## HU71 – Register a veterinarian at the shelter

Route: `/veterinarians/new` (reached with the **Registrar veterinario** button on the veterinarians list).

The "Registre un veterinario" form asks for first name, last name, email, phone, specialization and availability (all required). When REGISTRAR is pressed, the form is validated on the client, the veterinarian is created and the user is taken back to the list with a confirmation message.

### Integration status

The service (`veterinarianService.js`) consumes `POST /api/veterinarians`. If the backend rejects the registration (for example, "Two veterinarians cannot be associated with the same user; this user already exists" when the email is already registered, or "The shelter must be an existing shelter"), the message is shown in an alert and the form keeps what the user typed.

### Running the tests

```bash
npx vitest src/pages/RegisterVeterinarianPage src/services
```

### Manual integration tests

1. On `/veterinarians`, pressing **Registrar veterinario** opens the form.
2. Pressing REGISTRAR with an empty form shows the message for each missing field and sends nothing.
3. An email without a valid format (`camila`) or a phone with fewer than 7 digits shows its message.
4. With every field filled in, REGISTRAR creates the veterinarian, goes back to `/veterinarians` and shows "Veterinario/a Camila Rojas registrado/a correctamente.", with the new veterinarian in the list.
5. Registering another veterinarian with the same email shows the backend error and keeps the form data.