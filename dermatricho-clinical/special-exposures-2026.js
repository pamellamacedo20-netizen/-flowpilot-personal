(() => {
  const panel=document.querySelector('#detailPanel');
  const sidebar=document.querySelector('.sidebar');
  if(!panel||!sidebar)return;
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const STORE='dt-special-exposures-v1';
  const E={
    glp1:{
      title:'Canetas para emagrecimento / GLP-1 e duplo agonismo', badge:'EVIDÊNCIA A/B',
      examples:'Semaglutida, tirzepatida, liraglutida; outros incretínicos conforme disponibilidade/indicação.',
      takeaways:[
        'Há sinal consistente de aumento de queda não cicatricial em usuários de GLP-1 RA. Meta-análise de 2026 com 7 RCTs + 2 estudos prospectivos encontrou RR 3,25 para queda de cabelo versus placebo; evento absoluto permaneceu baixo.',
        'Os fenótipos mais relatados são eflúvio telógeno e AGA revelada/acelerada. Perda ponderal rápida, déficit energético/proteico e deficiências podem participar do mecanismo; não presumir toxicidade folicular direta.',
        'Não suspender automaticamente uma medicação metabolicamente útil apenas por queda. Avaliar temporalidade, velocidade da perda de peso, ingestão proteica, sinais de deficiência e alopecia pré-existente.',
        'Reações de aplicação incluem dor, eritema, equimose, prurido, edema, nódulos e raramente reações granulomatosas; em geral são leves e tratadas de forma sintomática.'
      ],
      ask:['Fármaco e dose atual','Data de início e último aumento de dose','Peso antes / peso atual / kg por semana','Náusea, vômitos, baixa ingestão ou dieta muito restritiva','Ingestão proteica aproximada','Início da queda em relação à perda de peso','AGA prévia ou miniaturização','Hemograma/ferritina/TSH e outros exames somente se a história indicar'],
      avoid:['Não atribuir toda alopecia à caneta sem examinar couro cabeludo/tricoscopia.','Não suplementar ferro, zinco, biotina ou vitamina D de forma automática sem indicação.','Não prometer que reduzir/trocar a caneta resolverá a queda; a decisão metabólica deve ser compartilhada com o prescritor.'],
      refs:[['Meta-análise 2026 — Cheng et al.','https://pubmed.ncbi.nlm.nih.gov/42155605/'],['Meta-análise 2026 — alopecia por subtipo','https://pubmed.ncbi.nlm.nih.gov/42621629/'],['Revisão sistemática 2026 — counseling','https://pubmed.ncbi.nlm.nih.gov/41998799/'],['BMJ 2026 — target trial emulation','https://www.bmj.com/content/394/bmj-2026-100077']]
    },
    testosterone:{
      title:'Reposição de testosterona / terapia hormonal com androgênio', badge:'EVIDÊNCIA B',
      examples:'Testosterona transdérmica, injetável, oral/bucal onde disponível; terapia em homens hipogonádicos e uso selecionado em mulheres.',
      takeaways:[
        'Acne é o evento dermatológico mais consistente da TRT; revisão de 2026 encontrou acne em ~0,6–9,1% nos estudos incluídos, com variação por formulação e população.',
        'Seborreia, aumento de pelos e aceleração de AGA em indivíduos suscetíveis devem entrar ativamente na anamnese.',
        'Em mulheres, sociedades internacionais sustentam indicação baseada em evidência principalmente para HSDD pós-menopausa, com dose fisiológica e monitorização de sinais de excesso androgênico. Não há indicação dermatológica para elevar testosterona.',
        'Se acne/AGA surge após início ou aumento de dose, documentar temporalidade e discutir com o prescritor se a exposição está fisiológica para a indicação original; não ajustar terapia endócrina isoladamente pela dermatologia sem contexto.'
      ],
      ask:['Indicação da reposição','Formulação, dose e intervalo','Níveis basais e em tratamento quando disponíveis','Acne/seborreia antes e depois da TRT','História familiar de AGA','Hirsutismo, irregularidade menstrual ou virilização em mulheres','Outros hormônios simultâneos'],
      avoid:['Não classificar toda TRT como uso anabolizante: diferenciar reposição fisiológica de dose suprafisiológica.','Não usar 5-alfa-redutase como “proteção universal” contra efeitos androgênicos.','Em mulher, não normalizar acne/hirsutismo/alopecia progressivos sem revisar excesso androgênico.'],
      refs:[['Scoping review dermatológica da TRT 2026','https://pubmed.ncbi.nlm.nih.gov/41182303/'],['IMS 2025 — recomendações de menopausa e androgênio','https://doi.org/10.1080/13697137.2025.2585487'],['ALEG 2025 — androgênio em mulheres','https://pubmed.ncbi.nlm.nih.gov/40919649/']]
    },
    aas:{
      title:'Anabolizantes / PIEDs / doses suprafisiológicas', badge:'EVIDÊNCIA B/C',
      examples:'Testosterona em dose suprafisiológica, oxandrolona, estanozolol, nandrolona, trembolona, boldenona, drostanolona e combinações.',
      takeaways:[
        'AAS estão associados a acne, formas acneiformes graves, seborreia, hirsutismo/virilização em mulheres e aceleração de alopecia androgenética em suscetíveis.',
        'Testosterona pode aumentar sinalização por DHT via 5α-redutase; finasterida/dutasterida podem reduzir essa conversão, mas não bloqueiam o receptor androgênico nem neutralizam todos os AAS.',
        'Derivados com atividade androgênica que não dependem da conversão por 5α-redutase — como oxandrolona/estanozolol e outros — não devem ser tratados como “protegidos” por finasterida/dutasterida.',
        'Nandrolona é uma exceção mecanística: sua 5α-redução gera DHN, menos androgênico. Bloquear essa via pode teoricamente aumentar androgenicidade relativa no couro cabeludo; isso é plausibilidade mecanística, não recomendação clínica de manejo.',
        'A prioridade clínica é reconhecer a exposição, explicar que a continuação pode limitar a resposta dermatológica e coordenar redução/cessação com profissional apropriado quando possível.'
      ],
      ask:['Substância exata (não apenas “hormônio”)','Dose semanal/diária e duração do ciclo','Via e origem do produto','Stack completo, incluindo estimulantes, GH, hormônio tireoidiano e suplementos','Acne nodular/conglobata','Queda temporal/frontal e miniaturização','Hirsutismo, voz, clitoromegalia ou irregularidade menstrual em mulheres','Uso de whey/altas doses de suplementos quando acne for relevante'],
      avoid:['Não prescrever finasterida/dutasterida com o objetivo de permitir manutenção segura de um ciclo anabolizante.','Não prometer reversibilidade de virilização ou alopecia avançada.','Não ignorar risco sistêmico: dislipidemia, hepatotoxicidade e eventos cardiovasculares exigem coordenação médica.'],
      refs:[['Revisão sistemática sobre androgênios e queda 2026','https://pubmed.ncbi.nlm.nih.gov/42027981/'],['Alopecia em mulheres usando AAS 2025','https://pubmed.ncbi.nlm.nih.gov/40579733/'],['Revisão dermatológica de performance enhancers 2026','https://pmc.ncbi.nlm.nih.gov/articles/PMC13691167/'],['CFM — Resolução/posição sobre EAA para estética/performance','https://portal.cfm.org.br/noticias/proibicao-da-anvisa-de-uso-e-venda-de-chips-da-beleza-atende-orientacao-do-conselho-federal-de-medicina']]
    },
    implants:{
      title:'Implantes hormonais / pellets / “chip da beleza”', badge:'BRASIL — REGULATÓRIO',
      examples:'Implante contraceptivo de etonogestrel é diferente de implantes manipulados contendo testosterona, gestrinona, oxandrolona ou combinações.',
      takeaways:[
        'No Brasil, implantes hormonais manipulados com esteroides anabolizantes/androgênicos não podem ser usados para finalidade estética, ganho de massa ou melhora de performance.',
        'Quando um implante manipulado é legalmente indicado, a Anvisa exige prescrição de controle especial, CID, termo de responsabilidade/esclarecimento e notificação de eventos adversos; a manipulação deve usar substâncias já avaliadas pela Agência.',
        'Não confundir essas restrições com implantes registrados, como etonogestrel contraceptivo.',
        'Pellets de testosterona podem produzir picos suprafisiológicos e grande variabilidade interindividual; revisão de 2025 considerou a evidência de eficácia/segurança insuficiente para adoção rotineira em mulheres.',
        'Do ponto de vista dermatológico, perguntar sempre qual substância está implantada, dose total, data, duração esperada e possibilidade de retirada. Acne, hirsutismo e alopecia podem persistir enquanto houver liberação hormonal.'
      ],
      ask:['Produto registrado ou manipulado?','Substância(s) e dose total do implante','Data de implantação e duração prevista','Indicação original e médico prescritor','Eventos após implantação: acne, queda, hirsutismo, voz, sangramento, humor','Há documentação/termo e acompanhamento laboratorial?'],
      avoid:['Não chamar todo implante de “chip da beleza”; distinguir contraceptivo aprovado de implante hormonal manipulado.','Não assumir que um pellet pode ser rapidamente titulado como gel/comprimido.','Se uso for estético/performance com androgênio/anabolizante manipulado, sinalizar a restrição regulatória brasileira atual.'],
      refs:[['Anvisa — regras atuais para implantes hormonais','https://www.gov.br/anvisa/pt-br/comunicacao/campanhas/estetica/implantes-hormonais'],['Anvisa — alerta/proibição para estética e performance','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2024/anvisa-faz-proibicao-e-publica-alerta-sobre-hormonios-implantaveis-manipulados'],['Anvisa — ação fiscalizatória 2026','https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/anvisa-suspende-venda-de-implantes-hormonais-irregulares-e-determina-apreensao-de-tirzepatida'],['Revisão 2025 — pellets de testosterona em mulheres','https://pubmed.ncbi.nlm.nih.gov/41089583/']]
    }
  };
  const diseaseMap={
    'Eflúvio telógeno':['glp1','testosterone','implants'],
    'Alopecia androgenética masculina':['glp1','testosterone','aas','implants'],
    'Alopecia androgenética feminina':['glp1','testosterone','aas','implants'],
    'Acne vulgar':['testosterone','aas','implants'],
    'Dermatite seborreica':['testosterone','aas'],
    'Melasma':['implants','testosterone'],
    'Hidradenite supurativa':['glp1']
  };
  const htmlBlock=(k,x)=>`<article class="sx-card" data-sx-card="${k}"><div class="sx-card-head"><div><span class="overview-label">${esc(x.badge)}</span><h3>${esc(x.title)}</h3></div></div><p class="sx-examples">${esc(x.examples)}</p><div class="sx-columns"><section><strong>O que muda na prática</strong><ul>${x.takeaways.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></section><section><strong>Perguntar na anamnese</strong><ul>${x.ask.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></section><section><strong>Evitar simplificações</strong><ul>${x.avoid.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></section></div><div class="sx-refs">${x.refs.map(r=>`<a href="${esc(r[1])}" target="_blank" rel="noopener noreferrer">${esc(r[0])}</a>`).join('')}</div></article>`;
  function load(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
  function save(v){localStorage.setItem(STORE,JSON.stringify(v));}
  function ensureButton(){
    if(document.querySelector('[data-open-special-exposures]'))return;
    const b=document.createElement('button');b.type='button';b.className='special-exposure-sidebar';b.dataset.openSpecialExposures='1';b.textContent='Exposições especiais';
    const note=sidebar.querySelector('.sidebar-note');note?sidebar.insertBefore(b,note):sidebar.appendChild(b);
  }
  function ensureDialog(){
    if(document.querySelector('#specialExposureDialog'))return;
    const d=document.createElement('dialog');d.id='specialExposureDialog';d.className='special-exposure-dialog';
    d.innerHTML=`<div class="sx-shell"><header><div><span class="eyebrow">Dermatologia + Tricologia</span><h2>Exposições que mudam conduta</h2><p>GLP-1, reposição hormonal, anabolizantes e implantes.</p></div><button type="button" class="icon-btn" data-close-special-exposures>×</button></header><div class="sx-tabs">${Object.entries(E).map(([k,x])=>`<button type="button" data-sx-tab="${k}">${esc(x.title.split(' / ')[0])}</button>`).join('')}</div><div class="sx-body" data-sx-body></div><aside class="sx-intake"><span class="overview-label">Checklist rápido do paciente</span><div class="sx-form"><label>Exposição / substância<input data-sx-field="agent" placeholder="Ex.: tirzepatida 10 mg, oxandrolona, testosterona gel…"></label><label>Dose / via<input data-sx-field="dose" placeholder="Dose, frequência e via"></label><label>Início / última mudança<input data-sx-field="start" placeholder="Data ou intervalo aproximado"></label><label>Peso antes → atual<input data-sx-field="weight" placeholder="Ex.: 82 → 70 kg em 4 meses"></label><label>Queixa dermatológica<textarea data-sx-field="complaint" rows="2" placeholder="Queda, acne, hirsutismo, melasma…"></textarea></label></div><div class="sx-form-actions"><button type="button" class="secondary" data-sx-clear>Limpar</button><button type="button" class="primary" data-sx-copy-context>Copiar para contexto clínico</button></div></aside></div>`;
    document.body.appendChild(d);
    const state=load();d.querySelectorAll('[data-sx-field]').forEach(el=>{el.value=state[el.dataset.sxField]||'';el.addEventListener('input',()=>{const s=load();s[el.dataset.sxField]=el.value;save(s);});});
  }
  function showTab(k){ensureDialog();const body=document.querySelector('[data-sx-body]');if(!body)return;body.innerHTML=htmlBlock(k,E[k]);document.querySelectorAll('[data-sx-tab]').forEach(b=>b.classList.toggle('active',b.dataset.sxTab===k));}
  function open(k='glp1'){ensureDialog();showTab(k);document.querySelector('#specialExposureDialog')?.showModal();}
  function injectDisease(){
    if(document.querySelector('.nav-btn.active')?.dataset.view==='prescriptions')return;
    const name=panel.querySelector('.detail-title')?.textContent?.trim();const keys=diseaseMap[name];if(!keys?.length)return;
    const old=panel.querySelector('[data-special-exposure-disease]');if(old?.dataset.name===name)return;old?.remove();
    const details=[...panel.querySelectorAll('details.clinical-accordion')];
    const tx=details.find(d=>/tratamento completo|abordagem terapêutica|conduta curada/i.test(d.querySelector('summary')?.textContent||''));
    const tools=panel.querySelector('.accordion-tools');if(!tx&&!tools)return;
    const d=document.createElement('details');d.className='clinical-accordion sx-disease-accordion';d.open=true;d.dataset.specialExposureDisease='1';d.dataset.name=name;
    d.innerHTML=`<summary><span>Medicamentos / hormônios que mudam conduta</span><span class="summary-right"><span class="accordion-badge">EXPOSIÇÕES</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"><p class="sx-disease-intro">Pergunte ativamente por estas exposições; elas podem alterar diagnóstico, prognóstico e resposta terapêutica.</p><div class="sx-disease-grid">${keys.map(k=>`<button type="button" data-open-sx="${k}"><strong>${esc(E[k].title)}</strong><small>${esc(E[k].takeaways[0])}</small><span>Ver evidência e checklist →</span></button>`).join('')}</div></div>`;
    (tx||tools).insertAdjacentElement(tx?'beforebegin':'afterend',d);
  }
  document.addEventListener('click',async e=>{
    const tab=e.target.closest('[data-sx-tab]');if(tab){showTab(tab.dataset.sxTab);return;}
    const openBtn=e.target.closest('[data-open-special-exposures]');if(openBtn){e.preventDefault();open();return;}
    const inline=e.target.closest('[data-open-sx]');if(inline){e.preventDefault();open(inline.dataset.openSx);return;}
    if(e.target.closest('[data-close-special-exposures]')){document.querySelector('#specialExposureDialog')?.close();return;}
    if(e.target.closest('[data-sx-clear]')){localStorage.removeItem(STORE);document.querySelectorAll('[data-sx-field]').forEach(x=>x.value='');return;}
    if(e.target.closest('[data-sx-copy-context]')){
      const s=load();const text=`EXPOSIÇÃO ESPECIAL\nSubstância: ${s.agent||'não informada'}\nDose/via: ${s.dose||'não informada'}\nInício/última mudança: ${s.start||'não informado'}\nPeso: ${s.weight||'não informado'}\nQueixa dermatológica: ${s.complaint||'não informada'}`;
      try{await navigator.clipboard.writeText(text);}catch{}
      const box=document.querySelector('#patientContext');if(box)box.value=box.value.trim()?`${box.value.trim()}\n\n${text}`:text;
      window.DT_NOTIFY?.('Contexto de exposição copiado para a IA clínica.','success');
    }
  },true);
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;ensureButton();injectDisease();});};
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
  ensureButton();ensureDialog();queue();
  window.DT_SPECIAL_EXPOSURES=E;
})();
