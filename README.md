# vetcare-front

ERP web app (React + Vite + TypeScript) for VetCare.

## Environment

Create a `.env` file with:

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_OIDC_AUTHORITY=http://localhost:8081/realms/vetcare
VITE_OIDC_CLIENT_ID=vetcare-front
VITE_OIDC_REDIRECT_URI=http://localhost:5173/login
VITE_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:5173/login
VITE_AUTH_DEV_MODE=true
VITE_MAX_LIST_ITEMS=120
```

Required for auth:
- `VITE_OIDC_AUTHORITY`
- `VITE_OIDC_CLIENT_ID`
- `VITE_OIDC_REDIRECT_URI`
- `VITE_API_BASE_URL`

Optional:
- `VITE_OIDC_POST_LOGOUT_REDIRECT_URI`
- `VITE_AUTH_DEV_MODE`
- `VITE_MAX_LIST_ITEMS`

## Authentication

- Flow: OIDC Authorization Code + PKCE.
- Login is handled by external IdP (Keycloak/Auth0/Cognito).
- Access token is sent to backend as `Authorization: Bearer ...`.
- Frontend no longer calls backend `/api/auth/login`.
- Internal profile is loaded from `/api/users/me` after OIDC session is established.
- `VITE_AUTH_DEV_MODE=true`: keep a local login page with manual `Entrar` button (dev helper).
- `VITE_AUTH_DEV_MODE=false`: `/login` automatically redirects to Keycloak (production-style flow).

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```
