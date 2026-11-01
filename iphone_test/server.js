import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 10000;
const BACKEND = process.env.GRAFTMAP_BACKEND_URL || 'https://graftmap-personal-v2.onrender.com';
const TOKEN = process.env.GRAFTMAP_API_TOKEN || '';
const sessions = new Map();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(raw.split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=');
    return [decodeURIComponent(v.slice(0, i)), decodeURIComponent(v.slice(i + 1))];
  }));
}
function isAuthed(req) {
  const sid = parseCookies(req).gm_session;
  if (!sid) return false;
  const expires = sessions.get(sid);
  if (!expires || expires < Date.now()) { sessions.delete(sid); return false; }
  return true;
}
function requireAuth(req, res, next) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'unauthorized' });
  next();
}
function safeEqual(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

app.get('/api/session', (req, res) => res.json({ authenticated: isAuthed(req) }));
app.post('/api/login', (req, res) => {
  if (!TOKEN) return res.status(503).json({ error: 'server_not_configured' });
  const supplied = req.body?.token || '';
  if (!safeEqual(supplied, TOKEN)) return res.status(401).json({ error: 'invalid_token' });
  const sid = crypto.randomUUID();
  sessions.set(sid, Date.now() + 24 * 60 * 60 * 1000);
  res.setHeader('Set-Cookie', `gm_session=${encodeURIComponent(sid)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);
  res.json({ ok: true });
});
app.post('/api/logout', requireAuth, (req, res) => {
  const sid = parseCookies(req).gm_session;
  if (sid) sessions.delete(sid);
  res.setHeader('Set-Cookie', 'gm_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
  res.json({ ok: true });
});

async function proxy(req, res, targetPath) {
  try {
    const headers = { Authorization: `Bearer ${TOKEN}` };
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
    const opts = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      opts.body = req;
      opts.duplex = 'half';
    }
    const upstream = await fetch(BACKEND + targetPath, opts);
    const body = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status);
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.send(body);
  } catch (err) {
    res.status(502).json({ error: 'proxy_failed', detail: String(err) });
  }
}

app.get('/api/graftmap/health', requireAuth, (req, res) => proxy(req, res, '/health'));
app.get('/api/graftmap/demo-mesh', requireAuth, (req, res) => proxy(req, res, '/v1/demo-mesh'));
app.post('/api/graftmap/uploads', requireAuth, (req, res) => proxy(req, res, '/v1/uploads'));
app.post('/api/graftmap/reconstruct', requireAuth, (req, res) => proxy(req, res, '/v1/reconstruct'));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`GraftMap iPhone Test listening on ${PORT}`));
