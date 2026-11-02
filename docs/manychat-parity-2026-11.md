# FlowPilot vs ManyChat — Instagram parity audit (2026-11)

Status: ✅ equivalent for current private-use goals · 🟡 partial · ❌ missing · ⚪ not prioritized

| Capability | FlowPilot | Status | Next action |
|---|---|---:|---|
| Instagram Unified Login | Implemented | ✅ | Keep current Meta connection path |
| DM received trigger | Implemented | ✅ | End-to-end production verification |
| Keyword trigger in DM | Implemented | ✅ | Expand match modes and exclusions |
| Story reply trigger | Webhook normalized | 🟡 | Expose dedicated trigger configuration + rate policy |
| Story mention trigger | Webhook normalized | 🟡 | Expose dedicated trigger configuration + 24h frequency option |
| Post/Reel comment trigger | Webhook normalized | 🟡 | Add post scope, include/exclude/any-comment filters, public/private reply actions |
| Live comment trigger | Webhook normalized | 🟡 | Add dedicated UI and live-only private reply constraints |
| Default reply | Generic DM trigger can approximate | 🟡 | Add explicit default-reply trigger and once-per-24h option |
| Comment public auto-reply rotation | Not implemented | ❌ | Add comment-reply delivery job + variation rotation |
| Comment → private DM | Generic send path not sufficient for first-contact comment | ❌ | Add private-reply-by-comment-id action and Meta policy guard |
| Specific / all / next post scope | Not implemented | ❌ | Add media scope metadata and next-post binding |
| Follow-to-DM | Not implemented | ❌ | Add only when account is Meta-eligible; feature is beta |
| Instagram Ads trigger | Not implemented | ❌ | Add only if needed for Ads Manager campaigns |
| Inbox | Implemented | ✅ | Improve Instagram-specific metadata display |
| Tags/custom fields | Implemented | ✅ | No blocker |
| Conditions/randomizer/delay | Implemented | ✅ | No blocker |
| Sequences | Implemented | ✅ | Respect Instagram messaging windows |
| AI step | OpenAI-compatible + local fallback | 🟡 | Configure real provider + structured goals/context/tasks |
| Analytics/conversions | Implemented | 🟡 | Add IG trigger/source attribution |
| Durable queue/retries | Implemented | ✅ | No blocker |
| Token refresh | Implemented | ✅ | Production verification |
| Webhook HMAC verification | Implemented | ✅ | No blocker |
| Persistent Postgres | Implemented on Render free DB | 🟡 | Move to non-expiring DB before 2026-11-30 |
| Multi-user/billing SaaS | Present but unnecessary for private installation | ⚪ | Do not prioritize |
| SMS/email/TikTok parity | Not implemented | ⚪ | Outside current scope |

## Priority order

1. Complete and verify Instagram OAuth + real webhook routing.
2. Post/Reel comments: filters, public reply rotation, private reply by comment ID.
3. Story reply + Story mention dedicated triggers.
4. Default reply + once-per-24h controls.
5. Live comments.
6. Configure real AI provider and enrich AI Step UX.
7. Only then evaluate Follow-to-DM and Ads triggers.

## Clean-room boundary

This project targets behavioral parity for the owner's private workflows. It does not copy ManyChat source code, assets, private APIs, text, branding, or proprietary implementation details.
