const crypto=require('crypto');

function graphVersion(env=process.env){return env.META_GRAPH_VERSION||'v26.0'}
function scopes(env=process.env){
  const custom=env.INSTAGRAM_OAUTH_SCOPES;
  if(custom)return custom.split(',').map(s=>s.trim()).filter(Boolean);
  return ['instagram_business_basic','instagram_business_manage_messages','instagram_business_manage_comments'];
}
function credentials(env=process.env){
  return {clientId:env.INSTAGRAM_APP_ID||'',clientSecret:env.INSTAGRAM_APP_SECRET||'',redirectUri:env.INSTAGRAM_OAUTH_REDIRECT_URI||''};
}
function buildAuthorizationUrl({clientId,redirectUri,state,env=process.env}={}){
  clientId=clientId||credentials(env).clientId;redirectUri=redirectUri||credentials(env).redirectUri;
  if(!clientId)throw new Error('INSTAGRAM_APP_ID is required');
  if(!redirectUri)throw new Error('INSTAGRAM_OAUTH_REDIRECT_URI is required');
  const u=new URL('https://www.instagram.com/oauth/authorize');
  u.searchParams.set('client_id',clientId);
  u.searchParams.set('redirect_uri',redirectUri);
  u.searchParams.set('response_type','code');
  u.searchParams.set('scope',scopes(env).join(','));
  u.searchParams.set('state',state);
  u.searchParams.set('force_reauth','true');
  u.searchParams.set('enable_fb_login','0');
  return u.toString();
}
async function exchangeCode({code,redirectUri,env=process.env,fetchImpl=fetch}={}){
  const {clientId,clientSecret}=credentials(env);redirectUri=redirectUri||credentials(env).redirectUri;
  if(!clientId||!clientSecret)throw new Error('Instagram OAuth credentials are not configured');
  if(!code)throw new Error('instagram_oauth_code_required');
  const body=new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:'authorization_code',redirect_uri:redirectUri,code:String(code).replace(/#_$/,'')});
  const r=await fetchImpl('https://api.instagram.com/oauth/access_token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','accept':'application/json'},body});
  const data=await r.json().catch(()=>({}));if(!r.ok||data.error_message||data.error)throw new Error(`Instagram OAuth ${r.status}: ${JSON.stringify(data)}`);
  const flat=data.access_token?data:Array.isArray(data.data)&&data.data.length===1?data.data[0]:null;if(!flat?.access_token)throw new Error('instagram_oauth_token_missing');return flat;
}
async function exchangeLongLivedToken(shortToken,{env=process.env,fetchImpl=fetch}={}){
  const {clientSecret}=credentials(env);if(!shortToken||!clientSecret)throw new Error('instagram_long_lived_exchange_missing_credentials');
  const u=new URL('https://graph.instagram.com/access_token');u.searchParams.set('grant_type','ig_exchange_token');u.searchParams.set('client_secret',clientSecret);u.searchParams.set('access_token',shortToken);
  const r=await fetchImpl(u,{headers:{accept:'application/json'}}),data=await r.json().catch(()=>({}));if(!r.ok||data.error)throw new Error(`Instagram long-lived token ${r.status}: ${JSON.stringify(data)}`);return data;
}
async function refreshLongLivedToken(token,{fetchImpl=fetch}={}){
  if(!token)throw new Error('instagram_access_token_required');const u=new URL('https://graph.instagram.com/refresh_access_token');u.searchParams.set('grant_type','ig_refresh_token');u.searchParams.set('access_token',token);
  const r=await fetchImpl(u,{headers:{accept:'application/json'}}),data=await r.json().catch(()=>({}));if(!r.ok||data.error)throw new Error(`Instagram refresh token ${r.status}: ${JSON.stringify(data)}`);return data;
}
async function getProfile(token,{env=process.env,fetchImpl=fetch}={}){
  if(!token)throw new Error('instagram_access_token_required');const u=new URL(`https://graph.instagram.com/${graphVersion(env)}/me`);u.searchParams.set('fields','id,user_id,username,account_type');u.searchParams.set('access_token',token);
  const r=await fetchImpl(u,{headers:{accept:'application/json'}}),data=await r.json().catch(()=>({}));if(!r.ok||data.error)throw new Error(`Instagram profile ${r.status}: ${JSON.stringify(data)}`);return data;
}
function webhookFields(env=process.env){return String(env.INSTAGRAM_WEBHOOK_FIELDS||'messages,message_edit,message_reactions,messaging_seen,comments').split(',').map(x=>x.trim()).filter(Boolean)}
async function subscribeWebhooks(token,{env=process.env,fetchImpl=fetch,fields=webhookFields(env)}={}){
  if(!token)throw new Error('instagram_access_token_required');const u=new URL(`https://graph.instagram.com/${graphVersion(env)}/me/subscribed_apps`);u.searchParams.set('subscribed_fields',fields.join(','));u.searchParams.set('access_token',token);
  const r=await fetchImpl(u,{method:'POST',headers:{accept:'application/json'}}),data=await r.json().catch(()=>({}));if(!r.ok||data.error||data.success===false)throw new Error(`Instagram webhook subscription ${r.status}: ${JSON.stringify(data)}`);return data;
}
async function getSubscriptions(token,{env=process.env,fetchImpl=fetch}={}){
  if(!token)throw new Error('instagram_access_token_required');const u=new URL(`https://graph.instagram.com/${graphVersion(env)}/me/subscribed_apps`);u.searchParams.set('access_token',token);
  const r=await fetchImpl(u,{headers:{accept:'application/json'}}),data=await r.json().catch(()=>({}));if(!r.ok||data.error)throw new Error(`Instagram webhook subscriptions ${r.status}: ${JSON.stringify(data)}`);return data;
}
async function setupFromCode({code,redirectUri,env=process.env,fetchImpl=fetch}={}){
  const short=await exchangeCode({code,redirectUri,env,fetchImpl});
  const long=await exchangeLongLivedToken(short.access_token,{env,fetchImpl});
  const token=long.access_token||short.access_token,profile=await getProfile(token,{env,fetchImpl}),subscription=await subscribeWebhooks(token,{env,fetchImpl});
  const accountId=String(profile.user_id||profile.id||short.user_id||'');if(!accountId)throw new Error('instagram_account_id_missing');
  return{token,accountId,profile,subscription,expiresIn:Number(long.expires_in||short.expires_in||0)||null,scopes:scopes(env)};
}
function newState(){return crypto.randomBytes(24).toString('base64url')}
module.exports={graphVersion,scopes,credentials,buildAuthorizationUrl,exchangeCode,exchangeLongLivedToken,refreshLongLivedToken,getProfile,webhookFields,subscribeWebhooks,getSubscriptions,setupFromCode,newState};


