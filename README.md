# Task Manager Monorepo

This repository contains a full-stack Task Manager application built as a monorepo. It serves as an example demonstrating the principles of **Domain-Driven Design (DDD)** and **Clean Architecture** within a modern web development stack.

## Core Concepts

The backend application strictly adheres to Clean Architecture principles, promoting separation of concerns, testability, and maintainability. Key architectural elements include:

*   **Domain Layer (`apps/backend/src/core/domain`):** Contains the core business logic, entities (like `Task` in `apps/backend/src/core/domain/task/task.entity.ts`), and repository interfaces (`apps/backend/src/core/domain/task/task.repository.ts`). This layer is independent of frameworks and infrastructure details.
*   **Application Layer (`apps/backend/src/core/application`):** Orchestrates the use cases (e.g., `AddTaskUseCase` in `apps/backend/src/core/application/task/use-cases/add-task.usecase.ts`) of the application. It depends on the Domain layer but remains independent of UI and infrastructure specifics. It defines DTOs (`apps/backend/src/core/application/task/dtos/task.dto.ts`) for data transfer.
*   **Infrastructure Layer (`apps/backend/src/infrastructure`):** Implements external concerns like database access (e.g., `FirebaseTaskRepository` in `apps/backend/src/infrastructure/persistence/firebase/repositories/firebase-task.repository.ts`), authentication services (`apps/backend/src/infrastructure/auth/firebase-auth.service.ts`), etc. It depends on interfaces defined in the Application/Domain layers.
*   **Presentation Layer (`apps/backend/src/presentation`):** Handles incoming requests (e.g., REST API using Express in `apps/backend/src/presentation/api/controllers/task.controller.ts` and `apps/backend/src/presentation/api/routes/task.routes.ts`) and outgoing responses, interacting with the Application layer via use cases.

This structure ensures that the core business logic is isolated and can evolve independently of the delivery mechanism or data storage technology.

## Technology Stack

*   **Monorepo Management:** pnpm workspaces
*   **Backend:**
    *   Runtime: Node.js
    *   Framework: Express.js
    *   Language: TypeScript
    *   Database: Firebase Firestore
    *   Authentication: Firebase Authentication (using Service Account)
    *   API Validation: Zod
    *   Logging: Pino
    *   Architecture: DDD, Clean Architecture
*   **Frontend:**
    *   Framework: Angular
    *   Language: TypeScript
    *   UI Components: Angular Material
    *   State Management: RxJS, Angular Signals
*   **Tooling:**
    *   Linting: ESLint
    *   Formatting: Prettier
    *   Testing: Jest (Backend - assumed from `package.json`), Karma/Jasmine (Frontend - standard Angular)

## Project Structure
```
├── apps
│ ├── backend # Node.js/Express backend application
│ │ ├── src
│ │ │ ├── config # Environment, Firebase config
│ │ │ ├── core # Domain and Application layers
│ │ │ ├── infrastructure # Persistence, Auth services
│ │ │ ├── presentation # API controllers, routes, middleware
│ │ │ └── shared # Logging, error handling utils
│ │ ├── .env.example # Example environment variables
│ │ └── ...
│ └── frontend # Angular frontend application
│ ├── src
│ │ ├── app
│ │ │ ├── core # Core services (Auth, Task), models
│ │ │ ├── features # Feature modules (Tasks, Auth)
│ │ │ └── shared # Shared components, directives
│ │ ├── assets
│ │ └── environments # Environment config (dev, prod)
│ └── ...
├── package.json # Root package file for monorepo scripts
├── pnpm-workspace.yaml # Defines pnpm workspace packages
└── tsconfig.base.json # Base TypeScript configuration
```

## Deployment

The application is deployed to Firebase Cloud Run and Firebase Hosting.

Live demo: https://task-manager-db-37545.web.app

## Getting Started

### Prerequisites

*   Node.js (LTS version recommended)
*   pnpm (Package manager)
*   Firebase Project:
    *   Enable Firestore database.
    *   Enable Firebase Authentication (Email/Password or other providers as needed).
    *   Generate a Service Account key file (`GOOGLE_APPLICATION_CREDENTIALS`).

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd task-manager
    ```
2.  Install dependencies for all packages:
    ```bash
    pnpm install
    ```

### Configuration

1.  **Backend:**
    *   Navigate to the backend directory: `cd apps/backend`
    *   Copy the example environment file: `cp .env.example .env`
    *   Edit the `.env` file:
        *   Set `GOOGLE_APPLICATION_CREDENTIALS` to the **absolute path** of your downloaded Firebase service account JSON key file.
        *   Adjust `PORT`, `LOG_LEVEL`, `CORS_ORIGIN` (if your frontend runs on a different port/domain), and `SESSION_COOKIE_EXPIRES_IN_MS` as needed.
    *   Return to the root directory: `cd ../..`
2.  **Frontend:**
    *   Navigate to the frontend directory: `cd apps/frontend`
    *   Configure Firebase for the client-side in `src/environments/environment.ts` and potentially `src/environments/environment.prod.ts`. You'll need your Firebase project's web configuration details (apiKey, authDomain, projectId, etc.).
    *   Ensure the `apiUrl` in the environment files points to your running backend (e.g., `http://localhost:3000/api` if using the default backend port).
    *   Return to the root directory: `cd ../..`

### Running the Applications

Run both the backend and frontend development servers concurrently from the **root directory**:
