
## Deploy no Render (modo pessoal)

A v0.8.2 inclui `render.yaml` e `docs/RENDER_DEPLOY.md`. O app pode subir em `SETUP_MODE=true` antes das credenciais Meta, usando automaticamente `RENDER_EXTERNAL_HOSTNAME` como origem HTTPS. Isso permite concluir a hospedagem primeiro e conectar o Instagram depois.

# FlowPilot v0.8.2 — Personal

FlowPilot Personal is a private, single-user conversational automation implementation. It keeps the clean-room automation engine while simplifying deployment to **1 administrator + 1 workspace**, with Instagram Direct as the primary channel.

## Current status

Replica pipeline: `recon → architect → design → build → backend → test → diff → entrepreneur → brand → launch → deploy-preflight`.

- Weighted feature parity: **98/100** across 58 mapped features.
- Incomplete must-haves in the current matrix: **0**.
- Automated tests: **71/71 passing** in the current build.
- Personal mode provides private login, disables registration, workspace creation and billing, and seeds a starter Instagram automation. Production Postgres and live Instagram still require deployment validation.
- Personal mode disables public registration, workspace creation and Stripe checkout.
- Production startup now fails closed when Postgres, HTTPS origin, encryption key, private credentials, or Instagram app credentials are missing/weak.
- Postgres no longer seeds the demo account in personal/production mode.
- Graph API target: configurable through `META_GRAPH_VERSION` (development default currently `v26.0`; verify the provider's supported version before production deployment).
- Real external delivery uses official provider adapters, but end-to-end production delivery still depends on your approved Meta app, permissions, accounts, tokens and live policy configuration.

## Implemented

### Personal foundation and security
- Private login with PBKDF2-SHA512 hashing.
- Opaque HttpOnly sessions.
- `PERSONAL_MODE=true` locks the app to one authenticated owner and one workspace.
- Public registration, workspace creation and billing checkout are disabled in personal mode.
- Provider tokens encrypted at rest with AES-256-GCM.
- CSRF-origin guard for authenticated state-changing requests.
- Security headers including CSP, frame denial and content-type protection.
- API/auth/webhook rate limiting with configurable quotas.
- Structured JSON access/error logs and request IDs.
- Prometheus-compatible local/token-protected metrics endpoint.
- Workspace observability snapshot with queue health and latency percentiles.
- JSON development store and Postgres production driver.
- Postgres migrations plus Docker Compose.

### Automation
- Visual flow builder with multiple independent active flows per workspace.
- Reusable clean-room automation template gallery.
- Trigger, message, condition, action, delay, randomizer and functional AI nodes.
- Keyword trigger matching plus AI-intention classification.
- Condition branching.
- Uniform random branch selection.
- Tag actions plus custom-field assignment, named conversion events, sequence enrollment and protected external HTTP actions.
- Custom variables/templates such as `{{contact.name}}`, `{{fields.interesse}}`, `{{text}}` and `{{intent}}`.
- Durable continuation jobs for delay nodes and multi-step sequences.
- External HTTP/webhook action with interpolation, timeout/size controls and SSRF/private-network protection by default.
- Loop guard.
- AI Step runtime with deterministic local fallback and optional OpenAI-compatible provider.
- Media payloads in flow messages, broadcasts and Inbox sends.
- Simulation endpoint for deterministic local testing.

### Meta / messaging
- Instagram Business Login OAuth (`instagram_business_*` scopes) with short→long-lived token exchange.
- Automatic per-account Instagram webhook subscription after OAuth.
- Automatic scheduled Instagram long-lived token refresh.
- Authenticated Instagram connection diagnostics, resubscription and manual token refresh.
- Meta/Facebook OAuth remains available for WhatsApp and Messenger.
- Instagram and Messenger account discovery after OAuth.
- WhatsApp Cloud API text, template and media adapters.
- Instagram Messaging API text/media adapter.
- Messenger Send API text/media adapter and page webhook normalization.
- Telegram Bot API text/media adapter and secret-protected webhook ingestion.
- Meta webhook verification challenge.
- Raw-body `X-Hub-Signature-256` HMAC verification.
- Instagram/WhatsApp/Messenger webhook normalization plus Telegram update normalization.
- Event deduplication and tenant routing by provider account ID.
- Durable jobs with retry/backoff for inbound processing and outbound delivery.
- Compliance guard with explicit opt-out/opt-in handling.
- Configurable customer-care window.
- WhatsApp template requirement outside the configured session window.
- Inbox reply path that queues real delivery when the contact has a provider identifier.
- Workspace analytics endpoint/UI for flow entries/completions, edge/node execution, named conversions, sequences, provider distribution and delivery health.

### CRM and campaigns
- Contacts, tags and custom fields with CRM schema management.
- Search plus channel/status/tag filters.
- Bulk add/remove tag, set status and privacy-aware delete.
- CSV import with email/phone deduplication.
- Segment engine: channel/provider, status, `tagsAny`, `tagsAll`, query.
- Audience preview.
- Broadcast scheduling and server-side audience resolution at dispatch time.
- Fan-out to provider delivery jobs.
- Optional WhatsApp template broadcasts.
- Inbox, assignment and automation pause state.

### Privacy, recovery and commercial controls
- Contact data export endpoint and UI.
- Contact erasure endpoint that also removes associated conversations and pending contact jobs.
- Workspace backup export with SHA-256 checksum.
- Workspace restore validation and UI.
- Workspace audit trail.
- Plan entitlements for contacts, messages and automation runs.
- Monthly usage counters and enforcement.
- Stripe Checkout subscription session creation for Pro/Business upgrades.
- Signed Stripe webhook verification and workspace plan synchronization for checkout/subscription lifecycle events.
- Billing/usage status plus upgrade controls in Settings.

## Quick start — personal mode

Requires Node 22+.

```bash
cd flowpilot-clone
./start-personal.sh
```

Open `http://localhost:4173`.

Local personal-mode credentials for `./start-personal.sh`:

```text
Email: admin@flowpilot.local
Password: FlowPilotPersonal123!
```

These credentials are only for local development. **Do not use them in production.** Production credentials come from `PERSONAL_EMAIL` and `PERSONAL_PASSWORD`.

The default store is `data/db.json`. Delete that file to recreate the demo database from `data/seed.json`.

See `docs/PERSONAL_DEPLOY.md` for the shortest path from private deployment to a live Instagram DM test.
For Render, use `docs/RENDER_DEPLOY.md` and the root `render.yaml`.

## Postgres mode

```bash
npm install
docker compose up postgres -d
export STORAGE_DRIVER=postgres
export DATABASE_URL='postgres://flowpilot:flowpilot-dev@localhost:5432/flowpilot'
export APP_ENCRYPTION_KEY='replace-me-with-a-long-random-secret'
node server.js
```

Or:

```bash
docker compose up --build
```

`src/store/postgres-store.js` automatically applies all ordered SQL files in `db/migrations/`.

## Instagram production setup

For new Instagram Direct integrations FlowPilot uses **Instagram API with Instagram Login / Business Login for Instagram**. Configure:

```bash
export PUBLIC_BASE_URL='https://your-domain.example'
export INSTAGRAM_APP_ID='...'
export INSTAGRAM_APP_SECRET='...'
export META_WEBHOOK_VERIFY_TOKEN='...'
export INSTAGRAM_OAUTH_REDIRECT_URI='https://your-domain.example/api/oauth/instagram/callback'
export APP_ENCRYPTION_KEY='a-long-random-secret-at-least-32-characters'
```

The default requested Instagram scopes are `instagram_business_basic`, `instagram_business_manage_messages` and `instagram_business_manage_comments`. After OAuth, FlowPilot upgrades the token, resolves the professional account, subscribes `messages` and related webhook fields, encrypts the token, and schedules refresh before expiry.

See `docs/INSTAGRAM_LIVE_SETUP.md` for the exact Meta dashboard setup and end-to-end DM test. A production environment template is provided in `.env.production.example`.

For WhatsApp/Messenger via Meta/Facebook Login, additionally configure `META_APP_ID`, `META_APP_SECRET` and `META_OAUTH_REDIRECT_URI`.

Optional AI provider configuration:

```bash
export AI_BASE_URL='https://your-openai-compatible-endpoint.example/v1'
export AI_API_KEY='...'
export AI_MODEL='...'
```

Without those variables, AI nodes remain functional using the deterministic local classifier/fallback, which is useful for development and tests.

Optional Stripe subscription configuration:

```bash
export STRIPE_SECRET_KEY='sk_...'
export STRIPE_WEBHOOK_SECRET='whsec_...'
export STRIPE_PRICE_PRO='price_...'
export STRIPE_PRICE_BUSINESS='price_...'
export BILLING_RETURN_BASE_URL='https://your-domain.example'
```

Without these variables, upgrade buttons and checkout fail closed instead of creating an unverified payment path. Configure the Stripe webhook to `POST /api/webhooks/stripe`.

External HTTP actions block loopback/private/reserved targets by default. Keep `ALLOW_PRIVATE_HTTP_ACTIONS=false` in public deployments unless private-network callbacks are an intentional, reviewed requirement.

Webhook endpoint:

```text
GET/POST /api/webhooks/meta
POST /api/webhooks/telegram/:accountId
POST /api/integrations/telegram/webhook
```

## Main APIs

```text
GET  /api/health
GET  /api/ready
GET  /api/deployment/readiness
GET  /api/metrics
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/workspaces
POST /api/workspaces
GET  /api/state
PUT  /api/state
GET  /api/templates
GET/POST /api/custom-fields
DELETE /api/custom-fields/:key
GET/POST /api/sequences
DELETE /api/sequences/:id
POST /api/events
POST /api/contacts/import
POST /api/contacts/bulk
GET  /api/privacy/contacts/:id/export
DELETE /api/privacy/contacts/:id
POST /api/segments/preview
POST /api/broadcasts
GET  /api/jobs
GET  /api/audit
GET  /api/billing
POST /api/billing/checkout
POST /api/webhooks/stripe
GET  /api/observability
GET  /api/analytics
GET  /api/backups/export
POST /api/backups/restore
GET  /api/integrations
POST /api/integrations/:provider
DELETE /api/integrations/:provider
GET  /api/oauth/instagram/start
GET  /api/oauth/instagram/callback
GET  /api/integrations/instagram/diagnostics
POST /api/integrations/instagram/resubscribe
POST /api/integrations/instagram/refresh-token
GET  /api/oauth/meta/start
GET  /api/oauth/meta/callback
GET  /api/integrations/meta/accounts
POST /api/send
GET/POST /api/webhooks/meta
POST /api/webhooks/telegram/:accountId
POST /api/integrations/telegram/webhook
```

Tenant-owned APIs use the active session and `x-workspace-id`.

## Tests and parity

```bash
npm test
npm run parity
npm run check
```

Expected result: **71 tests passing** and **98/100 parity**.

## Remaining public-production work

The application-level core is now materially close to the current product target. Public launch still requires external and infrastructure work: Meta app review/permissions and live-account verification; Telegram webhook registration against a public HTTPS URL; real Stripe keys/Price IDs and production webhook configuration; automated database backups plus a restore drill; external alerting/tracing; production KMS/secret rotation; legal/privacy/DPA review; and trademark/domain clearance for the final brand. SMS, email and TikTok remain optional product-scope connectors and are the only incomplete items in the current parity matrix.
