const crypto=require('crypto');

function graphVersion(env=process.env){return env.META_GRAPH_VERSION||'v26.0'}
function providerScopes(provider,env=process.env){
  const custom=env.META_OAUTH_SCOPES;
  if(custom) return custom.split(',').map(s=>s.trim()).filter(Boolean);
  if(provider==='whatsapp') return ['business_management','whatsapp_business_management','whatsapp_business_messaging'];
  if(provider==='messenger') return ['public_profile','pages_show_list','pages_manage_metadata','pages_messaging'];
  return ['public_profile','pages_show_list','pages_manage_metadata','instagram_basic','instagram_manage_messages'];
}
function buildAuthorizationUrl({appId,redirectUri,state,provider,env=process.env}){
  if(!appId) throw new Error('META_APP_ID is required');
  const u=new URL(`https://www.facebook.com/${graphVersion(env)}/dialog/oauth`);
  u.searchParams.set('client_id',appId);
  u.searchParams.set('redirect_uri',redirectUri);
  u.searchParams.set('response_type','code');
  u.searchParams.set('state',state);
  u.searchParams.set('scope',providerScopes(provider,env).join(','));
  return u.toString();
}
async function exchangeCode({code,redirectUri,env=process.env}){
  if(!env.META_APP_ID||!env.META_APP_SECRET) throw new Error('Meta OAuth credentials are not configured');
  const u=new URL(`https://graph.facebook.com/${graphVersion(env)}/oauth/access_token`);
  u.searchParams.set('client_id',env.META_APP_ID);u.searchParams.set('client_secret',env.META_APP_SECRET);u.searchParams.set('redirect_uri',redirectUri);u.searchParams.set('code',code);
  const r=await fetch(u,{headers:{accept:'application/json'}});const data=await r.json().catch(()=>({}));if(!r.ok||data.error) throw new Error(`Meta OAuth ${r.status}: ${JSON.stringify(data)}`);return data;
}
function newOAuthState(){return crypto.randomBytes(24).toString('base64url')}
module.exports={graphVersion,providerScopes,buildAuthorizationUrl,exchangeCode,newOAuthState};
