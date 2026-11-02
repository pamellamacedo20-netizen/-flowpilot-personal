(() => {
  const panel=document.querySelector('#detailPanel');
  const registry=window.DT_EVIDENCE_REGISTRY;
  if(!panel||!registry)return;
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const nowYear=2026;
  const policy={
    A:'Diretriz baseada em evidência/GRADE, S3, revisão sistemática/meta-análise robusta de RCTs ou NMA de alta qualidade.',
    B:'RCT robusto, consenso/position statement estruturado com revisão extensa ou síntese de boa qualidade com limitações.',
    C:'Coorte prospectiva, estudo observacional bem conduzido ou consenso quando não há evidência superior.',
    D:'Estudo retrospectivo pequeno, série de casos ou opinião de especialista.',
    E:'Relato de caso, hipótese mecanística isolada ou opinião sem revisão estruturada.'
  };
  const roleLabel={driver:'Pode mudar conduta',support:'Apoio/segurança',context:'Contexto prático'};
  function freshness(year){const d=nowYear-Number(year||0);return d<=3?'Atual':d<=5?'Aceitável':'Legado';}
  function badge(q){return `<span class="ev-badge ev-${esc(q)}">${esc(q)}</span>`;}
  function rows(items){return items.map(x=>`<article class="ev-source-card">
    <div class="ev-source-head">${badge(x.quality)}<div><strong>${esc(x.title)}</strong><small>${esc(x.year)} · ${esc(x.type)}</small></div><span class="ev-fresh ${freshness(x.year).toLowerCase()}">${freshness(x.year)}</span></div>
    <div class="ev-meta"><span>${esc(roleLabel[x.role]||'Contexto')}</span>${x.doi?`<span>DOI ${esc(x.doi)}</span>`:''}</div>
    <p>${esc(x.note||'')}</p>
    <a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Abrir fonte</a>
  </article>`).join('');}
  function policyHtml(){return `<div class="ev-policy-box"><strong>Regra de atualização clínica</strong><p>O conteúdo padrão só deve ser alterado por evidência A ou B. Evidência C pode complementar quando não houver fonte superior e deve permanecer sinalizada. Evidência D/E não deve, isoladamente, substituir tratamento padrão.</p><div class="ev-policy-grid">${Object.entries(policy).map(([k,v])=>`<div>${badge(k)}<span>${esc(v)}</span></div>`).join('')}</div><p><b>Recência:</b> priorizar últimos 3–5 anos. Estudos mais antigos permanecem apenas quando forem clássicos, ainda válidos e sem evidência recente melhor.</p><p><b>Conflito:</b> se fontes A/B divergirem, mostrar incerteza e não sobrescrever silenciosamente a conduta.</p></div>`;}
  function inject(){
    const name=panel.querySelector('.detail-title')?.textContent?.trim();
    if(!name)return;
    const items=registry.diseases?.[name]||[];
    const old=panel.querySelector('[data-evidence-quality]');
    if(old?.dataset.name===name)return;
    old?.remove();
    const tools=panel.querySelector('.accordion-tools');
    if(!tools)return;
    const d=document.createElement('details');
    d.className='clinical-accordion evidence-quality-accordion';
    d.dataset.evidenceQuality='1';d.dataset.name=name;
    const current=items.filter(x=>freshness(x.year)==='Atual').length;
    const top=items.some(x=>x.quality==='A')?'A':items.some(x=>x.quality==='B')?'B':'—';
    d.innerHTML=`<summary><span>Qualidade da evidência e atualização</span><span class="summary-right"><span class="accordion-badge">${top==='—'?'CURADORIA':`EVIDÊNCIA ${top}`}</span><span class="chevron">⌄</span></span></summary><div class="accordion-body">${policyHtml()}<div class="ev-review-strip"><span>Última revisão global: ${esc(registry.lastGlobalReview)}</span><span>${items.length} fonte(s) curada(s)</span><span>${current} atual(is)</span></div>${items.length?rows(items):'<div class="ev-empty"><strong>Curadoria específica ainda não concluída.</strong><p>A ficha continua disponível, mas nenhuma recomendação deve ser tratada como “atualizada por evidência de alta qualidade” até que entre no registro curado.</p></div>'}</div>`;
    const ref=[...panel.querySelectorAll('details.clinical-accordion')].find(x=>(x.querySelector('summary')?.textContent||'').toLowerCase().includes('refer'));
    if(ref)ref.insertAdjacentElement('beforebegin',d); else tools.insertAdjacentElement('afterend',d);
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();
