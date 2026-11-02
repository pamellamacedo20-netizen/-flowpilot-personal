(() => {
  const panel = document.querySelector('#detailPanel');
  if (!panel) return;

  const esc = (v='') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const clamp = (v,min,max) => Math.min(max,Math.max(min,Number(v)||0));
  const num = (label,key,min=0,max=100,step=1,suffix='') => `<label class="sev-field"><span>${esc(label)}</span><div class="sev-input-wrap"><input type="number" data-sev="${key}" min="${min}" max="${max}" step="${step}" value="0">${suffix?`<em>${esc(suffix)}</em>`:''}</div></label>`;
  const sel = (label,key,options) => `<label class="sev-field"><span>${esc(label)}</span><select data-sev="${key}">${options.map(o=>`<option value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select></label>`;
  const chk = (label,key) => `<label class="sev-check"><input type="checkbox" data-sev="${key}"><span>${esc(label)}</span></label>`;
  const result = () => `<div class="sev-result" data-sev-result><span class="sev-result-kicker">Resultado</span><strong>Preencha os campos</strong><p>O cálculo aparece automaticamente.</p></div>`;
  const source = (text) => `<p class="sev-source">Base: ${esc(text)}</p>`;
  const legend = (text) => `<p class="sev-legend">${esc(text)}</p>`;
  const scoreBand = (v,bands) => bands.find(b=>v>=b.min && v<=b.max)?.label || '';
  const val = (root,key) => Number(root.querySelector(`[data-sev="${key}"]`)?.value || 0);
  const checked = (root,key) => !!root.querySelector(`[data-sev="${key}"]`)?.checked;
  const setOut = (root,title,detail='',tone='') => {
    const box=root.querySelector('[data-sev-result]'); if(!box) return;
    box.className=`sev-result ${tone}`;
    box.innerHTML=`<span class="sev-result-kicker">Resultado</span><strong>${esc(title)}</strong>${detail?`<p>${esc(detail)}</p>`:''}`;
  };

  function rowGrades(regions, signOptions=[['0','0 — ausente'],['1','1 — leve'],['2','2 — moderado'],['3','3 — grave']]){
    return `<div class="sev-table">${regions.map(r=>`<div class="sev-table-row"><div class="sev-region">${esc(r.label)}</div>${r.fields.map(f=>sel(f.label,`${r.key}-${f.key}`,f.options||signOptions)).join('')}</div>`).join('')}</div>`;
  }

  function renderSALT(root){
    root.innerHTML=`<div class="sev-intro"><b>SALT — Severity of Alopecia Tool</b><p>Informe a porcentagem de perda de cabelos em cada região do couro cabeludo. O resultado varia de 0 a 100.</p></div>
      <div class="sev-grid">${num('Topo / vértex','top',0,100,1,'%')}${num('Lado direito','right',0,100,1,'%')}${num('Lado esquerdo','left',0,100,1,'%')}${num('Região posterior','post',0,100,1,'%')}</div>
      <div class="sev-checks">${chk('Perda de sobrancelhas/cílios','brow')}${chk('Atividade atual (pull test positivo ou sinais tricoscópicos)','activity')}${chk('DLQI > 10','dlqi')}${chk('Doença refratária','refractory')}</div>${result()}${source('SALT; consenso de gravidade: <20 leve, 20–49 moderada, ≥50 grave; modificadores podem elevar doença moderada para grave.')}`;
    const calc=()=>{const s=0.40*clamp(val(root,'top'),0,100)+0.18*clamp(val(root,'right'),0,100)+0.18*clamp(val(root,'left'),0,100)+0.24*clamp(val(root,'post'),0,100);let label=s<20?'Leve':s<50?'Moderada':'Grave';const mod=checked(root,'brow')||checked(root,'activity')||checked(root,'dlqi')||checked(root,'refractory');if(s>=20&&s<50&&mod) label='Grave por modificador clínico';setOut(root,`SALT ${s.toFixed(1)} — ${label}`,mod&&s<50?'Há modificador de gravidade selecionado.':'',s>=50||label.startsWith('Grave')?'sev-high':s>=20?'sev-mid':'sev-low');};
    bind(root,calc); calc();
  }

  function renderIHS4(root){
    root.innerHTML=`<div class="sev-intro"><b>IHS4 + Hurley</b><p>Contabilize as lesões atuais. IHS4 = nódulos + 2×abscessos + 4×túneis drenantes.</p></div>
      <div class="sev-grid">${num('Nódulos inflamatórios','nod',0,99,1)}${num('Abscessos','abs',0,99,1)}${num('Túneis drenantes','tun',0,99,1)}</div>
      <div class="sev-subcard"><span class="sev-subtitle">Hurley — características estruturais</span><div class="sev-checks">${chk('Sem túneis/cicatrizes; nódulos/abscessos isolados','h1')}${chk('Túneis/cicatrizes recorrentes, porém separados','h2')}${chk('Acometimento difuso ou túneis interconectados','h3')}</div></div>${result()}${source('IHS4 validado: ≤3 leve, 4–10 moderada, ≥11 grave. Hurley documenta dano estrutural.')}`;
    const calc=()=>{const s=val(root,'nod')+2*val(root,'abs')+4*val(root,'tun');const band=s<=3?'Leve':s<=10?'Moderada':'Grave';let hurley=checked(root,'h3')?'III':checked(root,'h2')?'II':checked(root,'h1')?'I':'não informado';setOut(root,`IHS4 ${s} — ${band}`,`Hurley: ${hurley}.`,s>=11?'sev-high':s>=4?'sev-mid':'sev-low');}; bind(root,calc); calc();
  }

  function renderGAGS(root){
    const o=[['0','0 — sem lesões'],['1','1 — comedão'],['2','2 — pápula'],['3','3 — pústula'],['4','4 — nódulo']];
    const regions=[['Fronte','fore',2],['Bochecha direita','rc',2],['Bochecha esquerda','lc',2],['Nariz','nose',1],['Queixo','chin',1],['Tórax + dorso superior','trunk',3]];
    root.innerHTML=`<div class="sev-intro"><b>GAGS — Global Acne Grading System</b><p>Em cada região, selecione a lesão de maior gravidade presente.</p></div><div class="sev-table">${regions.map(r=>`<div class="sev-table-row compact"><div class="sev-region">${r[0]} <small>×${r[2]}</small></div>${sel('Lesão mais grave',r[1],o)}</div>`).join('')}</div>${result()}${source('GAGS: 1–18 leve; 19–30 moderada; 31–38 grave; ≥39 muito grave.')}`;
    const calc=()=>{const s=regions.reduce((a,r)=>a+val(root,r[1])*r[2],0);const band=s===0?'Sem acne ativa':s<=18?'Leve':s<=30?'Moderada':s<=38?'Grave':'Muito grave';setOut(root,`GAGS ${s} — ${band}`,'',s>=31?'sev-high':s>=19?'sev-mid':'sev-low');}; bind(root,calc); calc();
  }

  function renderEASI(root){
    const area=[['0','0 — 0%'],['1','1 — 1–9%'],['2','2 — 10–29%'],['3','3 — 30–49%'],['4','4 — 50–69%'],['5','5 — 70–89%'],['6','6 — 90–100%']];
    const signs=[['0','0'],['1','1'],['2','2'],['3','3']];
    const regions=[['Cabeça/pescoço','hn'],['Membros superiores','ul'],['Tronco','tr'],['Membros inferiores','ll']];
    root.innerHTML=`<div class="sev-intro"><b>EASI — Eczema Area and Severity Index</b><p>Para cada região: área 0–6 e intensidade de eritema, edema/papulação, escoriação e liquenificação de 0–3.</p></div>
      ${sel('Faixa etária','age',[['adult','≥ 8 anos / adulto'],['child','< 8 anos']])}
      <div class="sev-table">${regions.map(r=>`<div class="sev-table-row"><div class="sev-region">${r[0]}</div>${sel('Área',`${r[1]}-a`,area)}${sel('Eritema',`${r[1]}-e`,signs)}${sel('Edema/pápulas',`${r[1]}-i`,signs)}${sel('Escoriação',`${r[1]}-x`,signs)}${sel('Liquenificação',`${r[1]}-l`,signs)}</div>`).join('')}</div>${result()}${source('EASI 0–72. Faixas: 0 limpa; 0,1–1 quase limpa; 1,1–7 leve; 7,1–21 moderada; 21,1–50 grave; 50,1–72 muito grave.')}`;
    const calc=()=>{const child=root.querySelector('[data-sev="age"]').value==='child';const w=child?{hn:.2,ul:.2,tr:.3,ll:.3}:{hn:.1,ul:.2,tr:.3,ll:.4};let s=0;regions.forEach(r=>{const k=r[1];const signsSum=val(root,`${k}-e`)+val(root,`${k}-i`)+val(root,`${k}-x`)+val(root,`${k}-l`);s+=w[k]*val(root,`${k}-a`)*signsSum;});let band=s===0?'Pele limpa':s<=1?'Quase limpa':s<=7?'Leve':s<=21?'Moderada':s<=50?'Grave':'Muito grave';setOut(root,`EASI ${s.toFixed(1)} — ${band}`,'',s>21?'sev-high':s>7?'sev-mid':'sev-low');};bind(root,calc);calc();
  }

  function renderUAS7(root){
    const wheals=[['0','0 — nenhuma'],['1','1 — <20/24h'],['2','2 — 20–50/24h'],['3','3 — >50/24h ou confluentes']];
    const itch=[['0','0 — nenhum'],['1','1 — leve'],['2','2 — moderado'],['3','3 — intenso']];
    root.innerHTML=`<div class="sev-intro"><b>UAS7 — Urticaria Activity Score em 7 dias</b><p>Preencha cada dia com número de urticas e intensidade do prurido.</p></div><div class="sev-table">${[1,2,3,4,5,6,7].map(d=>`<div class="sev-table-row compact"><div class="sev-region">Dia ${d}</div>${sel('Urticas',`w${d}`,wheals)}${sel('Prurido',`p${d}`,itch)}</div>`).join('')}</div>${result()}${source('UAS7: 0 sem atividade; 1–6 bem controlada; 7–15 leve; 16–27 moderada; 28–42 grave.')}`;
    const calc=()=>{let s=0;for(let d=1;d<=7;d++)s+=val(root,`w${d}`)+val(root,`p${d}`);const band=s===0?'Sem atividade':s<=6?'Bem controlada':s<=15?'Leve':s<=27?'Moderada':'Grave';setOut(root,`UAS7 ${s} — ${band}`,'',s>=28?'sev-high':s>=16?'sev-mid':'sev-low');};bind(root,calc);calc();
  }

  function renderMMASI(root){
    const area=[['0','0 — ausente'],['1','1 — <10%'],['2','2 — 10–29%'],['3','3 — 30–49%'],['4','4 — 50–69%'],['5','5 — 70–89%'],['6','6 — 90–100%']];
    const dark=[['0','0 — ausente'],['1','1 — discreta'],['2','2 — leve'],['3','3 — marcada'],['4','4 — intensa']];
    const regs=[['Fronte','f',.3],['Malar direita','mr',.3],['Malar esquerda','ml',.3],['Queixo','c',.1]];
    root.innerHTML=`<div class="sev-intro"><b>mMASI — modified Melasma Area and Severity Index</b><p>Calcule extensão e intensidade da pigmentação por região facial.</p></div><div class="sev-table">${regs.map(r=>`<div class="sev-table-row compact"><div class="sev-region">${r[0]}</div>${sel('Área',`${r[1]}a`,area)}${sel('Escurecimento',`${r[1]}d`,dark)}</div>`).join('')}</div>${result()}${legend('O mMASI varia de 0 a 24. Use o valor seriado para acompanhar resposta; não há ponto de corte universal para leve/moderado/grave.')}${source('mMASI = 0,3×A×D (fronte, malar D, malar E) + 0,1×A×D (queixo).')}`;
    const calc=()=>{let s=0;regs.forEach(r=>s+=r[2]*val(root,`${r[1]}a`)*val(root,`${r[1]}d`));setOut(root,`mMASI ${s.toFixed(1)} / 24`,'Registrar valor basal para comparação longitudinal.',s>=12?'sev-mid':'sev-low');};bind(root,calc);calc();
  }

  function renderOSI(root){
    const area=[['0','0 — 0%'],['1','1 — 1–10%'],['2','2 — 11–25%'],['3','3 — 26–50%'],['4','4 — 51–75%'],['5','5 — 76–100%']];
    const prox=[['1','1 — distal <1/4'],['2','2 — 1/4 a 1/2'],['3','3 — >1/2 a 3/4'],['4','4 — >3/4'],['5','5 — matriz/lúnula']];
    root.innerHTML=`<div class="sev-intro"><b>OSI — Onychomycosis Severity Index</b><p>Avalie a unha-alvo.</p></div><div class="sev-grid">${sel('Área acometida','area',area)}${sel('Proximidade da matriz','prox',prox)}</div><div class="sev-checks">${chk('Dermatofitoma OU hiperqueratose subungueal >2 mm','bonus')}</div>${result()}${source('OSI = área × proximidade + 10 se dermatofitoma/hiperqueratose >2 mm. 1–5 leve; 6–15 moderada; 16–35 grave.')}`;
    const calc=()=>{const a=val(root,'area');const s=a===0?0:a*val(root,'prox')+(checked(root,'bonus')?10:0);const band=s===0?'Sem acometimento clínico':s<=5?'Leve':s<=15?'Moderada':'Grave';setOut(root,`OSI ${s} — ${band}`,'',s>=16?'sev-high':s>=6?'sev-mid':'sev-low');};bind(root,calc);calc();
  }

  function renderVASI(root){
    const dep=[['0','0%'],['0.1','10%'],['0.25','25%'],['0.5','50%'],['0.75','75%'],['0.9','90%'],['1','100%']];
    const regions=[['Cabeça/pescoço','hn'],['Membros superiores','ul'],['Mãos','hands'],['Tronco','tr'],['Membros inferiores','ll'],['Pés','feet']];
    root.innerHTML=`<div class="sev-intro"><b>VASI + VIDA</b><p>1 unidade palmar ≈ 1% da superfície corporal. Para cada região, informe unidades palmares e percentual de despigmentação residual.</p></div><div class="sev-table">${regions.map(r=>`<div class="sev-table-row compact"><div class="sev-region">${r[0]}</div>${num('Unidades palmares',`${r[1]}u`,0,100,.1)}${sel('Despigmentação',`${r[1]}d`,dep)}</div>`).join('')}</div>${sel('Atividade — VIDA','vida',[['4','+4 — atividade ≤6 semanas'],['3','+3 — 6 semanas a 3 meses'],['2','+2 — 3 a 6 meses'],['1','+1 — 6 a 12 meses'],['0','0 — estável ≥1 ano'],['-1','−1 — estável ≥1 ano + repigmentação espontânea']])}${result()}${legend('VASI mede extensão/despigmentação. Não há ponto de corte universal que, isoladamente, defina gravidade global do vitiligo; atividade e impacto também importam.')}${source('VASI = Σ(unidades palmares × fração de despigmentação); VIDA documenta atividade temporal.')}`;
    const calc=()=>{let s=0;regions.forEach(r=>s+=val(root,`${r[1]}u`)*val(root,`${r[1]}d`));setOut(root,`VASI ${s.toFixed(1)} · VIDA ${val(root,'vida')}`,'Interpretar extensão junto com atividade, áreas de alto impacto e repercussão psicossocial.',val(root,'vida')>=2?'sev-mid':'sev-low');};bind(root,calc);calc();
  }

  function renderPASI(root){
    const area=[['0','0 — 0%'],['1','1 — <10%'],['2','2 — 10–29%'],['3','3 — 30–49%'],['4','4 — 50–69%'],['5','5 — 70–89%'],['6','6 — ≥90%']];
    const signs=[['0','0'],['1','1'],['2','2'],['3','3'],['4','4']];
    const regs=[['Cabeça','h',.1],['Membros superiores','u',.2],['Tronco','t',.3],['Membros inferiores','l',.4]];
    root.innerHTML=`<div class="sev-intro"><b>PASI + BSA + impacto clínico</b><p>PASI considera eritema, infiltração, descamação e extensão por região.</p></div><div class="sev-table">${regs.map(r=>`<div class="sev-table-row"><div class="sev-region">${r[0]}</div>${sel('Área',`${r[1]}a`,area)}${sel('Eritema',`${r[1]}e`,signs)}${sel('Infiltração',`${r[1]}i`,signs)}${sel('Descamação',`${r[1]}d`,signs)}</div>`).join('')}</div><div class="sev-grid">${num('BSA total acometida','bsa',0,100,.1,'%')}</div><div class="sev-checks">${chk('Área de alto impacto (face, couro cabeludo, mãos, pés, unhas ou genitais)','impact')}${chk('Controle inadequado com terapia tópica','topfail')}</div>${result()}${source('PASI 0–72; BSA historicamente <3% leve, 3–10% moderada, >10% grave. NPF 2026 recomenda considerar áreas de alto impacto e falha tópica para classificar doença moderada-a-grave.')}`;
    const calc=()=>{let pasi=0;regs.forEach(r=>pasi+=r[2]*val(root,`${r[1]}a`)*(val(root,`${r[1]}e`)+val(root,`${r[1]}i`)+val(root,`${r[1]}d`)));const bsa=val(root,'bsa');const historical=bsa<3?'leve':bsa<=10?'moderada':'grave';const advanced=bsa>10||checked(root,'impact')||checked(root,'topfail');setOut(root,`PASI ${pasi.toFixed(1)} · BSA ${bsa.toFixed(1)}%`,`BSA histórica: ${historical}. Classificação clínica atual: ${advanced?'moderada-a-grave / candidata a abordagem avançada':'leve, se adequadamente controlável com tópicos'}.`,advanced?'sev-high':bsa>=3?'sev-mid':'sev-low');};bind(root,calc);calc();
  }

  function renderPSSI(root){
    const signs=[['0','0 — ausente'],['1','1 — leve'],['2','2 — moderado'],['3','3 — grave'],['4','4 — muito grave']];
    const area=[['0','0 — 0%'],['1','1 — <10%'],['2','2 — 10–29%'],['3','3 — 30–49%'],['4','4 — 50–69%'],['5','5 — 70–89%'],['6','6 — 90–100%']];
    root.innerHTML=`<div class="sev-intro"><b>PSSI — Psoriasis Scalp Severity Index</b><p>Avalia eritema, infiltração, descamação e extensão do couro cabeludo.</p></div><div class="sev-grid">${sel('Eritema','e',signs)}${sel('Infiltração','i',signs)}${sel('Descamação','d',signs)}${sel('Área do couro cabeludo','a',area)}</div>${result()}${legend('PSSI varia de 0 a 72. Não há faixas universais de leve/moderada/grave; use o valor basal e sua evolução.')}${source('PSSI = (eritema + infiltração + descamação) × área.')}`;
    const calc=()=>{const s=(val(root,'e')+val(root,'i')+val(root,'d'))*val(root,'a');setOut(root,`PSSI ${s} / 72`,'Registrar como linha de base e comparar nas reavaliações.',s>=24?'sev-mid':'sev-low');};bind(root,calc);calc();
  }

  function renderNorwood(root){
    const stages=[['I','I — sem recessão significativa ou mínima'],['II','II — recessão bitemporal discreta'],['III','III — recessão temporal significativa'],['III-V','III Vertex — vértex predominante'],['IV','IV — frontal + vértex, separados por faixa de cabelo'],['V','V — progressão com faixa intermediária estreita'],['VI','VI — união das áreas frontal e vértex'],['VII','VII — faixa residual occipital/lateral']];
    root.innerHTML=`<div class="sev-intro"><b>Hamilton–Norwood</b><p>Classificação macroscópica da alopecia androgenética masculina.</p></div>${sel('Estágio clínico','stage',stages)}${result()}${source('Hamilton–Norwood. Complementar com tricoscopia, fotografia padronizada e atividade de miniaturização.')}`;
    const calc=()=>{const s=root.querySelector('[data-sev="stage"]').value;setOut(root,`Hamilton–Norwood: ${s}`,'Classificação de padrão/estágio, não um escore de atividade.','sev-low');};bind(root,calc);calc();
  }

  function renderSinclair(root){
    const stages=[['I','I — normal / sem alargamento evidente'],['II','II — alargamento discreto da risca central'],['III','III — alargamento maior + perda de volume adjacente'],['IV','IV — rarefação difusa importante no topo'],['V','V — rarefação severa no topo']];
    root.innerHTML=`<div class="sev-intro"><b>Sinclair</b><p>Classificação prática do padrão feminino de rarefação capilar.</p></div>${sel('Estágio clínico','stage',stages)}${result()}${source('Escala Sinclair. Pode ser complementada por Ludwig, tricoscopia e documentação fotográfica seriada.')}`;
    const calc=()=>{const s=root.querySelector('[data-sev="stage"]').value;setOut(root,`Sinclair: grau ${s}`,'Classificação de estágio; acompanhar densidade e miniaturização ao longo do tempo.','sev-low');};bind(root,calc);calc();
  }

  function renderBCC(root){
    root.innerHTML=`<div class="sev-intro"><b>Estratificação de risco de recorrência — CBC</b><p>Não classificar como “leve/moderado/grave”. Marque fatores clínicos e histológicos.</p></div>
      ${sel('Zona anatômica','zone',[['L','L — tronco/extremidades'],['M','M — bochecha, fronte, couro cabeludo, pescoço, pretíbia'],['H','H — face central/orelha/mãos/pés/genitália']])}${num('Maior diâmetro','size',0,200,1,'mm')}
      <div class="sev-checks">${chk('Bordas mal definidas','border')}${chk('Tumor recorrente','recur')}${chk('Imunossupressão','immuno')}${chk('Área previamente irradiada','rt')}${chk('Padrão histológico agressivo','hist')}${chk('Invasão perineural','pni')}</div>${result()}${source('Estratificação de risco de recorrência baseada em critérios NCCN/BAD; qualquer fator de alto risco classifica como alto risco.')}`;
    const calc=()=>{const z=root.querySelector('[data-sev="zone"]').value;const s=val(root,'size');const sizeRisk=z==='H'||(z==='M'&&s>10)||(z==='L'&&s>20);const high=sizeRisk||['border','recur','immuno','rt','hist','pni'].some(k=>checked(root,k));setOut(root,high?'CBC — alto risco de recorrência':'CBC — baixo risco de recorrência',high?'Revisar indicação de cirurgia com controle de margens e demais fatores anatomopatológicos.':'Se todos os critérios de baixo risco forem confirmados.','sev-high');};bind(root,calc);calc();
  }

  function renderSCC(root){
    root.innerHTML=`<div class="sev-intro"><b>BWH — estadiamento tumoral de CEC cutâneo</b><p>Marque os quatro fatores prognósticos e invasão óssea.</p></div><div class="sev-checks">${chk('Diâmetro ≥2 cm','diam')}${chk('Pouco diferenciado','poor')}${chk('Invasão perineural de grande calibre / ≥0,1 mm','pni')}${chk('Invasão além da gordura subcutânea','fat')}${chk('Invasão óssea','bone')}</div>${result()}${source('BWH: T1 = 0 fatores; T2a = 1; T2b = 2–3; T3 = 4 fatores ou invasão óssea.')}`;
    const calc=()=>{const n=['diam','poor','pni','fat'].filter(k=>checked(root,k)).length;const t=checked(root,'bone')||n===4?'T3':n>=2?'T2b':n===1?'T2a':'T1';setOut(root,`BWH ${t}`,`${n} fator(es) prognóstico(s) selecionado(s)${checked(root,'bone')?' + invasão óssea':''}.`,t==='T2b'||t==='T3'?'sev-high':t==='T2a'?'sev-mid':'sev-low');};bind(root,calc);calc();
  }

  function renderMelanoma(root){
    root.innerHTML=`<div class="sev-intro"><b>AJCC 8 — categoria T do melanoma</b><p>Calcula a categoria T pelo Breslow e ulceração. O estágio completo exige N e M.</p></div><div class="sev-checks">${chk('Melanoma in situ','insitu')}${chk('Ulceração','ulc')}${chk('Metástase linfonodal/regional conhecida','node')}${chk('Metástase à distância conhecida','met')}</div>${num('Breslow','breslow',0,20,.1,'mm')}${result()}${source('AJCC 8 / NCI. T1a: <0,8 mm sem ulceração; T1b: <0,8 ulcerado ou 0,8–1,0 mm; T2 >1–2; T3 >2–4; T4 >4, com sufixo a/b por ulceração.')}`;
    const calc=()=>{if(checked(root,'insitu')){setOut(root,'Tis — melanoma in situ','Estágio global depende da confirmação N0/M0.','sev-mid');return;}const b=val(root,'breslow');const u=checked(root,'ulc');let t='Tx';if(b>0&&b<.8)t=u?'T1b':'T1a';else if(b>=.8&&b<=1)t='T1b';else if(b>1&&b<=2)t=u?'T2b':'T2a';else if(b>2&&b<=4)t=u?'T3b':'T3a';else if(b>4)t=u?'T4b':'T4a';let extra=checked(root,'met')?'M1 — doença metastática; estágio IV.':checked(root,'node')?'N≥1 — doença regional; estágio III requer subestadiamento.':'N/M não informados; não concluir estágio global.';setOut(root,`${t} — categoria T`,extra,(checked(root,'node')||checked(root,'met')||b>4)?'sev-high':'sev-mid');};bind(root,calc);calc();
  }

  function renderGeneric(root,name){
    root.innerHTML=`<div class="sev-intro"><b>Classificação clínica assistida</b><p>Esta condição não tem um único score universal de uso rotineiro configurado. Marque os domínios abaixo para obter uma classificação clínica estruturada. <b>Não é um escore validado.</b></p></div>
      ${sel('Extensão','extent',[['0','Localizada'],['1','Multifocal / mais de uma área'],['2','Difusa / extensa']])}
      ${sel('Atividade/progressão','activity',[['0','Estável / limitada'],['1','Ativa / recorrente'],['2','Rapidamente progressiva']])}
      ${sel('Sintomas','symptom',[['0','Ausentes ou leves'],['1','Moderados'],['2','Intensos / limitantes']])}
      ${sel('Impacto funcional / área especial','impact',[['0','Baixo'],['1','Relevante'],['2','Alto impacto']])}
      <div class="sev-checks">${chk('Complicação, infecção secundária ou sinal sistêmico','comp')}${chk('Refratária ao tratamento adequado','refr')}${chk('Risco de sequela permanente/cicatriz','sequela')}</div>${result()}${legend(`Para ${name}, o resultado abaixo serve para documentação e triagem clínica; quando houver uma escala específica mais adequada, ela deve prevalecer.`)}`;
    const calc=()=>{const ext=val(root,'extent'),act=val(root,'activity'),sym=val(root,'symptom'),imp=val(root,'impact');const hard=checked(root,'comp')||(ext===2&&act===2)||sym===2&&imp>=1;const moderate=!hard&&(ext>=1||act>=1||sym>=1||imp>=1||checked(root,'refr')||checked(root,'sequela'));const label=hard?'Alta gravidade clínica sugerida':moderate?'Gravidade intermediária sugerida':'Baixa gravidade clínica sugerida';setOut(root,label,'Classificação assistida não validada; confirmar com julgamento clínico e critérios específicos da doença.',hard?'sev-high':moderate?'sev-mid':'sev-low');};bind(root,calc);calc();
  }

  function bind(root,calc){root.querySelectorAll('input,select').forEach(el=>{el.addEventListener('input',calc);el.addEventListener('change',calc);});}

  function buildFor(name,root){
    const map={
      'Alopecia areata':renderSALT,
      'Hidradenite supurativa':renderIHS4,
      'Acne vulgar':renderGAGS,
      'Dermatite atópica':renderEASI,
      'Urticária crônica espontânea':renderUAS7,
      'Melasma':renderMMASI,
      'Onicomicose':renderOSI,
      'Vitiligo':renderVASI,
      'Psoríase':renderPASI,
      'Psoríase do couro cabeludo':renderPSSI,
      'Alopecia androgenética masculina':renderNorwood,
      'Alopecia androgenética feminina':renderSinclair,
      'Carcinoma basocelular':renderBCC,
      'Carcinoma espinocelular cutâneo':renderSCC,
      'Melanoma cutâneo':renderMelanoma
    };
    (map[name]||((r)=>renderGeneric(r,name)))(root);
  }

  let queued=false;
  function inject(){
    queued=false;
    const nav=document.querySelector('.nav-btn.active');
    if(nav?.dataset.view==='prescriptions') return;
    const titleEl=panel.querySelector('.detail-title');
    if(!titleEl) return;
    const name=titleEl.textContent.trim();
    if(!name) return;
    const existing=panel.querySelector('.severity-accordion');
    if(existing?.dataset.for===name) return;
    if(existing) existing.remove();
    const tools=panel.querySelector('.accordion-tools');
    if(!tools) return;
    const d=document.createElement('details');
    d.className='clinical-accordion severity-accordion';
    d.open=true;
    d.dataset.for=name;
    d.innerHTML=`<summary><span>Avaliar gravidade / classificação</span><span class="summary-right"><span class="accordion-badge">INTERATIVO</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"><div class="severity-root"></div></div>`;
    tools.insertAdjacentElement('afterend',d);
    buildFor(name,d.querySelector('.severity-root'));
  }
  function queue(){if(queued)return;queued=true;requestAnimationFrame(inject);}
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});
  queue();
})();