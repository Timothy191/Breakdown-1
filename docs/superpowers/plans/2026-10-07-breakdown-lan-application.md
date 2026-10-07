# Standalone LAN Breakdown Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a production-usable standalone breakdown management web application for a private LAN, with local PostgreSQL, deterministic workflows, historical workbook import, dashboards, querying, reporting/export, RBAC, auditability, backups, and no AI runtime.

**Architecture:** Use a modular Next.js monolith with PostgreSQL and local persistent storage. Run the web application, database, and optional reverse proxy in Docker Compose on one LAN host; keep PostgreSQL and persistent services off the LAN interface. Development is coordinated by a separate agent council and specialist swarm.

**Tech Stack:** Next.js App Router, React, TypeScript, PostgreSQL, Docker Compose, typed validation/service boundaries, local filesystem storage, XLSX/CSV import/export, PDF reporting, browser E2E testing.

**Spec:** `docs/superpowers/specs/2026-10-07-breakdown-local-network-design.md`

## Global Constraints

- Standalone repository: `Timothy191/Breakdown-1`.
- Runtime is LAN-only and has no public ingress.
- No AI functionality or cloud AI dependency.
- No Vercel/Supabase dependency at runtime.
- PostgreSQL is local and not directly exposed to LAN clients.
- Architecture is a modular monolith, not microservices.
- Server-side authorization is mandatory; UI hiding is not authorization.
- Queries execute server-side; the browser never loads the complete dataset.
- New downtime is calculated from timestamps.
- Audit events are append-only from the application layer.
- Historical Excel is migration input, not permanent application storage.
- Production code contains no placeholders or fake operational data.
- Destructive migrations require explicit approval.
- Backup/restore is a release requirement.
- Verification evidence is required before completion.

## Review Focus

- Invalid lifecycle transitions must be rejected server-side; test an illegal transition and confirm the database state is unchanged.
- Unauthorized cross-site access must be denied even when a user manually calls the endpoint; test direct API access rather than only UI visibility.
- Malformed or duplicate workbook rows must produce row-level validation results without partial committed data.
- Large query/export requests must remain server-side and bounded; test pagination and filtered export rather than downloading the whole dataset.
- Backup restoration must reproduce usable application data and attachments; test an actual restore into a clean environment.

---

### Task 1: Repository foundation and development contracts

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `apps/web/`
- Create: `packages/config/`
- Create: `packages/validation/`
- Create: `packages/ui/`
- Create: `tests/`
- Create: `.env.example`
- Create: `README.md`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces the workspace scripts used by every later task: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.

- [ ] Initialize the Next.js TypeScript application and workspace structure.
- [ ] Configure strict TypeScript and deterministic formatting/linting.
- [ ] Add the baseline test runner and a health-check test.
- [ ] Add CI for install, lint, typecheck, tests and build.
- [ ] Add environment variable validation without embedding secrets.
- [ ] Run the complete baseline verification.
- [ ] Commit: `chore: initialize breakdown application`.

### Task 2: Database foundation

**Files:**
- Create: `packages/database/`
- Create: `database/migrations/`
- Create: `database/seeds/`
- Create: `docker/compose/compose.yml`
- Test: `tests/integration/database/`

**Interfaces:**
- Produces database client, migration commands and transaction helper for later domain modules.

- [ ] Write tests for clean database creation and transaction rollback.
- [ ] Add PostgreSQL container with persistent volume and no host database port.
- [ ] Implement migration runner and database health check.
- [ ] Define UUID primary-key convention, UTC timestamps, foreign keys and indexes.
- [ ] Run migrations against a clean database.
- [ ] Verify rollback behavior.
- [ ] Commit: `feat: add local postgres foundation`.

### Task 3: Identity, RBAC and sessions

**Files:**
- Create: `apps/web/modules/auth/`
- Create: `apps/web/modules/users/`
- Create: `database/migrations/*identity*`
- Test: `tests/integration/auth/`
- Test: `tests/integration/authorization/`

**Interfaces:**
- Produces `authenticate(credentials)`, `requirePermission(user, permission)`, `requireSiteAccess(user, siteId)` and session APIs.

