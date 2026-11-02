(() => {
  const panel=document.querySelector('#detailPanel'); if(!panel)return;
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const BULARIO='https://consultas.anvisa.gov.br/#/bulario/';
  const CONSULTA='https://consultas.anvisa.gov.br/#/medicamentos/';
  function inject(){
    if(document.querySelector('.nav-btn.active')?.dataset.view!=='prescriptions')return;
    const title=panel.querySelector('.detail-title')?.textContent?.trim();if(!title)return;
    const header=panel.querySelector('.detail-header');if(!header)return;
    let box=panel.querySelector('.anvisa-layer');
    if(!box){box=document.createElement('div');box.className='anvisa-layer';header.insertAdjacentElement('afterend',box);}
    if(box.dataset.drug===title)return;box.dataset.drug=title;
    box.innerHTML=`<div><span class="overview-label">Referência regulatória Brasil</span><strong>Bula profissional e registro ANVISA</strong><small>Antes de emitir a receita, confirme indicação, apresentação, fabricante, registro e bula profissional vigente no Brasil. O status on-label/off-label pode variar por indicação e apresentação.</small></div><div class="anvisa-actions"><a href="${BULARIO}" target="_blank" rel="noopener">Abrir Bulário ANVISA</a><a href="${CONSULTA}" target="_blank" rel="noopener">Consultar medicamento registrado</a></div>`;
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();