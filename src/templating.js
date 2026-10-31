function getPath(obj,path){return String(path||'').split('.').reduce((v,k)=>v==null?undefined:v[k],obj)}
function contextFor({event={},contact=null,state=null}={}){return{event,contact:contact||{},fields:contact?.fields||{},workspace:state?.workspace||{},text:event.text||'',intent:event.intent||'',aiOutput:event.aiOutput||''}}
function interpolate(value,ctx={}){
  if(typeof value!=='string')return value;
  return value.replace(/{{\s*([\w.-]+)\s*}}/g,(_,key)=>{const v=getPath(ctx,key);return v==null?'':typeof v==='object'?JSON.stringify(v):String(v)})
}
function interpolateDeep(value,ctx={}){
  if(typeof value==='string')return interpolate(value,ctx);
  if(Array.isArray(value))return value.map(v=>interpolateDeep(v,ctx));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,interpolateDeep(v,ctx)]));
  return value;
}
module.exports={getPath,contextFor,interpolate,interpolateDeep};