- [ ] Write tests for successful login, failed login, session expiration and permission denial.
- [ ] Implement password hashing and secure local sessions.
- [ ] Implement Administrator, Manager, Operator, Maintenance and Viewer roles.
- [ ] Implement permission and site-access checks.
- [ ] Test direct unauthorized endpoint access.
- [ ] Add initial administrator bootstrap procedure.
- [ ] Commit: `feat: add local authentication and rbac`.

### Task 4: Core site, machine and reason model

**Files:**
- Create: `apps/web/modules/machines/`
- Create: `apps/web/modules/reasons/`
- Create: `database/migrations/*core-reference-data*`
- Test: `tests/integration/machines/`
- Test: `tests/integration/reasons/`

**Interfaces:**
- Produces typed machine/reason CRUD services and lookup APIs.

- [ ] Test machine creation, uniqueness, inactive state and site isolation.
- [ ] Implement organisations, sites, areas, machine types, machines and locations.
- [ ] Implement deterministic breakdown categories/reasons.
- [ ] Add machine search suitable for capture forms.
- [ ] Add server-side permission enforcement.
- [ ] Commit: `feat: add machine and breakdown reference data`.

### Task 5: Breakdown domain and lifecycle

**Files:**
- Create: `apps/web/modules/breakdowns/`
- Create: `database/migrations/*breakdowns*`
- Test: `tests/integration/breakdowns/`
- Test: `tests/unit/breakdowns/`

**Interfaces:**
- Produces `createBreakdown(input)`, `transitionBreakdown(id, transition)`, `updateBreakdown(id,input)`, `getBreakdown(id)`, `listBreakdowns(query)`.

- [ ] Write failing tests for creation, timestamp validation and legal lifecycle transitions.
- [ ] Write failing test proving illegal transitions are rejected and leave state unchanged.
- [ ] Implement breakdown entity, status history, comments, corrective actions and technicians.
- [ ] Implement server-side lifecycle state machine.
- [ ] Calculate new downtime from timestamps rather than user-entered duration.
- [ ] Add optimistic/version checks to prevent conflicting edits.
- [ ] Commit: `feat: implement breakdown lifecycle`.

### Task 6: Capture and active operational UI

**Files:**
- Create: `apps/web/app/(authenticated)/capture/`
- Create: `apps/web/app/(authenticated)/active/`
- Create: `apps/web/components/breakdowns/`
- Test: `tests/e2e/capture.spec.ts`
- Test: `tests/e2e/active.spec.ts`

**Interfaces:**
- Consumes Task 3 authentication and Task 5 breakdown services.
- Produces working capture and active-board workflows.

- [ ] Write browser test for operator login and breakdown capture.
- [ ] Implement keyboard-friendly capture form.
- [ ] Implement active breakdown board with ageing and status.
- [ ] Test validation and duplicate submission prevention.
- [ ] Test responsive capture on mobile viewport.
- [ ] Commit: `feat: add breakdown capture and active board`.

### Task 7: Records and server-side query engine

**Files:**
- Create: `apps/web/modules/queries/`
- Create: `apps/web/app/(authenticated)/records/`
- Create: `apps/web/app/(authenticated)/query/`
- Test: `tests/integration/queries/`
- Test: `tests/e2e/query.spec.ts`

**Interfaces:**
- Produces validated `BreakdownQuery` filter schema and paginated query result.

- [ ] Test date, machine, status, reason, severity and downtime filters.
- [ ] Test multi-sort and pagination.
- [ ] Test site/permission isolation at query level.
- [ ] Implement structured filter JSON mapped to parameterized SQL.
- [ ] Implement column visibility and saved query persistence.
- [ ] Add full-text search over supported fields.
- [ ] Test that the browser receives only requested pages.
- [ ] Commit: `feat: add records and query engine`.

### Task 8: Dashboard and analytics

**Files:**
- Create: `apps/web/modules/analytics/`
- Create: `apps/web/app/(authenticated)/dashboard/`
- Create: `apps/web/app/(authenticated)/analytics/`
- Test: `tests/unit/analytics/`
- Test: `tests/e2e/dashboard.spec.ts`

