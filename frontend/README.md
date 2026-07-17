# SECompass Web Frontend

SECompass Web Frontend is the React client for the SECompass career development platform. It provides the primary browser experience for learners and administrators, including career exploration, personal roadmap management, skill gap analysis, AI mentor chat, portfolio management, market trend reporting, and operational admin tools.

The application is built as a modern single-page application with Vite, React, TypeScript, REST, and GraphQL integrations.

## Business Context

SECompass helps software engineering learners understand career options, choose structured development paths, and maintain evidence of their learning progress. The web client is the broadest product surface in the platform and supports both learner-facing and administrative workflows.

Core business capabilities:

- Public landing, authentication, career catalog, roadmap catalog, and public portfolio pages.
- Learner dashboard with roadmap progress and career development actions.
- Personal roadmap creation, visualization, progress tracking, and sharing.
- AI mentor chat for career and learning support.
- Skill gap analysis against selected career roadmaps.
- Market Pulse views for job trend insights.
- GitHub portfolio and public portfolio management.
- Admin management for users, career roles, roadmap templates, nodes, skills, resources, job trends, system configuration, and reports.

## Technology Stack

- React 19 and TypeScript for the application UI.
- Vite for local development and production builds.
- React Router for public, authenticated, and admin route layers.
- TanStack Query for server-state workflows.
- Apollo Client for GraphQL reads.
- Axios for REST API requests.
- Zustand for authentication state.
- Tailwind CSS 4 for styling.
- React Flow for roadmap canvas visualization.
- Recharts for reporting and charting.
- Lucide React for iconography.
- Sonner and custom app toast components for user feedback.
- Google OAuth provider for Google sign-in integration.

## Prerequisites

Install the following before working on the frontend:

- Node.js
- npm
- A running SECompass backend API
- A Google OAuth client ID when testing Google login

Check your local tooling:

```powershell
node --version
npm --version
```

## Project Structure

```text
frontend/
  public/                  Static public assets
  src/
    app/
      components/          Shared app, admin, layout, feedback, and roadmap UI
      pages/               Public, learner, admin, catalog, and reference pages
      App.tsx              React Router provider wrapper
      routes.tsx           Route definitions and route protection layers
    assets/                Bundled static assets
    constants/             Shared constants
    graphql/               GraphQL query documents
    lib/                   Axios, Apollo, auth mapping, redirects, and query client
    store/                 Zustand auth store
    styles/                Global style and font assets
    types/                 Shared API DTO TypeScript types
    main.tsx               Application bootstrap and provider setup
  index.html               Vite HTML entry
  package.json             Scripts and dependencies
  vite.config.ts           Vite configuration
  vercel.json              SPA rewrite configuration for Vercel-style hosting
```

## Application Architecture

The web client is organized around product surfaces rather than technical layers only. Shared infrastructure lives in `src/lib`, global state lives in `src/store`, route-level screens live in `src/app/pages`, and reusable UI lives in `src/app/components`.

Important architectural points:

- `src/main.tsx` bootstraps React, Google OAuth, and the application shell.
- `src/app/routes.tsx` defines public routes, authenticated learner routes, admin routes, and legacy redirects.
- `src/app/components/ProtectedRoute.tsx` guards authenticated learner pages.
- `src/app/components/AdminRoute.tsx` guards admin pages.
- `src/lib/axios.ts` configures REST requests, bearer-token injection, refresh-token retry, and logout redirect on expired sessions.
- `src/lib/apollo.ts` configures GraphQL requests, authorization headers, GraphQL auth-error handling, and token refresh.
- `src/store/authStore.ts` owns frontend authentication state.
- `src/graphql/queries.ts` contains GraphQL query documents used by the client.
- `src/types/api.ts` contains shared API DTO types.

## Routing Overview

Public routes:

- `/`
- `/login`
- `/register`
- `/portfolio/:username`
- `/reference/node-progress`
- `/reference/ui`
- `/explore/career-roles`
- `/explore/career-roles/:id`
- `/explore/roadmaps/:id`
- `/career-roadmap/:id`

Authenticated learner routes:

- `/dashboard`
- `/roadmaps`
- `/roadmap/:id`
- `/shared-roadmap/:id`
- `/mentor`
- `/skill-gap`
- `/market`
- `/portfolio`
- `/settings`
- `/career-roles`
- `/career-roles/:id`
- `/roadmaps/:id`

Legacy authenticated aliases:

- `/app/career-roles`
- `/app/career-roles/:id`
- `/app/roadmaps/:id`
- `/browse/career-roles`
- `/browse/career-roles/:id`
- `/browse/career-roadmap/:id`

Admin routes:

- `/admin`
- `/admin/users`
- `/admin/career-roles`
- `/admin/roadmaps`
- `/admin/nodes`
- `/admin/technical-skills`
- `/admin/learning-resources`
- `/admin/job-trends`
- `/admin/config`
- `/admin/reports`

## Backend Integration

The frontend communicates with the SECompass backend through both REST and GraphQL.

Default local backend:

```text
https://localhost:7210
```

GraphQL endpoint:

```text
https://localhost:7210/graphql
```

REST requests are made through `apiClient` in `src/lib/axios.ts`. GraphQL requests are made through `apolloClient` in `src/lib/apollo.ts`.

