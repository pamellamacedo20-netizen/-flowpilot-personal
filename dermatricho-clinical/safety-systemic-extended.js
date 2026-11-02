(() => {
  const panel=document.querySelector('#detailPanel'); if(!panel)return;
  const N=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const has=(text,arr)=>arr.some(x=>N(text).includes(N(x)));
  const rep=p=>['possible','trying','pregnant'].includes(p.pregnancy);
  const item=(level,text)=>({level,text,__extended:true});
  function extra(name,p){
    const out=[];const meds=p.meds||'';
    if(name==='Metotrexato'){
      if(rep(p))out.push(item('block','Metotrexato é contraindicado na gestação para indicações não neoplásicas; interromper este fluxo e revisar planejamento reprodutivo.'));
      if(['reduced','dialysis'].includes(p.renal))out.push(item('caution','Disfunção renal pode aumentar exposição/toxicidade do metotrexato; revisar eGFR, dose e alternativa.'));
      if(p.hepatic&&p.hepatic!=='normal'&&p.hepatic!=='unknown')out.push(item('caution','Alteração hepática informada: revisar risco de hepatotoxicidade antes de prescrever metotrexato.'));
      if(has(meds,['trimetoprim','cotrimoxazol','sulfametoxazol-trimetoprim']))out.push(item('block','Metotrexato + trimetoprim/cotrimoxazol: risco de mielossupressão/toxicidade grave; evitar associação.'));
    }
    if(name==='Ciclosporina'){
      if(!p.weight)out.push(item('incomplete','Informe o peso para calcular a dose em mg/kg/dia da ciclosporina.'));
      if(!p.bp)out.push(item('incomplete','Informe a pressão arterial antes de liberar ciclosporina.'));
      if(['reduced','dialysis'].includes(p.renal))out.push(item('block','Protocolo dermatológico: função renal reduzida informada; não liberar ciclosporina sem revisão especializada do risco nefrotóxico.'));
      if(p.bp==='high')out.push(item('caution','Hipertensão informada: ciclosporina pode piorar pressão arterial; confirmar controle antes do uso.'));
      if(has(meds,['itraconazol','cetoconazol','claritromicina','eritromicina']))out.push(item('caution','Azol/macrolídeo identificado: pode elevar exposição à ciclosporina; revisar interação e monitorização.'));
    }
    if(name==='Micofenolato mofetil'){
      if(rep(p))out.push(item('block','Micofenolato é teratogênico e contraindicado na gestação; exige prevenção gestacional e protocolo específico.'));
      if(has(meds,['azatioprina','metotrexato','ciclosporina','baricitinibe','ritlecitinibe','upadacitinibe','abrocitinibe']))out.push(item('caution','Outro imunossupressor sistêmico foi informado; combinação exige justificativa e monitorização especializada.'));
    }
    if(name==='Acitretina'){
      if(rep(p))out.push(item('block','Acitretina é altamente teratogênica; gestação/tentativa/possibilidade de gestação bloqueiam este fluxo.'));
      if(['reduced','dialysis'].includes(p.renal))out.push(item('block','Acitretina é contraindicada em disfunção renal grave na rotulagem de referência.'));
      if(p.hepatic==='active')out.push(item('block','Doença hepática ativa/grave informada: não liberar acitretina.'));
      if(has(meds,['doxiciclina','minociclina','sareciclina','tetraciclina']))out.push(item('block','Acitretina + tetraciclina: evitar pelo risco de hipertensão intracraniana.'));
      if(has(meds,['metotrexato']))out.push(item('caution','Acitretina + metotrexato aumenta preocupação com hepatotoxicidade; evitar combinação rotineira.'));
    }
    if(name==='Azatioprina'){
      if(has(meds,['alopurinol','febuxostate','febuxostato']))out.push(item('block','Alopurinol/febuxostate pode elevar fortemente exposição aos metabólitos da azatioprina; combinação exige ajuste especializado e não deve ser liberada automaticamente.'));
      if(rep(p))out.push(item('caution','Gestação/planejamento reprodutivo informado: decisão sobre azatioprina depende da indicação e avaliação especializada; não aplicar automaticamente protocolo dermatológico eletivo.'));
    }
    if(['Upadacitinibe','Abrocitinibe'].includes(name)){
      if(rep(p))out.push(item('block','Inibidor JAK sistêmico: gestação/tentativa de gestação bloqueiam o protocolo dermatológico até revisão da bula e planejamento reprodutivo.'));
      if(has(meds,['baricitinibe','ritlecitinibe','tofacitinibe','adalimumabe','infliximabe','secuquinumabe','bimequizumabe','dupilumabe','omalizumabe','ciclosporina','azatioprina']))out.push(item('block','Outro JAK/biológico/imunossupressor potente foi identificado; a combinação não deve ser liberada automaticamente.'));
    }
    if(name==='Abrocitinibe'&&['reduced','dialysis'].includes(p.renal))out.push(item('caution','Abrocitinibe exige ajuste/limitação conforme eGFR; revisar função renal e dose antes de prescrever.'));
    if(['Tralokinumabe','Risankizumabe'].includes(name)){
      if(rep(p))out.push(item('caution','Gestação/planejamento reprodutivo: revisar dados de segurança e bula brasileira antes de iniciar biológico.'));
      if(has(meds,['vacina viva','febre amarela','tríplice viral','triplice viral','varicela']))out.push(item('caution','Vacina viva informada: revisar calendário e bula antes de iniciar/continuar o biológico.'));
    }
    return out;
  }
  function render(){
    const gate=panel.querySelector('.rx-safety-gate');const last=window.DT_RX_SAFETY_LAST;if(!gate||!last)return;
    const name=panel.querySelector('.detail-title')?.textContent?.trim();if(!name||last.drug!==name)return;
    const base=(last.items||[]).filter(x=>!x.__extended);const more=extra(name,last.profile||{});if(!more.length&&!(last.items||[]).some(x=>x.__extended))return;
    const items=[...base,...more];const blocks=items.filter(x=>x.level==='block'),cautions=items.filter(x=>x.level==='caution'),incomplete=items.filter(x=>x.level==='incomplete');
    const ack=gate.querySelector('[data-rx-ack]');const list=gate.querySelector('[data-rx-safety-list]');const status=gate.querySelector('[data-rx-safety-status]');const action=panel.querySelector('#useRxInPatient');
    const canRelease=!blocks.length&&!incomplete.length&&(!cautions.length||!!ack?.checked);
    const label=blocks.length?'PRESCRIÇÃO BLOQUEADA':incomplete.length?'PREENCHA OS DADOS ESSENCIAIS':cautions.length?'REVISÃO MÉDICA NECESSÁRIA':'TRIAGEM SEM ALERTA CRÍTICO';
    const tone=blocks.length?'blocked':incomplete.length?'pending':cautions.length?'caution':'clear';
    if(list)list.innerHTML=items.length?items.map(x=>`<div class="rx-alert rx-${esc(x.level)}"><b>${x.level==='block'?'BLOQUEIO':x.level==='caution'?'CAUTELA':x.level==='incomplete'?'DADOS PENDENTES':'INFO'}</b><span>${esc(x.text)}</span></div>`).join(''):'<div class="rx-alert rx-ok"><b>OK</b><span>Nenhum alerta estruturado identificado.</span></div>';
    if(status){status.className=`rx-safety-status ${tone}`;status.textContent=label;}
    if(action){action.disabled=!canRelease;action.classList.toggle('rx-disabled',!canRelease);action.textContent=blocks.length?'Prescrição bloqueada':incomplete.length?'Complete a triagem de segurança':cautions.length&&!ack?.checked?'Confirme as cautelas para continuar':'Adicionar à receita';}
    window.DT_RX_SAFETY_LAST={...last,items,status:label,canRelease};
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;render();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled']});panel.addEventListener('input',queue,true);panel.addEventListener('change',queue,true);queue();
})();