**Interfaces:**
- Produces deterministic KPI functions for active count, total downtime, average downtime, MTTR, MTBF when valid, frequency, Pareto and SLA state.

- [ ] Write calculation tests with fixed known timestamps.
- [ ] Implement KPI queries with explicit metric definitions.
- [ ] Implement dashboard cards, trend charts, Pareto and active ageing.
- [ ] Handle insufficient data as unavailable rather than fabricating values.
- [ ] Test dashboard permissions.
- [ ] Commit: `feat: add operational dashboard and analytics`.

### Task 9: Historical workbook importer

**Files:**
- Create: `apps/web/modules/imports/`
- Create: `apps/web/app/(authenticated)/imports/`
- Create: `scripts/import/`
- Test: `tests/integration/imports/`
- Test: `tests/fixtures/workbook/`

**Interfaces:**
- Produces `validateWorkbook(file)`, `previewImport(batch)`, `commitImport(batchId)`, and row-level validation results.

- [ ] Build fixture workbook tests for valid rows, Pending rows, invalid dates, invalid durations, missing machines and duplicates.
- [ ] Implement workbook parser and deterministic column mapping.
- [ ] Implement preview without database mutation.
- [ ] Implement transactional commit and import-batch tracking.
- [ ] Preserve original raw values and imported downtime reference.
- [ ] Verify no partial import occurs after a commit failure.
- [ ] Import the supplied historical workbook only after the importer passes fixture tests.
- [ ] Record imported-row counts and validation results.
- [ ] Commit: `feat: add validated historical workbook import`.

### Task 10: Export engine

**Files:**
- Create: `apps/web/modules/exports/`
- Create: `apps/web/app/(authenticated)/exports/`
- Test: `tests/integration/exports/`
- Test: `tests/e2e/export.spec.ts`

**Interfaces:**
- Produces `createCsvExport(query)` and `createXlsxExport(query)` with permission-filtered datasets.

- [ ] Test exports inherit query filters and authorization.
- [ ] Implement streaming/bounded CSV generation.
- [ ] Implement XLSX generation.
- [ ] Add export audit events and local file retention.
- [ ] Test large filtered result behavior.
- [ ] Commit: `feat: add csv and xlsx exports`.

### Task 11: Reports and PDF generation

**Files:**
- Create: `apps/web/modules/reports/`
- Create: `apps/web/app/(authenticated)/reports/`
- Test: `tests/integration/reports/`
- Test: `tests/e2e/reports.spec.ts`

**Interfaces:**
- Produces deterministic daily, weekly, monthly, downtime, Pareto, worst-machine, active, SLA and corrective-action report data.

- [ ] Test report calculations against fixed fixtures.
- [ ] Implement report data services.
- [ ] Implement PDF rendering from report data.
- [ ] Store generated reports locally with retention.
- [ ] Ensure permissions and filters apply.
- [ ] Commit: `feat: add operational reports and pdf export`.

### Task 12: Attachments, comments and local file storage

**Files:**
- Create: `apps/web/modules/storage/`
- Modify: `apps/web/modules/breakdowns/`
- Test: `tests/integration/storage/`

**Interfaces:**
- Produces secure upload/download/delete services using local persistent storage and PostgreSQL metadata.

- [ ] Test MIME/size restrictions and checksum generation.
- [ ] Implement storage path isolation and metadata.
- [ ] Prevent path traversal and unauthorized download.
- [ ] Add breakdown comments and attachment UI.
- [ ] Commit: `feat: add local attachments and comments`.

### Task 13: Audit log

**Files:**
- Create: `apps/web/modules/audit/`
- Create: `apps/web/app/(authenticated)/audit/`
- Test: `tests/integration/audit/`

**Interfaces:**
- Produces `recordAuditEvent(event)` and permission-protected audit queries.

- [ ] Test audit creation for create/update/status/import/export/auth events.
- [ ] Implement append-only audit persistence.
- [ ] Store before/after representations where applicable.
- [ ] Implement audit search/filter UI.
- [ ] Test that normal application users cannot modify audit events.
- [ ] Commit: `feat: add immutable application audit trail`.

