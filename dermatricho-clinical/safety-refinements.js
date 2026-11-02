(() => {
  const panel=document.querySelector('#detailPanel'); const meds=window.DERMA_TRICHO_PRESCRIPTIONS||[]; if(!panel)return;
  const N=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const labelMap={age:'idade',weight:'peso',sex:'sexo biológico',pregnancy:'situação gestacional',lactation:'aleitamento',renal:'função renal',hepatic:'função hepática',potassium:'potássio',bp:'pressão arterial',cardiac:'situação cardiovascular',retinal:'doença retiniana/macular',qt:'QT/arritmia',allergies:'alergias',meds:'medicações em uso'};
  const systemicWeight=new Set(['rx-isotretinoin','rx-minoxidil-oral','rx-hydroxychloroquine','rx-ivermectin']);
  const cardiacSet=new Set(['rx-minoxidil-oral']);
  const potassiumSet=new Set(['rx-spironolactone']);
  const retinalSet=new Set(['rx-hydroxychloroquine']);
  const lactationSet=new Set(['rx-isotretinoin','rx-minoxidil-oral','rx-finasteride','rx-dutasteride','rx-spironolactone','rx-doxycycline','rx-hydroxychloroquine','rx-terbinafine','rx-ivermectin']);
  function isTopical(rx){const s=N(`${rx.name} ${rx.class||''}`);return /topico|topica|xampu|creme|gel|locao|solucao|espuma|pomada|esmalte/.test(s)&&!s.includes('oral');}
  function required(rx){
    const base=isTopical(rx)?['age','pregnancy','allergies','meds']:['age','sex','pregnancy','renal','hepatic','allergies','meds'];
    if(systemicWeight.has(rx.id))base.push('weight');
    if(cardiacSet.has(rx.id))base.push('bp','cardiac');
    if(potassiumSet.has(rx.id))base.push('potassium');
    if(retinalSet.has(rx.id))base.push('retinal','qt');
    if(lactationSet.has(rx.id))base.push('lactation');
    return [...new Set(base)];
  }
  function refine(){
    const gate=panel.querySelector('.rx-safety-gate'); if(!gate||!window.DT_RX_SAFETY_LAST)return;
    const name=panel.querySelector('.detail-title')?.textContent?.trim(); const rx=meds.find(x=>x.name===name); if(!rx)return;
    const last=window.DT_RX_SAFETY_LAST; if(last.drug!==rx.name)return;
    const profile=last.profile||{}; const missing=required(rx).filter(k=>!profile[k]);
    const items=(last.items||[]).filter(x=>!(x.level==='incomplete'&&/complete idade, peso/i.test(x.text||'')));
    if(missing.length)items.push({level:'incomplete',text:`Complete os campos relevantes para este medicamento: ${missing.map(k=>labelMap[k]||k).join(', ')}.`});
    const blocks=items.filter(x=>x.level==='block'),cautions=items.filter(x=>x.level==='caution'),incomplete=items.filter(x=>x.level==='incomplete');
    const ack=gate.querySelector('[data-rx-ack]'); const action=panel.querySelector('#useRxInPatient'); const list=gate.querySelector('[data-rx-safety-list]'); const status=gate.querySelector('[data-rx-safety-status]');
    const canRelease=!blocks.length&&!incomplete.length&&(!cautions.length||!!ack?.checked);
    const label=blocks.length?'PRESCRIÇÃO BLOQUEADA':incomplete.length?'PREENCHA OS DADOS ESSENCIAIS':cautions.length?'REVISÃO MÉDICA NECESSÁRIA':'TRIAGEM SEM ALERTA CRÍTICO';
    const tone=blocks.length?'blocked':incomplete.length?'pending':cautions.length?'caution':'clear';
    if(list)list.innerHTML=items.length?items.map(x=>`<div class="rx-alert rx-${esc(x.level)}"><b>${x.level==='block'?'BLOQUEIO':x.level==='caution'?'CAUTELA':x.level==='incomplete'?'DADOS PENDENTES':'INFO'}</b><span>${esc(x.text)}</span></div>`).join(''):'<div class="rx-alert rx-ok"><b>OK</b><span>Nenhum alerta estruturado identificado com os dados informados.</span></div>';
    if(status){status.className=`rx-safety-status ${tone}`;status.textContent=label;}
    if(action){action.disabled=!canRelease;action.classList.toggle('rx-disabled',!canRelease);action.textContent=blocks.length?'Prescrição bloqueada':incomplete.length?'Complete a triagem de segurança':cautions.length&&!ack?.checked?'Confirme as cautelas para continuar':'Adicionar à prescrição do paciente';}
    window.DT_RX_SAFETY_LAST={...last,items,status:label,canRelease};
  }
  let lock=false;const queue=()=>{if(lock)return;lock=true;requestAnimationFrame(()=>{lock=false;refine();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled']});
  panel.addEventListener('input',queue,true);panel.addEventListener('change',queue,true);queue();
})();