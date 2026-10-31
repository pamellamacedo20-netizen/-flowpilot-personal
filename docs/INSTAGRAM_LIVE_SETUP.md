# Instagram Direct — production setup

This project uses **Instagram API with Instagram Login / Business Login for Instagram** for new Instagram DM connections.

## What the application already does

- Starts Instagram OAuth on `https://www.instagram.com/oauth/authorize`.
- Requests `instagram_business_basic`, `instagram_business_manage_messages` and `instagram_business_manage_comments` by default.
- Exchanges the authorization code server-side.
- Upgrades the short-lived token to a long-lived Instagram User access token.
- Resolves the professional account ID/username.
- Subscribes the connected account to configured webhook fields, including `messages`.
- Stores the token encrypted at rest.
- Routes inbound Instagram webhook events to the correct workspace.
- Queues automation execution and outbound replies.
- Schedules token refresh before expiry.
- Provides an authenticated diagnostics endpoint and UI.

## Required Meta account setup

1. The Instagram account must be **Professional** (Business or Creator).
2. Create/configure a Meta app with the Instagram use case and **API setup with Instagram login**.
3. Copy the Instagram-specific App ID and App Secret into the deployment environment.
4. Register the exact OAuth callback URL:

   `https://YOUR_DOMAIN/api/oauth/instagram/callback`

5. Configure the Instagram webhook callback URL:

   `https://YOUR_DOMAIN/api/webhooks/meta`

6. Use the same value configured in `META_WEBHOOK_VERIFY_TOKEN` as the webhook Verify Token in the Meta dashboard.
7. Subscribe the app to the Instagram webhook fields required for messaging. FlowPilot also performs the per-account `subscribed_apps` call after OAuth.
8. Enable messaging access/connected tools for the Instagram professional account if the Instagram account settings require it.
9. For accounts outside your app roles/testers, complete the required Meta App Review / Advanced Access and put the app in the appropriate live mode.

## Required production environment variables

```env
NODE_ENV=production
PUBLIC_BASE_URL=https://YOUR_DOMAIN
STORAGE_DRIVER=postgres
DATABASE_URL=postgresql://...
PGSSL=require
APP_ENCRYPTION_KEY=<32+ random characters>

META_GRAPH_VERSION=v26.0
INSTAGRAM_APP_ID=<Instagram app ID>
INSTAGRAM_APP_SECRET=<Instagram app secret>
INSTAGRAM_OAUTH_REDIRECT_URI=https://YOUR_DOMAIN/api/oauth/instagram/callback
INSTAGRAM_OAUTH_SCOPES=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments
INSTAGRAM_WEBHOOK_FIELDS=messages,message_edit,message_reactions,messaging_seen,comments
META_WEBHOOK_VERIFY_TOKEN=<random verify token>
```

If Meta signs Instagram webhook payloads with a secret that differs from the OAuth Instagram app secret in your app configuration, set `INSTAGRAM_WEBHOOK_SECRET` as well. FlowPilot accepts configured Instagram webhook secret, Instagram app secret, or the Meta app secret as valid candidates for Instagram payload signature verification.

## Connect the account

1. Sign in to FlowPilot.
2. Open **Configurações**.
3. Click **Conectar** next to Instagram.
4. Complete the Instagram consent screen.
5. FlowPilot redirects back and automatically stores the account/token and subscribes webhooks.
6. Click **Diagnosticar Instagram**. A healthy connection should show `ready`, the account profile and returned `subscribed_apps` data.

## Create a real DM auto-reply

Use the built-in template **DM do Instagram → resposta automática**, or create a flow with:

- Trigger type: `instagram_message`
- Message or AI Step
- Optional tag/custom field/conversion action
- Flow status: active

A simple deterministic flow can use a Message block. An AI Step can use the local fallback or an OpenAI-compatible provider configured by environment variables.

## End-to-end test

Use another Instagram account to send a new DM to the connected professional account. Do not use a synthetic dashboard test as the only validation.

Expected pipeline:

`Instagram DM → Meta webhook → /api/webhooks/meta → contact upsert → durable process_event job → matching flow → send_message job → graph.instagram.com/{IG_ID}/messages`

Check:

- **Inbox** for the new contact/message.
- **Configurações → Ver fila** for `process_event` and `send_message` jobs.
- **Analytics** for flow executions and delivery counters.
- **Configurações → Diagnosticar Instagram** for token/subscription health.

## Diagnostics API

Authenticated workspace endpoints:

```text
GET  /api/integrations/instagram/diagnostics
POST /api/integrations/instagram/resubscribe
POST /api/integrations/instagram/refresh-token
GET  /api/deployment/readiness
```

## Important platform constraint

The Instagram Messaging API is intended for conversations initiated by an Instagram user. Do not treat the DM adapter as an unrestricted cold outbound messaging channel. Use current Meta policy and review requirements before production launch.
