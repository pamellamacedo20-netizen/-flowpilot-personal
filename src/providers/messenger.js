const {graphVersion}=require('../meta/oauth');
async function request(path,body,cfg=process.env){
  const token=cfg.META_ACCESS_TOKEN;if(!token)throw new Error('META_ACCESS_TOKEN_not_configured');const page=cfg.MESSENGER_PAGE_ID;if(!page)throw new Error('MESSENGER_PAGE_ID_not_configured');
  const url=new URL(`https://graph.facebook.com/${graphVersion()}/${page}/${path}`);url.searchParams.set('access_token',token);
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`messenger_error:${r.status}:${data.error?.message||'request_failed'}`);return data;
}
function sendText(to,text,cfg){return request('messages',{recipient:{id:String(to)},messaging_type:'RESPONSE',message:{text:String(text)}},cfg)}
function sendMedia(to,media,cfg){const type=media.type||'image';return request('messages',{recipient:{id:String(to)},messaging_type:'RESPONSE',message:{attachment:{type,payload:{url:media.url,is_reusable:true}}}},cfg)}
module.exports={sendText,sendMedia};
