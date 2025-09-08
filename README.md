# Google Calendar Integration API

Fullstack TypeScript app using React (Vite) + Express + Prisma + PostgreSQL, with Google OAuth and Calendar events (list/create/refresh).
Runs either in Docker (prod-like) or local dev.

## Stack

- Frontend: React 18 + Vite + TypeScript
- Backend: Node 20, Express, Zod, googleapis
- DB: PostgreSQL 16, Prisma ORM (UUID PKs)
- Auth: Google OAuth 2.0 (openid email profile + calendar.events)
- Infra: Docker Compose (web + api + db)

## Quick Start (using Docker)

- Clone repo and cd into it:
  ```bash
  git clone https://github.com/miloshdiklich/gcalendar
    ```
- CD into `/api` directory and copy `.env.docker.example` to `.env.docker`, then fill in the required env vars (Google OAuth client ID/secret, JWT secret):
  ```bash
  cd api
  cp .env.docker.example .env.docker
    ```
- From the `root` directory, run:
  ```bash
  docker compose up -d --build
    ```
  This will build and start 3 containers: `web` (frontend), `api` (backend), and `db` (PostgreSQL).
- Access the app at `http://localhost:8080` The backend API will be at `http://localhost:4000`.

## Start Local Dev (without Docker)
- Clone repo and cd into it:
  ```bash
  git clone https://github.com/miloshdiklich/gcalendar
  cd gcalendar
    ```
- CD into `/api` directory and copy `.env.local.example` to `.env`, then fill in the required env vars (Google OAuth client ID/secret, JWT secret, DB connection string)
- CD into `/web` directory and copy `.env.local.example` to `.env`, then fill in the required env vars (API URL)
- Start PostgreSQL locally (e.g. using Docker: `docker run --name gcalendar-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gcalendar -p 5432:5432 -d postgres:16`)
- Install dependencies and run migrations for the API:
  ```bash
  cd api
  pnpm install
  npx prisma generate
  npx prisma migrate dev --name init
    ```
- Start the API server:
- ```bash
  pnpm dev
    ```
- In a new terminal, install dependencies and start the frontend:
- ```bash
  cd ../web
  pnpm install
  pnpm dev
    ```
- Access the app at `http://localhost:5173` The backend API will be at `http://localhost:4000`.
- Make sure your Google OAuth consent screen and credentials are set up correctly in the Google Cloud Console, with the appropriate redirect URIs (e.g. `http://localhost:4000/auth/google/callback` for local dev).
- You can now log in with Google and manage your calendar events!

