# Parity report — v0.6

Current weighted parity: **98/100** across 58 mapped features.

Automated tests: **63/63 passing**.

## Core parity reached

- Authentication, sessions, RBAC and workspace isolation.
- Multiple active automation graphs plus a reusable clean-room template gallery.
- Keyword and AI-intention triggers, including normalized Instagram Story reply/mention and Live-comment events.
- Message, condition, action, delay, randomizer and AI nodes.
- Custom fields, variables/interpolation, durable sequences, named conversion events and external HTTP actions with SSRF protection.
- Durable delay/retry queue with correct `flowId` continuation.
- Contacts, tags, advanced custom-field filters, CSV import, bulk actions and segment engine.
- Inbox with real queue handoff for provider-addressable contacts.
- Broadcast segmentation, scheduling, fan-out and media payloads.
- Instagram, WhatsApp, Messenger and Telegram provider adapters.
- Meta OAuth scaffold, signed webhooks, Telegram webhook secret validation and idempotency.
- Postgres persistence path and migrations.
- Rate limits, security headers, audit trail and encrypted provider credentials.
- Messaging compliance guard, privacy export/erasure, backup/restore and operational metrics.
- Analytics for flow entries/completions, nodes/edges, named conversions, sequence steps, provider mix and delivery health.
- Plan/usage entitlements plus Stripe Checkout and signed Stripe webhook plan synchronization.

## Remaining incomplete features

Only three optional breadth connectors remain incomplete in the current matrix: **SMS, email and TikTok**. They are all `could` priorities and there are **zero incomplete must-haves**.

Public production deployment still depends on live provider credentials/approvals, real-account end-to-end verification, Stripe Price/Webhook configuration, production operations and legal/commercial review.
