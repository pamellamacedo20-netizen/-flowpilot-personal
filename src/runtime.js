const {inferIntent,runAiStep}=require('./ai');
const {contextFor,interpolate}=require('./templating');
const {executeHttpAction}=require('./http-action');
const {enrollSequence}=require('./sequences');

function matchesTrigger(node,event){
  const c=node.config||{}; if(node.type!=='trigger')return false;
  if(c.triggerType==='ai_intent'){
    if(!event.intent)return false;
    if(Array.isArray(c.intents)&&c.intents.length){const names=c.intents.map(i=>typeof i==='string'?i:i.name);return names.includes(event.intent)}
    return event.intent!=='unknown';
  }
  if(c.triggerType&&c.triggerType!==event.type)return false;
  if(Array.isArray(c.keywords)&&c.keywords.length){const text=String(event.text||'').toLowerCase();if(!c.keywords.some(k=>c.keywordMatch==='exact'?text.trim()===String(k).trim().toLowerCase():text.includes(String(k).toLowerCase())))return false}
  return true;
}
function delayMs(node){const c=node.config||{};if(Number.isFinite(Number(c.delayMs)))return Math.max(0,Number(c.delayMs));const body=String(node.body||'').toLowerCase();const m=body.match(/(\d+)\s*(minuto|minutos|min|hora|horas|h|segundo|segundos|s)/);if(!m)return 3600000;const n=Number(m[1]);return /(hora|horas|h)/.test(m[2])?n*3600000:/(minuto|minutos|min)/.test(m[2])?n*60000:n*1000}
function enrichIntent(flow,event){
  if(event.intent)return event;
  const triggers=(flow.nodes||[]).filter(n=>n.type==='trigger'&&n.config?.triggerType==='ai_intent');
  if(!triggers.length)return event;
  const intents=triggers.flatMap(n=>Array.isArray(n.config?.intentDefinitions)?n.config.intentDefinitions:Array.isArray(n.config?.intents)?n.config.intents.filter(x=>typeof x==='object'):[]);
  if(!intents.length)return event;
  const result=inferIntent(event.text||'',intents,Math.min(...triggers.map(n=>Number(n.config?.threshold||1))));event.intent=result.intent;event.intentConfidence=result.confidence;return event;
}
function contactFor(state,event){return(state.contacts||[]).find(c=>c.id===event.contactId)||null}
function analytics(state){state.analytics=state.analytics||{};state.analytics.nodeRuns=state.analytics.nodeRuns||{};state.analytics.edgeRuns=state.analytics.edgeRuns||{};state.analytics.flowRunsById=state.analytics.flowRunsById||{};state.analytics.flowCompletions=state.analytics.flowCompletions||{};state.analytics.conversions=state.analytics.conversions||{};return state.analytics}
function recordConversion(state,key,node,event){const a=analytics(state),k=String(key||node.id);const item=a.conversions[k]||(a.conversions[k]={count:0,nodeId:node.id,name:node.name||k,contacts:{}});item.count+=1;if(event.contactId)item.contacts[event.contactId]=true;item.uniqueContacts=Object.keys(item.contacts).length;item.lastAt=new Date().toISOString();return item}
async function executeAction({node,event,state,store,workspaceId,httpFetch}){
  const cfg=node.config||{},contact=contactFor(state,event);if(!contact&&['add_tag','remove_tag','set_field','enroll_sequence'].includes(cfg.action))return null;
  if(cfg.action==='add_tag'){contact.tags=Array.from(new Set([...(contact.tags||[]),cfg.tag].filter(Boolean)));return{tag:cfg.tag}}
  if(cfg.action==='remove_tag'){contact.tags=(contact.tags||[]).filter(t=>t!==cfg.tag);return{tag:cfg.tag}}
  if(cfg.action==='set_field'){contact.fields=contact.fields||{};const ctx=contextFor({event,contact,state});contact.fields[String(cfg.field||'field')]=interpolate(String(cfg.value??''),ctx);return{field:cfg.field,value:contact.fields[String(cfg.field||'field')]}}
  if(cfg.action==='mark_conversion'){const item=recordConversion(state,cfg.conversionKey||node.id,node,event);return{conversionKey:cfg.conversionKey||node.id,count:item.count,uniqueContacts:item.uniqueContacts}}
  if(cfg.action==='enroll_sequence'){return enrollSequence({store,workspaceId,state,sequenceId:cfg.sequenceId,event})}
  if(cfg.action==='http_request'){
    const ctx=contextFor({event,contact,state}),result=await executeHttpAction(cfg.http||cfg,ctx,{fetchImpl:httpFetch||fetch});event.httpResponse=result.data;event.httpStatus=result.status;
    if(cfg.saveResponseToField&&contact){contact.fields=contact.fields||{};contact.fields[cfg.saveResponseToField]=typeof result.data==='string'?result.data:JSON.stringify(result.data)}
    return{status:result.status,ok:result.ok};
  }
  return null;
}
async function executeFlow({store,workspaceId,state,event,startNodeId=null,enqueueDelivery=true,httpFetch=null,flow:providedFlow=null}){
  const flow=providedFlow||state.flow;if(!flow||!flow.live)return{matched:false,steps:[]};enrichIntent(flow,event);
  let current=startNodeId?flow.nodes.find(n=>n.id===startNodeId):flow.nodes.find(n=>matchesTrigger(n,event));if(!current)return{matched:false,steps:[],intent:event.intent||null};
  const steps=[],visited=new Set(),a=analytics(state);a.flowRuns=Number(a.flowRuns||0)+1;a.flowRunsById[flow.id]=Number(a.flowRunsById[flow.id]||0)+1;
  let completed=false;
  while(current&&!visited.has(current.id)&&steps.length<50){
    visited.add(current.id);const contact=contactFor(state,event),ctx=contextFor({event,contact,state});let output=interpolate(current.body||'',ctx),actionResult=null;
    if(current.type==='action')actionResult=await executeAction({node:current,event,state,store,workspaceId,httpFetch});
    if(current.type==='ai'){
      const ai=await runAiStep(current,event);output=ai.text;event.aiOutput=ai.text;event.aiProvider=ai.provider;if(ai.intent){event.intent=ai.intent;event.intentConfidence=ai.confidence}
      if(enqueueDelivery&&current.config?.sendReply!==false&&event.provider&&event.recipientId&&ai.text)await store.enqueue(workspaceId,'send_message',{provider:event.provider,to:event.recipientId,text:ai.text,contactId:event.contactId,media:current.config?.media||null});
    }
    steps.push({id:current.id,type:current.type,name:current.name,output,intent:event.intent||null,aiProvider:event.aiProvider||null,actionResult});a.nodeRuns[current.id]=Number(a.nodeRuns[current.id]||0)+1;
    const nextEdges=flow.edges.filter(e=>e.from===current.id);let edge=nextEdges[0];if(current.type==='condition'){const answer=event.answer||event.intent||event.aiOutput||event.httpStatus;if(answer!=null)edge=nextEdges.find(e=>String(e.label||'').toLowerCase()===String(answer).toLowerCase())||edge}if(current.type==='randomizer'&&nextEdges.length)edge=nextEdges[Math.floor(Math.random()*nextEdges.length)];
    const next=edge?flow.nodes.find(n=>n.id===edge.to):null;if(edge)a.edgeRuns[edge.id]=Number(a.edgeRuns[edge.id]||0)+1;
    if(current.type==='message'&&enqueueDelivery&&event.provider&&event.recipientId&&(output||current.config?.media)){await store.enqueue(workspaceId,'send_message',{provider:event.provider,to:event.recipientId,text:output||'',media:current.config?.media||null,contactId:event.contactId});}
    if(current.type==='delay'&&next){const runAt=new Date(Date.now()+delayMs(current)).toISOString();await store.enqueue(workspaceId,'continue_flow',{event,startNodeId:next.id,flowId:flow.id},runAt);break}
    if(!next){completed=true;break}current=next;
  }
  if(completed)a.flowCompletions[flow.id]=Number(a.flowCompletions[flow.id]||0)+1;
  const automation=state.automations.find(x=>x.flowId===flow.id||x.name===flow.name);if(automation)automation.runs=(automation.runs||0)+1;await store.setState(workspaceId,state);
  return{matched:true,flowId:flow.id,steps,intent:event.intent||null,intentConfidence:event.intentConfidence||0,completed};
}
function flowsForState(state){const list=Array.isArray(state.flows)&&state.flows.length?state.flows:(state.flow?[state.flow]:[]);return list.filter(Boolean)}
async function executeMatchingFlows({store,workspaceId,state,event,enqueueDelivery=true,httpFetch=null}){
  const results=[];for(const flow of flowsForState(state)){if(!flow.live)continue;const probe={...event};enrichIntent(flow,probe);const trigger=(flow.nodes||[]).find(n=>matchesTrigger(n,probe));if(!trigger)continue;const result=await executeFlow({store,workspaceId,state,event:probe,enqueueDelivery,httpFetch,flow});if(result.matched)results.push(result)}
  const first=results[0]||null;return{matched:results.length>0,runs:results,matchedCount:results.length,intent:first?.intent||event.intent||null,flowId:first?.flowId||null,steps:first?.steps||[],completed:first?.completed||false};
}
module.exports={matchesTrigger,executeFlow,executeMatchingFlows,flowsForState,delayMs,enrichIntent,executeAction,recordConversion};
