function normalize(v=''){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function tokenize(v=''){return normalize(v).split(/[^a-z0-9]+/).filter(Boolean)}
function scoreIntent(text,intent){
  const hay=normalize(text),tokens=new Set(tokenize(text));let score=0;
  for(const k of intent.keywords||[]){const nk=normalize(k);if(!nk)continue;if(hay.includes(nk))score+=3;for(const t of tokenize(nk))if(tokens.has(t))score+=1}
  for(const ex of intent.examples||[]){for(const t of tokenize(ex))if(tokens.has(t))score+=0.5}
  return score;
}
function inferIntent(text,intents=[],threshold=1){
  const ranked=(intents||[]).map(i=>({name:i.name||i.id||'intent',score:scoreIntent(text,i)})).sort((a,b)=>b.score-a.score);
  const best=ranked[0]||{name:'unknown',score:0};return{intent:best.score>=threshold?best.name:'unknown',confidence:best.score?Math.min(.99,.45+best.score/12):0,ranked};
}
function template(str,event){return String(str||'').replace(/\{\{\s*(\w+)\s*\}\}/g,(_,k)=>String(event?.[k]??event?.contact?.[k]??''))}
async function callCompatible(prompt,config={},env=process.env){
  const apiKey=env.AI_API_KEY,base=(env.AI_BASE_URL||'').replace(/\/$/,'');if(!apiKey||!base)return null;
  const model=config.model||env.AI_MODEL||'gpt-4.1-mini';const r=await fetch(`${base}/chat/completions`,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${apiKey}`},body:JSON.stringify({model,messages:[{role:'system',content:config.system||'You are a concise assistant.'},{role:'user',content:prompt}],temperature:Number(config.temperature??0.2)})});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`ai_provider_error:${r.status}:${j.error?.message||'request_failed'}`);return j.choices?.[0]?.message?.content||'';
}
async function runAiStep(node,event,env=process.env){
  const c=node.config||{},mode=c.mode||'generate';
  if(mode==='classify'){const result=inferIntent(event.text||'',c.intents||[],Number(c.threshold||1));return{mode,text:result.intent,intent:result.intent,confidence:result.confidence,provider:'local'}}
  const prompt=template(c.prompt||node.body||'Responda de forma útil à mensagem: {{text}}',{...event,text:event.text||''});
  const remote=await callCompatible(prompt,c,env);if(remote)return{mode,text:remote,provider:'compatible'};
  const local=template(c.fallbackText||'Entendi sua mensagem. Vou continuar com as próximas etapas para te ajudar.',event);return{mode,text:local,provider:'local'};
}
module.exports={normalize,tokenize,inferIntent,runAiStep,callCompatible};
