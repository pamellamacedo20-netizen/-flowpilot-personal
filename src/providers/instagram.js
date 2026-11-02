function config(env=process.env){
  return {version:env.META_GRAPH_VERSION||'v26.0',token:env.META_ACCESS_TOKEN,accountId:env.INSTAGRAM_ACCOUNT_ID,base:env.INSTAGRAM_API_BASE||(env.INSTAGRAM_LOGIN_MODE==='unified'?'https://graph.facebook.com':'https://graph.instagram.com')};
}
async function graphRequest(resource,{method='POST',body=null,params=null,env=process.env}={}){
  const c=config(env);if(!c.token)throw new Error('Instagram access token is not configured');
  const endpoint=new URL(`${c.base}/${c.version}/${String(resource).replace(/^\/+/, '')}`);
  for(const [k,v] of Object.entries(params||{}))if(v!==undefined&&v!==null&&v!=='')endpoint.searchParams.set(k,String(v));
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
function normalizeQuickReplies(items=[]){
  return (Array.isArray(items)?items:[]).slice(0,13).map((q,i)=>({content_type:q.content_type||q.contentType||'text',title:String(q.title||q.text||`Opção ${i+1}`).slice(0,20),payload:String(q.payload||q.value||q.title||`option_${i+1}`).slice(0,1000),...(q.image_url||q.imageUrl?{image_url:q.image_url||q.imageUrl}:{})}));
}
function sendText(recipientId,text,env=process.env,extras={}){
  const quickReplies=normalizeQuickReplies(extras.quickReplies||extras.quick_replies||[]),message={text:String(text||'')};if(quickReplies.length)message.quick_replies=quickReplies;return request({recipient:{id:recipientId},message},env)
}
function sendMedia(recipientId,media,env=process.env){const type=media.type||'image';return request({recipient:{id:recipientId},message:{attachment:{type,payload:{url:media.url}}}},env)}
function reactToMessage(recipientId,messageId,reaction='love',env=process.env){
  if(!recipientId||!messageId)throw new Error('instagram_reaction_recipient_and_message_required');return request({recipient:{id:recipientId},sender_action:'react',payload:{message_id:String(messageId),reaction:String(reaction||'love')}},env)
}
function unreactToMessage(recipientId,messageId,env=process.env){
  if(!recipientId||!messageId)throw new Error('instagram_reaction_recipient_and_message_required');return request({recipient:{id:recipientId},sender_action:'unreact',payload:{message_id:String(messageId)}},env)
}
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
async function listMedia(env=process.env,{limit=25,after=null}={}){
  const c=config(env);if(!c.accountId)throw new Error('Instagram account id is not configured');const fields='id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,comments_count';return graphRequest(`${encodeURIComponent(c.accountId)}/media`,{method:'GET',params:{fields,limit:Math.max(1,Math.min(50,Number(limit)||25)),after},env});
}
module.exports={sendText,sendMedia,replyToComment,sendPrivateReply,reactToMessage,unreactToMessage,listMedia,normalizeQuickReplies,config,graphRequest};
