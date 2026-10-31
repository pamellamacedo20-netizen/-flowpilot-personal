const test=require('node:test');
const assert=require('node:assert/strict');
const oauth=require('../src/instagram/oauth');

const env={META_GRAPH_VERSION:'v26.0',INSTAGRAM_APP_ID:'ig_app_123',INSTAGRAM_APP_SECRET:'ig_secret',INSTAGRAM_OAUTH_REDIRECT_URI:'https://flow.example/api/oauth/instagram/callback'};

test('Instagram Business Login URL uses current business scopes and Instagram host',()=>{
  const url=new URL(oauth.buildAuthorizationUrl({state:'csrf123',env}));
  assert.equal(url.origin,'https://www.instagram.com');
  assert.equal(url.pathname,'/oauth/authorize');
  assert.equal(url.searchParams.get('client_id'),'ig_app_123');
  assert.equal(url.searchParams.get('state'),'csrf123');
  const scopes=url.searchParams.get('scope').split(',');
  assert.ok(scopes.includes('instagram_business_basic'));
  assert.ok(scopes.includes('instagram_business_manage_messages'));
});

test('Instagram setup exchanges code, upgrades token, resolves account and subscribes messages',async()=>{
  const calls=[];
  const fetchImpl=async(input,options={})=>{
    const url=String(input),method=options.method||'GET';calls.push({url,method,body:String(options.body||'')});
    if(url==='https://api.instagram.com/oauth/access_token')return new Response(JSON.stringify({access_token:'short',user_id:'app_scoped'}),{status:200,headers:{'content-type':'application/json'}});
    if(url.startsWith('https://graph.instagram.com/access_token'))return new Response(JSON.stringify({access_token:'long',token_type:'bearer',expires_in:5184000}),{status:200,headers:{'content-type':'application/json'}});
    if(url.includes('/v26.0/me?')&&!url.includes('subscribed_apps'))return new Response(JSON.stringify({id:'scoped_id',user_id:'178414000000001',username:'clinicdemo',account_type:'BUSINESS'}),{status:200,headers:{'content-type':'application/json'}});
    if(url.includes('/v26.0/me/subscribed_apps'))return new Response(JSON.stringify({success:true}),{status:200,headers:{'content-type':'application/json'}});
    throw new Error(`unexpected ${method} ${url}`);
  };
  const r=await oauth.setupFromCode({code:'code123',redirectUri:env.INSTAGRAM_OAUTH_REDIRECT_URI,env,fetchImpl});
  assert.equal(r.token,'long');
  assert.equal(r.accountId,'178414000000001');
  assert.equal(r.profile.username,'clinicdemo');
  assert.equal(r.subscription.success,true);
  assert.equal(calls[0].method,'POST');
  assert.match(calls[0].body,/grant_type=authorization_code/);
  assert.ok(calls.some(c=>c.url.includes('/me/subscribed_apps')&&c.url.includes('messages')));
});

test('Instagram token refresh uses graph.instagram.com refresh_access_token',async()=>{
  const fetchImpl=async input=>{const url=String(input);assert.match(url,/graph\.instagram\.com\/refresh_access_token/);assert.match(url,/grant_type=ig_refresh_token/);return new Response(JSON.stringify({access_token:'fresh',expires_in:5184000}),{status:200,headers:{'content-type':'application/json'}})};
  const r=await oauth.refreshLongLivedToken('old',{fetchImpl});assert.equal(r.access_token,'fresh');
});
