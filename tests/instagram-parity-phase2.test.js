const test=require('node:test');
const assert=require('node:assert/strict');
const instagram=require('../src/providers/instagram');
const {parseMetaWebhook}=require('../src/meta/webhooks');
const {executeFlow,interpolateQuickReplies}=require('../src/runtime');
const {getTemplate}=require('../src/automation-templates');

function fakeStore(state){const jobs=[];return{jobs,state,async enqueue(workspaceId,type,payload,runAt){const j={id:`job_${jobs.length+1}`,workspaceId,type,payload,runAt:runAt||new Date().toISOString()};jobs.push(j);return j},async setState(_id,s){this.state=s;return s},async getState(){return this.state}}}

test('Instagram quick replies are limited to 13 and titles to 20 chars',()=>{
  const input=Array.from({length:15},(_,i)=>({title:`Opção muito longa número ${i}`,payload:`P${i}`})),out=instagram.normalizeQuickReplies(input);
  assert.equal(out.length,13);assert.ok(out.every(x=>x.title.length<=20));assert.equal(out[0].content_type,'text');
});

test('Instagram webhook preserves quick reply payload and message id',()=>{
  const [e]=parseMetaWebhook({object:'instagram',entry:[{id:'ig1',messaging:[{sender:{id:'u1'},message:{mid:'mid_1',text:'Agendar',quick_reply:{payload:'AGENDAR'}}}]}]});
  assert.equal(e.type,'instagram_message');assert.equal(e.messageId,'mid_1');assert.equal(e.quickReplyPayload,'AGENDAR');assert.equal(e.metadata.quickReplyPayload,'AGENDAR');
});

test('condition nodes branch using Instagram quick reply payload',async()=>{
  const flow={id:'f1',name:'QR',live:true,nodes:[{id:'t',type:'trigger',config:{triggerType:'instagram_message'},body:''},{id:'c',type:'condition',body:''},{id:'a',type:'message',body:'agenda',config:{}},{id:'v',type:'message',body:'valores',config:{}}],edges:[{id:'e1',from:'t',to:'c'},{id:'e2',from:'c',to:'a',label:'AGENDAR'},{id:'e3',from:'c',to:'v',label:'VALORES'}]};
  const state={contacts:[],automations:[],flows:[flow],flow},store=fakeStore(state),r=await executeFlow({store,workspaceId:'ws',state,event:{type:'instagram_message',quickReplyPayload:'VALORES',provider:'instagram',recipientId:'u1'},enqueueDelivery:false});
  assert.equal(r.completed,true);assert.equal(r.steps.at(-1).output,'valores');
});

test('message nodes enqueue interpolated Instagram quick replies',async()=>{
  const flow={id:'f2',name:'Msg',live:true,nodes:[{id:'t',type:'trigger',config:{triggerType:'instagram_message'},body:''},{id:'m',type:'message',body:'Olá {{contact.name}}',config:{quickReplies:[{title:'Agendar',payload:'AGENDAR'}]}}],edges:[{id:'e1',from:'t',to:'m'}]};
  const state={contacts:[{id:'c1',name:'Ana'}],automations:[],flows:[flow],flow},store=fakeStore(state);await executeFlow({store,workspaceId:'ws',state,event:{type:'instagram_message',provider:'instagram',recipientId:'u1',contactId:'c1'}});
  const job=store.jobs.find(j=>j.type==='send_message');assert.equal(job.payload.text,'Olá Ana');assert.equal(job.payload.quickReplies[0].payload,'AGENDAR');
});

test('Instagram provider emits quick reply and reaction payloads',async()=>{
  const old=global.fetch,calls=[];global.fetch=async(url,opt)=>{calls.push({url:String(url),body:JSON.parse(opt.body)});return new Response(JSON.stringify({recipient_id:'u1'}),{status:200,headers:{'content-type':'application/json'}})};
  try{const env={META_GRAPH_VERSION:'v26.0',META_ACCESS_TOKEN:'token',INSTAGRAM_ACCOUNT_ID:'ig1',INSTAGRAM_LOGIN_MODE:'unified'};await instagram.sendText('u1','Escolha',env,{quickReplies:[{title:'Agendar',payload:'AGENDAR'}]});await instagram.reactToMessage('u1','mid_1','love',env);assert.equal(calls[0].body.message.quick_replies[0].payload,'AGENDAR');assert.equal(calls[1].body.sender_action,'react');assert.equal(calls[1].body.payload.message_id,'mid_1');assert.equal(calls[1].body.payload.reaction,'love')}finally{global.fetch=old}
});

test('Instagram media discovery requests visual fields without exposing token in URL',async()=>{
  const old=global.fetch;let seen;global.fetch=async(url,opt)=>{seen={url:String(url),headers:opt.headers};return new Response(JSON.stringify({data:[{id:'m1',media_type:'IMAGE'}]}),{status:200,headers:{'content-type':'application/json'}})};
  try{const env={META_GRAPH_VERSION:'v26.0',META_ACCESS_TOKEN:'secret-token',INSTAGRAM_ACCOUNT_ID:'ig1',INSTAGRAM_LOGIN_MODE:'unified'},r=await instagram.listMedia(env,{limit:12});assert.equal(r.data[0].id,'m1');assert.match(seen.url,/\/ig1\/media\?/);assert.match(seen.url,/thumbnail_url/);assert.doesNotMatch(seen.url,/secret-token/);assert.equal(seen.headers.authorization,'Bearer secret-token')}finally{global.fetch=old}
});

test('Story Mention template reacts before delayed reply',()=>{const t=getTemplate('instagram-story-mention'),react=t.flow.nodes.find(n=>n.config?.action==='instagram_react');assert.ok(react);assert.equal(react.config.reaction,'love');assert.ok(t.flow.edges.some(e=>e.from==='sm1'&&e.to===react.id))});

test('quick reply interpolation supports contact variables',()=>{const out=interpolateQuickReplies([{title:'Oi {{contact.name}}',payload:'P_{{contact.id}}'}],{contact:{id:'c1',name:'Ana'}});assert.equal(out[0].title,'Oi Ana');assert.equal(out[0].payload,'P_c1')});
