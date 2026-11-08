/* Auditoria transversal de qualidade estrutural do catálogo.
   Não é validação editorial, farmacológica ou médica independente. */
(() => {
  const BASE=['summary','clinic','diagnosis','differentials','exams','treatment','prescription','alerts','followup','references'];
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const recent=new Set([
    'leprosy','cutaneous-lupus','prurigo-nodular','pemphigus-vulgar','bullous-pemphigoid','periorificial-dermatitis','pityriasis-rosea','pityriasis-versicolor','warts','molluscum','herpes-simplex','impetigo','cutaneous-syphilis',
    'lichen-sclerosus','lichen-planus-cutaneous','chronic-pruritus','morphea','pyoderma-gangrenosum','erythema-nodosum','erythema-multiforme','dress','sjs-ten','hyperhidrosis','keloids','erythrasma-intertrigo'
  ]);
  // IDs podem mudar; a classificação abaixo é apenas marcador de priorização, não prova de falta de conteúdo.
  const expandedNames=new Set(['Hanseníase','Lúpus eritematoso cutâneo','Prurigo nodular','Pênfigo vulgar','Penfigoide bolhoso','Dermatite periorificial','Pitiríase rósea','Pitiríase versicolor','Verrugas virais cutâneas','Molusco contagioso','Herpes simples cutâneo/genital','Impetigo e ectima','Sífilis cutânea (primária/secundária)','Líquen escleroso','Líquen plano cutâneo/oral','Prurido crônico','Morfeia (esclerodermia localizada)','Pioderma gangrenoso','Eritema nodoso','Eritema multiforme','DRESS (reação medicamentosa com eosinofilia e sintomas sistêmicos)','Síndrome de Stevens-Johnson / necrólise epidérmica tóxica','Hiperidrose','Queloide e cicatriz hipertrófica','Eritrasma e intertrigo infectado']);
  const filled=v=>Array.isArray(v)?v.length>0:typeof v==='string'?v.trim().length>0:v!=null;
  function run(){
    const diseases=window.DERMA_TRICHO_DATA||[];
    const registry=window.DT_EVIDENCE_REGISTRY?.diseases||{};
    const pivots=window.DT_DECISION_PIVOTS||{};
    const unique=new Set(diseases.map(x=>x.id));
    const rows=diseases.map(d=>{
      const missing=BASE.filter(k=>!filled(d[k]));
      const ev=registry[d.name]||[];
      const branches=pivots[d.name]||[];
      const gaps=[];
      if(missing.length)gaps.push('Sem campos: '+missing.join(', '));
      if(!Array.isArray(ev)||!ev.length)gaps.push('Sem fonte específica no registro de evidências');
      if(!Array.isArray(branches)||!branches.length)gaps.push('Sem pivôs clínicos');
      if(d.area==='Tricologia'&&!filled(d.trichoscopy))gaps.push('Sem tricoscopia estruturada');
      const sourceLevel=Array.isArray(ev)&&ev.some(x=>['A','B'].includes(x.quality))?'A/B':Array.isArray(ev)&&ev.some(x=>x.quality==='C')?'C':'não qualificado';
      const deeper=expandedNames.has(d.name);
      const protocol=window.DT_EXPANDED_TREATMENT_PROTOCOLS?.[d.name];
      if(deeper&&!protocol)gaps.push('Protocolo de tratamento aprofundado não carregado');
      return {id:d.id,name:d.name,area:d.area,structural:!gaps.length,gaps,evidence:ev.length,pivots:branches.length,sourceLevel,depth:deeper?(protocol?'protocolo por cenário (validação farmacológica ainda necessária)':'protocolo não carregado'):'compêndio clínico histórico; verificar monografia item a item'};
    });
    const panel=document.querySelector('#detailPanel');
    const title=panel?.querySelector('.detail-title')?.textContent?.trim();
    const current=title&&diseases.find(d=>d.name===title);
    const txt=panel?.querySelector('details[data-dt-recovered] .accordion-body')?.textContent||'';
    if(current&&expandedNames.has(current.name)&&!panel?.querySelector('[data-dt-recovered-treatment]')){
      const found=rows.find(x=>x.id===current.id);if(found)found.gaps.push('Síntese de tratamento ainda não renderizada nesta ficha');
    }
    const report={version:'2026-11-06',total:diseases.length,uniqueIds:unique.size,structuralComplete:rows.filter(r=>r.structural).length,missing:rows.filter(r=>r.gaps.length),deeperReview:rows.filter(r=>expandedNames.has(r.name)).map(r=>r.name),protocolsByScenario:rows.filter(r=>!!window.DT_EXPANDED_TREATMENT_PROTOCOLS?.[r.name]).length,rows,at:new Date().toISOString()};
    try{localStorage.setItem('dt-disease-quality-report-2026',JSON.stringify(report));}catch{}
    return report;
  }
  const reportText=r=>['DermaTricho · auditoria de doenças · '+r.at,'Fichas: '+r.total+' | IDs únicos: '+r.uniqueIds+' | Estruturalmente cobertas: '+r.structuralComplete,'',...r.rows.map(x=>x.name+' | '+x.evidence+' fonte(s) | '+x.pivots+' pivô(s) | '+x.depth+(x.gaps.length?' | LACUNAS: '+x.gaps.join('; '):''))].join('\n');
  function show(){
    const r=run();
    let d=document.querySelector('#dtClinicalAuditDialog');if(!d){d=document.createElement('dialog');d.id='dtClinicalAuditDialog';d.className='dt-qa-dialog';document.body.appendChild(d);}
    const failures=r.rows.filter(x=>x.gaps.length);
    d.innerHTML='<div class="dt-qa-shell"><header><div><span class="eyebrow">Auditoria clínica</span><h2>56 fichas — completude de conteúdo</h2><small>'+r.structuralComplete+'/'+r.total+' estruturalmente cobertas · '+r.protocolsByScenario+' protocolos por cenário · farmacologia individual pendente</small></div><button type="button" class="icon-btn" data-close-disease-audit>×</button></header><div class="dt-qa-list"><p class="microcopy">Auditoria automatizada dos campos, evidências e pivôs. NÃO comprova exatidão de doses, atualização de bula nem revisão independente de cada frase.</p>'+(failures.length?failures.map(x=>'<div class="dt-qa-row"><b class="dt-qa-fail">!</b><div><strong>'+esc(x.name)+'</strong><p>'+esc(x.gaps.join(' · '))+'</p></div></div>').join(''):'<p>Nenhum campo estrutural obrigatório ausente.</p>')+'<div class="dt-qa-row"><b class="dt-qa-warn">!</b><div><strong>Revisão de profundidade terapêutica</strong><p>As 25 fichas expandidas ganharam protocolos por cenário, mas doses, apresentações brasileiras e interações ainda exigem revisão farmacológica antes da emissão da prescrição.</p></div></div></div><footer style="display:flex;gap:8px;justify-content:flex-end;padding:14px 20px"><button type="button" class="secondary" data-copy-disease-audit>Copiar relatório</button><button type="button" class="primary" data-close-disease-audit>Fechar</button></footer></div>';
    d.querySelectorAll('[data-close-disease-audit]').forEach(x=>x.addEventListener('click',()=>d.close()));
    d.querySelector('[data-copy-disease-audit]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(reportText(r));window.DT_UI?.toast?.('Relatório copiado')}catch{window.prompt('Copie o relatório:',reportText(r))}});
    if(!d.open)d.showModal();
  }
  function init(){
    const params=new URLSearchParams(location.search);if(params.get('qa')!=='1')return;
    const side=document.querySelector('.sidebar');if(!side||side.querySelector('[data-audit-56]'))return;
    const b=document.createElement('button');b.type='button';b.className='dt-qa-btn';b.dataset.audit56='1';b.textContent='Auditar conteúdo das doenças';
    side.appendChild(b);b.addEventListener('click',show);
  }
  window.DT_CLINICAL_AUDIT={run,show};
  init();
})();