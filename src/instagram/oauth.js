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
