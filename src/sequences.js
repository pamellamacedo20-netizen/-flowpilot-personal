const {contextFor,interpolateDeep}=require('./templating');
function findSequence(state,id){return(state.sequences||[]).find(x=>x.id===id)||null}
function stepDelay(step){return Math.max(0,Number(step?.delayMs||0))}
async function enrollSequence({store,workspaceId,state,sequenceId,event}){
  const sequence=findSequence(state,sequenceId);if(!sequence)throw new Error('sequence_not_found');if(!event?.contactId)throw new Error('sequence_contact_required');
  const runAt=new Date(Date.now()+stepDelay(sequence.steps?.[0])).toISOString();const job=await store.enqueue(workspaceId,'sequence_step',{sequenceId,stepIndex:0,event,contactId:event.contactId},runAt);return{sequenceId,jobId:job.id,steps:sequence.steps?.length||0};
}
async function processSequenceStep({store,workspaceId,payload}){
  const state=await store.getState(workspaceId),sequence=findSequence(state,payload.sequenceId);if(!sequence)return{cancelled:true,reason:'sequence_not_found'};const contact=(state.contacts||[]).find(x=>x.id===payload.contactId);if(!contact)return{cancelled:true,reason:'contact_not_found'};if(String(contact.status||'').toLowerCase().includes('descadas'))return{cancelled:true,reason:'contact_opted_out'};
  const step=sequence.steps?.[payload.stepIndex];if(!step)return{complete:true};const ctx=contextFor({event:payload.event||{},contact,state}),rendered=interpolateDeep(step,ctx),provider=rendered.provider||contact.provider||String(contact.channel||'').toLowerCase(),to=contact.providerUserId||(provider==='whatsapp'?String(contact.phone||'').replace(/\D/g,''):'');if(to&&(rendered.text||rendered.media?.url||rendered.template?.name))await store.enqueue(workspaceId,'send_message',{provider,to,text:rendered.text||'',media:rendered.media||null,template:rendered.template||null,contactId:contact.id});
  const next=payload.stepIndex+1;if(sequence.steps?.[next])await store.enqueue(workspaceId,'sequence_step',{...payload,stepIndex:next},new Date(Date.now()+stepDelay(sequence.steps[next])).toISOString());state.analytics=state.analytics||{};state.analytics.sequenceSteps=Number(state.analytics.sequenceSteps||0)+1;await store.setState(workspaceId,state);return{sequenceId:sequence.id,stepIndex:payload.stepIndex,complete:!sequence.steps?.[next]};
}
module.exports={findSequence,stepDelay,enrollSequence,processSequenceStep};
