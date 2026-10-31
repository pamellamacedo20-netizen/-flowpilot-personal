# Entrepreneur pass — opportunity map

Research snapshot: public 2026 review pages from G2 and Capterra, not a complete census of all reviews.

Sources:
- https://www.g2.com/pt/products/manychat/reviews?qs=pros-and-cons
- https://www.g2.com/pt/products/manychat/reviews
- https://www.capterra.com/p/206636/ManyChat/reviews/

## Recurrent pain points visible in public reviews

1. Pricing/usage can feel difficult to predict, especially when usage is tied to active contacts.
2. Support latency is particularly painful when messaging access or billing is disrupted.
3. Account/channel connections can fail or disconnect and cause missed leads.
4. Large branched flows become difficult to maintain.
5. Users want clearer analytics and visibility into conversation performance.

## Product changes for FlowPilot

- **Usage meter before surprise billing:** realtime active-contact/message usage, forecast and hard budget alerts.
- **Connection health:** provider status, token expiry, webhook heartbeat, last successful inbound/outbound event and proactive reconnect alert.
- **Flow health:** unreachable-node detection, cycle warnings, missing fallback branches, duplicate-trigger detection and version snapshots.
- **Operational analytics:** conversion by trigger, node drop-off, response-time, delivery failures and automation-to-human handoff rate.
- **Transparent incident trail:** every provider/auth failure appears in a workspace event log rather than silently breaking an automation.

These differentiators should be treated as product requirements, not marketing claims, until implemented and measured.
