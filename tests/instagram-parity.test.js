const test=require('node:test');
const assert=require('node:assert/strict');
const {matchesTrigger,keywordMatches,executeAction,executeMatchingFlows}=require('../src/runtime');
const {parseMetaWebhook}=require('../src/meta/webhooks');
const instagram=require('../src/providers/instagram');
const {getTemplate}=require('../src/automation-templates');

function fakeStore(state){
  const jobs=[];
  return{jobs,state,async enqueue(workspaceId,type,payload,runAt){const j={id:`job_${jobs.length+1}`,workspaceId,type,payload,runAt:runAt||new Date().toISOString()};jobs.push(j);return j},async setState(_id,s){this.state=s;return s},async getState(){return this.state}};
}

test('keyword matcher supports contains, exact, starts-with and full-word modes',()=>{
  assert.equal(keywordMatches('Quero o link agora','link','contains'),true);
  assert.equal(keywordMatches('LINK','link','exact'),true);
  assert.equal(keywordMatches('link por favor','link','starts_with'),true);
  assert.equal(keywordMatches('quero o link, por favor','link','full_word'),true);
  assert.equal(keywordMatches('blink','link','full_word'),false);
});

test('Instagram comment trigger supports include and exclude keywords',()=>{
  const node={type:'trigger',config:{triggerType:'instagram_comment',keywords:['quero'],excludeKeywords:['spam'],keywordMatch:'contains'}};
  assert.equal(matchesTrigger(node,{type:'instagram_comment',text:'Eu quero saber mais'}),true);
  assert.equal(matchesTrigger(node,{type:'instagram_comment',text:'quero spam agora'}),false);
  assert.equal(matchesTrigger(node,{type:'instagram_comment',text:'somente informação'}),false);
});

test('Instagram comment trigger can match any comment on a specific media id',()=>{
  const node={type:'trigger',config:{triggerType:'instagram_comment',anyComment:true,mediaScope:'specific',mediaIds:['media_123']}};
  assert.equal(matchesTrigger(node,{type:'instagram_comment',text:'oi',mediaId:'media_123'}),true);
  assert.equal(matchesTrigger(node,{type:'instagram_comment',text:'oi',mediaId:'media_999'}),false);
});

test('Instagram webhook parser preserves comment and media metadata',()=>{
  const events=parseMetaWebhook({object:'instagram',entry:[{id:'ig1',changes:[{field:'comments',value:{id:'comment_1',text:'QUERO',media:{id:'media_123'},created_time:'2026-11-02T12:00:00Z',from:{id:'user_1',username:'ana'}}}]}]});
  assert.equal(events.length,1);
  assert.equal(events[0].type,'instagram_comment');
  assert.equal(events[0].commentId,'comment_1');
  assert.equal(events[0].mediaId,'media_123');
  assert.equal(events[0].metadata.username,'ana');
});

test('live comment trigger supports exact matching',()=>{
  const node={type:'trigger',config:{triggerType:'instagram_live_comment',keywords:['teste'],keywordMatch:'exact'}};
  assert.equal(matchesTrigger(node,{type:'instagram_live_comment',text:'teste'}),true);
  assert.equal(matchesTrigger(node,{type:'instagram_live_comment',text:'teste agora'}),false);
});

test('Instagram default reply can be restricted to DMs and excludes story replies',()=>{
  const node={type:'trigger',config:{triggerType:'instagram_default_reply',dmOnly:true,anyMessage:true}};
  assert.equal(matchesTrigger(node,{type:'instagram_message',text:'oi'}),true);
  assert.equal(matchesTrigger(node,{type:'instagram_story_reply',text:'amei'}),false);
});

test('specific Instagram automation wins before default reply',async()=>{
  const specific={id:'specific',name:'Specific',live:true,nodes:[{id:'s1',type:'trigger',config:{triggerType:'instagram_message',keywords:['preço']}},{id:'s2',type:'message',body:'valor'}],edges:[{id:'se',from:'s1',to:'s2'}]};
  const fallback={id:'fallback',name:'Fallback',live:true,nodes:[{id:'f1',type:'trigger',config:{triggerType:'instagram_default_reply',dmOnly:true,anyMessage:true}},{id:'f2',type:'message',body:'fallback'}],edges:[{id:'fe',from:'f1',to:'f2'}]};
  const state={contacts:[],automations:[],flows:[specific,fallback],flow:specific};const store=fakeStore(state);
  const r=await executeMatchingFlows({store,workspaceId:'ws',state,event:{type:'instagram_message',text:'qual o preço?',provider:'instagram',recipientId:'u1'},enqueueDelivery:false});
  assert.equal(r.matchedCount,1);assert.equal(r.flowId,'specific');
});

