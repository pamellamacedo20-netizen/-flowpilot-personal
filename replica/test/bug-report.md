# Test / bug report — v0.3

Automated suite: **19/19 passing**.

Covered paths include health/static serving, auth, session cookies, tenant isolation, automation runtime, provider token redaction, durable queue creation, segment resolution, CSV import, broadcast scheduling/fan-out, Meta webhook verification, HMAC rejection, signed webhook deduplication, OAuth fail-closed behavior and audit events.

Known limitations are tracked as product gaps rather than test failures: live Meta credentials/app review are not available in this repository, so network delivery is not exercised in CI; Postgres integration requires the `pg` package and a running database; external provider policy/rate-limit handling remains pending.
