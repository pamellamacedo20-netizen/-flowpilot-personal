const crypto = require('crypto');

const PBKDF2_ITERATIONS = 210000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function b64url(buf){ return Buffer.from(buf).toString('base64url'); }
function sha256(value){ return crypto.createHash('sha256').update(String(value)).digest('hex'); }
function normalizeEmail(email){ return String(email || '').trim().toLowerCase(); }

function hashPassword(password, salt = crypto.randomBytes(16)){
  if(typeof password !== 'string' || password.length < 10) throw new Error('password_must_have_10_chars');
  const digest = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha512');
  return `pbkdf2-sha512$${PBKDF2_ITERATIONS}$${b64url(salt)}$${b64url(digest)}`;
}

function verifyPassword(password, encoded){
  try{
    const [algo, iterations, saltB64, digestB64] = String(encoded).split('$');
    if(algo !== 'pbkdf2-sha512') return false;
    const salt = Buffer.from(saltB64, 'base64url');
    const expected = Buffer.from(digestB64, 'base64url');
    const actual = crypto.pbkdf2Sync(String(password), salt, Number(iterations), expected.length, 'sha512');
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }catch{ return false; }
}

function newSessionToken(){ return b64url(crypto.randomBytes(32)); }
function sessionRecord(userId, token, ttlMs = SESSION_TTL_MS){
  const now = Date.now();
  return { id:`ses_${crypto.randomUUID()}`, userId, tokenHash:sha256(token), createdAt:new Date(now).toISOString(), expiresAt:new Date(now + ttlMs).toISOString() };
}
function sessionCookie(token, {secure=false,maxAge=Math.floor(SESSION_TTL_MS/1000)}={}){
  return `fp_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure?'; Secure':''}`;
}
function clearSessionCookie({secure=false}={}){
  return `fp_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure?'; Secure':''}`;
}
function parseCookies(header=''){
  return String(header).split(';').map(v=>v.trim()).filter(Boolean).reduce((acc,pair)=>{
    const i=pair.indexOf('='); if(i<0) return acc;
    acc[pair.slice(0,i)] = decodeURIComponent(pair.slice(i+1)); return acc;
  },{});
}
function getSessionToken(req){
  const auth = req.headers.authorization || '';
  if(auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return parseCookies(req.headers.cookie || '').fp_session || '';
}

module.exports = { normalizeEmail, hashPassword, verifyPassword, newSessionToken, sessionRecord, sessionCookie, clearSessionCookie, getSessionToken, sha256, SESSION_TTL_MS };
