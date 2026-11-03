(() => {
  const panel=document.querySelector('#detailPanel'); if(!panel)return;
  const meds=()=>window.DERMA_TRICHO_PRESCRIPTIONS||[];
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const BULARIO='https://consultas.anvisa.gov.br/#/bulario/';
  const CONSULTA='https://consultas.anvisa.gov.br/#/medicamentos/';
  function inject(){
    if(document.querySelector('.nav-btn.active')?.dataset.view!=='prescriptions')return;
    const title=panel.querySelector('.detail-title')?.textContent?.trim();if(!title)return;
    const item=meds().find(x=>x.name===title);
    const header=panel.querySelector('.detail-header');if(!header)return;
    let box=panel.querySelector('.anvisa-layer');
    if(!box){box=document.createElement('div');box.className='anvisa-layer';header.insertAdjacentElement('afterend',box);}
    if(box.dataset.drug===title)return;box.dataset.drug=title;
    const presentations=Array.isArray(item?.presentations)?item.presentations:[];
    box.innerHTML=`<div class="anvisa-copy"><span class="overview-label">Referência regulatória Brasil</span><strong>Bula profissional e registro ANVISA</strong><small>As apresentações abaixo vêm do cadastro clínico do app. Só considerar uma apresentação como disponível/regularizada no Brasil após conferir o registro ativo e a bula profissional vigente na Anvisa.</small>${presentations.length?`<div class="anvisa-presentations"><b>Apresentações cadastradas</b><ul>${presentations.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}</div><div class="anvisa-actions"><button type="button" data-copy-anvisa-term="${esc(title)}">Copiar nome para busca</button><a href="${BULARIO}" target="_blank" rel="noopener">Abrir Bulário ANVISA</a><a href="${CONSULTA}" target="_blank" rel="noopener">Consultar registro</a></div>`;
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-copy-anvisa-term]');if(!b)return;navigator.clipboard?.writeText(b.dataset.copyAnvisaTerm||'');});
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();
