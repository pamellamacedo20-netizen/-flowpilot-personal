(() => {
  const panel = document.querySelector('#detailPanel');
  const data = window.DERMA_TRICHO_DATA || [];
  const prescriptions = window.DERMA_TRICHO_PRESCRIPTIONS || [];
  if (!panel) return;

  let mode = 'list';
  let scheduled = false;
  let currentKey = '';

  const norm = (v='') => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const esc = (v='') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const summaryText = d => d?.querySelector(':scope > summary > span')?.textContent?.trim() || d?.querySelector(':scope > summary')?.textContent?.trim() || '';
  const allDetails = () => [...panel.querySelectorAll('details.clinical-accordion')];

  const groups = [
    {key:'overview',label:'Visão geral',terms:['definição e contexto clínico','apresentação clínica']},
    {key:'diagnosis',label:'Diagnóstico',terms:['como confirmar o diagnóstico','exames e investigação']},
    {key:'severity',label:'Score / classificação',terms:['avaliar gravidade / classificação','gravidade / classificação']},
    {key:'treatment',label:'Tratamento',terms:['abordagem terapêutica','conduta orientada pela gravidade']},
    {key:'prescription',label:'Prescrição',terms:['prescrição prática no consultório','prescrição / conduta editável']},
    {key:'followup',label:'Seguimento',terms:['acompanhamento e reavaliação']},
    {key:'notes',label:'Anotações',terms:['anotações clínicas']},
    {key:'references',label:'Referências',terms:['referências-base','referências e base de evidência','fontes e atualização']}
  ];

  function findByTerms(terms){
    const ds = allDetails();
    for (const term of terms){
      const t = norm(term);
      const found = ds.find(d => norm(summaryText(d)).includes(t));
      if (found) return found;
    }
    return null;
  }

  function goList(push=false){
    mode = 'list';
    currentKey = '';
    document.body.classList.add('consultorio-list-mode');
    document.body.classList.remove('consultorio-detail-mode');
    if (push) history.pushState({dtView:'list'},'',location.pathname + location.search);
    window.scrollTo({top:0,behavior:'instant'});
  }

  function goDetail(){
    mode = 'detail';
    document.body.classList.remove('consultorio-list-mode');
    document.body.classList.add('consultorio-detail-mode');
    window.scrollTo({top:0,behavior:'instant'});
    queue();
  }

  function transformConsultorioOnly(){
    const target = allDetails().find(d => norm(summaryText(d)).includes('prescrição ambulatorial x urgência/hospital'));
    if (!target) return;
    const title = target.querySelector(':scope > summary > span');
    if (title) title.textContent = 'Prescrição prática no consultório';
    const cols = target.querySelector('.parity-two');
    if (cols){
      const children = [...cols.children];
      if (children.length > 1) children.slice(1).forEach(x => x.remove());
      cols.classList.add('consultorio-single');
    }
    const badge = target.querySelector('.accordion-badge');
    if (badge) badge.textContent = 'CONSULTÓRIO';
  }

  function targetMap(){
    return Object.fromEntries(groups.map(g => [g.key, findByTerms(g.terms)]));
  }

  function jump(key){
    const target = targetMap()[key];
    if (!target) return;
    target.open = true;
    target.querySelector(':scope > summary')?.setAttribute('aria-expanded','true');
    requestAnimationFrame(() => target.scrollIntoView({behavior:'smooth',block:'start'}));
  }

  function detailInfo(){
    const title = panel.querySelector('.detail-title')?.textContent?.trim() || '';
    const disease = data.find(x => x.name === title);
    const rx = prescriptions.find(x => x.name === title);
    if (disease) return {type:'disease',id:disease.id,title,subtitle:`${disease.area} · ${disease.category}`};
    if (rx) return {type:'rx',id:rx.id,title,subtitle:rx.class || 'Guia de prescrição'};
    return null;
  }

  function ensurePagebar(info){
    let bar = panel.querySelector('.consultorio-pagebar');
    if (!bar){
      bar = document.createElement('div');
      bar.className = 'consultorio-pagebar';
      panel.insertAdjacentElement('afterbegin',bar);
    }
    bar.innerHTML = `
      <button type="button" class="consultorio-back" data-consultorio-back aria-label="Voltar para a lista">← <span>Voltar</span></button>
      <div class="consultorio-pagebar-meta"><span class="consultorio-kicker">Consulta ambulatorial</span><strong>${esc(info.title)}</strong><small>${esc(info.subtitle)}</small></div>
      <span class="consultorio-mode-badge">CONSULTÓRIO</span>`;
  }

  function ensureActions(info){
    const header = panel.querySelector('.detail-header');
    if (!header) return;
    let shell = panel.querySelector('.consultorio-tools');
    if (!shell){
      shell = document.createElement('div');
      shell.className = 'consultorio-tools';
      header.insertAdjacentElement('afterend',shell);
    }
    const map = targetMap();
    const actions = info.type === 'disease' ? [
      ['prescription','Prescrever'],['severity','Score / classificação'],['notes','Anotações'],['references','Referências']
    ] : [
      ['prescription','Modelo de receita'],['notes','Anotações'],['references','Referências']
    ];
    const actionHtml = actions.map(([key,label]) => `<button type="button" class="consultorio-action" data-consultorio-jump="${key}" ${map[key]?'':'disabled'}>${esc(label)}</button>`).join('');
    const navHtml = groups.filter(g => map[g.key]).map(g => `<button type="button" class="consultorio-section-link" data-consultorio-jump="${g.key}">${esc(g.label)}</button>`).join('');
    const sig = `${info.type}|${actions.map(x=>x[0]+':' + !!map[x[0]]).join(',')}|${groups.map(g=>g.key+':' + !!map[g.key]).join(',')}`;
    if (shell.dataset.signature === sig) return;
    shell.dataset.signature = sig;
    shell.innerHTML = `<div class="consultorio-quick-actions"><span class="overview-label">Acesso rápido</span><div>${actionHtml}</div></div><nav class="consultorio-section-nav" aria-label="Seções da ficha">${navHtml}</nav>`;
  }

  function enhance(){
    scheduled = false;
    if (mode !== 'detail') return;
    const info = detailInfo();
    if (!info) return;
    transformConsultorioOnly();
    const key = `${info.type}:${info.id}`;
    if (currentKey !== key){
      currentKey = key;
      panel.scrollTop = 0;
      window.scrollTo({top:0,behavior:'instant'});
    }
    ensurePagebar(info);
    ensureActions(info);
    panel.classList.add('consultorio-focused-panel');
  }

  function queue(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhance);
  }

  document.addEventListener('click', e => {
    const nav = e.target.closest('.nav-btn');
    if (nav){ goList(false); return; }

    const diseaseCard = e.target.closest('.disease-card[data-id]');
    if (diseaseCard && !e.target.closest('[data-star]')){
      mode = 'detail';
      const id = diseaseCard.dataset.id;
      if (!history.state || history.state.dtId !== id) history.pushState({dtView:'detail',dtType:'disease',dtId:id},'',`#doenca=${encodeURIComponent(id)}`);
      requestAnimationFrame(goDetail);
      return;
    }

    const rxCard = e.target.closest('.disease-card[data-rx-id]');
    if (rxCard){
      mode = 'detail';
      const id = rxCard.dataset.rxId;
      if (!history.state || history.state.dtId !== id) history.pushState({dtView:'detail',dtType:'rx',dtId:id},'',`#medicamento=${encodeURIComponent(id)}`);
      requestAnimationFrame(goDetail);
      return;
    }

    if (e.target.closest('[data-consultorio-back]')){
      e.preventDefault();
      if (history.state?.dtView === 'detail') history.back(); else goList(true);
      return;
    }

    const jumpButton = e.target.closest('[data-consultorio-jump]');
    if (jumpButton){
      e.preventDefault();
      jump(jumpButton.dataset.consultorioJump);
    }
  }, true);

  window.addEventListener('popstate', e => {
    if (e.state?.dtView === 'detail'){
      mode = 'detail';
      goDetail();
    } else {
      goList(false);
    }
  });

  new MutationObserver(() => { if (mode === 'detail') queue(); }).observe(panel,{childList:true,subtree:true});

  history.replaceState({dtView:'list'},'',location.pathname + location.search);
  goList(false);
})();