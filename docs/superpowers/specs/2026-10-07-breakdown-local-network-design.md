# Breakdown Management System — Standalone LAN-Only Design Specification

**Date:** 2026-10-07  
**Repository:** Timothy191/Breakdown-1  
**Status:** Design stage — implementation blocked until this specification is reviewed and approved

## 1. Product definition

Build a standalone Breakdown Management System for use exclusively on a private company/local network.

The application records equipment breakdowns, tracks their operational lifecycle, calculates downtime, provides operational and management dashboards, supports advanced queries and filters, imports the supplied historical workbook, and exports reports/data.

This application is independent from Arch-System, Arch-Base, Supabase cloud projects, Vercel deployments, existing business portals, and their authentication/database systems.

### Explicit exclusions

The production application contains **no AI functionality**:

- no LLM integration
- no AI assistant
- no natural-language-to-SQL
- no AI-generated reports
- no AI classification/normalization
- no AI-dependent workflows
- no cloud AI service requirement

AI/agent tooling may be used during development and maintenance, but it must never be required for the deployed application's normal operation.

## 2. Success criteria

The first production release is successful when a user on the company LAN can:

1. Sign in.
2. Register/search machines.
3. Capture a new breakdown in seconds.
4. Track it through its lifecycle.
5. See active breakdowns immediately.
6. Search historical records using multiple filters.
7. Calculate trustworthy downtime from timestamps.
8. View management KPIs and trends.
9. Import the historical workbook with validation.
10. Export filtered datasets and reports.
11. See who changed important records and when.
12. Operate the system with the LAN disconnected from the public Internet after initial installation.
13. Recover the system from a local database/file backup.

## 3. Deployment model

This is a **private-network application**, not a public SaaS deployment.

### Target topology

```
                     COMPANY LAN
                           |
                 +---------+---------+
                 |                   |
          User PCs/Tablets      Mobile Devices
                 |                   |
                 +---------+---------+
                           |
                    LAN HTTP/HTTPS
                           |
                 +---------v---------+
                 | Breakdown Web App |
                 |     Next.js       |
                 +---------+---------+
                           |
                 Internal application network
                           |
             +-------------+-------------+
             |                           |
      +------v------+             +------v-------+
      | PostgreSQL  |             | Local Files   |
      |   database  |             | attachments   |
      |   volume    |             | exports       |
      +-------------+             +--------------+
```

Recommended deployment is one Linux host on the LAN, preferably a small server or workstation that can run Docker.

The web application binds to the LAN interface. PostgreSQL and internal services are not exposed directly to the LAN.

### Network rules

- No public inbound exposure.
- No dependency on public DNS.
- No dependency on Vercel at runtime.
- No dependency on Supabase at runtime.
- No dependency on cloud object storage.
- PostgreSQL listens only on the internal Docker network or host-local interface.
- Application access is restricted by host firewall to the approved LAN/subnets.
- Admin interfaces are not exposed on a separate public port.
- Secrets are kept in environment files outside source control.
- Production should use HTTPS on the LAN where practical; HTTP may be supported for an isolated first installation if certificate management is not yet available.

### Recommended local service stack

- Next.js application
- PostgreSQL
- Docker Compose
- Caddy or Nginx as optional LAN reverse proxy
- Local persistent volumes for database, uploads, generated reports and backups

Redis is not required for the first release. It should only be introduced when asynchronous report generation, notifications, or other workload evidence justifies it.

## 4. Technology architecture

### Application

- Next.js App Router
- React
- TypeScript
- Server-side business/service layer
- Typed request/response contracts
- PostgreSQL
- SQL migrations
- Local filesystem/object abstraction for attachments
- Deterministic validation and business rules

The architecture should be a modular monolith, not microservices.

### Domain modules

```
src/
  app/
  modules/
    auth/
    dashboard/
    breakdowns/
    machines/
    reasons/
    reports/
    queries/
    imports/
    exports/
    notifications/
    audit/
    users/
    settings/
  db/
  lib/
  components/
```

