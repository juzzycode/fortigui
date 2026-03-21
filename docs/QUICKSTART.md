# Quickstart

## What This Is

EdgeOps Cloud is a frontend-first network management UI for:

- Switches
- Wireless access points
- Sites
- Clients
- Alerts
- Profiles
- Firmware lifecycle

This project currently uses mocked data and a mock async service layer so real APIs can be connected later without rewriting the UI.

## Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended

## Install

From the project root:

```bash
npm install
```

## Start The App

For normal frontend work:

```bash
npm run dev -- --host 0.0.0.0
```

Then open the local Vite URL shown in the terminal.

Important:

- Use `npm run dev -- --host 0.0.0.0`
- Not `npm run dev --host 0.0.0.0`
- The extra `--` tells npm to pass `--host` through to Vite

## Start The Gateway Cache API

Only run this if you want the local backend running too:

```bash
npm run server
```

## Build

Only run this when you want to test a production build:

```bash
npm run build
```

## Typical Workflows

### Frontend only

```bash
npm install
npm run dev -- --host 0.0.0.0
```

### Frontend plus backend

Terminal 1:

```bash
npm run server
```

Terminal 2:

```bash
npm run dev -- --host 0.0.0.0
```

## Main Folders

- `src/app`
  - App composition and route registration
- `src/components`
  - Reusable UI building blocks
- `src/features`
  - Page-level modules
- `src/mocks`
  - Seed data
- `src/services`
  - Mock API functions
- `src/store`
  - Global UI state
- `src/types`
  - Shared domain models

## Important Routes

- `/dashboard`
- `/sites`
- `/sites/:id`
- `/switches`
- `/switches/:id`
- `/aps`
- `/aps/:id`
- `/clients`
- `/alerts`
- `/profiles`
- `/firmware`
- `/settings`

## Mock API Integration

Today the UI reads from `src/services/api.ts`.

To connect real backend APIs later:

1. Replace mock functions with real HTTP client calls.
2. Preserve returned data shapes where possible.
3. Add websocket or SSE subscriptions for live updates.
4. Move role rules from UI hints into real authorization checks.

## Notes

- Theme switching is already wired in.
- Role switching is mocked for `super_admin`, `site_admin`, and `read_only`.
- Device actions like reboot and blink LED are simulated through the service layer.
