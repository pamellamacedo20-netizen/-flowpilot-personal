(() => {
  const panel=document.querySelector('#detailPanel'); if(!panel)return;
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const N=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const option03=(key,label)=>`<label class="calcx-field"><span>${esc(label)}</span><select data-calcx="${key}"><option value="">Selecione</option><option value="0">0 — ausente</option><option value="1">1 — leve</option><option value="2">2 — moderado</option><option value="3">3 — grave</option></select></label>`;
  const num=(key,label,min,max,step=1,suffix='')=>`<label class="calcx-field"><span>${esc(label)}</span><div><input type="number" data-calcx="${key}" min="${min}" max="${max}" step="${step}" placeholder="—">${suffix?`<em>${esc(suffix)}</em>`:''}</div></label>`;
  const value=(root,key)=>{const el=root.querySelector(`[data-calcx="${key}"]`);return el&&el.value!==''?Number(el.value):null};
  const complete=(root,keys)=>keys.every(k=>value(root,k)!==null);
  function result(root,title,detail,tone=''){
    const out=root.querySelector('[data-calcx-result]');if(!out)return;out.className=`calcx-result ${tone}`;out.innerHTML=`<span>Resultado</span><strong>${esc(title)}</strong>${detail?`<p>${esc(detail)}</p>`:''}`;
  }
  function bind(root,fn){root.querySelectorAll('input,select').forEach(x=>{x.addEventListener('input',fn);x.addEventListener('change',fn);});}
  function scorad(){
    const wrap=document.createElement('div');wrap.className='calcx-wrap';
    wrap.innerHTML=`<div class="calcx-intro"><b>SCORAD</b><p>Ferramenta adicional para dermatite atópica. Extensão A (0–100), intensidade B (0–18) e sintomas subjetivos C (0–20).</p></div><div class="calcx-grid">${num('area','Área corporal acometida',0,100,1,'%')}${option03('ery','Eritema')}${option03('edema','Edema / papulação')}${option03('ooze','Exsudação / crostas')}${option03('exc','Escoriações')}${option03('lich','Liquenificação')}${option03('dry','Xerose')}${num('itch','Prurido',0,10,1,'/10')}${num('sleep','Perda de sono',0,10,1,'/10')}</div><div class="calcx-result" data-calcx-result><span>Resultado</span><strong>Preencha todos os campos</strong></div><p class="calcx-source">SCORAD = A/5 + 7×B/2 + C; máximo 103. Use especialmente para seguimento longitudinal.</p>`;
    const keys=['area','ery','edema','ooze','exc','lich','dry','itch','sleep'];
    const calc=()=>{if(!complete(wrap,keys)){result(wrap,'Preencha todos os campos','');return}const A=value(wrap,'area');const B=['ery','edema','ooze','exc','lich','dry'].reduce((s,k)=>s+value(wrap,k),0);const C=value(wrap,'itch')+value(wrap,'sleep');const s=A/5+7*B/2+C;result(wrap,`SCORAD ${s.toFixed(1)} / 103`,`Extensão ${A}% · Intensidade ${B}/18 · Sintomas ${C}/20.`);};bind(wrap,calc);return wrap;
  }
  function lppai(){
    const wrap=document.createElement('div');wrap.className='calcx-wrap';
    wrap.innerHTML=`<div class="calcx-intro"><b>LPPAI — Lichen Planopilaris Activity Index</b><p>Quantifica atividade clínica do líquen plano pilar; não mede dano cicatricial acumulado.</p></div><div class="calcx-grid">${option03('prur','Prurido')}${option03('pain','Dor')}${option03('burn','Ardor')}${option03('ery','Eritema difuso')}${option03('perery','Eritema perifolicular')}${option03('scale','Descamação perifolicular')}<label class="calcx-field"><span>Pull test com fios anágenos</span><select data-calcx="pull"><option value="">Selecione</option><option value="0">0 — não</option><option value="1">1 — sim</option></select></label><label class="calcx-field"><span>Progressão clínica</span><select data-calcx="prog"><option value="">Selecione</option><option value="0">0 — estável</option><option value="1">1 — indeterminada</option><option value="2">2 — piorando</option></select></label></div><div class="calcx-result" data-calcx-result><span>Resultado</span><strong>Preencha todos os campos</strong></div><p class="calcx-source">LPPAI = média dos 3 sintomas + média dos 3 sinais + 2,5×pull test + 1,5×(progressão/2). Faixa 0–10.</p>`;
    const keys=['prur','pain','burn','ery','perery','scale','pull','prog'];
    const calc=()=>{if(!complete(wrap,keys)){result(wrap,'Preencha todos os campos','');return}const a=(value(wrap,'prur')+value(wrap,'pain')+value(wrap,'burn'))/3;const b=(value(wrap,'ery')+value(wrap,'perery')+value(wrap,'scale'))/3;const s=a+b+2.5*value(wrap,'pull')+1.5*(value(wrap,'prog')/2);result(wrap,`LPPAI ${s.toFixed(2)} / 10`,'Compare com medidas anteriores para documentar atividade e resposta; não usar isoladamente como critério terapêutico.');};bind(wrap,calc);return wrap;
  }
  function uct(){
    const wrap=document.createElement('div');wrap.className='calcx-wrap';
    wrap.innerHTML=`<div class="calcx-intro"><b>UCT — interpretação do escore</b><p>Insira o total obtido com a versão validada do Urticaria Control Test. O questionário não é reproduzido aqui.</p></div>${num('uct','UCT total',0,16,1,'/16')}<div class="calcx-result" data-calcx-result><span>Resultado</span><strong>Informe o total</strong></div><p class="calcx-source">UCT ≥12 indica doença bem controlada; 16 corresponde a controle completo. UCT ≤11 indica controle inadequado e deve motivar revisão do manejo.</p>`;
    const calc=()=>{const s=value(wrap,'uct');if(s===null){result(wrap,'Informe o total','');return}const label=s===16?'Controle completo':s>=12?'Bem controlada':'Controle inadequado';result(wrap,`UCT ${s}/16 — ${label}`,s<=11?'Revisar adesão, gatilhos e necessidade de escalonamento conforme guideline atual.':'Manter seguimento e reavaliar controle.');};bind(wrap,calc);return wrap;
  }
  function makeSection(name){
    let tool=null;if(name==='Dermatite atópica')tool=scorad();else if(name==='Líquen plano pilar')tool=lppai();else if(name==='Urticária crônica espontânea')tool=uct();if(!tool)return null;
    const d=document.createElement('details');d.className='clinical-accordion calcx-accordion';d.innerHTML='<summary><span>Calculadoras adicionais</span><span class="summary-right"><span class="accordion-badge">CLÍNICO</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"></div>';d.querySelector('.accordion-body').appendChild(tool);return d;
  }
  function inject(){
    if(document.querySelector('.nav-btn.active')?.dataset.view==='prescriptions')return;
    const name=panel.querySelector('.detail-title')?.textContent?.trim();if(!name)return;
    if(panel.querySelector(`.calcx-accordion[data-for="${CSS.escape(name)}"]`))return;
    panel.querySelectorAll('.calcx-accordion').forEach(x=>x.remove());
    const d=makeSection(name);if(!d)return;d.dataset.for=name;
    const severity=panel.querySelector('.severity-accordion');const anchor=severity||panel.querySelector('.accordion-tools');if(anchor)anchor.insertAdjacentElement('afterend',d);
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();