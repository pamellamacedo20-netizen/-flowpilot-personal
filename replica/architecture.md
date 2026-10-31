# Architecture — implemented v0.6

## Runtime

- Frontend: zero-build HTML/CSS/JavaScript application.
- API: Node.js HTTP server.
- Development persistence: transactional JSON file store.
- Production persistence: Postgres driver using `pg` and all ordered files under `db/migrations/`.
- Jobs: durable queue persisted in JSON or Postgres; Postgres uses `FOR UPDATE SKIP LOCKED` claiming.
- Authentication: opaque HttpOnly sessions; PBKDF2-SHA512 password hashes.
- Secret storage: AES-256-GCM encryption for provider access tokens.
- Abuse controls: fixed-window in-memory API/auth/webhook limiter (replace or externalize for horizontally scaled deployments).
- Observability: request IDs, structured logs, counters/latency percentiles, Prometheus-style scrape output and workspace queue snapshot.

## Tenant model

`users → workspace_members → workspaces`.

Every state, connection, job, audit entry, OAuth state, usage counter and webhook event is scoped to a workspace. Tenant API routes resolve the current session first, then verify membership for `x-workspace-id` before reading or writing state.

## Messaging path

Inbound Meta webhook
→ raw-body HMAC verification
→ provider/account lookup
→ webhook event deduplication
→ normalized event
→ update contact consent/last-inbound state
→ durable `process_event` job when not opted out
→ plan-entitlement check
→ automation runtime
→ optional delayed continuation / outbound delivery jobs.

Outbound
→ plan preflight where possible
→ `send_message` job
→ load contact consent/session state
→ compliance guard
→ encrypted workspace connection
→ decrypt token server-side
→ official Instagram or WhatsApp adapter
→ successful-send usage accounting
→ retry/fail state for provider/network failures.

## Broadcast path

Campaign create
→ server-side segment definition
→ durable `broadcast_dispatch` job at `sendAt`
→ resolve audience at dispatch time
→ one `send_message` job per eligible contact
→ compliance guard per contact
→ provider adapter.

## Storage

Migrations currently cover core SaaS/runtime data and monthly usage counters. The UI state remains a workspace JSON snapshot for rapid iteration; normalizing contacts, conversations and automation graphs into dedicated tables is still the preferred scaling path for large datasets.

## Recovery and privacy

- Workspace-level app backup exports snapshot state with a SHA-256 checksum and restore validation.
- Contact privacy export returns the contact plus associated workspace conversation data.
- Contact erasure removes the contact, associated conversations and queued/running jobs that carry the contact ID.

Database-level PITR/backups and full disaster-recovery automation remain deployment responsibilities.

## Automation graph model

A workspace owns multiple independent flows. Inbound normalized events are evaluated against all active automations; every delayed continuation carries a `flowId` so resumption cannot drift into another graph. Reusable templates instantiate fresh node/edge IDs rather than sharing mutable graph state.

Runtime actions now include tags, custom fields, named conversion events, sequence enrollment and external HTTP calls. Text/JSON fields can interpolate the current contact, custom fields and normalized event values. External HTTP actions apply protocol/hostname/IP validation, DNS resolution checks, timeouts, response-size limits and private-network blocking by default.

## Commercial path

Plan entitlements remain authoritative in the application store. Stripe Checkout creates subscription sessions tied to a workspace; signed Stripe webhook events update that workspace plan. Checkout failure is fail-closed when secrets or Price IDs are absent. Provider payment data is not stored in FlowPilot.