// Unified Login uses a Business Integration System User token on Facebook Graph.
// Legacy integrations remain available when INSTAGRAM_LOGIN_MODE is not unified.
const legacy = {...module.exports};
function isUnified(env=process.env){return env.INSTAGRAM_LOGIN_MODE==='unified'}
function unifiedCredentials(env){return {clientId:env.META_APP_ID||env.INSTAGRAM_APP_ID,clientSecret:env.META_APP_SECRET||env.INSTAGRAM_APP_SECRET}}
async function unifiedRequest(resource,token,{env=process.env,fetchImpl=fetch,method='GET',params={}}={}){
  const u=new URL(`https://graph.facebook.com/${graphVersion(env)}/${resource}`);
  for(const [k,v] of Object.entries(params))u.searchParams.set(k,String(v));
  const r=await fetchImpl(u,{method,headers:{authorization:`Bearer ${token}`,accept:'application/json'}});
  const data=await r.json().catch(()=>({}));
  // Never include provider payloads or URLs in errors: they can contain credentials.
  if(!r.ok||data.error||data.success===false)throw new Error(`instagram_unified_request_failed:${r.status}:${data.error?.code||'unknown'}`);
  return data;
}
async function unifiedProfile(token,options={}){
  const env=options.env||process.env;
  const data=await unifiedRequest('me/assigned_instagram_accounts',token,{...options,params:{fields:'id,username'}});
  const accounts=data.data||[],wanted=options.accountId||env.INSTAGRAM_ACCOUNT_ID;
  const profile=wanted?accounts.find(x=>String(x.id)===String(wanted)):(accounts.length===1?accounts[0]:null);
  if(!profile)throw new Error(accounts.length>1?'instagram_account_selection_required':'instagram_assigned_account_not_found');
  return profile;
}
function unifiedAuthorization({redirectUri,state,env=process.env}={}){
  const {clientId}=unifiedCredentials(env);
  const configId=env.INSTAGRAM_LOGIN_CONFIG_ID;
  redirectUri=redirectUri||env.INSTAGRAM_OAUTH_REDIRECT_URI;
  if(!clientId||!configId||!redirectUri||!state)throw new Error('instagram_unified_login_configuration_required');
  const u=new URL('https://www.facebook.com/dialog/oauth');
  for(const [k,v] of Object.entries({client_id:clientId,config_id:configId,redirect_uri:redirectUri,response_type:'code',display:'popup',prompt:'login',state}))u.searchParams.set(k,v);
  return u.toString();
}
async function unifiedExchange({code,redirectUri,env=process.env,fetchImpl=fetch}={}){
  const {clientId,clientSecret}=unifiedCredentials(env);
  if(!code||!clientId||!clientSecret)throw new Error('instagram_unified_credentials_or_code_missing');
  const u=new URL(`https://graph.facebook.com/${graphVersion(env)}/oauth/access_token`);
  for(const [k,v] of Object.entries({client_id:clientId,client_secret:clientSecret,code,redirect_uri:redirectUri||env.INSTAGRAM_OAUTH_REDIRECT_URI}))if(v)u.searchParams.set(k,v);
  const r=await fetchImpl(u,{headers:{accept:'application/json'}}),data=await r.json().catch(()=>({}));
  if(!r.ok||data.error||!data.access_token)throw new Error(`instagram_unified_token_exchange_failed:${r.status}`);
  return data;
}
async function unifiedSubscribe(token,options={}){
  const profile=await unifiedProfile(token,options);
  return unifiedRequest(`${encodeURIComponent(profile.id)}/subscribed_apps`,token,{...options,method:'POST',params:{subscribed_fields:(options.fields||webhookFields(options.env)).join(',')}});
}
module.exports.isUnified=isUnified;
module.exports.scopes=(env=process.env)=>isUnified(env)?['instagram_basic','instagram_manage_messages','instagram_manage_comments']:legacy.scopes(env);
module.exports.buildAuthorizationUrl=(options={})=>isUnified(options.env)?unifiedAuthorization(options):legacy.buildAuthorizationUrl(options);
module.exports.exchangeCode=(options={})=>isUnified(options.env)?unifiedExchange(options):legacy.exchangeCode(options);
module.exports.getProfile=(token,options={})=>isUnified(options.env)?unifiedProfile(token,options):legacy.getProfile(token,options);
module.exports.subscribeWebhooks=(token,options={})=>isUnified(options.env)?unifiedSubscribe(token,options):legacy.subscribeWebhooks(token,options);
module.exports.getSubscriptions=async(token,options={})=>{
  if(!isUnified(options.env))return legacy.getSubscriptions(token,options);
  const p=await unifiedProfile(token,options);return unifiedRequest(`${encodeURIComponent(p.id)}/subscribed_apps`,token,options);
};
module.exports.refreshLongLivedToken=async(token,options={})=>{
  if(isUnified(options.env))throw new Error('unified_token_requires_reauthorization');
  return legacy.refreshLongLivedToken(token,options);
};
module.exports.setupFromCode=async(options={})=>{
  if(!isUnified(options.env))return legacy.setupFromCode(options);
  const data=await unifiedExchange(options),token=data.access_token;
  const [profile,business]=await Promise.all([unifiedProfile(token,options),unifiedRequest('me',token,{...options,params:{fields:'client_business_id'}})]);
  if(!business.client_business_id)throw new Error('instagram_client_business_id_missing');
  const subscription=await unifiedSubscribe(token,{...options,accountId:profile.id});
  return {token,profile,subscription,accountId:String(profile.id),clientBusinessId:business.client_business_id,oauthKind:'unified_login',expiresIn:0,scopes:module.exports.scopes(options.env)};
};
