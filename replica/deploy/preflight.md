# Production preflight — v0.4

## Core engineering gate

- [x] Auth/session implementation.
- [x] Workspace authorization/RBAC enforcement.
- [x] Postgres driver and ordered migrations.
- [x] Meta OAuth start/callback.
- [x] Verified webhook signatures and event idempotency.
- [x] Durable delay/retry/broadcast jobs.
- [x] Instagram/WhatsApp delivery adapters.
- [x] WhatsApp template adapter.
- [x] Token encryption at rest.
- [x] Messaging-window and explicit opt-out guard.
- [x] API/auth/webhook rate limiting.
- [x] Security headers and same-origin mutation guard.
- [x] Structured logs, request IDs and metrics endpoint.
- [x] Workspace observability snapshot.
- [x] App-level backup export/restore with checksum.
- [x] Contact privacy export/erasure workflows.
- [x] Plan entitlements and monthly usage accounting.
- [x] Segment engine, filters, bulk actions and broadcast fan-out.
- [x] 34 automated tests pass.
- [x] Weighted feature parity is 90/100 with zero incomplete must-haves.

## External/operational launch gate

- [ ] Configure a real Meta app and production redirect URI.
- [ ] Obtain required Meta permissions/app review for intended accounts/use cases.
- [ ] Run end-to-end tests against live Instagram and WhatsApp test assets.
- [ ] Revalidate exact provider policy/window/template rules for the approved app permissions before launch.
- [ ] Configure external logs/traces/alerts and on-call thresholds.
- [ ] Configure production secrets/KMS and rotation procedure.
- [ ] Configure automated Postgres backups and complete a restore drill.
- [ ] Connect a payment processor if paid self-service plans are required.
- [ ] Complete terms/privacy/DPA/legal review.
- [ ] Trademark/domain clearance for final brand.

**Core engineering gate: PASS. Public production launch gate: CONDITIONAL / NOT YET COMPLETE.**


## Instagram Direct production gate
- [ ] Public HTTPS origin configured in `PUBLIC_BASE_URL`.
- [ ] Instagram professional account (Business/Creator).
- [ ] Instagram Business Login App ID/Secret configured.
- [ ] Exact OAuth callback registered: `/api/oauth/instagram/callback`.
- [ ] Webhook callback registered: `/api/webhooks/meta`.
- [ ] `instagram_business_basic` + `instagram_business_manage_messages` approved for the intended accounts.
- [ ] Per-account `subscribed_apps` returns `messages`.
- [ ] Real DM from a second account creates inbound job and outbound reply.
- [ ] Token refresh job is scheduled.