test('once-per-24h trigger is suppressed for the same contact after first run',async()=>{
  const flow={id:'mention',name:'Mention',live:true,nodes:[{id:'m1',type:'trigger',config:{triggerType:'instagram_story_mention',oncePer24h:true}},{id:'m2',type:'message',body:'obrigada'}],edges:[{id:'me',from:'m1',to:'m2'}]};
  const state={contacts:[{id:'c1'}],automations:[],flows:[flow],flow};const store=fakeStore(state),event={type:'instagram_story_mention',text:'',contactId:'c1',provider:'instagram',recipientId:'u1'};
  const first=await executeMatchingFlows({store,workspaceId:'ws',state,event,enqueueDelivery:false});const second=await executeMatchingFlows({store,workspaceId:'ws',state,event,enqueueDelivery:false});
  assert.equal(first.matchedCount,1);assert.equal(second.matchedCount,0);
});

test('comment actions enqueue public and private reply jobs using comment id',async()=>{
  const state={contacts:[{id:'c1',name:'Ana'}]},store=fakeStore(state),event={type:'instagram_comment',commentId:'comment_1',contactId:'c1',providerEventId:'evt_1'};
  await executeAction({node:{id:'a1',type:'action',body:'Obrigada!',config:{action:'instagram_public_reply'}},event,state,store,workspaceId:'ws'});
  await executeAction({node:{id:'a2',type:'action',body:'Te chamei no direct.',config:{action:'instagram_private_reply'}},event,state,store,workspaceId:'ws'});
  assert.deepEqual(store.jobs.map(j=>j.type),['instagram_public_reply','instagram_private_reply']);assert.equal(store.jobs[1].payload.commentId,'comment_1');
});

test('Instagram provider sends private reply with comment_id recipient and public reply on replies edge',async()=>{
  const old=global.fetch,calls=[];global.fetch=async(url,opt)=>{calls.push({url:String(url),opt});return new Response(JSON.stringify({id:'ok'}),{status:200,headers:{'content-type':'application/json'}})};
  try{
    const env={META_GRAPH_VERSION:'v26.0',META_ACCESS_TOKEN:'token',INSTAGRAM_ACCOUNT_ID:'ig1',INSTAGRAM_LOGIN_MODE:'unified'};
    await instagram.sendPrivateReply('comment_1','Oi',env);await instagram.replyToComment('comment_1','Obrigada',env);
    assert.match(calls[0].url,/\/ig1\/messages$/);assert.match(calls[0].opt.body,/"comment_id":"comment_1"/);assert.match(calls[1].url,/\/comment_1\/replies$/);
  }finally{global.fetch=old}
});

test('comment-to-DM template tags origin before terminal private reply',()=>{
  const t=getTemplate('comment-to-dm'),privateNode=t.flow.nodes.find(n=>n.config?.action==='instagram_private_reply'),tagNode=t.flow.nodes.find(n=>n.config?.tag==='comentario_instagram');
  assert.ok(privateNode);assert.ok(tagNode);assert.equal(t.flow.edges.some(e=>e.from===privateNode.id),false);assert.equal(t.flow.edges.some(e=>e.from===tagNode.id&&e.to===privateNode.id),true);
});

test('live comments template tags origin before terminal private reply',()=>{
  const t=getTemplate('instagram-live-comments'),privateNode=t.flow.nodes.find(n=>n.config?.action==='instagram_private_reply'),tagNode=t.flow.nodes.find(n=>n.config?.tag==='live_instagram');
  assert.ok(privateNode);assert.ok(tagNode);assert.equal(t.flow.edges.some(e=>e.from===privateNode.id),false);assert.equal(t.flow.edges.some(e=>e.from===tagNode.id&&e.to===privateNode.id),true);
});
