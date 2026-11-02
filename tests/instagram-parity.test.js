const test=require('node:test');
const assert=require('node:assert/strict');
const {matchesTrigger,keywordMatches}=require('../src/runtime');
const {parseMetaWebhook}=require('../src/meta/webhooks');

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
