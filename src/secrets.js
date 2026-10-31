const crypto = require('crypto');
function keyFromEnv(env=process.env){
  const raw = env.APP_ENCRYPTION_KEY || env.SESSION_SECRET || 'flowpilot-dev-key-change-me';
  return crypto.createHash('sha256').update(raw).digest();
}
function encryptString(value, env=process.env){
  if(value == null || value === '') return null;
  const iv=crypto.randomBytes(12), key=keyFromEnv(env), cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
  const encrypted=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}
function decryptString(value, env=process.env){
  if(!value) return null;
  const [version,ivB64,tagB64,dataB64]=String(value).split('.');
  if(version!=='v1') throw new Error('unsupported_secret_version');
  const decipher=crypto.createDecipheriv('aes-256-gcm',keyFromEnv(env),Buffer.from(ivB64,'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64,'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64,'base64url')),decipher.final()]).toString('utf8');
}
module.exports={encryptString,decryptString};