Each module owns its domain logic, validation, permissions and repository/service boundaries.

## 5. Core navigation

Primary navigation:

- Dashboard
- Capture Breakdown
- Active Breakdowns
- Breakdown Records
- Query
- Analytics
- Reports
- Machines
- Breakdown Reasons
- Imports
- Exports
- Notifications
- Users & Roles
- Audit Log
- Settings

The navigation is permission-aware.

## 6. Breakdown lifecycle

Canonical states:

```
OPEN
  -> ACKNOWLEDGED
  -> ASSIGNED
  -> IN_PROGRESS
  -> WAITING_PARTS
  -> REPAIR_COMPLETE
  -> VERIFIED
  -> CLOSED
```

Valid transitions must be enforced server-side.

Important timestamps:

- reported_at
- acknowledged_at
- assigned_at
- started_at
- completed_at
- verified_at
- closed_at

Downtime must be computed from the operational timestamps according to the configured calculation rule.

Default calculation:

`downtime_minutes = completed_at - reported_at`

For historical records, the importer may retain the supplied downtime value as an imported reference, but newly created records must derive downtime from timestamps.

## 7. Breakdown capture

Required:

- machine
- report date/time
- breakdown reason/category
- description
- reporter

Recommended:

- severity
- location
- machine status
- shift
- work area
- attachments/photos
- notes

On submission:

1. Validate all required fields.
2. Verify user has permission for the machine/site.
3. Create a breakdown in OPEN state.
4. Write an audit event.
5. Return the new record immediately.
6. Update dashboard/active views through normal application refresh/revalidation.

No AI is used.

## 8. Breakdown completion

Closure requires the relevant completion information:

- completion timestamp
- root cause
- corrective action
- technician/owner
- repair notes
- optional parts used
- verification outcome

A record cannot become CLOSED until required fields for its configured workflow are present.

Historical records that predate the workflow may be marked as imported/legacy where necessary.

## 9. Database design

Core relational entities:

### Organisation/site structure

- organisations
- sites
- areas

The first deployment may contain one organisation and one site, but site_id should exist on operational tables from day one.

### Identity and permissions

- users
- roles
- permissions
- role_permissions
- user_roles
- user_site_access
- sessions

Default roles:

- Administrator
- Manager
- Operator
- Maintenance
- Viewer

Permissions use actions such as:

```
breakdown.create
breakdown.read
breakdown.update
breakdown.assign
breakdown.complete
breakdown.verify
breakdown.close
breakdown.delete
machine.read
machine.manage
reason.manage
report.read
report.generate
export.create
import.create
user.manage
role.manage
audit.read
settings.manage
```

### Machine data

- machine_types
- machines
- machine_locations

Machine fields:

- id
- machine_code
- name
- fleet/type
- serial_number when available
- site_id
- location_id
- active
- qr_code_value
- created_at
- updated_at

### Breakdown data

- breakdowns
- breakdown_status_history
- breakdown_comments
- breakdown_attachments
- breakdown_corrective_actions
- technicians
- parts
- breakdown_parts

The primary breakdown entity contains:

- id
- site_id
- machine_id
- category_id
- reason_id
- reported_by
- reported_at
- severity
- status
- description
- acknowledged_at
- assigned_at
- started_at
- waiting_parts_at
- completed_at
- verified_at
- closed_at
- root_cause
- corrective_action
- downtime_minutes
- imported
- import_batch_id
- created_at
- updated_at
- version

The status-history table stores every transition rather than relying only on the current status.

## 10. Audit architecture

Important changes generate immutable audit records.

Audit fields:

- id
- timestamp
- actor_user_id
- action
- entity_type
- entity_id
- site_id
- before_json
- after_json
- request_id
- source
- reason/comment where applicable

Audit coverage includes:

- login/logout
- failed login
- record creation/update/deletion
- status transitions
- permission changes
- user/role changes
- imports
- exports
- settings changes
- attachment operations
- administrative actions

