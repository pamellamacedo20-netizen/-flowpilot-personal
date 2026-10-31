const dns=require('node:dns').promises;
const net=require('node:net');
const {interpolateDeep}=require('./templating');

function privateIp(ip){
  if(!net.isIP(ip))return false;
  if(ip==='127.0.0.1'||ip==='::1'||ip==='0.0.0.0'||ip==='::')return true;
  if(net.isIP(ip)===4){const p=ip.split('.').map(Number);return p[0]===10||p[0]===127||(p[0]===169&&p[1]===254)||(p[0]===172&&p[1]>=16&&p[1]<=31)||(p[0]===192&&p[1]===168)||(p[0]===100&&p[1]>=64&&p[1]<=127)}
  const s=ip.toLowerCase();return s.startsWith('fc')||s.startsWith('fd')||s.startsWith('fe8')||s.startsWith('fe9')||s.startsWith('fea')||s.startsWith('feb');
}
async function validateUrl(raw,{production=process.env.NODE_ENV==='production',allowPrivate=process.env.ALLOW_PRIVATE_HTTP_ACTIONS==='true',lookup=dns.lookup}={}){
  let u;try{u=new URL(raw)}catch{throw new Error('http_action_invalid_url')}
  if(!['https:','http:'].includes(u.protocol))throw new Error('http_action_protocol_not_allowed');
  if(production&&u.protocol!=='https:')throw new Error('http_action_https_required');
  if(['localhost','localhost.localdomain'].includes(u.hostname.toLowerCase())&&!allowPrivate)throw new Error('http_action_private_target_blocked');
  if(net.isIP(u.hostname)){if(privateIp(u.hostname)&&!allowPrivate)throw new Error('http_action_private_target_blocked')}
  else if(!allowPrivate){try{const results=await lookup(u.hostname,{all:true});if(results.some(x=>privateIp(x.address)))throw new Error('http_action_private_target_blocked')}catch(e){if(e.message==='http_action_private_target_blocked')throw e;throw new Error('http_action_dns_failed')}}
  return u;
}
function safeHeaders(input={}){const blocked=new Set(['host','content-length','connection','transfer-encoding','cookie']);const out={};for(const[k,v]of Object.entries(input||{})){if(!blocked.has(k.toLowerCase()))out[k]=String(v)}return out}
async function executeHttpAction(config,ctx,{fetchImpl=fetch,validate=validateUrl}={}){
  const cfg=interpolateDeep(config||{},ctx),method=String(cfg.method||'POST').toUpperCase();if(!['GET','POST','PUT','PATCH','DELETE'].includes(method))throw new Error('http_action_method_not_allowed');
  const u=await validate(cfg.url);const headers=safeHeaders(cfg.headers||{});let body;
  if(!['GET'].includes(method)&&cfg.body!==undefined){body=typeof cfg.body==='string'?cfg.body:JSON.stringify(cfg.body);if(!Object.keys(headers).some(k=>k.toLowerCase()==='content-type'))headers['content-type']='application/json'}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.min(Math.max(Number(cfg.timeoutMs||8000),500),15000));let r;try{r=await fetchImpl(u,{method,headers,body,signal:controller.signal,redirect:'error'})}catch(e){throw new Error(e.name==='AbortError'?'http_action_timeout':`http_action_network_error:${e.message}`)}finally{clearTimeout(timer)}
  const text=(await r.text()).slice(0,100_000);let data=text;try{data=JSON.parse(text)}catch{}
  if(!r.ok&&cfg.failOnHttpError!==false)throw new Error(`http_action_status_${r.status}`);return{ok:r.ok,status:r.status,data};
}
module.exports={privateIp,validateUrl,safeHeaders,executeHttpAction};
