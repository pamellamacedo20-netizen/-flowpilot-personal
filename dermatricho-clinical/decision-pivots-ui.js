(() => {
  const panel=document.querySelector('#detailPanel'); if(!panel)return;
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  function render(){
    const name=panel.querySelector('.detail-title')?.textContent?.trim();
    const rows=window.DT_DECISION_PIVOTS?.[name];
    if(!name||!Array.isArray(rows)||!rows.length)return;
    const old=panel.querySelector('[data-decision-pivots]'); if(old?.dataset.name===name)return; old?.remove();
    const treatment=[...panel.querySelectorAll('details.clinical-accordion')].find(d=>(d.querySelector('summary')?.textContent||'').toLowerCase().includes('tratamento completo'));
    const tools=panel.querySelector('.accordion-tools'); if(!treatment&&!tools)return;
    const d=document.createElement('details'); d.className='clinical-accordion decision-pivots'; d.open=true; d.dataset.decisionPivots='1'; d.dataset.name=name;
    d.innerHTML=`<summary><span>Pivôs que mudam conduta</span><span class="summary-right"><span class="accordion-badge">DECISÃO</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"><p class="decision-intro">Use estes modificadores para mudar a hierarquia terapêutica. Eles têm prioridade sobre regras simplificadas de gravidade isolada.</p><div class="decision-pivot-list">${rows.map(r=>`<article class="decision-pivot-card"><div class="decision-pivot-top"><strong>${esc(r.finding)}</strong><span class="decision-quality">${esc(r.quality||'')}</span></div><p>${esc(r.action)}</p><small>${esc(r.source||'')}</small></article>`).join('')}</div><p class="microcopy">A força indicada reflete a melhor evidência disponível para este modificador; não substitui julgamento clínico, bula vigente ou particularidades do paciente.</p></div>`;
    treatment?treatment.insertAdjacentElement('beforebegin',d):tools.insertAdjacentElement('afterend',d);
  }
  let queued=false; const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();
