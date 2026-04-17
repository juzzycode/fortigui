# Backend Architecture

EdgeOps runs a Node.js backend from `server/index.js`.
The backend is an Express API that composes stores, service modules, route modules, authentication, generated OpenAPI docs, and two in-process schedulers.

## Runtime Shape

Production uses two Node processes:

- `node server/index.js`
  Runs the backend API.
- `node server/frontend.js`
  Serves the built React app from `dist/` and proxies `EDGEOPS_API_PREFIX` requests to the backend.

`start.sh` starts both processes, supervises them in the same shell by default, and writes runtime metadata under `.run/edgeops/`.
The backend can also be started directly during development with:

```bash
npm run server
```

The API bind address, port, URL prefix, database client, MySQL settings, session settings, and bootstrap admin values are loaded from `.env` through `server/config.js`.

## Startup Flow

`server/index.js` is the composition root.
On startup it:

1. Creates the Express app.
2. Opens the configured databases with `createDatabase`.
3. Initializes setup, site, history, and auth stores.
4. Creates service objects for FortiGate access, inventory, alerts, history, topology, config archives, device actions, gateway config cache, host scans, and MAC vendor lookups.
5. Creates the OpenAPI document and Swagger UI.
6. Installs global middleware for JSON parsing, security headers, CORS, optional verbose request logging, and session authentication.
7. Mounts route modules under `EDGEOPS_API_PREFIX`, which defaults to `/api`.
8. Starts the HTTP listener.
9. Starts the config archive scheduler and history scheduler.

The backend uses explicit dependency injection rather than global singletons.
For example, `createSitesRouter` receives `siteStore`, `fortiGateClient`, `siteConfigArchiveService`, `historyService`, and `topologyService` from `server/index.js`.
That keeps route handlers thin and makes service ownership visible at startup.

## Storage

`server/lib/database.js` exposes a small database adapter with:

- `exec(sql)`
- `run(sql, ...params)`
- `get(sql, ...params)`
- `all(sql, ...params)`

SQLite is the default.
It uses `sql.js`, persists database files into `data/`, and writes changes back to disk after mutating statements.

MySQL can be enabled with:

```env
EDGEOPS_DB_CLIENT=mysql
```

When MySQL is enabled, the same adapter methods are backed by `mysql2/promise`.
The adapter transforms the SQLite-oriented schema statements into MySQL-compatible SQL where needed.

The backend opens three logical stores:

- Gateway cache database
  Uses `EDGEOPS_DB_PATH`, normally `data/edgeops-cache.sqlite`.
  It stores generic gateway definitions, encrypted API keys, and gateway config cache rows.
- Site database
  Uses `data/sites.sqlite` in SQLite mode.
  It stores sites, config snapshots, switch port overrides, host scan cache, MAC vendor cache, site metric history, device action events, and alert history.
- Auth database
  Uses `data/auth.sqlite` in SQLite mode.
  It stores users and sessions.

When MySQL is selected, these logical stores share the configured MySQL database through separate adapter instances.

## Route Layer

Routes live in `server/routes`.
Each route module exports a `create*Router` function and receives only the stores or services it needs.

Main route groups:

- `/auth`
  Login, logout, and current session handling.
- `/setup`
  First-run setup state and setup wizard persistence.
- `/sites`
  Site CRUD, live summaries, persisted history, topology, daily config snapshots, config downloads, and config diffs.
- `/alerts`
  Live alert feed generated from current FortiGate/site state.
- `/events`
  Device action events and alert history.
- `/profiles`
  Derived switch, AP, SSID, VLAN, and policy profile catalogs.
- `/firmware`
  Derived firmware compliance groups.
- `/fortigates`
  FortiGate inventory, detail, interfaces, VPNs, policies, DHCP leases, HA status, and host scan actions.
- `/switches`
  Managed switch list, detail, and operator actions.
- `/aps`
  Managed AP list, rogue APs, detail, and operator actions.
- `/clients`
  Observed client inventory.
- `/users`
  Operator management.
- `/gateways`
  Generic gateway records, API keys, config sync, and config cache retrieval.

All live inventory routes are protected by session middleware.
Role and site-scope checks are handled by helpers from `server/lib/auth.js`, including `requireSuperAdmin`, `requireOperator`, and `ensureSiteAccess`.

## Service Layer

Services live in `server/lib`.
The major service responsibilities are:

- `fortigate-client.js`
  Talks to FortiGate REST endpoints over HTTPS, maps vendor payloads into UI-shaped summaries, maintains short-lived in-memory caches for some high-frequency switch/AP/client calls, retries limited `429` responses, and applies the configured request timeout.
- `inventory-service.js`
  Builds derived profile and firmware inventories from site and FortiGate data.
- `alert-service.js`
  Produces live alert records from site reachability, switch state, AP state, and related telemetry.
- `history-service.js`
  Collects site summary metrics and alert observations into `history-store`.
