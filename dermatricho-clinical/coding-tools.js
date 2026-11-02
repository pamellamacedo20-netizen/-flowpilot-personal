(() => {
  const panel=document.querySelector('#detailPanel');if(!panel)return;
  function inject(){
    const box=panel.querySelector('.parity-coding');if(!box||box.querySelector('.coding-actions'))return;
    const d=document.createElement('div');d.className='coding-actions';d.innerHTML='<span class="overview-label">Procedimentos / faturamento</span><div class="coding-btns"><button type="button" class="secondary" data-tuss>Consultar TUSS/ANS</button><button type="button" class="secondary" data-sigtap>Consultar SIGTAP/SUS</button></div><small>TUSS e SIGTAP são códigos de procedimentos/itens e variam conforme o procedimento escolhido; não são inferidos automaticamente apenas pelo diagnóstico.</small>';
    box.appendChild(d);
    d.querySelector('[data-tuss]').addEventListener('click',()=>window.open('https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/codigos-da-tuss','_blank','noopener'));
    d.querySelector('[data-sigtap]').addEventListener('click',()=>window.open('http://sigtap.datasus.gov.br','_blank','noopener'));
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();