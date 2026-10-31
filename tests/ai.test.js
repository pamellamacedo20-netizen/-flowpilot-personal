const test=require('node:test');
const assert=require('node:assert/strict');
const {inferIntent,runAiStep}=require('../src/ai');
const {executeFlow}=require('../src/runtime');
const {parseMetaWebhook}=require('../src/meta/webhooks');
const telegram=require('../src/providers/telegram');
const messenger=require('../src/providers/messenger');

test('local intent classifier ranks configured intent deterministically',()=>{
  const out=inferIntent('Quero marcar uma consulta amanhã',[{name:'agendamento',keywords:['marcar','consulta','agendar']},{name:'preco',keywords:['valor','preço']}]);
  assert.equal(out.intent,'agendamento');assert.ok(out.confidence>0.5);
});

test('AI intention trigger and AI step execute inside automation runtime',async()=>{
  const state={contacts:[{id:'c1',tags:[]}],automations:[{name:'IA',runs:0}],flow:{name:'IA',live:true,nodes:[
    {id:'t',type:'trigger',name:'Intenção',body:'',config:{triggerType:'ai_intent',intents:['agendamento'],intentDefinitions:[{name:'agendamento',keywords:['marcar','consulta','agendar']},{name:'preco',keywords:['valor','preço']}]}},
    {id:'ai',type:'ai',name:'Responder',body:'',config:{fallbackText:'Posso ajudar a agendar.',sendReply:true}},
    {id:'a',type:'action',name:'Tag',body:'',config:{action:'add_tag',tag:'agendamento'}}
  ],edges:[{from:'t',to:'ai'},{from:'ai',to:'a'}]}};
  const jobs=[];const store={enqueue:async(_w,type,payload)=>{jobs.push({type,payload});return{id:'j1'}},setState:async()=>state};
  const out=await executeFlow({store,workspaceId:'ws',state,event:{type:'instagram_message',provider:'instagram',recipientId:'u1',contactId:'c1',text:'Quero marcar uma consulta'}});
  assert.equal(out.matched,true);assert.equal(out.intent,'agendamento');assert.equal(out.steps[1].type,'ai');assert.equal(out.steps[1].output,'Posso ajudar a agendar.');assert.ok(state.contacts[0].tags.includes('agendamento'));assert.equal(jobs[0].type,'send_message');
});

test('AI step can use local classify mode without external provider',async()=>{const out=await runAiStep({config:{mode:'classify',intents:[{name:'suporte',keywords:['ajuda']},{name:'venda',keywords:['comprar']}] }},{text:'preciso de ajuda'});assert.equal(out.intent,'suporte');assert.equal(out.provider,'local')});

test('Messenger webhook payload is normalized',()=>{const events=parseMetaWebhook({object:'page',entry:[{id:'page_1',messaging:[{sender:{id:'psid_1'},message:{mid:'m1',text:'oi'}}]}]});assert.equal(events.length,1);assert.equal(events[0].provider,'messenger');assert.equal(events[0].recipientId,'psid_1')});

test('Telegram update parser captures text and photo metadata',()=>{const events=telegram.parseUpdate({update_id:7,message:{from:{id:1,first_name:'Ana'},chat:{id:1},caption:'foto',photo:[{file_id:'small'},{file_id:'large'}]}});assert.equal(events[0].provider,'telegram');assert.equal(events[0].media[0].fileId,'large')});

test('Telegram and Messenger adapters build official text/media request shapes',async()=>{
  const old=global.fetch;const seen=[];global.fetch=async(url,opts)=>{seen.push({url:String(url),body:JSON.parse(opts.body)});return{ok:true,status:200,json:async()=>String(url).includes('telegram.org')?{ok:true,result:{message_id:1}}:{message_id:'m'}}};
  try{
    await telegram.sendText('123','Olá',{TELEGRAM_BOT_TOKEN:'token'});await telegram.sendMedia('123',{type:'photo',url:'https://example.com/a.jpg'},{TELEGRAM_BOT_TOKEN:'token'});await messenger.sendText('psid','Oi',{META_ACCESS_TOKEN:'token',MESSENGER_PAGE_ID:'page'});await messenger.sendMedia('psid',{type:'image',url:'https://example.com/a.jpg'},{META_ACCESS_TOKEN:'token',MESSENGER_PAGE_ID:'page'});
    assert.equal(seen[0].body.chat_id,'123');assert.equal(seen[1].body.photo,'https://example.com/a.jpg');assert.equal(seen[2].body.recipient.id,'psid');assert.equal(seen[3].body.message.attachment.type,'image');
  }finally{global.fetch=old}
});
