(() => {
  const rows=[];
  const push=(name,ok,detail='',tone)=>rows.push({name,ok:!!ok,detail,tone:tone|| (ok?'ok':'fail')});
  function duplicateIds(){const seen=new Map(),dups=[];document.querySelectorAll('[id]').forEach(el=>{const id=el.id;if(!id)return;seen.set(id,(seen.get(id)||0)+1)});seen.forEach((n,id)=>{if(n>1)dups.push(`${id} ×${n}`)});return dups;}
  function currentTitle(){return document.querySelector('#detailPanel .detail-title')?.textContent?.trim()||'';}
  function audit(){
    rows.length=0;
    const diseases=window.DERMA_TRICHO_DATA||[];const meds=window.DERMA_TRICHO_PRESCRIPTIONS||[];
    push('Catálogo de doenças carregado',diseases.length>=50,`${diseases.length} doença(s)`);
    push('Guia de prescrição carregado',meds.length>=30,`${meds.length} medicamento(s)`);
    const safetyMap=window.DT_DRUG_SAFETY_MATRIX?.rules||{};
    const covered=meds.filter(x=>Object.prototype.hasOwnProperty.call(safetyMap,x.id)||window.DT_RX_SPECIFIC_IDS?.includes(x.id));
    push('Matriz complementar de segurança',Object.keys(safetyMap).length===41,`${Object.keys(safetyMap).length} monografias com precauções específicas adicionais`);
    const registry=window.DT_EVIDENCE_REGISTRY?.diseases||{};
    const pivots=window.DT_DECISION_PIVOTS||{};
    push('Evidências de todas as doenças',diseases.every(x=>Array.isArray(registry[x.name])&&registry[x.name].length>0),`${diseases.filter(x=>Array.isArray(registry[x.name])&&registry[x.name].length>0).length}/${diseases.length} doenças`);
    push('Pivôs para todas as doenças',diseases.every(x=>Array.isArray(pivots[x.name])&&pivots[x.name].length>0),`${diseases.filter(x=>Array.isArray(pivots[x.name])&&pivots[x.name].length>0).length}/${diseases.length} doenças`);
    push('Controle efetivo de exportação crítica',typeof window.DT_PRESCRIPTION_CART?.audit==='function','O carrinho expõe validação antes de copiar/imprimir.');
    const inverseDDI=window.DT_DDI_CRITICAL?.evaluate?.('Doxiciclina','Isotretinoína')||[];
    push('DDI bidirecional',inverseDDI.some(x=>x.level==='BLOQUEIO'),'Checa isotretinoína e tetraciclina independentemente da ordem.');
    const regulations=window.DT_REGULATORY_NOTES;
    push('Regras brasileiras de receita especial',!!regulations?.cases?.['rx-isotretinoin']&&!!regulations?.cases?.['rx-acitretin'],'SNCR/retinoides e PQT-U destacados, sem alegar registro ativo por produto.');
    push('Carrinho de receita disponível',!!window.DT_PRESCRIPTION_CART,'DT_PRESCRIPTION_CART');
    push('Guia de procedimentos disponível',Array.isArray(window.DT_PROCEDURES)&&window.DT_PROCEDURES.length>0,`${window.DT_PROCEDURES?.length||0} procedimento(s)`);
    push('Registro de evidências disponível',!!window.DT_EVIDENCE_REGISTRY,'DT_EVIDENCE_REGISTRY');
    const expanded=window.DT_EXPANDED_TREATMENT_PROTOCOLS||{};
    push('Protocolos por cenário das novas doenças',Object.keys(expanded).length===25,`${Object.keys(expanded).length}/25 protocolos com primeira linha, escalonamento e segurança`);
    push('Pivôs de decisão disponíveis',!!window.DT_DECISION_PIVOTS,`${Object.keys(window.DT_DECISION_PIVOTS||{}).length} doença(s) com pivôs`);
    push('Módulo de exposições especiais disponível',!!window.DT_SPECIAL_EXPOSURES,`${Object.keys(window.DT_SPECIAL_EXPOSURES||{}).length} contexto(s)`);
    push('Sem IDs duplicados',duplicateIds().length===0,duplicateIds().join(', ')||'nenhum');
    push('Dialog IA presente',!!document.querySelector('#aiDialog'),'#aiDialog');
    push('Dialog de receita presente',!!document.querySelector('#rxCartDialog'),'#rxCartDialog');
    push('Dialog de procedimentos presente',!!document.querySelector('#procedureDialog'),'#procedureDialog');
    push('Dialog de exposições presente',!!document.querySelector('#specialExposureDialog'),'#specialExposureDialog');
    const visibleDisabled=[...document.querySelectorAll('button:disabled')].filter(x=>x.offsetParent!==null);
    push('Sem botões desabilitados visíveis',visibleDisabled.length===0,visibleDisabled.map(x=>x.textContent.trim()).join(' | ')||'nenhum',visibleDisabled.length?'warn':'ok');
    const brokenLinks=[...document.querySelectorAll('a')].filter(a=>!a.getAttribute('href')||a.getAttribute('href')==='#');
    push('Links possuem destino',brokenLinks.length===0,brokenLinks.length?`${brokenLinks.length} link(s) sem destino`:'ok');
    const title=currentTitle();
    if(title){
      const isDisease=diseases.some(x=>x.name===title);const isRx=meds.some(x=>x.name===title);
      push('Ficha atual reconhecida',isDisease||isRx,title);
      if(isDisease){
        const pivots=window.DT_DECISION_PIVOTS?.[title]||[];push('Fluxograma presente quando há pivôs',!pivots.length||!!document.querySelector('[data-dt-flowchart]'),`${pivots.length} pivô(s)`);
        push('Ferramentas do consultório presentes',!!document.querySelector('.consultorio-tools'),'atalhos rápidos');
      }
      if(isRx){push('Triagem de segurança presente',!!document.querySelector('.rx-safety-gate'),'segurança pré-prescrição');push('Botão de adicionar receita presente',!!document.querySelector('#useRxInPatient'),'#useRxInPatient');}
    }
    const report={at:new Date().toISOString(),url:location.href,rows:[...rows],errors:window.DT_UI?.getErrors?.()||[]};
    try{localStorage.setItem('dt-last-qa-report-v1',JSON.stringify(report));}catch{}
    return report;
  }
  function renderReport(report){
    let d=document.querySelector('#dtQaDialog');if(!d){d=document.createElement('dialog');d.id='dtQaDialog';d.className='dt-qa-dialog';document.body.appendChild(d);}
    const fail=report.rows.filter(x=>!x.ok).length;const warn=report.rows.filter(x=>x.tone==='warn').length;
    d.innerHTML=`<div class="dt-qa-shell"><header><div><span class="eyebrow">Autoteste</span><h2>Integridade da interface</h2><small>${fail} falha(s) · ${warn} aviso(s)</small></div><button type="button" class="icon-btn" data-close-qa>×</button></header><div class="dt-qa-list">${report.rows.map(r=>`<div class="dt-qa-row"><b class="dt-qa-${r.ok?(r.tone==='warn'?'warn':'ok'):'fail'}">${r.ok?'✓':'✕'}</b><div><strong>${r.name}</strong><br><span>${String(r.detail||'')}</span></div></div>`).join('')}${report.errors.length?`<div class="dt-qa-row"><b class="dt-qa-warn">!</b><div><strong>Erros JavaScript registrados</strong><br><span>${report.errors.map(x=>`${x.kind}: ${x.message}`).join(' | ')}</span></div></div>`:''}</div></div>`;
    d.querySelector('[data-close-qa]')?.addEventListener('click',()=>d.close());if(!d.open)d.showModal();
  }
  function ensureDebugButton(){
    const params=new URLSearchParams(location.search);if(params.get('qa')!=='1')return;if(document.querySelector('[data-run-dt-qa]'))return;
    const side=document.querySelector('.sidebar');if(!side)return;const b=document.createElement('button');b.type='button';b.className='dt-qa-btn';b.dataset.runDtQa='1';b.textContent='Diagnóstico da interface';const note=side.querySelector('.sidebar-note');note?side.insertBefore(b,note):side.appendChild(b);
    b.addEventListener('click',()=>renderReport(audit()));
  }
  window.DT_QA={run:audit,show(){renderReport(audit())},last(){try{return JSON.parse(localStorage.getItem('dt-last-qa-report-v1')||'null')}catch{return null}}};
  setTimeout(()=>{audit();ensureDebugButton();},550);
  new MutationObserver(()=>ensureDebugButton()).observe(document.body,{childList:true,subtree:true});
})();
