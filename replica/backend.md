# Backend implementation status — v0.6

## Implemented

- Auth: register/login/logout/me, PBKDF2 password hashes, HttpOnly sessions.
- Multi-workspace tenancy and server-side RBAC.
- JSON development storage plus Postgres production driver with ordered migrations.
- AES-256-GCM provider-token encryption.
- Meta OAuth start/callback and Instagram/Messenger account discovery.
- Meta webhook challenge/HMAC verification and Telegram secret-token webhook validation.
- Webhook normalization, tenant routing and idempotency.
- Durable jobs with retry/backoff and delay continuations.
- Instagram, WhatsApp, Messenger and Telegram text/media delivery adapters.
- AI-intention classifier and AI-step execution with local deterministic mode plus optional OpenAI-compatible endpoint.
- Multiple concurrently active automation flows with flow-scoped durable continuations.
- Custom fields, interpolation, durable sequences and named conversion actions.
- External HTTP action with DNS/IP SSRF protections, timeout and bounded response capture.
- Provider compliance guard: opt-out/opt-in, configurable session window and WhatsApp template requirement outside it.
- Contact CSV import, compound filtering and bulk actions.
- Segment preview, scheduled broadcast dispatch and fan-out.
- Workspace analytics endpoint/UI for flow/edge/node/conversion/sequence/provider/delivery metrics.
- Audit log, API/auth/webhook rate limiting, request IDs and Prometheus-style metrics.
- App-level workspace backup/restore with checksum validation.
- Contact privacy export/erasure operations.
- Plan entitlements and monthly usage counters.
- Stripe Checkout session creation and signed webhook workspace-plan synchronization.

## Still needed before unrestricted public production

- Live Meta app review, permissions and approved production credentials.
- Automated Telegram webhook registration in the actual public deployment environment and operational verification.
- External tracing/alert routing and SLO monitoring.
- Automated Postgres backups and a completed disaster-recovery restore drill.
- Production KMS/secret rotation procedure.
- Production Stripe credentials, Price IDs, webhook endpoint registration and billing-support workflow.
- Optional SMS/email/TikTok connectors if they are in product scope.
- Legal/privacy/DPA and final brand/domain review.
