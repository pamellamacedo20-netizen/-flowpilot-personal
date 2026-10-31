const DEFAULT_WINDOW_HOURS=Number(process.env.META_CUSTOMER_CARE_WINDOW_HOURS||24);
const OPT_OUT=/^(stop|parar|sair|cancelar|descadastrar|unsubscribe|não quero|nao quero)$/i;
const OPT_IN=/^(start|iniciar|voltar|inscrever|subscribe|quero voltar)$/i;
function isoNow(){return new Date().toISOString()}
function noteInbound(contact,text,at=isoNow()){
  contact.lastInboundAt=at;const clean=String(text||'').trim();
  if(OPT_OUT.test(clean)){contact.status='Descadastrado';contact.optOutAt=at;contact.optOutReason='explicit_keyword'}
  else if(OPT_IN.test(clean)&&contact.status==='Descadastrado'){contact.status='Inscrito';contact.optInAt=at;delete contact.optOutAt;delete contact.optOutReason}
  return contact;
}
function hoursSince(iso,now=Date.now()){if(!iso)return Infinity;const t=new Date(iso).getTime();return Number.isFinite(t)?Math.max(0,(now-t)/3_600_000):Infinity}
function isOptedOut(contact){return String(contact?.status||'').toLowerCase()==='descadastrado'||!!contact?.optOutAt}
function evaluateOutbound({provider,contact,payload={},now=Date.now(),windowHours=DEFAULT_WINDOW_HOURS}={}){
  if(contact&&isOptedOut(contact))return{allowed:false,reason:'contact_opted_out'};
  const within=hoursSince(contact?.lastInboundAt,now)<=windowHours;
  if(provider==='whatsapp'){if(within)return{allowed:true,mode:'session'};if(payload.template?.name)return{allowed:true,mode:'template'};return{allowed:false,reason:'whatsapp_template_required_outside_window'}}
  if(provider==='instagram'||provider==='messenger'){if(within)return{allowed:true,mode:'session'};return{allowed:false,reason:`${provider}_outside_customer_care_window`}}
  if(provider==='telegram')return{allowed:true,mode:'bot_conversation'};
  return{allowed:false,reason:'unsupported_provider'};
}
function sanitizeContactExport(contact){if(!contact)return null;return{...contact,privacy:{exportedAt:isoNow(),source:'FlowPilot workspace'}}}
module.exports={DEFAULT_WINDOW_HOURS,noteInbound,hoursSince,isOptedOut,evaluateOutbound,sanitizeContactExport};
