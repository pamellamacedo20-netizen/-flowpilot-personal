import pg from 'pg';
const checks=[];
const add=(name,ok,detail='')=>checks.push({name,ok,detail});
const env=process.env;
const setupMode=String(env.SETUP_MODE||'false').toLowerCase()==='true';
const publicBase=String(env.PUBLIC_BASE_URL||'').trim() || (env.RENDER_EXTERNAL_HOSTNAME?`https://${env.RENDER_EXTERNAL_HOSTNAME}`:'');
add('NODE_ENV=production',env.NODE_ENV==='production',env.NODE_ENV||'ausente');
add('PERSONAL_MODE=true',String(env.PERSONAL_MODE).toLowerCase()==='true',env.PERSONAL_MODE||'ausente');
add('PERSONAL_EMAIL',Boolean(env.PERSONAL_EMAIL),env.PERSONAL_EMAIL?'configurado':'ausente');
add('PERSONAL_PASSWORD forte',String(env.PERSONAL_PASSWORD||'').length>=16,'mínimo 16 caracteres');
add('Postgres',env.STORAGE_DRIVER==='postgres'&&Boolean(env.DATABASE_URL),env.STORAGE_DRIVER||'ausente');
add('APP_ENCRYPTION_KEY',String(env.APP_ENCRYPTION_KEY||'').length>=32,'mínimo 32 caracteres');
add('Origem pública HTTPS',publicBase.startsWith('https://'),publicBase||'ausente');
if(!setupMode)add('Instagram App',Boolean(env.INSTAGRAM_APP_ID&&env.INSTAGRAM_APP_SECRET),env.INSTAGRAM_APP_ID?'configurado':'ausente');
else add('SETUP_MODE',true,'Instagram pode ser conectado após o primeiro deploy');
add('Webhook verify token',Boolean(env.META_WEBHOOK_VERIFY_TOKEN),env.META_WEBHOOK_VERIFY_TOKEN?'configurado':'ausente');
if(env.DATABASE_URL){
  const pool=new pg.Pool({connectionString:env.DATABASE_URL,ssl:env.PGSSL==='require'?{rejectUnauthorized:false}:undefined,connectionTimeoutMillis:5000});
  try{await pool.query('select 1');add('Conexão Postgres',true,'select 1 OK')}catch(e){add('Conexão Postgres',false,e.message)}finally{await pool.end().catch(()=>{})}
}
for(const c of checks)console.log(`${c.ok?'✓':'✗'} ${c.name}${c.detail?` — ${c.detail}`:''}`);
const failed=checks.filter(x=>!x.ok);
if(failed.length){console.error(`\nPreflight falhou: ${failed.length} item(ns).`);process.exit(1)}
console.log('\nPreflight aprovado.');