Audit records are append-only from the application layer.

## 11. Dashboard

Dashboard must be deterministic and database-backed.

Primary KPI cards:

- Active breakdowns
- Breakdowns today
- Breakdowns this period
- Total downtime
- Average downtime
- MTTR
- MTBF where sufficient operating-hour data exists
- SLA compliance

Visuals:

- downtime trend
- breakdown frequency trend
- downtime by reason Pareto
- downtime by machine/fleet
- active breakdown ageing
- recent closures

Operational panel:

- currently open
- waiting parts
- overdue/SLA breaches
- longest active breakdowns

All dashboard calculations must have explicit definitions documented in code/tests.

## 12. Query tab

The Query screen is the main analytical register.

Filters:

- date range
- machine
- fleet/type
- site
- area
- status
- severity
- category
- reason
- reporter
- technician
- imported/live
- downtime range
- SLA state

Capabilities:

- multi-column sorting
- column visibility
- grouping
- pagination
- saved filters
- saved queries
- full-text search across supported text fields
- date presets
- reset filters
- export current result
- shareable query URLs where safe
- bulk status/action operations subject to permission checks

Queries must execute server-side.

No client-side loading of the entire dataset.

## 13. Saved queries

Users with permission can save query definitions.

Example saved queries:

- Active critical breakdowns
- Machines with >10 hours downtime
- Top downtime assets
- 3+ breakdowns in 30 days
- Awaiting parts
- SLA breaches
- Maintenance-related breakdowns
- Breakdown history by fleet

Saved queries store the filter definition as validated structured JSON, not arbitrary SQL.

The server maps the structured filter model to parameterized database queries.

## 14. Analytics

Analytics screens provide:

- breakdown frequency
- total downtime
- MTTR
- MTBF where valid
- downtime percentage
- machine ranking
- fleet ranking
- reason/category Pareto
- repeat failure analysis
- SLA performance
- monthly trends
- shift comparison where shift data exists

Analytics must clearly distinguish:

- calculated data
- unavailable metrics
- imported historical values

No fabricated values or silent assumptions.

## 15. Reports

Built-in reports:

1. Daily operational breakdown report
2. Weekly breakdown summary
3. Monthly management report
4. Downtime report
5. Breakdown Pareto
6. Worst-performing machines
7. Active/open breakdown report
8. SLA performance report
9. Corrective-action report

Exports:

- CSV
- XLSX
- PDF

Exports respect current permissions and filters.

Generated files are stored locally and automatically expire according to configurable retention.

## 16. Historical workbook import

The supplied workbook is an initial historical data source.

Import flow:

```
Upload workbook
    ->
Validate workbook
    ->
Detect sheet/columns
    ->
Preview mappings
    ->
Validate rows
    ->
Show errors/warnings
    ->
Explicit user confirmation
    ->
Create import batch
    ->
Transactional import
    ->
Post-import summary
```

Initial mapping:

- Machine ID -> machines.machine_code
- Breakdown reason -> breakdown reason/reference
- Report date/time -> breakdowns.reported_at
- Completion date/time -> breakdowns.completed_at
- Downtime -> imported downtime reference

The import system must:

- preserve original raw values
- detect duplicate rows
- report missing machines
- report invalid dates
- report invalid durations
- preserve Pending/unresolved records
- create an import batch id
- allow review before commit
- create audit entries
- provide row-level failure messages
- support re-running corrected imports without corrupting existing data

The importer should normalize known machine/reason values through deterministic mapping tables only.

## 17. Local storage

Attachments are stored outside PostgreSQL as files, with metadata in PostgreSQL.

Metadata:

- file id
- breakdown id
- original filename
- stored path/key
- MIME type
- size
- checksum
- uploaded_by
- created_at

Store uploads in persistent Docker volume or a designated application data directory.

No cloud object storage is required.

## 18. Notifications

Notifications use deterministic rule evaluation.

Examples:

