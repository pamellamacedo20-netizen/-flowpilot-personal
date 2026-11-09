(() => {
  const panel=document.querySelector('#detailPanel');
  const search=document.querySelector('#searchInput');
  const list=document.querySelector('#diseaseList');
  if(!panel||!search||!list)return;
  const cache=new Map();
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const norm=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const aliases={'isotretinoína':'isotretinoin','doxiciclina':'doxycycline','espironolactona':'spironolactone','minoxidil':'minoxidil','finasterida':'finasteride','dutasterida':'dutasteride','hidroxicloroquina':'hydroxychloroquine','terbinafina':'terbinafine','cetoconazol':'ketoconazole','ivermectina':'ivermectin','tacrolimo':'tacrolimus','adapaleno':'adapalene','tretinoína':'tretinoin','ácido azelaico':'azelaic acid','acido azelaico':'azelaic acid','metronidazol':'metronidazole','clindamicina':'clindamycin','valaciclovir':'valacyclovir','aciclovir':'acyclovir','itraconazol':'itraconazole','fluconazol':'fluconazole','griseofulvina':'griseofulvin','mupirocina':'mupirocin','dupilumabe':'dupilumab','omalizumabe':'omalizumab','adalimumabe':'adalimumab','secuquinumabe':'secukinumab','baricitinibe':'baricitinib','ritlecitinibe':'ritlecitinib'};
  const en=v=>aliases[norm(v)]||norm(v);
  async function get(url){if(cache.has(url))return cache.get(url);const p=fetch(url,{headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).catch(()=>null);cache.set(url,p);return p;}
  async function rxnorm(term){const q=encodeURIComponent(en(term));let j=await get(`https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${q}&maxEntries=5&option=1`);const c=j?.approximateGroup?.candidate?.[0];if(!c)return null;const id=c.rxcui;const p=await get(`https://rxnav.nlm.nih.gov/REST/rxcui/${id}/properties.json`);const cls=await get(`https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=${id}&relaSource=ATC`);return {rxcui:id,name:p?.properties?.name||term,tty:p?.properties?.tty||'',classes:[...new Set((cls?.rxclassDrugInfoList?.rxclassDrugInfo||[]).map(x=>x?.rxclassMinConceptItem?.className).filter(Boolean))].slice(0,8)}}
  async function label(term){const name=en(term).replace(/"/g,'');const queries=[`openfda.generic_name:\"${name}\"`,`openfda.substance_name:\"${name}\"`,`openfda.brand_name:\"${name}\"`];for(const s of queries){const j=await get(`https://api.fda.gov/drug/label.json?search=${encodeURIComponent(s)}&limit=1`);const x=j?.results?.[0];if(x){const join=k=>Array.isArray(x[k])?x[k].join('\n'):'';return {generic:(x.openfda?.generic_name||[]).join(', '),brand:(x.openfda?.brand_name||[]).join(', '),indications:join('indications_and_usage'),dosage:join('dosage_and_administration'),contra:join('contraindications'),interactions:join('drug_interactions'),warnings:join('warnings_and_cautions')||join('warnings'),pregnancy:join('pregnancy')||join('use_in_specific_populations'),adverse:join('adverse_reactions'),boxed:join('boxed_warning')}}}return null;}
  const clip=(t,n=1500)=>!t?'Não localizado na bula pública consultada.':String(t).replace(/\s+/g,' ').trim().slice(0,n)+(String(t).length>n?'…':'');
  function isRxView(){return document.querySelector('.nav-btn.active')?.dataset.view==='prescriptions'}
  function ensureButton(){
    const old=document.querySelector('[data-universal-drug-search]');
    if(!isRxView()){old?.remove();return}
    if(old)return;
    const host=document.querySelector('.search-panel');if(!host)return;
    const b=document.createElement('button');b.type='button';b.className='secondary universal-drug-btn';b.dataset.universalDrugSearch='1';b.textContent='Buscar medicamento na base externa';b.addEventListener('click',run);host.appendChild(b);
  }
  async function run(){
    const term=search.value.trim();if(term.length<2){search.focus();return}
    panel.className='detail-panel';panel.innerHTML=`<div class="detail-header"><div class="eyebrow">Base farmacológica externa</div><div class="detail-title">${esc(term)}</div><p class="detail-summary">Consultando RxNorm/RxClass e bula pública FDA.</p></div><div class="universal-loading">Consultando fontes públicas…</div>`;
    const [r,l]=await Promise.all([rxnorm(term),label(term)]);
    panel.innerHTML=`<div class="detail-header"><div class="eyebrow">Base farmacológica externa</div><div class="detail-title">${esc(r?.name||term)}</div><p class="detail-summary">Consulta clean-room em fontes públicas. Não substitui uma base DDI proprietária ou bula local.</p>${r?`<div class="tag-row" style="margin-top:12px"><span class="tag">RxCUI ${esc(r.rxcui)}</span>${r.classes.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div>`:''}</div>
      <div class="accordion-tools"><button class="text-btn" data-u-expand>Expandir tudo</button><span>·</span><button class="text-btn" data-u-collapse>Recolher tudo</button></div>
      ${sec('Indicações',clip(l?.indications),true)}${sec('Posologia / administração',clip(l?.dosage))}${sec('Contraindicações',clip(l?.contra),false,true)}${sec('Interações',clip(l?.interactions),false,true)}${sec('Warnings / precauções',clip(l?.warnings),false,true)}${l?.boxed?sec('Boxed warning',clip(l.boxed),false,true):''}${sec('Gestação e populações especiais',clip(l?.pregnancy),false,true)}${sec('Eventos adversos',clip(l?.adverse))}<div class="integration-actions"><button class="primary" data-u-ai>Adicionar ao contexto clínico</button></div>`;
    panel.querySelector('[data-u-expand]')?.addEventListener('click',()=>panel.querySelectorAll('details').forEach(x=>x.open=true));
    panel.querySelector('[data-u-collapse]')?.addEventListener('click',()=>panel.querySelectorAll('details').forEach(x=>x.open=false));
    panel.querySelector('[data-u-ai]')?.addEventListener('click',()=>{document.querySelector('#aiButton')?.click();requestAnimationFrame(()=>{const ta=document.querySelector('#patientContext');if(ta)ta.value+=(ta.value?'\n\n':'')+`MEDICAMENTO: ${r?.name||term}\nRxCUI: ${r?.rxcui||'não localizado'}\nClasses: ${(r?.classes||[]).join('; ')||'não localizadas'}\nRevisar bula pública e triagem clínica antes de prescrever.`;});});
  }
  function sec(title,body,open=false,warn=false){return `<details class="clinical-accordion ${warn?'accordion-warning':''}" ${open?'open':''}><summary><span>${esc(title)}</span><span class="summary-right"><span class="chevron">⌄</span></span></summary><div class="accordion-body"><p>${esc(body)}</p></div></details>`}
  new MutationObserver(ensureButton).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});ensureButton();
})();