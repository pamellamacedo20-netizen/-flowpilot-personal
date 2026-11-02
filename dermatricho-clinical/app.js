(() => {
  const data = window.DERMA_TRICHO_DATA || [];
  const prescriptions = window.DERMA_TRICHO_PRESCRIPTIONS || [];
  const rxDetails = window.DERMA_TRICHO_RX_DETAILS || {};
  const searchInput = document.querySelector('#searchInput');
  const categoryChips = document.querySelector('#categoryChips');
  const diseaseList = document.querySelector('#diseaseList');
  const detailPanel = document.querySelector('#detailPanel');
  const resultCount = document.querySelector('#resultCount');
  const listTitle = document.querySelector('#listTitle');
  const listEyebrow = document.querySelector('#listEyebrow');
  const pageTitle = document.querySelector('#pageTitle');
  const pageEyebrow = document.querySelector('#pageEyebrow');
  const aiButton = document.querySelector('#aiButton');
  const aiDialog = document.querySelector('#aiDialog');
  const aiContext = document.querySelector('#aiContext');
  const patientContext = document.querySelector('#patientContext');
  const generateAi = document.querySelector('#generateAi');
  const aiOutput = document.querySelector('#aiOutput');

  const state = {
    view: 'home', category: 'Todas', query: '', selectedId: null, selectedType: 'disease',
    favorites: new Set(JSON.parse(localStorage.getItem('dt-favorites') || '[]')),
    recent: JSON.parse(localStorage.getItem('dt-recent') || '[]')
  };

  const normalize = (value='') => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const unique = items => [...new Set(items)];
  const escapeHtml = (value='') => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const isRx = () => state.view === 'prescriptions';

  function getCategories(){
    if (isRx()) return ['Todas', ...unique(prescriptions.map(x => x.class)).sort((a,b)=>a.localeCompare(b,'pt-BR'))];
    const base = state.view === 'trichology' ? data.filter(x=>x.area==='Tricologia') : state.view === 'dermatology' ? data.filter(x=>x.area==='Dermatologia') : data;
    return ['Todas', ...unique(base.map(x=>x.category)).sort((a,b)=>a.localeCompare(b,'pt-BR'))];
  }

  function filteredItems(){
    if(isRx()){
      let items=[...prescriptions];
      if(state.category!=='Todas') items=items.filter(x=>x.class===state.category);
      const q=normalize(state.query.trim());
      if(q) items=items.filter(x=>{
        const e=rxDetails[x.name]||{};
        return normalize([x.name,x.class,x.status,x.indications,x.adultDose,...(x.tags||[]),...(x.presentations||[]),...(e.choose||[]),...(e.practical||[]),...(e.follow||[])].join(' ')).includes(q);
      });
      return items;
    }
    let items=[...data];
    if(state.view==='trichology') items=items.filter(x=>x.area==='Tricologia');
    if(state.view==='dermatology') items=items.filter(x=>x.area==='Dermatologia');
    if(state.view==='favorites') items=items.filter(x=>state.favorites.has(x.id));
    if(state.view==='recent'){
      const order=new Map(state.recent.map((id,i)=>[id,i]));
      items=items.filter(x=>order.has(x.id)).sort((a,b)=>order.get(a.id)-order.get(b.id));
    }
    if(state.category!=='Todas') items=items.filter(x=>x.category===state.category);
    const q=normalize(state.query.trim());
    if(q) items=items.filter(x=>normalize([x.name,x.area,x.category,...(x.tags||[]),x.summary,x.clinic,x.diagnosis,...(x.differentials||[]),x.exams,x.treatment].join(' ')).includes(q));
    return items;
  }

  function renderCategories(){
    const categories=getCategories();
    if(!categories.includes(state.category)) state.category='Todas';
    categoryChips.innerHTML=categories.map(c=>`<button class="chip ${state.category===c?'active':''}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
    categoryChips.querySelectorAll('[data-category]').forEach(btn=>btn.addEventListener('click',()=>{state.category=btn.dataset.category;render();}));
  }

  function renderList(){
    const items=filteredItems();
    resultCount.textContent=`${items.length} ${isRx()?'medicamento':'conteúdo'}${items.length===1?'':'s'}`;
    if(isRx()){
      listTitle.textContent='Guia de prescrição'; listEyebrow.textContent='Medicamentos';
      pageTitle.textContent='Guia de Prescrição'; pageEyebrow.textContent='Dermatologia + Tricologia';
      searchInput.placeholder='Buscar medicamento, classe, indicação ou situação clínica…';
    } else {
      const titles={home:'Todas as doenças',dermatology:'Dermatologia',trichology:'Tricologia',favorites:'Favoritos',recent:'Recentes'};
      listTitle.textContent=titles[state.view]||'Conteúdos'; listEyebrow.textContent='Conteúdos';
      pageTitle.textContent='Dermatologia + Tricologia'; pageEyebrow.textContent='Biblioteca clínica';
      searchInput.placeholder='Buscar doença, sintoma ou termo clínico…';
    }
    if(!items.length){diseaseList.innerHTML='<div class="empty-state"><p>Nenhum conteúdo encontrado com os filtros atuais.</p></div>';return;}

    if(isRx()){
      diseaseList.innerHTML=items.map(item=>{
        const e=rxDetails[item.name]||{};
        const preview=(e.choose&&e.choose[0])||item.indications;
        return `<button class="disease-card ${state.selectedType==='rx'&&state.selectedId===item.id?'active':''}" data-rx-id="${item.id}">
          <div class="title-row"><strong>${escapeHtml(item.name)}</strong><span class="mini-arrow">›</span></div>
          <small>${escapeHtml(preview)}</small>
          <div class="tag-row"><span class="tag">${escapeHtml(item.class)}</span><span class="tag">${escapeHtml(item.status)}</span></div>
        </button>`;
      }).join('');
      diseaseList.querySelectorAll('[data-rx-id]').forEach(card=>card.addEventListener('click',()=>selectRx(card.dataset.rxId)));
      return;
    }

    diseaseList.innerHTML=items.map(item=>`<button class="disease-card ${state.selectedType==='disease'&&state.selectedId===item.id?'active':''}" data-id="${item.id}">
      <div class="title-row"><strong>${escapeHtml(item.name)}</strong><span class="star ${state.favorites.has(item.id)?'on':''}" data-star="${item.id}" role="button" aria-label="Favoritar">★</span></div>
      <small>${escapeHtml(item.summary)}</small>
      <div class="tag-row"><span class="tag">${escapeHtml(item.area)}</span><span class="tag">${escapeHtml(item.category)}</span></div>
    </button>`).join('');
    diseaseList.querySelectorAll('.disease-card').forEach(card=>card.addEventListener('click',event=>{
      const star=event.target.closest('[data-star]'); if(star){event.preventDefault();event.stopPropagation();toggleFavorite(star.dataset.star);return;} selectDisease(card.dataset.id);
    }));
  }

  function toggleFavorite(id){
    state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);
    localStorage.setItem('dt-favorites',JSON.stringify([...state.favorites])); renderList(); if(state.selectedId===id&&state.selectedType==='disease') renderDetail();
  }
  function selectDisease(id){state.selectedType='disease';state.selectedId=id;state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,25);localStorage.setItem('dt-recent',JSON.stringify(state.recent));renderList();renderDetail();}
  function selectRx(id){state.selectedType='rx';state.selectedId=id;renderList();renderDetail();}

  function bodyHtml(content){
    if(content===undefined||content===null||content===''||(Array.isArray(content)&&!content.length)) return '';
    if(Array.isArray(content)) return `<ul>${content.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
    return `<p>${escapeHtml(content).replace(/\n/g,'<br>')}</p>`;
  }

  function accordion(title, content, opts={}){
    const body=opts.raw?content:bodyHtml(content);
    if(!body) return '';
    const badge=opts.badge?`<span class="accordion-badge">${escapeHtml(opts.badge)}</span>`:'';
    return `<details class="clinical-accordion ${opts.warning?'accordion-warning':''}" ${opts.open?'open':''}>
      <summary><span>${escapeHtml(title)}</span><span class="summary-right">${badge}<span class="chevron">⌄</span></span></summary>
      <div class="accordion-body">${body}</div>
    </details>`;
  }

  function accordionTools(){
    return `<div class="accordion-tools"><button class="text-btn" data-expand-all>Expandir tudo</button><span>·</span><button class="text-btn" data-collapse-all>Recolher tudo</button></div>`;
  }

  function bindAccordionTools(){
    const expand=detailPanel.querySelector('[data-expand-all]');
    const collapse=detailPanel.querySelector('[data-collapse-all]');
    if(expand) expand.addEventListener('click',()=>detailPanel.querySelectorAll('details.clinical-accordion').forEach(d=>d.open=true));
    if(collapse) collapse.addEventListener('click',()=>detailPanel.querySelectorAll('details.clinical-accordion').forEach(d=>d.open=false));
  }

  function renderRxDetail(){
    const item=prescriptions.find(x=>x.id===state.selectedId);
    if(!item){detailPanel.className='detail-panel empty';detailPanel.innerHTML='<div class="empty-state"><div class="empty-mark">Rx</div><h2>Selecione um medicamento</h2><p>Veja indicação, raciocínio, esquema, receita pronta, monitorização e segurança.</p></div>';return;}
    const e=rxDetails[item.name]||{};
    const overview=`<div class="overview-grid">
      <div><span class="overview-label">Quando considerar</span>${bodyHtml(e.choose||item.indications)}</div>
      ${e.rationale?`<div><span class="overview-label">Por que funciona</span><p>${escapeHtml(e.rationale)}</p></div>`:''}
    </div>`;
    const dosing=`<div class="stacked-copy"><div><span class="overview-label">Esquema usual</span>${bodyHtml(item.adultDose)}</div><div><span class="overview-label">Como orientar o uso</span>${bodyHtml(item.howToUse)}</div></div>`;
    const recipe=`<div class="prescription rx-prescription">${escapeHtml(item.sample).replace(/\n/g,'<br>')}</div><p class="microcopy">Modelo editável. Confirmar indicação, dose, apresentação, quantidade, contraindicações e particularidades do paciente antes de emitir.</p>`;
    const monitor=`<div class="stacked-copy">${bodyHtml(e.follow)}${bodyHtml(item.monitoring)}</div>`;
    const safety=`<div class="stacked-copy">${bodyHtml(e.redFlags)}${bodyHtml(item.contraindications)}</div>`;

    detailPanel.className='detail-panel';
    detailPanel.innerHTML=`
      <div class="detail-header">
        <div class="eyebrow">${escapeHtml(item.class)}</div>
        <div class="detail-title">${escapeHtml(item.name)}</div>
        <p class="detail-summary">${escapeHtml(item.indications)}</p>
        <div class="tag-row" style="margin-top:12px"><span class="tag status-tag">${escapeHtml(item.status)}</span>${(item.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      </div>
      ${accordionTools()}
      ${accordion('Visão prática',overview,{raw:true,open:true,badge:'COMECE AQUI'})}
      ${accordion('Apresentações disponíveis',item.presentations)}
      ${accordion('Posologia e como prescrever',dosing,{raw:true})}
      ${accordion('Modelo de receita',recipe,{raw:true,badge:'EDITÁVEL'})}
      ${accordion('Como iniciar, ajustar e usar na prática',e.practical||item.howToUse)}
      ${accordion('Monitorização e acompanhamento',monitor,{raw:true})}
      ${accordion('Quando evitar / sinais de alerta',safety,{raw:true,warning:true})}
      ${accordion('Interações relevantes',item.interactions,{warning:true})}
      ${accordion('Gestação e lactação',item.pregnancy,{warning:true})}
      ${accordion('Orientações ao paciente',item.patientAdvice)}
      ${accordion('Referências e base de evidência',item.source)}
      <div class="integration-actions"><button class="primary" id="useRxInPatient">Adicionar à prescrição do paciente</button><button class="secondary" id="openAiFromRx">Perguntar à IA</button></div>`;
    bindAccordionTools();
    detailPanel.querySelector('#openAiFromRx').addEventListener('click',openAiDialog);
    detailPanel.querySelector('#useRxInPatient').addEventListener('click',()=>{openAiDialog();patientContext.focus();});
  }

  function renderDetail(){
    if(state.selectedType==='rx'||isRx()){renderRxDetail();return;}
    const item=data.find(x=>x.id===state.selectedId);
    if(!item){detailPanel.className='detail-panel empty';detailPanel.innerHTML='<div class="empty-state"><div class="empty-mark">DT</div><h2>Selecione uma condição</h2><p>A ficha clínica aparecerá aqui.</p></div>';return;}
    const recipe=`<div class="prescription">${escapeHtml(item.prescription).replace(/\n/g,'<br>')}</div><p class="microcopy">Modelo clínico editável; deve ser individualizado conforme idade, gestação, comorbidades, alergias, interações e apresentação disponível.</p>`;
    detailPanel.className='detail-panel';
    detailPanel.innerHTML=`<div class="detail-header"><div class="detail-title-row"><div><div class="eyebrow">${escapeHtml(item.area)} · ${escapeHtml(item.category)}</div><div class="detail-title">${escapeHtml(item.name)}</div></div><button class="star ${state.favorites.has(item.id)?'on':''}" id="detailStar" aria-label="Favoritar">★</button></div><p class="detail-summary">${escapeHtml(item.summary)}</p><div class="tag-row" style="margin-top:12px">${(item.tags||[]).map(tag=>`<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div></div>
      ${accordionTools()}
      ${accordion('Apresentação clínica',item.clinic,{open:true})}
      ${accordion('Como confirmar o diagnóstico',item.diagnosis)}
      ${accordion('Diagnósticos diferenciais',item.differentials)}
      ${accordion('Exames e investigação',item.exams)}
      ${item.trichoscopy?accordion('Tricoscopia',item.trichoscopy):''}
      ${accordion('Abordagem terapêutica',item.treatment)}
      ${accordion('Prescrição / conduta editável',recipe,{raw:true,badge:'EDITÁVEL'})}
      ${accordion('Alertas e contraindicações',item.alerts,{warning:true})}
      ${accordion('Acompanhamento e reavaliação',item.followup)}
      ${accordion('Referências-base',item.references)}
      <div class="integration-actions"><button class="primary" id="useInPatient">Usar no paciente</button><button class="secondary" id="openAiFromDetail">Perguntar à IA</button></div>`;
    bindAccordionTools();
    detailPanel.querySelector('#detailStar').addEventListener('click',()=>toggleFavorite(item.id));
    detailPanel.querySelector('#openAiFromDetail').addEventListener('click',openAiDialog);
    detailPanel.querySelector('#useInPatient').addEventListener('click',()=>{openAiDialog();patientContext.focus();});
  }

  function openAiDialog(){
    if(state.selectedType==='rx'){
      const rx=prescriptions.find(x=>x.id===state.selectedId);
      aiContext.textContent=rx?`Medicamento selecionado: ${rx.name}. A IA poderá confrontar indicação, dose, contraindicações, interações e dados do paciente antes de montar a receita.`:'Selecione um medicamento.';
    } else {
      const item=data.find(x=>x.id===state.selectedId);
      aiContext.textContent=item?`Condição selecionada: ${item.name}. A IA poderá combinar esta ficha com avaliação, fotos, medicamentos e histórico do paciente.`:'Selecione uma doença.';
    }
    aiOutput.style.display='none';aiOutput.textContent='';aiDialog.showModal();
  }

  function generateContext(event){
    event.preventDefault(); const patient=patientContext.value.trim()||'[contexto do paciente não informado]'; aiOutput.style.display='block';
    if(state.selectedType==='rx'){
      const x=prescriptions.find(v=>v.id===state.selectedId); if(!x){aiOutput.textContent='Selecione um medicamento primeiro.';return;}
      const e=rxDetails[x.name]||{};
      aiOutput.textContent=['CONTEXTO PARA IA — PRESCRIÇÃO',`Medicamento: ${x.name}`,`Status regulatório/uso: ${x.status}`,`Indicações: ${x.indications}`,`Quando considerar: ${(e.choose||[]).join('; ')}`,`Dose/esquema: ${x.adultDose}`,`Pontos práticos: ${(e.practical||[]).join('; ')}`,`Monitorização: ${[...(e.follow||[]),...(x.monitoring||[])].join('; ')}`,`Alertas/contraindicações: ${[...(e.redFlags||[]),...(x.contraindications||[])].join('; ')}`,`Interações: ${(x.interactions||[]).join('; ')}`,`Gestação/lactação: ${x.pregnancy}`,'','DADOS DO PACIENTE:',patient,'','Tarefa: verificar se indicação e esquema são adequados ao paciente, sinalizar riscos/interações, sugerir ajustes e somente então montar prescrição editável.'].join('\n'); return;
    }
    const x=data.find(v=>v.id===state.selectedId); if(!x){aiOutput.textContent='Selecione uma condição primeiro.';return;}
    aiOutput.textContent=['CONTEXTO PARA IA CLÍNICA — DERMATRICHO',`Condição-base: ${x.name}`,`Resumo: ${x.summary}`,`Clínica-chave: ${x.clinic}`,`Diferenciais: ${(x.differentials||[]).join('; ')}`,`Investigação: ${x.exams}`,`Tratamento-base: ${x.treatment}`,x.trichoscopy?`Tricoscopia: ${x.trichoscopy}`:'',`Alertas: ${x.alerts}`,'','DADOS DO PACIENTE:',patient,'','Tarefa: confrontar hipótese e diferenciais com os dados; identificar lacunas; propor plano individualizado; gerar prescrição editável e orientação.'].filter(Boolean).join('\n');
  }

  function renderNav(){document.querySelectorAll('.nav-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===state.view));}
  function render(){renderNav();renderCategories();renderList();renderDetail();}

  document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{state.view=btn.dataset.view;state.category='Todas';state.query='';searchInput.value='';state.selectedId=null;state.selectedType=isRx()?'rx':'disease';render();}));
  searchInput.addEventListener('input',()=>{state.query=searchInput.value;renderList();});
  aiButton.addEventListener('click',openAiDialog); generateAi.addEventListener('click',generateContext); render();
})();