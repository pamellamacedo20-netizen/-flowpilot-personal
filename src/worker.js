const {executeFlow,executeMatchingFlows,flowsForState}=require('./runtime');
const whatsapp=require('./providers/whatsapp');
const instagram=require('./providers/instagram');
const messenger=require('./providers/messenger');
const telegram=require('./providers/telegram');
const {decryptString,encryptString}=require('./secrets');
const {resolveSegment}=require('./segments');
const {evaluateOutbound}=require('./compliance');
const {billingSnapshot,enforce}=require('./billing');
const {processSequenceStep}=require('./sequences');
const instagramOAuth=require('./instagram/oauth');

async function workspaceBilling(store,workspaceId){
  const [workspace,state,usage]=await Promise.all([store.getWorkspace(workspaceId),store.getState(workspaceId),store.getUsage(workspaceId)]);
  return billingSnapshot(workspace,usage,(state?.contacts||[]).length);
}
async function sendViaConnection(store,workspaceId,payload,env=process.env){
  const [c,state]=await Promise.all([store.getConnection(workspaceId,payload.provider,payload.accountId||null),store.getState(workspaceId)]);
  if(!c)throw new Error(`No ${payload.provider} connection for workspace`);
  const contact=(state?.contacts||[]).find(x=>x.id===payload.contactId)||null;
  const compliance=evaluateOutbound({provider:payload.provider,contact,payload});
  if(!compliance.allowed){await store.audit(workspaceId,null,'compliance.blocked',{provider:payload.provider,contactId:payload.contactId||null,reason:compliance.reason});return{blocked:true,reason:compliance.reason}}
  const billing=await workspaceBilling(store,workspaceId);
  try{enforce(billing,'messages',1)}catch(e){await store.audit(workspaceId,null,'billing.blocked',{metric:'messages'});return{blocked:true,reason:'plan_limit_exceeded:messages'}}
  const token=decryptString(c.encryptedAccessToken,env),meta=c.metadata||{};
  let result;
  if(payload.provider==='whatsapp'){
    const cfg={...env,META_ACCESS_TOKEN:token,WA_PHONE_NUMBER_ID:meta.phoneNumberId||c.providerAccountId};
    result=payload.template?.name?await whatsapp.sendTemplate(payload.to,payload.template,cfg):payload.media?.url?await whatsapp.sendMedia(payload.to,payload.media,cfg):await whatsapp.sendText(payload.to,payload.text,cfg);
  }else if(payload.provider==='instagram'){
    const cfg={...env,META_ACCESS_TOKEN:token,INSTAGRAM_ACCOUNT_ID:meta.instagramAccountId||c.providerAccountId};
    result=payload.media?.url?await instagram.sendMedia?.(payload.to,payload.media,cfg)||await instagram.sendText(payload.to,payload.text,cfg):await instagram.sendText(payload.to,payload.text,cfg);
  }else if(payload.provider==='messenger'){
    const cfg={...env,META_ACCESS_TOKEN:token,MESSENGER_PAGE_ID:meta.pageId||c.providerAccountId};result=payload.media?.url?await messenger.sendMedia(payload.to,payload.media,cfg):await messenger.sendText(payload.to,payload.text,cfg);
  }else if(payload.provider==='telegram'){
    const cfg={...env,TELEGRAM_BOT_TOKEN:token};result=payload.media?.url?await telegram.sendMedia(payload.to,payload.media,cfg):await telegram.sendText(payload.to,payload.text,cfg);
  }else throw new Error(`Unsupported delivery provider: ${payload.provider}`);
  await store.incrementUsage(workspaceId,'messages',1);
  return{...result,complianceMode:compliance.mode};
}
async function dispatchBroadcast(store,workspaceId,payload){
  const state=await store.getState(workspaceId),b=(state.broadcasts||[]).find(x=>x.id===payload.broadcastId);if(!b)throw new Error('broadcast_not_found');if(['queued','sent'].includes(b.status))return{alreadyDispatched:true};
  const contacts=resolveSegment(state.contacts||[],b.segment||{});let queued=0,skipped=0;for(const c of contacts){const provider=b.provider||String(b.channel||'').toLowerCase(),to=provider==='whatsapp'?(c.providerUserId||String(c.phone||'').replace(/\D/g,'')):c.providerUserId;if(!to){skipped++;continue}await store.enqueue(workspaceId,'send_message',{provider,to,text:b.message,template:b.template||null,media:b.media||null,contactId:c.id});queued++}
  b.status='queued';b.queuedAt=new Date().toISOString();b.queuedCount=queued;b.skippedCount=skipped;await store.setState(workspaceId,state);return{queued,skipped,audience:contacts.length};
}
function instagramRefreshDelay(expiresIn){const ms=Number(expiresIn||0)*1000;if(!ms)return 50*24*60*60*1000;return Math.max(24*60*60*1000,ms-7*24*60*60*1000)}
async function refreshInstagramConnection(store,workspaceId,payload={},env=process.env,refreshFn=instagramOAuth.refreshLongLivedToken){
  const c=await store.getConnection(workspaceId,'instagram',payload.accountId||null);if(!c)throw new Error('instagram_connection_not_found');const current=decryptString(c.encryptedAccessToken,env),fresh=await refreshFn(current,{env}),token=fresh.access_token||current,expiresIn=Number(fresh.expires_in||c.metadata?.expiresIn||0)||null,expiresAt=expiresIn?new Date(Date.now()+expiresIn*1000).toISOString():null,metadata={...(c.metadata||{}),expiresIn,expiresAt,tokenRefreshedAt:new Date().toISOString()};await store.upsertConnection(workspaceId,'instagram',{providerAccountId:c.providerAccountId,encryptedAccessToken:encryptString(token,env),status:'connected',metadata});const runAt=new Date(Date.now()+instagramRefreshDelay(expiresIn)).toISOString();await store.enqueue(workspaceId,'refresh_instagram_token',{accountId:c.providerAccountId},runAt,{maxAttempts:5});await store.audit(workspaceId,null,'instagram.token_auto_refreshed',{providerAccountId:c.providerAccountId,expiresAt,nextRefreshAt:runAt});return{ok:true,expiresAt,nextRefreshAt:runAt};
}
async function processJob(store,job){
  if(job.type==='send_message')return sendViaConnection(store,job.workspaceId,job.payload);
  if(job.type==='process_event'){
    const billing=await workspaceBilling(store,job.workspaceId);try{enforce(billing,'automation_runs',1)}catch{return{blocked:true,reason:'plan_limit_exceeded:automation_runs'}}
    const state=await store.getState(job.workspaceId),result=await executeMatchingFlows({store,workspaceId:job.workspaceId,state,event:job.payload.event});if(result.matchedCount)await store.incrementUsage(job.workspaceId,'automation_runs',result.matchedCount);return result;
  }
  if(job.type==='broadcast_dispatch')return dispatchBroadcast(store,job.workspaceId,job.payload);
  if(job.type==='continue_flow'){const state=await store.getState(job.workspaceId),flow=flowsForState(state).find(x=>x.id===job.payload.flowId)||state.flow;return executeFlow({store,workspaceId:job.workspaceId,state,event:job.payload.event,startNodeId:job.payload.startNodeId,flow})}
  if(job.type==='sequence_step')return processSequenceStep({store,workspaceId:job.workspaceId,payload:job.payload});
  if(job.type==='refresh_instagram_token')return refreshInstagramConnection(store,job.workspaceId,job.payload,process.env);
  throw new Error(`Unknown job type: ${job.type}`);
}
function startWorker(store,{intervalMs=250,enabled=true,metrics=null}={}){if(!enabled)return()=>{};let stopped=false,busy=false;const timer=setInterval(async()=>{if(stopped||busy)return;busy=true;try{for(let i=0;i<10;i++){const job=await store.claimDueJob(new Date());if(!job)break;metrics?.inc('jobs_claimed_total');try{const result=await processJob(store,job);await store.completeJob(job.id,result||null);metrics?.inc('jobs_completed_total');if(result?.blocked)metrics?.inc('jobs_blocked_total')}catch(e){await store.failJob(job.id,e);metrics?.inc('jobs_failed_total')}}}finally{busy=false}},intervalMs);timer.unref?.();return()=>{stopped=true;clearInterval(timer)}}
module.exports={startWorker,processJob,sendViaConnection,dispatchBroadcast,workspaceBilling,refreshInstagramConnection,instagramRefreshDelay};