Both clients attach the current bearer token when available. When the backend returns an authentication failure, the frontend attempts to refresh the session. If refresh fails, auth state is cleared and the user is redirected to `/login`.

## Environment Configuration

Create `frontend/.env` for local development:

```env
VITE_API_URL=https://localhost:7210
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Base URL for REST requests and GraphQL endpoint construction. |
| `VITE_GOOGLE_CLIENT_ID` | Required for Google login | Google OAuth client ID passed to `GoogleOAuthProvider`. |

The backend CORS policy must allow the frontend origin. For local Vite development, configure the backend with:

```text
Cors__AllowedOrigins=http://localhost:5173
```

Do not commit production credentials or secret values into `.env` files.

## Local Development Setup

From the `frontend` directory:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Vite serves the app at:

```text
http://localhost:5173
```

Run linting:

```powershell
npm run lint
```

Build production assets:

```powershell
npm run build
```

Preview the production build locally:

```powershell
npm run preview
```

## Available Scripts

```powershell
npm run dev      # Start the Vite development server
npm run build    # Type-check with tsc and build production assets
npm run lint     # Run ESLint across the project
npm run preview  # Serve the built application locally
```

## Development Workflow

Recommended workflow for feature development:

1. Confirm the backend contract, DTO shape, and route requirements.
2. Add or update shared API types in `src/types/api.ts`.
3. Add REST calls, GraphQL queries, or TanStack Query hooks near the relevant product surface.
4. Build route-level page behavior in `src/app/pages`.
5. Extract reusable UI into `src/app/components` only when it serves more than one screen or keeps a large page maintainable.
6. Include loading, empty, error, and success states.
7. Validate auth behavior for protected or admin-only flows.
8. Run `npm run lint` and `npm run build`.
9. Smoke test the affected routes in the browser.

## Coding Standards

- Keep route-level screens in `src/app/pages`.
- Keep reusable UI in `src/app/components`.
- Keep API client infrastructure in `src/lib`.
- Keep authentication state in `src/store/authStore.ts`.
- Prefer typed API DTOs from `src/types/api.ts`.
- Keep REST and GraphQL calls behind shared clients so auth and refresh behavior remain consistent.
- Use existing layout, navigation, dialog, toast, card, chip, and admin list components before introducing new patterns.
- Ensure every async user flow has loading and failure states.
- Avoid hard-coded backend URLs in source code; use `VITE_API_URL`.
- Avoid committing generated build output, local logs, or local environment files.

## Quality Gates

Run these commands before merging frontend changes:

```powershell
npm install
npm run lint
npm run build
```

Recommended manual checks:

- Open the landing page.
- Register and log in.
- Confirm Google login renders when configured.
- Open dashboard, roadmap list, roadmap canvas, and shared roadmap routes.
- Run skill gap analysis.
- Start or resume an AI mentor conversation.
- Open Market Pulse.
- Update portfolio data and check the public portfolio route.
- Log out and confirm protected routes redirect to `/login`.
- Log in as an admin user and verify admin route access.

## Deployment Notes

The app builds static assets into `dist`.

```powershell
npm run build
```

The included `vercel.json` rewrites all routes to `index.html`, which is required for browser refreshes and direct links in a client-side routed SPA:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

For any static hosting provider, configure equivalent SPA fallback behavior so routes like `/dashboard`, `/portfolio/:username`, and `/admin/users` resolve correctly.

Production deployments must provide:

- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`
- SPA fallback to `index.html`
- HTTPS
- Backend CORS allowance for the production frontend origin

## Troubleshooting

API calls fail with CORS errors:

- Confirm `Cors__AllowedOrigins` on the backend includes the exact frontend origin.
- Confirm protocol, host, and port match. `http://localhost:5173` and `https://localhost:5173` are different origins.

API calls fail because of local HTTPS certificates:

- Trust the ASP.NET Core development certificate:

```powershell
dotnet dev-certs https --trust
```

- Restart the browser and backend after trusting the certificate.

Google login does not render:

- Confirm `VITE_GOOGLE_CLIENT_ID` is present.
- Confirm the OAuth client allows `http://localhost:5173` during local development.
- Restart the Vite dev server after changing `.env`.

Authenticated requests redirect to login:

- Confirm the backend is returning valid access and refresh tokens.
- Check browser storage for auth state.
- Confirm `/api/auth/refresh` is reachable.
- Confirm the token issuer, audience, and signing key match backend configuration.

Direct links return 404 in production:

- Configure SPA fallback rewrites to `index.html`.
- Confirm the hosting provider is deploying the contents of `dist`.

Changes to `.env` do not apply:

- Stop and restart `npm run dev`.
- Confirm variables are prefixed with `VITE_`.

Build fails with TypeScript errors:

- Run `npm run build` locally and fix reported type errors.
- Confirm DTO types match backend responses.

## Security Notes

- Frontend environment variables are bundled into browser assets and are not secrets.
- Do not place private keys, server secrets, database credentials, or backend signing keys in frontend files.
- Treat access tokens as sensitive client-side state.
- Keep admin routes protected by both frontend route guards and backend authorization checks.
- Always enforce authorization on the backend; frontend route guards are a user-experience layer, not a security boundary.

## Related Projects

- Backend API: `../backend/src/SECompass`
- Mobile client: `../mobile`
- Root project documentation: `../README.md`
