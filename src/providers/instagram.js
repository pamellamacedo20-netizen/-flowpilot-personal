function config(env=process.env){
  return {version:env.META_GRAPH_VERSION||'v26.0',token:env.META_ACCESS_TOKEN,accountId:env.INSTAGRAM_ACCOUNT_ID,base:env.INSTAGRAM_API_BASE||(env.INSTAGRAM_LOGIN_MODE==='unified'?'https://graph.facebook.com':'https://graph.instagram.com')};
}
async function graphRequest(resource,{method='POST',body=null,env=process.env}={}){
  const c=config(env);if(!c.token)throw new Error('Instagram access token is not configured');
  const endpoint=`${c.base}/${c.version}/${String(resource).replace(/^\/+/, '')}`;
  const options={method,headers:{authorization:`Bearer ${c.token}`,accept:'application/json'}};
  if(body!==null){options.headers['content-type']='application/json';options.body=JSON.stringify(body)}
  const r=await fetch(endpoint,options),data=await r.json().catch(()=>({}));
  if(!r.ok||data.error)throw new Error(`Instagram API ${r.status}: ${data.error?.code||'request_failed'}`);
  return data;
}
async function request(message,env=process.env){
  const c=config(env);if(!c.token||!c.accountId)throw new Error('Instagram credentials are not configured');
  return graphRequest(`${encodeURIComponent(c.accountId)}/messages`,{body:message,env});
}
function sendText(recipientId,text,env=process.env){return request({recipient:{id:recipientId},message:{text}},env)}
function sendMedia(recipientId,media,env=process.env){const type=media.type||'image';return request({recipient:{id:recipientId},message:{attachment:{type,payload:{url:media.url}}}},env)}
function replyToComment(commentId,text,env=process.env){
  if(!commentId)throw new Error('instagram_comment_id_required');
  return graphRequest(`${encodeURIComponent(commentId)}/replies`,{body:{message:String(text||'')},env});
}
function sendPrivateReply(commentId,text,env=process.env){
  if(!commentId)throw new Error('instagram_comment_id_required');
  const mode=env.INSTAGRAM_PRIVATE_REPLY_MODE||'comment_id_recipient';
  if(mode==='private_replies_edge')return graphRequest(`${encodeURIComponent(commentId)}/private_replies`,{body:{message:String(text||'')},env});
  const c=config(env);if(!c.accountId)throw new Error('Instagram account id is not configured');
  return graphRequest(`${encodeURIComponent(c.accountId)}/messages`,{body:{recipient:{comment_id:String(commentId)},message:{text:String(text||'')}},env});
}
module.exports={sendText,sendMedia,replyToComment,sendPrivateReply,config,graphRequest};
