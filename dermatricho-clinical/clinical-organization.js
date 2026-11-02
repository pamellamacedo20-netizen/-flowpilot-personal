(() => {
  const panel=document.querySelector('#detailPanel'); if(!panel)return;
  const norm=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const title=d=>d.querySelector(':scope > summary > span')?.textContent?.trim()||'';
  const groups=[
    {label:'Visão geral',terms:['definição e contexto clínico','fisiopatologia / mecanismo','apresentação clínica','fatores de risco, gatilhos e anamnese dirigida','exame dermatológico / tricológico dirigido']},
    {label:'Diagnóstico',terms:['como confirmar o diagnóstico','diagnósticos diferenciais','exames e investigação','tricoscopia']},
    {label:'Classificação e gravidade',terms:['avaliar gravidade / classificação','gravidade / classificação']},
    {label:'Tratamento',terms:['tratamento completo','abordagem terapêutica','conduta orientada pela gravidade','prescrição prática no consultório','prescrição / conduta editável']},
    {label:'Segurança e seguimento',terms:['situações especiais e individualização','alertas e contraindicações','acompanhamento e reavaliação','manutenção, prevenção e recidiva','prognóstico e objetivos terapêuticos','orientações ao paciente']},
    {label:'Ferramentas da consulta',terms:['anotações clínicas','fontes e atualização','referências-base','referências e base de evidência']}
  ];
  function organize(){
    if(document.querySelector('.nav-btn.active')?.dataset.view==='prescriptions')return;
    const name=panel.querySelector('.detail-title')?.textContent?.trim();if(!name)return;
    const tools=panel.querySelector('.accordion-tools');if(!tools)return;
    const signature=[...panel.querySelectorAll('details.clinical-accordion')].map(title).join('|');
    const sig=`org:${name}:${signature}`;if(panel.dataset.clinicalOrg===sig)return;
    panel.dataset.clinicalOrg=sig;
    panel.querySelectorAll('.clinical-group-title').forEach(x=>x.remove());
    const details=[...panel.querySelectorAll('details.clinical-accordion')];
    const used=new Set(); let anchor=tools;
    groups.forEach(g=>{
      const matched=[];
      g.terms.forEach(term=>{const t=norm(term);details.forEach(d=>{if(!used.has(d)&&norm(title(d)).includes(t)){used.add(d);matched.push(d);}});});
      if(!matched.length)return;
      const h=document.createElement('div');h.className='clinical-group-title';h.textContent=g.label;anchor.insertAdjacentElement('afterend',h);anchor=h;
      matched.forEach(d=>{anchor.insertAdjacentElement('afterend',d);anchor=d;});
    });
    details.filter(d=>!used.has(d)).forEach(d=>{anchor.insertAdjacentElement('afterend',d);anchor=d;});
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;organize();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();