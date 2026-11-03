(() => {
  const panel=document.querySelector('#detailPanel');
  const meds=()=>window.DERMA_TRICHO_PRESCRIPTIONS||[];
  if(!panel)return;
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const REQUIRED=['presentations','indications','adultDose','howToUse','monitoring','contraindications','interactions','pregnancy','patientAdvice','source','sample'];
  const ok=v=>Array.isArray(v)?v.length>0:!!String(v||'').trim();
  function current(){
    if(document.querySelector('.nav-btn.active')?.dataset.view!=='prescriptions')return null;
    const title=panel.querySelector('.detail-title')?.textContent?.trim();
    return meds().find(x=>x.name===title)||null;
  }
  function score(item){
    const base=REQUIRED.filter(k=>ok(item[k])).length;
    const deep=panel.querySelector(`[data-rx-deep="${CSS.escape(item.id)}"]`);
    const partial=!!deep?.textContent?.includes('Mecanismo específico ainda não estruturado');
    return {base,total:REQUIRED.length,deep:!!deep,partial,percent:Math.round((base/REQUIRED.length)*100)};
  }
  function fixFallback(item){
    const deep=panel.querySelector(`[data-rx-deep="${CSS.escape(item.id)}"]`); if(!deep)return;
    if(!deep.textContent.includes('Mecanismo específico ainda não estruturado'))return;
    deep.classList.add('rx-deep-partial');
    const sections=[...deep.querySelectorAll('details.clinical-accordion')];
    const dose=sections.find(x=>(x.querySelector('summary')?.textContent||'').includes('Dose mínima'));
    if(dose){
      const body=dose.querySelector('.accordion-body');
      if(body && !body.dataset.safeFallback){
        body.dataset.safeFallback='1';
        body.innerHTML=`<div class="rx-partial-warning"><b>Faixa de dose ainda não curada separadamente</b><p><strong>Dose cadastrada:</strong> ${esc(item.adultDose||'Consultar fonte específica.')}</p><p>Não interpretar este texto como dose mínima, habitual e máxima. Esses limites só serão exibidos quando houver fonte específica validada para a indicação dermatológica/tricológica.</p></div>`;
      }
    }
  }
  function inject(){
    const item=current(); if(!item)return;
    fixFallback(item);
    const s=score(item);
    let box=panel.querySelector('[data-rx-quality-gate]');
    if(!box){box=document.createElement('div');box.dataset.rxQualityGate='1';box.className='rx-quality-gate';const header=panel.querySelector('.detail-header');(header||panel.firstElementChild)?.insertAdjacentElement('afterend',box);}
    if(box.dataset.drug===item.id && box.dataset.state===`${s.percent}-${s.partial}`)return;
    box.dataset.drug=item.id;box.dataset.state=`${s.percent}-${s.partial}`;
    const status=s.percent===100&&!s.partial?'MONOGRAFIA CURADA':'REVISÃO NECESSÁRIA';
    const cls=status==='MONOGRAFIA CURADA'?'rx-q-ok':'rx-q-review';
    const missing=REQUIRED.filter(k=>!ok(item[k]));
    box.innerHTML=`<div class="rx-quality-main"><span class="overview-label">Qualidade da monografia</span><strong class="${cls}">${status}</strong><small>${s.base}/${s.total} campos estruturais preenchidos · revisão 03/11/2026</small></div><div class="rx-quality-detail">${s.partial?'<span>Farmacologia profunda ainda parcial: não inferir dose mínima/máxima.</span>':'<span>Faixa de dose/ajustes estruturados disponíveis nesta ficha.</span>'}${missing.length?`<span>Faltando: ${esc(missing.join(', '))}</span>`:''}</div>`;
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();
