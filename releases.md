# EdgeOps Cloud Releases

This release history is reconstructed from the project commit trail. It is intentionally written as an operator-facing changelog: what changed, why it mattered, and where the product took a practical step forward.

## 0.9.1 - 2026-04-10

### Fixed

- Fixed a double-auth/session check issue that could produce noisy unauthorized calls after login.
- Cleaned up LastPass-injected overlays after successful login and authenticated startup so the app no longer stays greyed out when a password prompt is dismissed.

### Changed

- Added the new EdgeOps favicon and began carrying the EO mark into the application shell.

## 0.9.0 - 2026-04-09

### Added

- Added FortiWiFi support for integrated access points.
- Added 24-hour site ping response history with 30-minute rollup samples on the dashboard.
- Added warning hover reasons for client status badges so operators can see why a client is flagged.
- Added production startup scripts, detached mode, PID tracking, and reverse proxy examples for nginx and Apache.

### Fixed

- Collapsed duplicate FortiWiFi `WIFI0` AP rows so integrated radios count as one real AP.
- Added FortiOS 7.6.6 config backup fallback behavior when older backup endpoints return HTTP 405.
- Added FortiGate request timeout configuration and targeted retry handling for rate-limited API calls.
- Fixed a site creation database insert mismatch.

## 0.8.2 - 2026-03-27

### Fixed

- Tightened config diff cleanup for daily FortiGate archives.
- Filtered noisy SAE/key-management lines from config diffs.
- Fixed partial key-line parsing so credential-like fragments are handled more safely in archived comparisons.

## 0.8.0 - 2026-03-22

### Added

- Added WAN latency into the dashboard topology graph.
- Made dashboard health summaries actionable instead of purely informational.
- Added FortiGate inventory documentation and expanded scan feature docs.
- Added site VDOM and backup retention settings for more realistic multi-tenant FortiGate deployments.

### Changed

- Cleaned up completed roadmap items and shifted the TODO list toward future product work.

## 0.7.3 - 2026-03-22

### Fixed

- Fixed FortiGate firmware lifecycle rows.
- Relaxed AP firmware compliance checks for generic target versions.
- Used switch provisioning targets in the firmware lifecycle view.
- Added root VDOM fallback for switch status queries.
- Clarified the firmware upgrade availability column.

## 0.7.0 - 2026-03-22

### Added

- Added FortiGate inventory and detail pages.
- Added VPN, HA, interface, policy, and lease visibility to FortiGate detail views.
- Added tile filters and pagination for long FortiGate detail sections.
- Added policy detail inspection and a host scan drawer.
- Added cached host scans, MAC-preferred scan caching, and two-stage deep scan behavior.
- Added cached vendor lookup and broader vendor enrichment for unknown clients and DHCP leases.

### Fixed

- Returned host scan failures as normal API payloads so the UI can display diagnostics instead of treating every scan issue as a hard failure.
- Preserved nmap diagnostics on scan failures.
- Removed version detection from basic scans to keep lightweight scans faster and less intrusive.

## 0.6.4 - 2026-03-22

### Fixed

- Matched FortiGate UI request shape for switch VLAN updates.
- Sent content length headers for FortiGate write calls.
- Verified FortiGate VLAN changes before updating the UI.
- Fixed API startup after switch port edit changes.

## 0.6.0 - 2026-03-22

### Added

- Added quick edit controls for switch ports.
- Added live switch VLAN dropdowns and FortiGate API-backed VLAN updates.
- Added switch port status and PoE controls.
- Surfaced live PoE state from switch monitor data.

### Changed

- Improved disabled-port language and visual treatment in the port map.
- Rounded PoE totals to one decimal place.
- Differentiated disabled PoE ports and disabled speed labels in the switch detail UI.

## 0.5.1 - 2026-03-22

### Changed

- Removed demo data and mock fallbacks so the app behaves like a live-only operations tool.
- Added an explicit product roadmap document after the first real feature wave stabilized.
- Began showing the application version in the sidebar.

## 0.5.0 - 2026-03-22

### Added

- Added topology, site history, and backend action audit flows.
- Added daily FortiGate config archive collection and diff views.
- Added per-site config archive toggles.
- Expanded site onboarding and access-control documentation.

### Changed

- Added switch bandwidth activity visuals and tuned chart scaling, colors, tooltip clipping, and early-port tooltip placement.

## 0.4.0 - 2026-03-22

### Added

- Added session-backed authentication.
- Added user management with super admin, site admin, and read-only operator roles.
- Added site-scoped user assignment behavior.
- Added profile menu controls in the app header.

### Fixed

- Fixed header menu stacking so profile controls render above the rest of the shell.

## 0.3.4 - 2026-03-21

### Fixed

- Fixed AP online status heuristics.
- Added fallback AP radio and SSID extraction from client telemetry.
- Improved WAN IP and firmware identity parsing.

## 0.3.0 - 2026-03-21

### Added

- Added live FortiGate alert center.
- Added live profiles and firmware lifecycle views.
- Added rogue AP reporting.
- Added richer live dashboard signals.
- Expanded the Settings workspace.

### Changed

- Polished firmware lists and SSID tiles.

## 0.2.3 - 2026-03-21

### Fixed

- Timed out unreachable FortiGate site requests.
- Fixed hanging behavior when FortiGate requests timed out.
- Added support for non-default FortiGate ports.
- Improved FortiGate system status field parsing.

## 0.2.0 - 2026-03-21

### Added

- Shifted onboarding to a site-based FortiGate flow.
- Added cached FortiGate latency checks.
- Added managed FortiSwitch inventory from FortiGate.
- Added switch port stats hover details and live counter reconciliation.
- Added live FortiGate access point inventory.
- Added richer AP radio and client popovers.
- Added live FortiGate client inventory.
- Added site edit and delete management.
- Populated live site inventory counts.

### Changed

- Greyed out inactive switch ports and polished switch port hover layering.

## 0.1.2 - 2026-03-21

### Added

- Added API index and Swagger/OpenAPI documentation.
- Added OpenAPI schemas and example payloads.
- Added an HTML index page for the API server.
- Added the first FortiGate bootstrap startup wizard.

### Fixed

- Improved backend connectivity errors and verbose logging.
- Fixed LAN API access for the startup wizard.

## 0.1.1 - 2026-03-21

### Changed

- Clarified development and server run instructions.
- Added Node 20 support for the gateway cache backend.
- Loaded backend settings from `.env`.
- Replaced the native SQLite dependency with `sql.js` to make local startup less fragile.

## 0.1.0 - 2026-03-21

### Added

- Created the initial EdgeOps Cloud frontend shell.
- Added dashboard, sites, FortiGates, switches, APs, clients, alerts, profiles, firmware, and settings page scaffolding.
- Added reusable layout, table, panel, chart, status, drawer, and topology placeholder components.
- Added the first gateway cache backend and project documentation.
- Added encrypted gateway configuration storage and baseline server routes.
