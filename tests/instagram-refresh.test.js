const test=require('node:test');
const assert=require('node:assert/strict');
const {encryptString,decryptString}=require('../src/secrets');
const {refreshInstagramConnection,instagramRefreshDelay}=require('../src/worker');

test('Instagram refresh is scheduled before token expiry',()=>{
  const d=instagramRefreshDelay(60*24*60*60);
  assert.equal(d,53*24*60*60*1000);
  assert.equal(instagramRefreshDelay(0),50*24*60*60*1000);
});

test('automatic Instagram token refresh replaces encrypted token and schedules next job',async()=>{
  const env={APP_ENCRYPTION_KEY:'a-very-long-test-encryption-key-123456789'};
  let connection={providerAccountId:'1784',encryptedAccessToken:encryptString('old-token',env),metadata:{expiresIn:100}};
  const jobs=[],audits=[];
  const store={
    async getConnection(){return connection},
    async upsertConnection(_w,_p,d){connection={...connection,...d};return connection},
    async enqueue(_w,type,payload,runAt,options){jobs.push({type,payload,runAt,options});return jobs.at(-1)},
    async audit(_w,_u,action,meta){audits.push({action,meta})}
  };
  const refreshFn=async token=>{assert.equal(token,'old-token');return{access_token:'new-token',expires_in:60*24*60*60}};
  const r=await refreshInstagramConnection(store,'ws1',{},env,refreshFn);
  assert.equal(decryptString(connection.encryptedAccessToken,env),'new-token');
  assert.equal(jobs.length,1);
  assert.equal(jobs[0].type,'refresh_instagram_token');
  assert.equal(audits[0].action,'instagram.token_auto_refreshed');
  assert.ok(r.nextRefreshAt);
});