- `topology-service.js`
  Builds graph data from sites, FortiGate devices, switches, APs, and clients.
- `site-config-archive-service.js`
  Fetches full FortiGate config backups, stores one snapshot per site per day, creates diffs, records failed snapshot attempts, and applies per-site retention.
- `device-action-service.js`
  Validates switch/AP actions, executes them against FortiGate where supported, and records events in `history-store`.
- `gateway-config-service.js`
  Retrieves and stores generic gateway configuration cache entries.
- `host-scan-service.js`
  Runs optional `nmap` scans when available on the server host.
- `vendor-lookup-service.js`
  Caches MAC vendor lookups for clients and DHCP leases.

Stores own persistence and schema initialization.
Services own network calls, aggregation, derived data, and cross-store workflows.
Routes translate HTTP requests into service calls and shape HTTP responses.

## FortiGate Integration

Site records hold the FortiGate address, API key, VDOM, and archive retention settings.
The FortiGate address can be a host/IP or host with port; the backend normalizes it into an HTTPS base URL.

FortiGate requests:

- use bearer-token authentication from the site API key
- use `rejectUnauthorized: false` for local appliance certificates
- default to `EDGEOPS_FORTIGATE_TIMEOUT_MS`, or `15000` ms
- retry `429` responses up to two times using `Retry-After` when available
- return UI-safe mapped objects rather than exposing raw FortiGate payloads directly

Some list endpoints cache FortiGate responses briefly in memory to avoid repeated expensive calls while users move between pages.
These are process-local caches and are cleared when the backend restarts.

## Scheduling Service

The scheduling service is intentionally in-process.
No external queue, cron daemon, worker process, or distributed lock is used today.

`server/index.js` starts both schedulers after the API listener is created:

```js
siteConfigArchiveService.startScheduler();
historyService.startScheduler();
```

### Site History Scheduler

Implemented in `server/lib/history-service.js`.

Default interval:

- every 15 minutes

Startup behavior:

- waits 3 seconds after backend startup
- runs an initial collection for all sites
- repeats every 15 minutes

What it does:

1. Lists all sites from `siteStore`.
2. Calls `fortiGateClient.summarizeSite(site)` for each site.
3. Stores point-in-time metrics in `site_metric_history`.
4. Calls `alertService.listAlerts({ siteId })`.
5. Stores alert observations in `alert_history`.

The scheduler uses `Promise.allSettled` for all-site collection.
A failure for one site does not stop collection for other sites.
Scheduled failures are logged with a `[history]` prefix.

Manual refresh:

- `GET /api/sites/:id/history?refresh=true`

When `refresh=true` is used, `historyService.getSiteHistory` attempts an immediate collection for that site before returning stored history.

### Config Archive Scheduler

Implemented in `server/lib/site-config-archive-service.js`.

Default interval:

- every 1 hour

Startup behavior:

- waits 5 seconds after backend startup
- runs an initial archive pass
- repeats every hour

What it does:

1. Lists all sites from `siteStore`.
2. Skips sites that have config archive disabled.
3. Skips sites missing `fortigate_ip` or `fortigate_api_key`.
4. Calls `ensureDailySnapshot(site.id)` for eligible sites.
5. Fetches the FortiGate backup endpoint for the site's VDOM.
6. Stores one snapshot row per site per UTC date.
7. Calculates a SHA-256 hash for successful config blobs.
8. Builds a diff against the previous successful snapshot.
9. Records failed attempts with an error message instead of dropping them.
10. Applies per-site retention from `config_backups_to_keep`.

The hourly timer checks whether today's successful snapshot already exists.
If it does, no duplicate config blob is fetched unless a manual sync asks for `force`.

Manual sync:

- `POST /api/sites/:id/config-snapshots/sync`
- body can include `{ "force": true }`

Archive-related read endpoints:

- `GET /api/sites/:id/config-snapshots`
- `GET /api/sites/:id/config-snapshots/:snapshotId/download`
- `GET /api/sites/:id/config-diffs`

### Scheduler Limits And Operations

Because scheduling is process-local:

- restarting the backend resets timers and in-memory FortiGate response caches
- running two backend instances starts two scheduler sets
- there is no distributed lock to prevent two instances from archiving at the same time
- horizontal scaling should use a single scheduler owner or add a lock/queue before multiple API replicas run schedulers

The config archive table has a unique key on `(site_id, snapshot_date)`.
That protects the one-row-per-day model, but it is not a complete distributed scheduling lock.

There are no environment variables today for changing the two scheduler intervals.
To tune the timings, update the defaults in:

- `server/lib/history-service.js`
- `server/lib/site-config-archive-service.js`

## API Documentation

The OpenAPI document is generated by `server/openapi.js`.
Authenticated users can view:

- `GET /api/docs`
- `GET /api/openapi.json`

The backend root page also links the main API groups when visited with a valid session.
