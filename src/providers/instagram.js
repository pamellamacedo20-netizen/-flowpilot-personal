function config(env=process.env){
  return {version:env.META_GRAPH_VERSION||'v26.0',token:env.META_ACCESS_TOKEN,accountId:env.INSTAGRAM_ACCOUNT_ID,base:env.INSTAGRAM_API_BASE||(env.INSTAGRAM_LOGIN_MODE==='unified'?'https://graph.facebook.com':'https://graph.instagram.com')};
}
async function request(message,env=process.env){
  const c=config(env);if(!c.token||!c.accountId)throw new Error('Instagram credentials are not configured');const endpoint=`${c.base}/${c.version}/${encodeURIComponent(c.accountId)}/messages`;
  const r=await fetch(endpoint,{method:'POST',headers:{authorization:`Bearer ${c.token}`,'content-type':'application/json'},body:JSON.stringify(message)}),data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`Instagram API ${r.status}: ${JSON.stringify(data)}`);return data;
}
function sendText(recipientId,text,env=process.env){return request({recipient:{id:recipientId},message:{text}},env)}
function sendMedia(recipientId,media,env=process.env){const type=media.type||'image';return request({recipient:{id:recipientId},message:{attachment:{type,payload:{url:media.url}}}},env)}
module.exports={sendText,sendMedia,config};

