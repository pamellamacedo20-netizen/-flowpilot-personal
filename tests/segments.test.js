const test=require('node:test');
const assert=require('node:assert/strict');
const {resolveSegment}=require('../src/segments');
const {dispatchBroadcast}=require('../src/worker');

test('segment resolver filters channel, status and any-tag',()=>{
  const contacts=[
    {id:'1',name:'A',channel:'WhatsApp',status:'Inscrito',tags:['retorno']},
    {id:'2',name:'B',channel:'Instagram',status:'Inscrito',tags:['retorno']},
    {id:'3',name:'C',channel:'WhatsApp',status:'Pausado',tags:['vip']}
  ];
  const out=resolveSegment(contacts,{channel:'WhatsApp',status:'Inscrito',tagsAny:['retorno','vip']});
  assert.deepEqual(out.map(x=>x.id),['1']);
});

test('broadcast dispatcher fans out eligible contacts into delivery jobs',async()=>{
  const state={contacts:[
    {id:'1',channel:'WhatsApp',status:'Inscrito',tags:['retorno'],providerUserId:'5527999990001'},
    {id:'2',channel:'WhatsApp',status:'Inscrito',tags:['retorno'],providerUserId:'5527999990002'},
    {id:'3',channel:'Instagram',status:'Inscrito',tags:['retorno'],providerUserId:'ig3'}
  ],broadcasts:[{id:'b1',status:'scheduled',provider:'whatsapp',message:'Olá',segment:{channel:'WhatsApp',tagsAny:['retorno']}}]};
  const jobs=[];
  const store={getState:async()=>state,setState:async(_w,s)=>Object.assign(state,s),enqueue:async(_w,type,payload)=>{jobs.push({type,payload});return{id:String(jobs.length)}}};
  const result=await dispatchBroadcast(store,'ws1',{broadcastId:'b1'});
  assert.equal(result.audience,2);assert.equal(result.queued,2);assert.equal(jobs.length,2);assert.ok(jobs.every(x=>x.type==='send_message'&&x.payload.provider==='whatsapp'));assert.equal(state.broadcasts[0].status,'queued');
});

const {executeFlow}=require('../src/runtime');
test('randomizer node chooses one outgoing branch',async()=>{
  const state={contacts:[],automations:[{name:'R',runs:0}],flow:{name:'R',live:true,nodes:[
    {id:'t',type:'trigger',name:'T',body:''},{id:'r',type:'randomizer',name:'R',body:''},{id:'a',type:'action',name:'A',body:'A'},{id:'b',type:'action',name:'B',body:'B'}
  ],edges:[{from:'t',to:'r'},{from:'r',to:'a'},{from:'r',to:'b'}]}};
  const store={enqueue:async()=>({}),setState:async()=>state};const old=Math.random;Math.random=()=>0.99;try{const out=await executeFlow({store,workspaceId:'ws',state,event:{type:'x'},enqueueDelivery:false});assert.equal(out.steps.at(-1).id,'b')}finally{Math.random=old}
});
