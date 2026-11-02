(() => {
  const panel = document.querySelector('#detailPanel');
  const searchInput = document.querySelector('#searchInput');
  const data = window.DERMA_TRICHO_DATA || [];
  if (!panel || !searchInput) return;

  const esc = (v='') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const norm = (v='') => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const numFrom = (text,re) => { const m=String(text||'').match(re); return m?Number(m[1].replace(',','.')):null; };

  const rxMap = {
    'Acne vulgar':['Adapaleno tópico','Peróxido de benzoíla','Doxiciclina','Espironolactona','Isotretinoína'],
    'Alopecia androgenética masculina':['Minoxidil tópico','Minoxidil oral em baixa dose','Finasterida','Dutasterida'],
    'Alopecia androgenética feminina':['Minoxidil tópico','Minoxidil oral em baixa dose','Espironolactona'],
    'Alopecia areata':['Triancinolona intralesional','Clobetasol tópico 0,05%'],
    'Alopecia fibrosante frontal':['Clobetasol tópico 0,05%','Tacrolimo tópico','Hidroxicloroquina','Doxiciclina'],
    'Líquen plano pilar':['Clobetasol tópico 0,05%','Tacrolimo tópico','Hidroxicloroquina','Doxiciclina'],
    'Dermatite seborreica':['Cetoconazol xampu'],
    'Psoríase do couro cabeludo':['Clobetasol tópico 0,05%'],
    'Psoríase':['Clobetasol tópico 0,05%'],
    'Dermatite atópica':['Tacrolimo tópico'],
    'Onicomicose':['Terbinafina oral'],
    'Escabiose':['Permetrina 5% creme/loção','Ivermectina oral'],
    'Rosácea':['Doxiciclina']
  };

  function tierFrom(result, detail){
    const t=norm(`${result} ${detail}`);
    if(/muito grave|grave|alta gravidade|alto risco|t2b|t3|t4|estagio iii|estagio iv/.test(t)) return 'high';
    if(/moderad|intermediaria|intermediario/.test(t)) return 'mid';
    return 'low';
  }

  function specificTier(name,result,detail){
    if(name==='Alopecia areata'){
      const s=numFrom(result,/SALT\s+([0-9.,]+)/i); if(s!==null) return s>=50?'high':s>=20?'mid':'low';
    }
    if(name==='Hidradenite supurativa'){
      const s=numFrom(result,/IHS4\s+([0-9.,]+)/i); if(s!==null) return s>=11?'high':s>=4?'mid':'low';
    }
    if(name==='Acne vulgar'){
      const s=numFrom(result,/GAGS\s+([0-9.,]+)/i); if(s!==null) return s>=31?'high':s>=19?'mid':'low';
    }
    if(name==='Dermatite atópica'){
      const s=numFrom(result,/EASI\s+([0-9.,]+)/i); if(s!==null) return s>21?'high':s>7?'mid':'low';
    }
    if(name==='Urticária crônica espontânea'){
      const s=numFrom(result,/UAS7\s+([0-9.,]+)/i); if(s!==null) return s>=28?'high':s>=7?'mid':'low';
    }
    if(name==='Onicomicose'){
      const s=numFrom(result,/OSI\s+([0-9.,]+)/i); if(s!==null) return s>=16?'high':s>=6?'mid':'low';
    }
    return tierFrom(result,detail);
  }

  function planFor(item,tier,result,detail){
    const base=item?.treatment||'Individualizar tratamento conforme diagnóstico, extensão, atividade, comorbidades e resposta prévia.';
    const label=tier==='high'?'Conduta para maior gravidade':tier==='mid'?'Conduta para gravidade intermediária':'Conduta inicial / menor gravidade';
    const actions=[];
    if(tier==='high'){
      actions.push('Confirmar diagnóstico, extensão, atividade e fatores de risco antes de escalonar o tratamento.');
      actions.push('Considerar terapia sistêmica, procedimento ou encaminhamento especializado quando indicado para esta condição.');
      actions.push('Encurtar o intervalo de reavaliação e documentar resposta com score/fotografia quando aplicável.');
    } else if(tier==='mid'){
      actions.push('Otimizar terapia de primeira linha e considerar associação ou escalonamento se resposta for insuficiente.');
      actions.push('Reavaliar adesão, técnica de uso, gatilhos e contraindicações antes de intensificar.');
    } else {
      actions.push('Priorizar primeira linha e medidas locais/gerais adequadas à condição.');
      actions.push('Documentar linha de base e reavaliar evolução antes de escalonamento, salvo sinais de alerta.');
    }
    if(nameSpecific[item?.name]) actions.unshift(...nameSpecific[item.name][tier]);
    return {label,base,actions,rx:rxMap[item?.name]||[],result,detail};
  }

  const nameSpecific={
    'Acne vulgar':{
      low:['Retinoide tópico e/ou peróxido de benzoíla são pilares para acne leve.'],
      mid:['Combinar terapia tópica; considerar antibiótico sistêmico por período limitado ou espironolactona em paciente selecionada.'],
      high:['Acne grave, cicatricial ou refratária deve levar à avaliação de isotretinoína quando elegível.']
    },
    'Alopecia areata':{
      low:['Doença limitada: priorizar tratamento local, frequentemente corticoide intralesional ou tópico potente.'],
      mid:['SALT intermediário/progressão relevante: discutir escalonamento sistêmico conforme impacto e atividade.'],
      high:['Doença extensa: avaliar terapia sistêmica apropriada e segurança antes do início.']
    },
    'Hidradenite supurativa':{
      low:['Doença limitada: manejo local e prevenção de progressão.'],
      mid:['Persistência inflamatória justifica terapia sistêmica e avaliação de lesões estruturais.'],
      high:['Doença grave: combinar controle inflamatório sistêmico com abordagem de túneis/cicatrizes.']
    },
    'Dermatite atópica':{
      low:['Emoliente + anti-inflamatório tópico dirigido.'],
      mid:['Otimizar tópicos; considerar fototerapia ou sistêmico se controle inadequado.'],
      high:['Considerar biológico/JAK conforme perfil; evitar corticoide sistêmico crônico como manutenção.']
    },
    'Psoríase':{
      low:['Doença localizada: corticosteroide tópico e/ou análogo de vitamina D conforme área.'],
      mid:['Revisar áreas especiais e impacto; considerar fototerapia ou sistêmico se controle tópico insuficiente.'],
      high:['Doença moderada-grave/alto impacto: avaliar terapia sistêmica e comorbidades, inclusive artrite psoriásica.']
    },
    'Onicomicose':{
      low:['Doença limitada pode ser manejada com terapia tópica em casos selecionados e diagnóstico confirmado.'],
      mid:['Maior acometimento aumenta a indicação de terapia sistêmica após confirmação micológica e revisão hepática/interações.'],
      high:['Doença grave: terapia sistêmica costuma ser necessária; avaliar matriz, dermatofitoma e fatores de falha.']
    }
  };

  function rxButtons(items){
    if(!items.length) return '<p class="tx-muted">Sem medicamento automático associado; selecionar terapia após avaliação clínica completa.</p>';
    return `<div class="tx-rx-list">${items.map(x=>`<button class="tx-rx" type="button" data-rx-search="${esc(x)}"><span>${esc(x)}</span><small>Abrir no Guia de prescrição</small></button>`).join('')}</div>`;
  }

  function context(){
    const title=panel.querySelector('.detail-title')?.textContent?.trim();
    const sev=panel.querySelector('.severity-root');
    if(!title||!sev) return null;
    return {title,sev,result:sev.querySelector('[data-sev-result] strong')?.textContent?.trim()||'',detail:sev.querySelector('[data-sev-result] p')?.textContent?.trim()||''};
  }

  function ensure(){
    const ctx=context(); if(!ctx) return;
    const sevDetails=ctx.sev.closest('details.clinical-accordion'); if(!sevDetails) return;
    let d=panel.querySelector('details[data-treatment-engine-v2]');
    if(!d){
      d=document.createElement('details');
      d.className='clinical-accordion treatment-accordion';
      d.dataset.treatmentEngineV2='1';
      d.innerHTML='<summary><span>Conduta orientada pela gravidade</span><span class="summary-right"><span class="accordion-badge">DINÂMICO</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"><div class="treatment-root"></div></div>';
      sevDetails.insertAdjacentElement('afterend',d);
    }
    render(d,ctx);
  }

  function render(details,ctx){
    const touched=ctx.sev.dataset.touched==='1';
    const item=data.find(x=>x.name===ctx.title);
    const tier=specificTier(ctx.title,ctx.result,ctx.detail);
    const sig=[ctx.title,ctx.result,ctx.detail,touched,tier].join('|');
    if(details.dataset.signature===sig) return;
    details.dataset.signature=sig;
    const root=details.querySelector('.treatment-root');
    if(!touched){
      root.innerHTML='<div class="tx-await"><strong>Preencha a avaliação de gravidade acima.</strong><p>Depois do primeiro campo marcado, a conduta será atualizada automaticamente.</p></div>';
      return;
    }
    const p=planFor(item,tier,ctx.result,ctx.detail);
    root.innerHTML=`<div class="tx-head"><span class="tx-kicker">Direção terapêutica</span><h4>${esc(p.label)}</h4><p>${esc(p.base)}</p></div><div class="tx-block"><span class="tx-label">Conduta sugerida</span><ol>${p.actions.map(a=>`<li>${esc(a)}</li>`).join('')}</ol></div><div class="tx-block"><span class="tx-label">Guia de prescrição relacionado</span>${rxButtons(p.rx)}</div><div class="tx-actions"><button type="button" class="primary tx-use">Usar esta conduta no paciente</button></div>`;
    details.open=true;
    root.querySelectorAll('[data-rx-search]').forEach(btn=>btn.addEventListener('click',()=>openRx(btn.dataset.rxSearch)));
    root.querySelector('.tx-use')?.addEventListener('click',()=>usePatient(ctx,p));
  }

  function openRx(term){
    document.querySelector('.nav-btn[data-view="prescriptions"]')?.click();
    requestAnimationFrame(()=>{searchInput.value=term;searchInput.dispatchEvent(new Event('input',{bubbles:true}));requestAnimationFrame(()=>document.querySelector('[data-rx-id]')?.click());});
  }

  function usePatient(ctx,p){
    document.querySelector('#aiButton')?.click();
    requestAnimationFrame(()=>{const ta=document.querySelector('#patientContext');if(!ta)return;const txt=[`AVALIAÇÃO: ${ctx.title}`,`GRAVIDADE/CLASSIFICAÇÃO: ${ctx.result}`,ctx.detail?`INTERPRETAÇÃO: ${ctx.detail}`:'',`DIREÇÃO TERAPÊUTICA: ${p.label}`,...p.actions.map(x=>`• ${x}`)].filter(Boolean).join('\n');ta.value=(ta.value?ta.value+'\n\n':'')+txt;ta.focus();});
  }

  panel.addEventListener('input',e=>{const sev=e.target.closest('.severity-root');if(!sev)return;sev.dataset.touched='1';requestAnimationFrame(ensure);});
  panel.addEventListener('change',e=>{const sev=e.target.closest('.severity-root');if(!sev)return;sev.dataset.touched='1';requestAnimationFrame(ensure);});

  let scheduled=false;
  const observer=new MutationObserver(muts=>{
    if(muts.some(m=>m.target===panel || [...m.addedNodes].some(n=>n.nodeType===1 && (n.matches?.('.detail-header')||n.querySelector?.('.detail-header'))))){
      if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;ensure();});}
    }
  });
  observer.observe(panel,{childList:true});
  ensure();
})();