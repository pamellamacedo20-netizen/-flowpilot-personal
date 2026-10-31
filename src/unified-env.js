'use strict';

// Preload compatibility shim for Instagram Unified Login.
// The Unified Login implementation uses Meta app credentials, while some
// legacy readiness/validation paths still read the older Instagram names.
// Keep a single source of truth in Render and alias it at process startup.
if (String(process.env.INSTAGRAM_LOGIN_MODE || '').toLowerCase() === 'unified') {
  if (!process.env.INSTAGRAM_APP_ID && process.env.META_APP_ID) {
    process.env.INSTAGRAM_APP_ID = process.env.META_APP_ID;
  }
  if (!process.env.INSTAGRAM_APP_SECRET && process.env.META_APP_SECRET) {
    process.env.INSTAGRAM_APP_SECRET = process.env.META_APP_SECRET;
  }
}
