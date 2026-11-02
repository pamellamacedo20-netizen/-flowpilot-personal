(() => {
  const panel=document.querySelector('#detailPanel');
  if(!panel) return;

  const requiredDisease=['Apresentação clínica','Como confirmar o diagnóstico','Diagnósticos diferenciais','Exames e investigação','Abordagem terapêutica','Prescrição / conduta editável','Alertas e contraindicações','Acompanhamento e reavaliação','Referências-base'];
  const requiredRx=['Visão prática','Apresentações disponíveis','Posologia e como prescrever','Modelo de receita','Como iniciar, ajustar e usar na prática','Monitorização e acompanhamento','Quando evitar / sinais de alerta','Interações relevantes','Gestação e lactação','Orientações ao paciente','Referências e base de evidência'];

  function textOfSummary(d){return d.querySelector(':scope > summary > span')?.textContent?.trim()||d.querySelector(':scope > summary')?.textContent?.trim()||'';}

  function wire(details){
    if(details.dataset.toggleWired==='1') return;
    const summary=details.querySelector(':scope > summary'); if(!summary) return;
    details.dataset.toggleWired='1';
    summary.setAttribute('role','button');
    summary.setAttribute('tabindex','0');
    summary.setAttribute('aria-expanded',details.open?'true':'false');
    const toggle=(ev)=>{
      if(ev.type==='keydown' && ev.key!=='Enter' && ev.key!==' ') return;
      if(ev.type==='keydown') ev.preventDefault();
      if(ev.type==='click') ev.preventDefault();
      details.open=!details.open;
      summary.setAttribute('aria-expanded',details.open?'true':'false');
    };
    summary.addEventListener('click',toggle);
    summary.addEventListener('keydown',toggle);
    details.addEventListener('toggle',()=>summary.setAttribute('aria-expanded',details.open?'true':'false'));
  }

  function ensureRequired(){
    const title=panel.querySelector('.detail-title')?.textContent?.trim(); if(!title) return;
    const isRx=!!(window.DERMA_TRICHO_PRESCRIPTIONS||[]).find(x=>x.name===title);
    const expected=isRx?requiredRx:requiredDisease;
    const present=new Set([...panel.querySelectorAll('details.clinical-accordion')].map(textOfSummary));
    expected.forEach(name=>{
      if(present.has(name)) return;
      const d=document.createElement('details');
      d.className='clinical-accordion integrity-placeholder';
      d.innerHTML=`<summary><span>${name}</span><span class="summary-right"><span class="accordion-badge">REVISAR</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"><p>Este tópico estava ausente na renderização. O conteúdo clínico precisa ser revisado no cadastro desta ficha.</p></div>`;
      panel.querySelector('.integration-actions')?.insertAdjacentElement('beforebegin',d);
    });
  }

  function fix(){
    ensureRequired();
    panel.querySelectorAll('details.clinical-accordion').forEach(wire);
    const tx=[...panel.querySelectorAll('details.clinical-accordion')].find(d=>/Abordagem terapêutica/i.test(textOfSummary(d)));
    if(tx && !tx.dataset.highlighted){tx.dataset.highlighted='1';tx.querySelector('summary')?.setAttribute('aria-label','Abrir tratamento e abordagem terapêutica');}
  }

  let scheduled=false;
  const queue=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;fix();});};
  new MutationObserver(queue).observe(panel,{childList:true});
  panel.addEventListener('click',e=>{
    const expand=e.target.closest('[data-expand-all]');
    const collapse=e.target.closest('[data-collapse-all]');
    if(expand){e.preventDefault();panel.querySelectorAll('details.clinical-accordion').forEach(d=>{d.open=true;d.querySelector(':scope > summary')?.setAttribute('aria-expanded','true');});}
    if(collapse){e.preventDefault();panel.querySelectorAll('details.clinical-accordion').forEach(d=>{d.open=false;d.querySelector(':scope > summary')?.setAttribute('aria-expanded','false');});}
  },true);
  fix();
})();