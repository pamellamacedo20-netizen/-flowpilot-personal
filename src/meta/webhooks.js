const crypto=require('crypto');
function stableEventId(provider,payload){return `${provider}_${crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0,32)}`}
function parseWhatsApp(body){
  const out=[];
  for(const entry of body.entry||[]) for(const change of entry.changes||[]){
    if(change.field!=='messages') continue; const v=change.value||{};
    for(const m of v.messages||[]){
      const text=m.text?.body || m.button?.text || m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || '';
      const media=[];for(const k of ['image','video','audio','document'])if(m[k])media.push({type:k,id:m[k].id,mimeType:m[k].mime_type||''});
      out.push({provider:'whatsapp',type:'whatsapp_message',providerEventId:m.id||stableEventId('whatsapp',m),recipientId:m.from,text,raw:m,media,metadata:v.metadata||{},contact:{name:v.contacts?.find(c=>c.wa_id===m.from)?.profile?.name||m.from,phone:m.from,providerUserId:m.from}});
    }
  }
  return out;
}
function parseInstagram(body){
  const out=[];
  for(const entry of body.entry||[]){
    for(const m of entry.messaging||[]){
      const msg=m.message||{},media=(msg.attachments||[]).map(a=>({type:a.type||'attachment',url:a.payload?.url||''})),storyReply=msg.reply_to?.story||null,storyMention=(msg.attachments||[]).find(a=>a.type==='story_mention')?.payload||m.referral?.story||null,type=storyReply?'instagram_story_reply':storyMention||m.referral?.source==='STORY_MENTION'?'instagram_story_mention':'instagram_message';out.push({provider:'instagram',type,providerEventId:msg.mid||m.referral?.ref||stableEventId('instagram',m),recipientId:m.sender?.id,text:msg.text||'',raw:m,media,story:storyReply||storyMention||null,contact:{name:m.sender?.id||'Instagram contact',providerUserId:m.sender?.id}});
    }
    for(const c of entry.changes||[]){
      if(c.field==='comments'||c.field==='live_comments'){
        const v=c.value||{};out.push({provider:'instagram',type:c.field==='live_comments'?'instagram_live_comment':'instagram_comment',providerEventId:v.id||stableEventId('instagram',c),recipientId:v.from?.id||v.from?.username||'',text:v.text||'',raw:c,contact:{name:v.from?.username||v.from?.id||'Instagram contact',providerUserId:v.from?.id||v.from?.username||''}})
      }
      if(c.field==='mentions'){
        const v=c.value||{};out.push({provider:'instagram',type:'instagram_story_mention',providerEventId:v.id||stableEventId('instagram',c),recipientId:v.from?.id||'',text:v.text||'',raw:c,contact:{name:v.from?.username||v.from?.id||'Instagram contact',providerUserId:v.from?.id||''}})
      }
    }
  }
  return out;
}
function parseMessenger(body){
  const out=[];for(const entry of body.entry||[])for(const m of entry.messaging||[]){const msg=m.message||{},sender=m.sender?.id;if(!sender)continue;out.push({provider:'messenger',type:'messenger_message',providerEventId:msg.mid||stableEventId('messenger',m),recipientId:sender,text:msg.text||'',raw:m,media:(msg.attachments||[]).map(a=>({type:a.type||'attachment',url:a.payload?.url||''})),contact:{name:sender,providerUserId:sender}})}return out;
}
function detectProvider(body){if(body.object==='whatsapp_business_account')return'whatsapp';if(body.object==='instagram')return'instagram';if(body.object==='page')return'messenger';return'unknown'}
function parseMetaWebhook(body){const provider=detectProvider(body);return provider==='whatsapp'?parseWhatsApp(body):provider==='instagram'?parseInstagram(body):provider==='messenger'?parseMessenger(body):[]}
module.exports={parseMetaWebhook,detectProvider,stableEventId,parseMessenger};