- new critical breakdown
- breakdown not acknowledged within configured time
- breakdown exceeds configured age
- waiting parts exceeds configured threshold
- SLA breach
- record assigned to user
- corrective action due

Channels for LAN-only first release:

- in-app notification centre
- optional LAN email relay later
- optional browser notifications later

Notification rules are configurable by administrators.

## 19. Authentication and security

Authentication is local to this application.

Recommended:

- username/email + password
- secure password hashing
- HTTP-only secure session cookies
- CSRF protection where applicable
- rate limiting for authentication attempts
- account lockout/throttling
- session expiration
- password reset by local administrator
- forced password change for initial accounts

Do not expose PostgreSQL credentials or application secrets to the browser.

Authorization is enforced server-side on every protected operation.

UI hiding is not considered authorization.

## 20. LAN-only security boundary

The fact that the application is private-network-only is an additional control, not the authentication mechanism.

Required controls:

- host firewall
- private network binding
- authenticated application access
- no public ingress
- no hard-coded LAN trust
- no unrestricted admin endpoints
- request validation
- SQL parameterization
- upload type/size validation
- security headers
- secure cookie configuration
- dependency vulnerability checks
- audit trail

## 21. Backup and recovery

Production installation must include:

- PostgreSQL backup script
- attachment backup
- configuration/secrets backup procedure
- retention policy
- restore procedure
- backup health check

Backups should target a second local storage location on the private network where available.

A backup is not considered valid until restore can be tested.

## 22. Observability

The application should provide:

- structured application logs
- request correlation IDs
- database error logging
- import/export job logging
- authentication events
- health endpoint
- database connectivity check
- storage health check

The health endpoint must not disclose secrets or sensitive data.

## 23. Performance requirements

Design targets for the initial deployment:

- fast dashboard load on LAN
- server-side pagination for records
- indexed date/machine/status queries
- no full-table browser downloads
- bounded export generation
- lazy loading of attachments
- database connection pooling
- reasonable operation on a small LAN server

The design should remain comfortable with at least tens of thousands of breakdown records without requiring architectural redesign.

## 24. UI direction

The visual language should be professional industrial/operations software rather than a consumer application.

Priorities:

- high information density without clutter
- clear status/severity indicators
- strong table usability
- responsive layouts
- obvious primary actions
- keyboard-friendly forms
- accessible labels/focus states
- consistent spacing and typography
- readable charts
- confirmation for destructive operations

Use a shared component system and centralized design tokens.

## 25. QR capability

QR support is optional to enable during Phase 2.

A machine may have a QR code whose payload maps to a machine record.

Scanning should:

1. identify the machine
2. open the machine context
3. allow immediate breakdown capture

QR must be a convenience layer, not a dependency.

## 26. API boundaries

Use explicit server-side services for:

- authentication
- machine management
- breakdown commands
- breakdown queries
- analytics
- reports
- import
- export
- audit
- notifications

Command endpoints should use validated request schemas.

Do not expose generic unrestricted database access.

## 27. Development agent swarm — development-time only

The application itself has no AI. Development is coordinated by an agent council external to runtime features.

Recommended council:

```
                  PROJECT COORDINATOR
                         |
              +----------+----------+
              |                     |
         DEBATE/CRITIC          QA/VERIFIER
              |
      +-------+-------+-------+-------+
      |       |       |       |       |
     UX     DB/API  FRONTEND SECURITY DATA/IMPORT
                         |
                     DEVOPS/DEPLOY
```

### Agent responsibilities

**Coordinator**
- owns task decomposition
- maintains canonical plan
- prevents scope drift
- requires evidence before declaring completion

**Debate/Critic**
- challenges architectural decisions
- checks hidden coupling
- checks requirements against implementation
- rejects weak assumptions

**Database/API agent**
- schema
- migrations
- constraints
- indexes
- service contracts
- transaction boundaries

**Frontend agent**
- UI
- forms
- tables
- dashboards
- responsive behavior
- accessibility

**UX agent**
- information architecture
- workflow friction
- table/query usability
- design-system consistency

