(() => {
  const panel=document.querySelector('#detailPanel');
  if(!panel)return;
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const clean=(v='')=>String(v||'').replace(/\s+/g,' ').trim();
  const data=()=>window.DERMA_TRICHO_DATA||[];
  const getDisease=name=>data().find(x=>x.name===name);
  const node=(klass,title,body='')=>`<div class="flow-node ${klass}"><strong>${esc(title)}</strong>${body?`<small>${esc(body)}</small>`:''}</div>`;

  function render(){
    const name=panel.querySelector('.detail-title')?.textContent?.trim();
    if(!name)return;
    const disease=getDisease(name);
    if(!disease)return;
    const rows=Array.isArray(window.DT_DECISION_PIVOTS?.[name])?window.DT_DECISION_PIVOTS[name]:[];
    const existing=panel.querySelector('[data-dt-flowchart]');
    if(existing?.dataset.name===name)return;
    existing?.remove();

    const treatment=[...panel.querySelectorAll('details.clinical-accordion')].find(d=>{
      const t=(d.querySelector('summary')?.textContent||'').toLowerCase();
      return t.includes('tratamento completo')||t.includes('conduta curada');
    });
    const tools=panel.querySelector('.accordion-tools');
    if(!treatment&&!tools)return;

    const diagnosis=clean(disease.diagnosis)||'Confirmar diagnóstico clínico e diferenciais relevantes.';
    const standard=clean(disease.treatment)||'Seguir tratamento curado da ficha conforme gravidade, contraindicações e preferência.';
    const follow=clean(disease.followup)||'Reavaliar resposta, tolerabilidade e necessidade de escalonamento.';
    const alerts=clean(disease.alerts)||'Revisar contraindicações, sinais de alarme e necessidade de encaminhamento.';

    const d=document.createElement('details');
    d.className='clinical-accordion dt-flowchart';
    d.open=true;
    d.dataset.dtFlowchart='1';
    d.dataset.name=name;
    const options=rows.length?rows.map((r,i)=>`<button type="button" class="flow-option" data-flow-index="${i}"><strong>${esc(r.finding)}</strong><span>${esc(r.quality||'EVIDÊNCIA')}</span></button>`).join(''):`<button type="button" class="flow-option" data-flow-index="0"><strong>Sem modificador específico cadastrado</strong><span>CONDUTA PADRÃO</span></button>`;

    d.innerHTML=`<summary><span>Fluxograma clínico</span><span class="summary-right"><span class="accordion-badge">FLUXO</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"><div class="flow-shell"><div class="flow-intro"><p>Fluxo interativo derivado da ficha curada e dos pivôs que mudam conduta. Selecione o cenário que melhor representa o paciente.</p><span class="flow-badge">${rows.length?`${rows.length} ramos clínicos`:'fluxo-base'}</span></div><div class="flow-stage">${node('start','1. Confirmar / definir o diagnóstico',diagnosis)}<div class="flow-arrow"></div><div class="flow-branch-title">2. Qual modificador muda a conduta?</div><div class="flow-options">${options}</div><div class="flow-selected" data-flow-selected></div></div><div class="flow-default"><b>Sem um pivô dominante:</b> ${esc(standard)}</div><p class="flow-footnote">O fluxograma organiza a tomada de decisão, mas não substitui a ficha completa, a bula vigente nem o julgamento clínico individual.</p></div></div>`;
    (treatment||tools).insertAdjacentElement(treatment?'beforebegin':'afterend',d);

    const selected=d.querySelector('[data-flow-selected]');
    const buttons=[...d.querySelectorAll('.flow-option')];
    const choose=i=>{
      buttons.forEach(b=>b.classList.toggle('active',Number(b.dataset.flowIndex)===i));
      const r=rows[i];
      const action=r?.action||standard;
      const source=r?.source||'Ficha clínica curada';
      const quality=r?.quality||'—';
      selected.innerHTML=`<div class="flow-arrow"></div>${node('action','3. Conduta prioritária',action)}<div class="flow-source">${esc(quality)} · ${esc(source)}</div><div class="flow-arrow"></div>${node('follow','4. Reavaliar / manter / escalar',follow)}<div class="flow-arrow"></div>${node('alert','5. Segurança / encaminhamento',alerts)}<button type="button" class="flow-reset">Escolher outro cenário</button>`;
      selected.classList.add('show');
      selected.querySelector('.flow-reset')?.addEventListener('click',()=>{
        selected.classList.remove('show'); selected.innerHTML=''; buttons.forEach(b=>b.classList.remove('active'));
      });
      selected.scrollIntoView?.({block:'nearest',behavior:'smooth'});
    };
    buttons.forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.flowIndex))));
  }

  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});
  queue();
})();
