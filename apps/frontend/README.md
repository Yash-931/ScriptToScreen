# ScriptToScreen: frontend

React app for ScriptToScreen. Sign in, then turn a short script and a character photo into storyboard frames and animated video clips.

## Screens

- **Sign in / Create account**: `POST /users/signup`, then `POST /users/signin` with the same credentials.
- **Studio**: `POST /stories/create` (script and image URL) and `POST /charecters/create` (image URL).

## Run it

Install once from the repo root:

```bash
bun install
```

Start the backend. It listens on http://localhost:4000 and needs a `.env` with `DATABASE_URL`, `JWT_SECRET`, `GCP_PROJECT`, `GOOGLE_APPLICATION_CREDENTIALS` and `IMAGE_BUCKET`:

```bash
cd apps/backend
bun run index.ts
```

Start the frontend. Bun prints the URL, http://localhost:3000 by default:

```bash
cd apps/frontend
bun dev
```

To point the app at a different backend, change `API_BASE_URL` in [src/lib/api.ts](src/lib/api.ts).

Production build: `bun run build` writes static files to `dist/`.

## Stack

Bun (dev server and bundler), React 19, TanStack Query for the API calls, Tailwind CSS v4. No router and no component library.

## Layout

```
src/
  index.html            page shell
  index.ts              Bun dev server
  frontend.tsx          entry point; mounts <App /> with the query client
  App.tsx               signed out: sign-in page. Signed in: studio. Signs out when the token expires
  components/
    AuthPanel.tsx       sign in / create account
    StudioPanel.tsx     layout for the two forms
    StoryForm.tsx       POST /stories/create
    CharacterForm.tsx   POST /charecters/create
    ui.tsx              Tailwind primitives (button, field, alert, ...)
  hooks/useElapsed.ts   elapsed timer for requests that take minutes
  lib/api.ts            fetch client; every backend route is defined here
  lib/session.ts        session in localStorage; reads the JWT expiry
```

## Backend notes

- The JWT goes in the `Authorization` header as-is. The backend does not accept a `Bearer ` prefix.
- Tokens last one hour. The app signs you out when yours expires. An expired token currently comes back as a 500 from the backend, not a 401.
- `/stories/create` replies only after every frame and clip is generated. That takes minutes. The reply is `{ "message": "Success" }`, and no endpoint returns the clips. They are written to the storage bucket under `uploads/videos/`.
- `/charecters/create` never replies on success. The app stops waiting after 30 seconds and says so.
- Both image fields take a public URL. The backend downloads the image itself, and there is no upload endpoint.
- `/scenes` is mounted but has no routes, so the app doesn't call it.
- The session token is kept in `localStorage`. That is fine for a demo, but not for production.
