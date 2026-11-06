/* Evita que 25 fichas recém-adicionadas percam o tratamento base quando falta compêndio profundo.
   Síntese com evidência, ramos de conduta e alertas. Não fabrica doses ou aprovações regulatórias. */
(() => {
  const panel=document.querySelector('#detailPanel'); if(!panel)return;
  const diseases=()=>window.DERMA_TRICHO_DATA||[];
  const pivots=()=>window.DT_DECISION_PIVOTS||{};
  const registry=()=>window.DT_EVIDENCE_REGISTRY?.diseases||{};
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const lines=v=>esc(v||'').replace(/\n/g,'<br>');
  const section=(title,content)=>'<section class="tc-section"><h5>'+esc(title)+'</h5>'+content+'</section>';
  const list=a=>'<ul>'+a.filter(Boolean).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
  const TITLE='Tratamento completo';
  const placeholder=/Conteúdo terapêutico estruturado em revisão editorial|Use a conduta orientada pela gravidade e o Guia de Prescrição enquanto esta ficha é aprofundada/i;
  function curated(panel){
    const d=[...panel.querySelectorAll('details.clinical-accordion')].find(x=>(x.querySelector(':scope > summary > span')?.textContent||'').trim()==='Conduta curada 2026');
    if(!d)return [];
    const sec=[...d.querySelectorAll('.tri-curation-card')].find(x=>/Prioridade terapêutica/i.test(x.querySelector('strong')?.textContent||''));
    return sec?[...sec.querySelectorAll('li')].map(x=>x.textContent.trim()).filter(Boolean):[];
  }
  function render(){
    if(document.querySelector('.nav-btn.active')?.dataset.view==='prescriptions')return;
    const name=panel.querySelector('.detail-title')?.textContent?.trim();
    const disease=diseases().find(x=>x.name===name);if(!disease)return;
    const treatment=[...panel.querySelectorAll('details.clinical-accordion')].find(x=>/Tratamento completo|Abordagem terapêutica/i.test(x.querySelector('summary')?.textContent||''));
    if(!treatment)return;
    const body=treatment.querySelector('.accordion-body');if(!body)return;
    const isPlaceholder=placeholder.test(body.textContent||'');
    if(!isPlaceholder && !body.querySelector('[data-dt-recovered-treatment]'))return; // preserve already curated deep compendia.
    const priorities=curated(panel);
    const cases=Array.isArray(pivots()[name])?pivots()[name]:[];
    const sources=Array.isArray(registry()[name])?registry()[name]:[];
    const signature=[name,priorities.join('|'),cases.length,sources.length].join('::');
    if(body.dataset.dtTreatmentSignature===signature && body.querySelector('[data-dt-recovered-treatment]'))return;
    const emergency=/^DRESS|Stevens-Johnson|necrólise epidérmica tóxica/i.test(name);
    const triage=emergency?'<p class="dt-recovery-urgent"><strong>URGÊNCIA HOSPITALAR:</strong> reconhecer, interromper possível medicamento desencadeante, avaliar envolvimento sistêmico e encaminhar imediatamente. Não usar como protocolo ambulatorial de imunossupressão.</p>':'';
    const first=priorities.length?priorities:[disease.treatment||'Consultar conduta individualizada da ficha.'];
    const scenarios=cases.length?cases.map(c=>'<li><strong>'+esc(c.finding)+'</strong><p>'+esc(c.action)+'</p><small>'+esc(c.quality||'Evidência a revisar')+' · '+esc(c.source||'Referência na ficha')+'</small></li>').join(''):'<li>Sem pivô específico registrado. Individualizar por gravidade, fatores de risco e segurança.</li>';
    const refs=sources.slice(0,4).filter(s=>s.url).map(s=>'<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title||'Fonte científica')+'</a> · '+esc(s.year||'')+' · '+esc(s.quality||'')+'</li>').join('');
    body.innerHTML='<div class="tc-compendium" data-dt-recovered-treatment="1"><div class="tc-hero"><span>Tratamento completo — síntese integrada</span><h4>Primeira linha, modificadores, seguimento e segurança</h4></div>'+triage+
      section('Conduta prioritária',list(first))+
      section('Cenários que mudam a escolha', '<ul class="dt-recovered-pivots">'+scenarios+'</ul>')+
      section('Plano de prescrição individualizável','<p>'+lines(disease.prescription)+'</p><p class="microcopy">Não transformar texto do plano em receita pronta: conferir dose, idade, gestação, função renal/hepática, bula ANVISA, interações e apresentação existente.</p>')+
      section('Monitorização, manutenção e prevenção','<p>'+lines(disease.followup)+'</p>')+
      section('Limites de segurança / encaminhamento','<p>'+lines(disease.alerts)+'</p>')+
      (refs?section('Evidência associada','<ul>'+refs+'</ul>'):'<p class="dt-recovery-urgent">Fonte específica ainda não vinculada ao registro de evidências — revisar antes de alterar tratamento padrão.</p>')+
      '<p class="tc-evidence">Síntese construída a partir da ficha existente, conduta curada e pivôs clínicos. Doses não validadas separadamente NÃO são inferidas. A monografia farmacológica profunda continua sendo revisada medicamento a medicamento.</p></div>';
    body.dataset.dtTreatmentSignature=signature;
    const summary=treatment.querySelector(':scope > summary > span');if(summary)summary.textContent=TITLE+' — opções por cenário';
    treatment.dataset.dtRecovered='1';
  }
  let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();