### Task 14: Notifications and configurable SLA rules

**Files:**
- Create: `apps/web/modules/notifications/`
- Create: `apps/web/modules/sla/`
- Create: `apps/web/app/(authenticated)/notifications/`
- Test: `tests/unit/sla/`
- Test: `tests/integration/notifications/`

**Interfaces:**
- Produces deterministic rule evaluation and in-app notification records.

- [ ] Test acknowledgement, ageing, waiting-parts and SLA thresholds.
- [ ] Implement configurable rules.
- [ ] Implement in-app notification centre.
- [ ] Prevent duplicate notifications for the same event/rule window.
- [ ] Commit: `feat: add deterministic sla notifications`.

### Task 15: Administration and settings

**Files:**
- Create: `apps/web/app/(authenticated)/admin/`
- Create: `apps/web/modules/settings/`
- Test: `tests/e2e/admin.spec.ts`

- [ ] Implement users/roles administration.
- [ ] Implement site/area/machine/reason administration.
- [ ] Implement SLA and notification configuration.
- [ ] Implement data-retention settings.
- [ ] Require explicit confirmation for destructive actions.
- [ ] Audit administrative changes.
- [ ] Commit: `feat: add administration settings`.

### Task 16: UI system and accessibility hardening

**Files:**
- Modify: `packages/ui/`
- Create: `tests/e2e/accessibility.spec.ts`
- Modify: `apps/web/app/globals.css`

- [ ] Establish design tokens and reusable controls.
- [ ] Ensure keyboard navigation and visible focus.
- [ ] Add accessible labels, table semantics and status text.
- [ ] Test desktop, tablet and mobile critical paths.
- [ ] Run accessibility checks and fix reported blockers.
- [ ] Commit: `feat: harden ui accessibility and consistency`.

### Task 17: LAN deployment, backups and operations

**Files:**
- Create: `docker/compose/production.yml`
- Create: `docker/reverse-proxy/`
- Create: `scripts/backup/`
- Create: `scripts/restore/`
- Create: `docs/operations/runbook.md`
- Create: `docs/operations/backup-restore.md`
- Create: `docs/operations/lan-deployment.md`
- Test: `tests/operations/`

**Interfaces:**
- Produces reproducible LAN deployment and backup/restore procedures.

- [ ] Build production Docker images.
- [ ] Bind only the web/reverse-proxy service to the approved LAN interface/port.
- [ ] Keep PostgreSQL internal to the Docker network.
- [ ] Add health endpoint for application/database/storage checks.
- [ ] Implement database and attachment backups.
- [ ] Implement restore into a clean environment.
- [ ] Test persistence across container restart.
- [ ] Test application access from a second LAN machine.
- [ ] Test that PostgreSQL is not directly reachable from the LAN.
- [ ] Document firewall, startup, shutdown and recovery procedures.
- [ ] Commit: `ops: add production lan deployment and recovery`.

### Task 18: Full verification and production closeout

**Files:**
- Create: `docs/verification/production-readiness.md`
- Create: `docs/verification/test-evidence.md`
- Modify: `.github/workflows/ci.yml`

- [ ] Run lint, typecheck, unit tests, integration tests and E2E tests.
- [ ] Run dependency/security checks.
- [ ] Run clean migration from an empty database.
- [ ] Run historical import verification.
- [ ] Run export/report verification.
- [ ] Run backup/restore verification.
- [ ] Run LAN isolation verification.
- [ ] Review for AI/cloud runtime dependencies.
- [ ] Review for placeholders/debug secrets/fake operational data.
- [ ] Record exact evidence and known limitations.
- [ ] Commit: `chore: record production readiness evidence`.

### Task 19: Final independent review and deployment handoff

**Files:**
- Review-only unless fixes are required.

- [ ] Dispatch the critic/security/QA reviewers against the completed branch.
- [ ] Resolve verified findings.
- [ ] Re-run affected verification gates.
- [ ] Produce final closeout report.
- [ ] Prepare deployment instructions for the LAN host.
- [ ] Do not claim production readiness without passing Gate A-F from the design specification.
- [ ] Commit final verified state.