**Security agent**
- authentication
- authorization
- input validation
- upload security
- network boundary
- audit requirements

**Data/Import agent**
- workbook mapping
- validation
- historical migration
- data quality

**QA/Verification agent**
- tests
- integration checks
- browser checks
- regression verification
- acceptance criteria

**DevOps agent**
- Docker Compose
- LAN deployment
- backups
- health checks
- startup/shutdown
- operational documentation

### Swarm rules

- Agents may work in parallel only on isolated areas.
- Shared contracts are defined before dependent work starts.
- No agent may silently change database/API contracts.
- Destructive migrations require explicit approval.
- The coordinator resolves cross-agent conflicts.
- The critic reviews substantial changes before merge.
- Verification evidence is mandatory before completion.
- Minimal-diff principle applies.
- Placeholders are forbidden in production code.
- Failed tests cannot be hidden, skipped without justification, or reclassified as success.
- No fake data may be presented as real operational data.
- Generated files must be reproducible.
- Agent tooling must never be included in the runtime application's dependency graph unless explicitly required for a non-AI operational feature.

## 28. Development repository structure

Planned high-level structure:

```
Breakdown-1/
  apps/
    web/

  packages/
    ui/
    config/
    validation/
    database/

  database/
    migrations/
    seeds/

  scripts/
    import/
    backup/
    restore/
    operations/

  docs/
    architecture/
    operations/
    runbooks/
    superpowers/
      specs/

  agents/
    coordinator/
    critic/
    specialists/
    workflows/
    policies/

  skills/
    project/
    database/
    frontend/
    security/
    qa/
    import/
    deployment/

  tests/
    unit/
    integration/
    e2e/

  docker/
    compose/
    reverse-proxy/

  .github/
    workflows/
```

The agent directories are development infrastructure only.

## 29. Verification gates

Before release, the coordinator must require evidence for:

### Gate A — Static quality

- typecheck
- lint
- unit tests
- migration validation
- dependency/security checks

### Gate B — Database

- clean migration from empty database
- seed/admin creation
- constraints
- indexes
- backup/restore test

### Gate C — Functional

- authentication
- CRUD
- lifecycle transitions
- dashboard
- query/filter
- import
- export
- audit
- permissions

### Gate D — Browser

- desktop
- tablet
- mobile
- critical workflows
- accessibility checks

### Gate E — LAN deployment

- application reachable from another LAN machine
- database not directly reachable
- restart survives
- data persists
- uploads persist
- health check passes
- backup/restore succeeds

### Gate F — Production closeout

- no placeholder content
- no AI dependencies
- no cloud runtime dependencies
- no debug secrets/logging
- operational runbook present
- rollback/restore procedure documented

## 30. Delivery phases

### Phase 1
Foundation, local auth, database, machines, breakdown capture/lifecycle, records, query, dashboard, import, CSV/XLSX export.

### Phase 2
Analytics, reports/PDF, attachments, comments, notifications, SLA rules, full audit UX, backup tooling.

### Phase 3
QR workflow, PWA/offline capture, advanced enterprise controls, integrations, scheduled reports.

Do not build Phase 3 features before Phase 1 is fully operational.

## 31. Architectural decisions

1. Standalone application.
2. LAN-only runtime.
3. Self-hosted/local PostgreSQL.
4. Modular monolith.
5. No AI runtime.
6. No mandatory cloud service.
7. Development agent swarm is separate from production runtime.
8. Deterministic business rules.
9. Server-side authorization.
10. Server-side query execution.
11. Timestamp-derived downtime.
12. Immutable audit events.
13. Historical Excel is migration input, not application storage.
14. Docker-first local deployment.
15. Backups and restoration are first-class operational requirements.

## 32. Implementation acceptance statement

Implementation may begin only after this design document is reviewed and approved.

The next engineering artifact after design approval is a detailed implementation plan that decomposes work into independently verifiable tasks, establishes interfaces and tests, and defines the safe execution order for the development swarm.
