(() => {
  const panel = document.querySelector('#detailPanel');
  const prescriptions = window.DERMA_TRICHO_PRESCRIPTIONS || [];
  if (!panel || !prescriptions.length) return;

  const cache = new Map();
  const esc = (v='') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const norm = (v='') => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const aliases = {
    'isotretinoína':'isotretinoin','isotretinoina':'isotretinoin','doxiciclina':'doxycycline','espironolactona':'spironolactone','minoxidil':'minoxidil','finasterida':'finasteride','dutasterida':'dutasteride','clobetasol':'clobetasol','triancinolona':'triamcinolone','hidroxicloroquina':'hydroxychloroquine','terbinafina':'terbinafine','cetoconazol':'ketoconazole','permetrina':'permethrin','ivermectina':'ivermectin','tacrolimo':'tacrolimus','adapaleno':'adapalene','tretinoína':'tretinoin','tretinoina':'tretinoin','peróxido de benzoíla':'benzoyl peroxide','peroxido de benzoila':'benzoyl peroxide',
    'losartana':'losartan','valsartana':'valsartan','enalapril':'enalapril','ramipril':'ramipril','lisinopril':'lisinopril','amlodipino':'amlodipine','anlodipino':'amlodipine','propranolol':'propranolol','atenolol':'atenolol','metoprolol':'metoprolol','carvedilol':'carvedilol','hidroclorotiazida':'hydrochlorothiazide','furosemida':'furosemide','lítio':'lithium','litio':'lithium','amiodarona':'amiodarone','azitromicina':'azithromycin','claritromicina':'clarithromycin','ritonavir':'ritonavir','cobicistat':'cobicistat','itraconazol':'itraconazole','trimetoprim':'trimethoprim','cálcio':'calcium','calcio':'calcium','magnésio':'magnesium','magnesio':'magnesium','ferro':'iron'
  };

  function englishName(v){ const k=norm(v); return aliases[k] || k; }
  function splitMeds(v=''){
    return [...new Set(v.split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean).map(x=>x.replace(/\b\d+(?:[.,]\d+)?\s*(mg|mcg|g|ml|ui)\b/ig,'').replace(/\b\d+x\/dia\b/ig,'').trim()).filter(Boolean))].slice(0,12);
  }
  async function jfetch(url){
    if(cache.has(url)) return cache.get(url);
    const p = fetch(url,{headers:{'Accept':'application/json'}}).then(r=>{if(!r.ok) throw new Error(`${r.status}`);return r.json();}).catch(()=>null);
    cache.set(url,p); return p;
  }
  async function rxnorm(term){
    const q=encodeURIComponent(englishName(term));
    let j=await jfetch(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${q}&search=2`);
    let id=j?.idGroup?.rxnormId?.[0];
    if(!id){
      j=await jfetch(`https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${q}&maxEntries=3&option=1`);
      id=j?.approximateGroup?.candidate?.[0]?.rxcui;
    }
    if(!id) return {input:term,name:englishName(term),rxcui:null,classes:[]};
    const n=await jfetch(`https://rxnav.nlm.nih.gov/REST/rxcui/${id}.json`);
    const c=await jfetch(`https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=${id}&relaSource=ATC`);
    const classes=(c?.rxclassDrugInfoList?.rxclassDrugInfo||[]).map(x=>x?.rxclassMinConceptItem?.className).filter(Boolean);
    return {input:term,name:n?.idGroup?.name||englishName(term),rxcui:id,classes:[...new Set(classes)].slice(0,6)};
  }
  async function label(term){
    const name=englishName(term).replace(/"/g,'');
    const q=encodeURIComponent(`openfda.generic_name:"${name}"`);
    let j=await jfetch(`https://api.fda.gov/drug/label.json?search=${q}&limit=1`);
    if(!j?.results?.length){
      const q2=encodeURIComponent(`openfda.substance_name:"${name}"`);
      j=await jfetch(`https://api.fda.gov/drug/label.json?search=${q2}&limit=1`);
    }
    const x=j?.results?.[0];
    if(!x) return null;
    const join=k=>Array.isArray(x[k])?x[k].join('\n'):'';
    return {
      interactions:join('drug_interactions'), contraindications:join('contraindications'), warnings:join('warnings_and_cautions')||join('warnings'), boxed:join('boxed_warning'),
      generic:(x.openfda?.generic_name||[]).join(', '), brand:(x.openfda?.brand_name||[]).join(', '), updated:j?.meta?.last_updated||''
    };
  }
  function excerpt(text,needle){
    if(!text) return '';
    const low=norm(text), n=norm(englishName(needle)); let i=low.indexOf(n);
    if(i<0){ const raw=norm(needle); i=low.indexOf(raw); }
    if(i<0) return '';
    const start=Math.max(0,i-180), end=Math.min(text.length,i+320); return text.slice(start,end).replace(/\s+/g,' ').trim();
  }
  function html(rx){
    return `<details class="clinical-accordion pharmacology-live" data-pharm-rx="${esc(rx.id)}">
      <summary><span>Verificação farmacológica externa</span><span class="summary-right"><span class="accordion-badge">AO VIVO</span><span class="chevron">⌄</span></span></summary>
      <div class="accordion-body">
        <div class="pharm-head"><div><span class="overview-label">Fontes públicas</span><h4>RxNorm / RxClass + bula FDA</h4></div><button type="button" class="secondary" data-pharm-run>Verificar agora</button></div>
        <p class="microcopy">Normaliza nomes e classes farmacológicas e pesquisa texto de interações, contraindicações e warnings nas bulas públicas. Não substitui uma base DDI proprietária completa.</p>
        <div class="pharm-status" data-pharm-status>Aguardando verificação.</div>
        <div data-pharm-results></div>
        <div class="pharm-provider-note"><b>DDI estruturada completa:</b> conector preparado para provedor comercial (ex.: DrugBank). Sem credencial/licença, o app mantém a camada pública + regras críticas locais.</div>
      </div>
    </details>`;
  }

  async function run(root,rx){
    const btn=root.querySelector('[data-pharm-run]'), status=root.querySelector('[data-pharm-status]'), out=root.querySelector('[data-pharm-results]');
    const meds=splitMeds(panel.querySelector('[data-rx-profile="meds"]')?.value||'');
    btn.disabled=true; status.textContent='Consultando RxNorm/RxClass e bulas públicas…'; out.innerHTML='';
    const selected=await rxnorm(rx.name);
    const selectedLabel=await label(rx.name);
    const normalized=await Promise.all(meds.map(rxnorm));
    const pairs=[];
    for(const m of normalized.slice(0,8)){
      const medLabel=await label(m.name||m.input);
      const a=excerpt(selectedLabel?.interactions||'',m.name||m.input) || excerpt(selectedLabel?.contraindications||'',m.name||m.input) || excerpt(selectedLabel?.warnings||'',m.name||m.input);
      const b=excerpt(medLabel?.interactions||'',selected.name) || excerpt(medLabel?.contraindications||'',selected.name) || excerpt(medLabel?.warnings||'',selected.name);
      if(a||b) pairs.push({med:m.input,norm:m.name,txt:a||b});
    }
    const labelFlags=[];
    if(selectedLabel?.boxed) labelFlags.push('Há boxed warning na bula pública selecionada.');
    if(selectedLabel?.contraindications) labelFlags.push('Contraindicações de bula disponíveis para revisão.');
    if(selectedLabel?.interactions) labelFlags.push('Seção de interações de bula encontrada.');
    out.innerHTML=`
      <div class="pharm-card"><b>Medicamento selecionado</b><div>${esc(rx.name)} → ${esc(selected.name||'não normalizado')} ${selected.rxcui?`<span class="pharm-id">RxCUI ${esc(selected.rxcui)}</span>`:''}</div>${selected.classes.length?`<small>Classes: ${selected.classes.map(esc).join(' · ')}</small>`:''}</div>
      <div class="pharm-card"><b>Medicações concomitantes normalizadas</b>${normalized.length?normalized.map(m=>`<div class="pharm-med">${esc(m.input)} → <strong>${esc(m.name||'não reconhecido')}</strong>${m.rxcui?` <span class="pharm-id">RxCUI ${esc(m.rxcui)}</span>`:''}${m.classes.length?`<small>${m.classes.map(esc).join(' · ')}</small>`:''}</div>`).join(''):'<p>Nenhuma medicação concomitante informada.</p>'}</div>
      <div class="pharm-card"><b>Possíveis correspondências encontradas em bula</b>${pairs.length?pairs.map(p=>`<div class="pharm-hit"><strong>${esc(p.med)}${p.norm&&p.norm!==p.med?` (${esc(p.norm)})`:''}</strong><p>${esc(p.txt)}</p></div>`).join(''):'<p>Nenhuma correspondência textual encontrada nas bulas consultadas. Isso não exclui interação.</p>'}</div>
      ${labelFlags.length?`<div class="pharm-card"><b>Seções de segurança encontradas</b><ul>${labelFlags.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}`;
    status.textContent=`Verificação concluída · ${normalized.filter(x=>x.rxcui).length}/${normalized.length} concomitantes normalizados · ${pairs.length} correspondência(s) textual(is) em bula.`;
    btn.disabled=false;
  }

  function inject(){
    const title=panel.querySelector('.detail-title')?.textContent?.trim(); if(!title) return;
    const rx=prescriptions.find(x=>x.name===title); if(!rx) return;
    const gate=panel.querySelector('.rx-safety-gate'); if(!gate) return;
    const old=panel.querySelector('.pharmacology-live'); if(old?.dataset.pharmRx===rx.id) return; old?.remove();
    gate.insertAdjacentHTML('afterend',html(rx));
    const root=panel.querySelector('.pharmacology-live'); root.querySelector('[data-pharm-run]').addEventListener('click',()=>run(root,rx));
  }
  let queued=false; function queue(){ if(queued)return; queued=true; requestAnimationFrame(()=>{queued=false;inject();}); }
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true}); queue();
})();
