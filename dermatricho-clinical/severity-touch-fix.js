(() => {
  const panel=document.querySelector('#detailPanel'); if(!panel)return;
  function prime(root){
    if(!root||root.dataset.touchFix==='1')return;root.dataset.touchFix='1';root.dataset.touched='false';
    const out=root.querySelector('[data-sev-result]');
    if(out){out.className='sev-result';out.innerHTML='<span class="sev-result-kicker">Resultado</span><strong>Preencha a avaliação</strong><p>O resultado só será interpretado após você alterar ao menos um campo.</p>';}
    const mark=()=>{root.dataset.touched='true';root.querySelectorAll('input,select').forEach(el=>el.removeEventListener('input',mark,true));};
    root.querySelectorAll('input,select').forEach(el=>{el.addEventListener('input',mark,true);el.addEventListener('change',mark,true);});
  }
  function scan(){panel.querySelectorAll('.severity-root').forEach(prime);}
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;scan();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();