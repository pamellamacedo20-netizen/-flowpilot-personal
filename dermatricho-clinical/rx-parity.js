(() => {
  const panel=document.querySelector('#detailPanel');const rx=window.DERMA_TRICHO_PRESCRIPTIONS||[];const details=window.DERMA_TRICHO_RX_DETAILS||{};if(!panel||!rx.length)return;
  const STORE='dt-rx-notes-v1';const UPDATED='02/11/2026';
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  function load(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}function save(id,t){const x=load();x[id]=t;localStorage.setItem(STORE,JSON.stringify(x));}
  function first(v){return Array.isArray(v)?v[0]||'':String(v||'')}
  function inject(){
    const title=panel.querySelector('.detail-title')?.textContent?.trim();if(!title)return;const item=rx.find(x=>x.name===title);if(!item)return;
    if(panel.querySelector(`[data-rx-parity="${CSS.escape(item.id)}"]`))return;panel.querySelectorAll('.rx-parity-layer').forEach(x=>x.remove());
    const tools=panel.querySelector('.accordion-tools');if(!tools)return;const e=details[item.name]||{};
    const w=document.createElement('div');w.className='rx-parity-layer';w.dataset.rxParity=item.id;w.innerHTML=`<div class="rx-parity-grid"><div><span class="overview-label">PRINCIPAL</span><strong>${esc(first(e.choose)||item.indications)}</strong><small>${esc(item.class)} · ${esc(item.status)}</small></div><div><span class="overview-label">AJUSTES</span><strong>Individualizar por idade, gestação, função renal/hepática e comorbidades.</strong><small>A triagem de segurança abaixo bloqueia/cautela quando aplicável.</small></div><div><span class="overview-label">CUIDADOS</span><strong>${esc(first(e.redFlags)||first(item.contraindications)||'Revisar contraindicações e interações.')}</strong><small>Revisão ${UPDATED}</small></div></div><details class="clinical-accordion rx-note-accordion"><summary><span>Anotações do medicamento</span><span class="summary-right"><span class="accordion-badge">NOTAS</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"><textarea class="clinical-note" data-rx-note="${esc(item.id)}" rows="5" placeholder="Anotações pessoais sobre este medicamento…">${esc(load()[item.id]||'')}</textarea><p class="microcopy">Salva neste dispositivo. Não substitui prescrição ou registro no prontuário.</p></div></details>`;
    tools.insertAdjacentElement('afterend',w);w.querySelector('[data-rx-note]')?.addEventListener('input',ev=>save(item.id,ev.target.value));
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();