function normalize(v){return String(v??'').trim().toLowerCase()}
function fieldMatches(actual,rule){
  if(rule&&typeof rule==='object'&&!Array.isArray(rule)){
    const op=rule.op||'eq',expected=rule.value;
    if(op==='exists')return actual!==undefined&&actual!==null&&String(actual)!=='';
    if(op==='neq')return normalize(actual)!==normalize(expected);
    if(op==='contains')return normalize(actual).includes(normalize(expected));
    if(op==='in')return (rule.values||[]).map(normalize).includes(normalize(actual));
    if(op==='gt')return Number(actual)>Number(expected);if(op==='gte')return Number(actual)>=Number(expected);if(op==='lt')return Number(actual)<Number(expected);if(op==='lte')return Number(actual)<=Number(expected);
    return normalize(actual)===normalize(expected);
  }
  return normalize(actual)===normalize(rule);
}
function contactMatches(contact,segment={}){
  if(segment.channel&&normalize(contact.channel)!==normalize(segment.channel))return false;
  if(segment.provider&&normalize(contact.provider||contact.channel)!==normalize(segment.provider))return false;
  if(segment.status&&normalize(contact.status)!==normalize(segment.status))return false;
  const tags=(contact.tags||[]).map(normalize),any=(segment.tagsAny||[]).map(normalize).filter(Boolean),all=(segment.tagsAll||[]).map(normalize).filter(Boolean);
  if(any.length&&!any.some(t=>tags.includes(t)))return false;
  if(all.length&&!all.every(t=>tags.includes(t)))return false;
  if(segment.fields&&typeof segment.fields==='object'){for(const[key,rule]of Object.entries(segment.fields)){if(!fieldMatches(contact.fields?.[key],rule))return false}}
  if(segment.query){const q=normalize(segment.query),hay=[contact.name,contact.email,contact.phone,...(contact.tags||[]),...Object.values(contact.fields||{})].map(normalize).join(' ');if(!hay.includes(q))return false}
  return true;
}
function resolveSegment(contacts,segment={}){return (contacts||[]).filter(c=>contactMatches(c,segment))}
module.exports={contactMatches,resolveSegment,fieldMatches};
