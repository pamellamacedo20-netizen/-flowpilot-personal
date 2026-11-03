(() => {
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const ERR_KEY='dt-ui-errors-v1';
  function ensureToastRegion(){
    let r=document.querySelector('#dtToastRegion');
    if(!r){r=document.createElement('div');r.id='dtToastRegion';r.className='dt-toast-region';r.setAttribute('aria-live','polite');r.setAttribute('aria-atomic','true');document.body.appendChild(r);}return r;
  }
  function notify(message,tone='info',ms=2600){
    const r=ensureToastRegion();const t=document.createElement('div');t.className=`dt-toast dt-toast-${tone}`;t.innerHTML=`<span>${esc(message)}</span>`;r.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),180)},ms);
  }
  async function copyText(text,success='Copiado.'){
    const value=String(text||'');if(!value){notify('Não há conteúdo para copiar.','warning');return false;}
    try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);}else throw new Error('clipboard unavailable');notify(success,'success');return true;}catch{
      try{const ta=document.createElement('textarea');ta.value=value;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';ta.style.pointerEvents='none';document.body.appendChild(ta);ta.focus();ta.select();const ok=document.execCommand('copy');ta.remove();if(!ok)throw new Error('copy failed');notify(success,'success');return true;}catch{notify('Não foi possível copiar automaticamente. Selecione o texto manualmente.','warning',3600);return false;}
    }
  }
  function openExternal(url){
    try{const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.style.display='none';document.body.appendChild(a);a.click();a.remove();return true;}catch{notify('Não foi possível abrir o link neste navegador.','warning');return false;}
  }
  function cartText(){
    const cart=window.DT_PRESCRIPTION_CART?.get?.()||[];
    return cart.map((x,i)=>`${i+1}. ${x.name}${x.quantity?` — Quantidade: ${x.quantity}`:''}\n${x.instructions||''}${x.notes?`\nObservações: ${x.notes}`:''}`).join('\n\n');
  }
  function logError(kind,message,source=''){
    try{const old=JSON.parse(localStorage.getItem(ERR_KEY)||'[]');old.unshift({at:new Date().toISOString(),kind,message:String(message||''),source:String(source||'')});localStorage.setItem(ERR_KEY,JSON.stringify(old.slice(0,20)));}catch{}
  }
  function safetyLocked(btn){
    const title=document.querySelector('#detailPanel .detail-title')?.textContent?.trim();const last=window.DT_RX_SAFETY_LAST;return !!(btn&&last&&last.drug===title&&!last.canRelease);
  }
  function focusSafety(){
    const gate=document.querySelector('#detailPanel .rx-safety-gate');if(!gate)return;gate.open=true;gate.querySelector(':scope > summary')?.setAttribute('aria-expanded','true');gate.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function heal(){
    document.querySelectorAll('a[target="_blank"]').forEach(a=>{const rel=new Set((a.getAttribute('rel')||'').split(/\s+/).filter(Boolean));rel.add('noopener');rel.add('noreferrer');a.setAttribute('rel',[...rel].join(' '));});
    const use=document.querySelector('#useInPatient');if(use){use.textContent='Usar na IA clínica';use.title='Abrir esta doença no contexto clínico do paciente';}
    const rx=document.querySelector('#useRxInPatient');if(rx){
      const locked=safetyLocked(rx);
      if(locked){rx.disabled=false;rx.setAttribute('aria-disabled','true');rx.dataset.safetyLocked='1';rx.title='Toque para ver o que falta na triagem de segurança';}
      else{rx.removeAttribute('aria-disabled');delete rx.dataset.safetyLocked;rx.title='Adicionar este medicamento à receita';}
    }
    document.querySelectorAll('.consultorio-action[disabled]').forEach(b=>{b.hidden=true;b.setAttribute('aria-hidden','true');});
    document.querySelectorAll('.consultorio-action:not([disabled])').forEach(b=>{b.hidden=false;b.removeAttribute('aria-hidden');});
  }
  document.addEventListener('click',e=>{
    const locked=e.target.closest('#useRxInPatient[data-safety-locked="1"]');
    if(locked){e.preventDefault();e.stopImmediatePropagation();const last=window.DT_RX_SAFETY_LAST;const msg=last?.status==='PRESCRIÇÃO BLOQUEADA'?'A prescrição está bloqueada pela triagem de segurança.':'Complete/revise a triagem de segurança antes de adicionar à receita.';notify(msg,'warning',3400);focusSafety();return;}
    const copyAnvisa=e.target.closest('[data-copy-anvisa-term]');
    if(copyAnvisa){e.preventDefault();e.stopImmediatePropagation();copyText(copyAnvisa.dataset.copyAnvisaTerm||'','Nome copiado para buscar na ANVISA.');return;}
    if(e.target.closest('[data-copy-rx-cart]')){e.preventDefault();e.stopImmediatePropagation();copyText(cartText(),'Receita copiada.');return;}
    if(e.target.closest('[data-tuss]')){e.preventDefault();e.stopImmediatePropagation();openExternal('https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/codigos-da-tuss');return;}
    if(e.target.closest('[data-sigtap]')){e.preventDefault();e.stopImmediatePropagation();openExternal('http://sigtap.datasus.gov.br');return;}
  },true);
  window.addEventListener('error',e=>logError('error',e.message,e.filename||''));
  window.addEventListener('unhandledrejection',e=>logError('promise',e.reason?.message||e.reason||'Promise rejeitada',''));
  let scheduled=false;const queue=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;heal();});};
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','href','target']});
  window.DT_UI={notify,copyText,openExternal,heal,getErrors(){try{return JSON.parse(localStorage.getItem(ERR_KEY)||'[]')}catch{return[]}},clearErrors(){localStorage.removeItem(ERR_KEY)}};
  heal();
})();
