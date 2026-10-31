const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {hashPassword,normalizeEmail,sha256}=require('../auth');
const {periodKey}=require('../billing');

class JsonStore{
  constructor({root,seedPath,dbPath}){this.root=root;this.seedPath=seedPath;this.dbPath=dbPath;this.ensure()}
  id(prefix){return`${prefix}_${crypto.randomUUID()}`}
  ensure(){
    fs.mkdirSync(path.dirname(this.dbPath),{recursive:true});
    if(fs.existsSync(this.dbPath)){
      const current=this.read();
      current.platformVersion=Math.max(Number(current.platformVersion||0),5);
      current.users=current.users||[];current.workspaces=current.workspaces||[];current.members=current.members||[];current.sessions=current.sessions||[];current.oauthStates=current.oauthStates||[];current.connections=current.connections||[];current.jobs=current.jobs||[];current.webhookEvents=current.webhookEvents||[];current.audit=current.audit||[];current.usage=current.usage||{};current.workspaceStates=current.workspaceStates||{};
      for(const state of Object.values(current.workspaceStates)){state.customFields=Array.isArray(state.customFields)?state.customFields:[];state.sequences=Array.isArray(state.sequences)?state.sequences:[];state.flows=Array.isArray(state.flows)&&state.flows.length?state.flows:(state.flow?[state.flow]:[]);for(const a of state.automations||[]){let f=state.flows.find(x=>x.id===a.flowId)||state.flows.find(x=>x.name===a.name);if(f)a.flowId=f.id}}
      this.write(current);return;
    }
    const seed=JSON.parse(fs.readFileSync(this.seedPath,'utf8')),userId='usr_demo',workspaceId='ws_demo';
    const db={platformVersion:5,users:[{id:userId,email:'demo@flowpilot.local',name:'Demo FlowPilot',passwordHash:hashPassword('FlowPilot123!'),createdAt:new Date().toISOString()}],workspaces:[{id:workspaceId,name:seed.workspace?.name||'Clínica Aurora',plan:seed.workspace?.plan||'Pro demo',createdAt:new Date().toISOString()}],members:[{workspaceId,userId,role:'owner'}],sessions:[],oauthStates:[],connections:[],jobs:[],webhookEvents:[],audit:[],usage:{},workspaceStates:{[workspaceId]:seed}};
    this.write(db);
  }
  read(){return JSON.parse(fs.readFileSync(this.dbPath,'utf8'))}
  write(db){const tmp=this.dbPath+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2));fs.renameSync(tmp,this.dbPath);return db}
  tx(fn){const db=this.read(),out=fn(db);this.write(db);return out}
  resetWorkspace(workspaceId){const seed=JSON.parse(fs.readFileSync(this.seedPath,'utf8'));return this.tx(db=>{const ws=db.workspaces.find(x=>x.id===workspaceId);if(ws)seed.workspace={name:ws.name,plan:ws.plan};db.workspaceStates[workspaceId]=seed;return seed})}
  getUserByEmail(email){return this.read().users.find(u=>u.email===normalizeEmail(email))||null}
  getUser(userId){return this.read().users.find(u=>u.id===userId)||null}
  createUser({email,name,passwordHash}){return this.tx(db=>{const normalized=normalizeEmail(email);if(db.users.some(u=>u.email===normalized))throw new Error('email_exists');const user={id:this.id('usr'),email:normalized,name:String(name||normalized.split('@')[0]),passwordHash,createdAt:new Date().toISOString()};db.users.push(user);return user})}
  createWorkspaceForUser(userId,{name='Novo workspace',plan='Free'}={}){return this.tx(db=>{const id=this.id('ws'),ws={id,name,plan,createdAt:new Date().toISOString()};db.workspaces.push(ws);db.members.push({workspaceId:id,userId,role:'owner'});const seed=JSON.parse(fs.readFileSync(this.seedPath,'utf8'));seed.workspace={name,plan};seed.contacts=[];seed.automations=[];seed.broadcasts=[];seed.threads=[];seed.flows=[];seed.customFields=[];seed.sequences=[];seed.flow={id:this.id('flow'),name:'Nova automação',live:false,zoom:1,selected:null,nodes:[],edges:[]};db.workspaceStates[id]=seed;return ws})}
  listWorkspaces(){return this.read().workspaces}
  getWorkspace(id){return this.read().workspaces.find(w=>w.id===id)||null}
  updateWorkspacePlan(id,plan,billing={}){return this.tx(db=>{const w=db.workspaces.find(x=>x.id===id);if(!w)return null;w.plan=plan;w.billing={...(w.billing||{}),...billing,updatedAt:new Date().toISOString()};const state=db.workspaceStates[id];if(state?.workspace)state.workspace.plan=plan;return w})}
  listUserWorkspaces(userId){const db=this.read(),ids=new Set(db.members.filter(m=>m.userId===userId).map(m=>m.workspaceId));return db.workspaces.filter(w=>ids.has(w.id)).map(w=>({...w,role:db.members.find(m=>m.userId===userId&&m.workspaceId===w.id)?.role}))}
  role(userId,workspaceId){return this.read().members.find(m=>m.userId===userId&&m.workspaceId===workspaceId)?.role||null}
  getState(workspaceId){return this.read().workspaceStates[workspaceId]||null}
  setState(workspaceId,state){return this.tx(db=>{if(!db.workspaceStates[workspaceId])throw new Error('workspace_not_found');db.workspaceStates[workspaceId]=state;return state})}
  createSession(record){return this.tx(db=>{db.sessions=db.sessions.filter(s=>new Date(s.expiresAt)>new Date());db.sessions.push(record);return record})}
  findSession(token){const hash=sha256(token),now=Date.now(),db=this.read();return db.sessions.find(s=>s.tokenHash===hash&&new Date(s.expiresAt).getTime()>now)||null}
  revokeSession(token){const hash=sha256(token);return this.tx(db=>{const before=db.sessions.length;db.sessions=db.sessions.filter(s=>s.tokenHash!==hash);return before!==db.sessions.length})}
  audit(workspaceId,userId,action,meta={}){return this.tx(db=>{const item={id:this.id('aud'),workspaceId,userId,action,meta,createdAt:new Date().toISOString()};db.audit.push(item);db.audit=db.audit.slice(-5000);return item})}
  listAudit(workspaceId,limit=100){return this.read().audit.filter(x=>x.workspaceId===workspaceId).slice(-limit).reverse()}
  createOAuthState(item){return this.tx(db=>{db.oauthStates=db.oauthStates.filter(s=>new Date(s.expiresAt)>new Date());db.oauthStates.push(item);return item})}
  consumeOAuthState(state){return this.tx(db=>{const idx=db.oauthStates.findIndex(x=>x.state===state&&new Date(x.expiresAt)>new Date());if(idx<0)return null;const[item]=db.oauthStates.splice(idx,1);return item})}
  upsertConnection(workspaceId,provider,data){return this.tx(db=>{let c=db.connections.find(x=>x.workspaceId===workspaceId&&x.provider===provider&&x.providerAccountId===String(data.providerAccountId||data.accountId||'default'));if(!c){c={id:this.id('con'),workspaceId,provider,providerAccountId:String(data.providerAccountId||data.accountId||'default'),createdAt:new Date().toISOString()};db.connections.push(c)}Object.assign(c,data,{workspaceId,provider,updatedAt:new Date().toISOString()});return c})}
  getConnection(workspaceId,provider,providerAccountId=null){const list=this.read().connections.filter(x=>x.workspaceId===workspaceId&&x.provider===provider);return providerAccountId?list.find(x=>x.providerAccountId===String(providerAccountId))||null:list[0]||null}
  findConnection(provider,providerAccountId){return this.read().connections.find(x=>x.provider===provider&&x.providerAccountId===String(providerAccountId))||null}
  listConnections(workspaceId){return this.read().connections.filter(x=>x.workspaceId===workspaceId)}
  deleteConnections(workspaceId,provider){return this.tx(db=>{const before=db.connections.length;db.connections=db.connections.filter(x=>!(x.workspaceId===workspaceId&&x.provider===provider));return before-db.connections.length})}
  enqueue(workspaceId,type,payload={},runAt=new Date().toISOString(),options={}){return this.tx(db=>{const job={id:this.id('job'),workspaceId,type,payload,status:'queued',attempts:0,maxAttempts:options.maxAttempts||5,runAt:new Date(runAt).toISOString(),createdAt:new Date().toISOString(),lockedAt:null,lastError:null};db.jobs.push(job);return job})}
  claimDueJob(now=new Date()){return this.tx(db=>{const job=db.jobs.filter(j=>j.status==='queued'&&new Date(j.runAt)<=now).sort((a,b)=>new Date(a.runAt)-new Date(b.runAt))[0];if(!job)return null;job.status='running';job.lockedAt=new Date().toISOString();job.attempts+=1;return JSON.parse(JSON.stringify(job))})}
  completeJob(id,result=null){return this.tx(db=>{const j=db.jobs.find(x=>x.id===id);if(j){j.status='done';j.completedAt=new Date().toISOString();j.result=result}return j||null})}
  failJob(id,error){return this.tx(db=>{const j=db.jobs.find(x=>x.id===id);if(!j)return null;j.lastError=String(error?.message||error);if(j.attempts>=j.maxAttempts){j.status='failed'}else{j.status='queued';j.runAt=new Date(Date.now()+Math.min(60000,1000*2**j.attempts)).toISOString()}return j})}
  listJobs(workspaceId,limit=100){return this.read().jobs.filter(j=>j.workspaceId===workspaceId).slice(-limit).reverse()}
  jobStats(workspaceId=null){const jobs=this.read().jobs.filter(j=>!workspaceId||j.workspaceId===workspaceId);return jobs.reduce((a,j)=>(a[j.status]=(a[j.status]||0)+1,a),{queued:0,running:0,done:0,failed:0})}
  purgeContactJobs(workspaceId,contactId){return this.tx(db=>{const before=db.jobs.length;db.jobs=db.jobs.filter(j=>!(j.workspaceId===workspaceId&&j.payload?.contactId===contactId&&['queued','running'].includes(j.status)));return before-db.jobs.length})}
  recordWebhookEvent({workspaceId=null,provider,providerEventId,payload}){return this.tx(db=>{if(db.webhookEvents.some(e=>e.provider===provider&&e.providerEventId===providerEventId))return{duplicate:true};const e={id:this.id('evt'),workspaceId,provider,providerEventId,payload,receivedAt:new Date().toISOString(),processedAt:null};db.webhookEvents.push(e);db.webhookEvents=db.webhookEvents.slice(-10000);return e})}
  getUsage(workspaceId,period=periodKey()){const db=this.read();return db.usage?.[`${workspaceId}:${period}`]||{}}
  incrementUsage(workspaceId,metric,amount=1,period=periodKey()){return this.tx(db=>{db.usage=db.usage||{};const key=`${workspaceId}:${period}`,u=db.usage[key]||(db.usage[key]={});u[metric]=Number(u[metric]||0)+Number(amount||0);return u})}
}
module.exports={JsonStore};
