/* Pivôs corrigidos e curadoria transversal das doenças com recomendações A/B. */
(() => {
  const P=window.DT_DECISION_PIVOTS=window.DT_DECISION_PIVOTS||{};
  const E=window.DT_EVIDENCE_REGISTRY;
  if(P['Tinea corporis/cruris'] && !P['Tinea corporis / cruris'])P['Tinea corporis / cruris']=P['Tinea corporis/cruris']; // compatibilidade de versões antigas
  const key='Alopecia fibrosante frontal';
  const current=Array.isArray(P[key])?P[key]:[];
  const additions=[
    {finding:'Sem sintomas, mas progressão em fotos ou medidas',action:'Considerar doença ativa mesmo sem eritema evidente; revisar intervalo fotográfico, linha frontal em mm e iniciar/otimizar supressão da progressão conforme elegibilidade.',quality:'B — consenso',source:'SOFFIA 2024/JEADV 2026'},
    {finding:'Sobrancelhas ativas / rarefação recente',action:'Documentar extensão e sinais foliculares; avaliar corticosteroide intralesional de baixa concentração em mãos experientes e considerar poupador tópico quando apropriado. A repilação é possível em parte das pacientes.',quality:'B/C',source:'SOFFIA 2024/JEADV 2026'},
    {finding:'Pápulas faciais associadas',action:'Pesquisar AFF de pelos velos faciais; avaliar retinoide tópico ou isotretinoína sistêmica apenas em casos selecionados, após triagem reprodutiva, monitorização e discussão de baixa evidência.',quality:'C — estudos limitados',source:'SOFFIA 2024/JEADV 2026'},
    {finding:'Progressão rápida e inflamação intensa',action:'Não aguardar 6–12 meses para agir. Otimizar terapia multimodal e considerar ponte anti-inflamatória sistêmica curta sob supervisão especializada; corticoide sistêmico não é manutenção.',quality:'B — consenso',source:'SOFFIA 2024/JEADV 2026'},
    {finding:'Gestação, tentativa ou potencial reprodutivo sem controle',action:'Não usar 5ARI ou retinoide sistêmico; rever alternativas e situação reprodutiva, com aconselhamento de risco. Não usar a dose de consenso como prescrição automática.',quality:'A — segurança de classe',source:'Bulas + SOFFIA'},
    {finding:'Estabilidade prolongada e desejo de transplante',action:'Exigir estabilidade objetiva sustentada, preferencialmente ≥2 anos, avaliar área doadora e explicar risco de reativação/perda de enxertos; manter seguimento.',quality:'B/C — consenso e séries',source:'SOFFIA 2024/JEADV 2026'}
  ];
  additions.forEach(x=>{if(!current.some(y=>y.finding===x.finding))current.push(x)});
  P[key]=current;
  if(E?.diseases){
    const f=E.diseases[key]=E.diseases[key]||[];
    const soffia={title:'Statement from the frontal fibrosing alopecia international expert alliance: SOFFIA 2024',year:2026,type:'Consenso internacional eDelphi (69 convidados; publicação JEADV 2026)',quality:'B',role:'driver',doi:'10.1111/jdv.20833',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12843854/',note:'Monitorização objetiva (FFASI/FFASS e medidas), abordagem combinada, 5ARI sem AGA concomitante, HCQ quando necessária; experiência de especialistas, sem RCT robusto para muitas decisões.'};
    if(!f.some(x=>x.doi===soffia.doi))f.unshift(soffia);
  }
  const C={
    'Acne vulgar':{grade:'A',priority:['Terapia tópica combinada para acne leve e formas moderadas apropriadas; evitar antibiótico tópico isolado.','Isotretinoína em acne grave, nodular, cicatricial, resistente ou com alto impacto psicossocial, com prevenção gestacional e monitorização; lesão isolada no tronco não torna isotretinoína obrigatória.','Terapia hormonal pode ser opção em mulher adulta elegível; limitar antibióticos sistêmicos e manter regime tópico.'],avoid:['Não associar isotretinoína a tetraciclinas.','Não classificar gravidade somente pela presença de acometimento truncal.'],source:'AAD 2024; EuroGuiDerm 2026'},
    'Dermatite atópica':{grade:'A',priority:['Emoliente/barreira e terapêutica anti-inflamatória tópica conforme área, potência e idade.','Se moderada/grave ou não controlada, considerar fototerapia, biológicos e/ou inibidores de JAK apropriados após triagem; selecionar pela comorbidade e perfil de segurança.','Documentar EASI/SCORAD e impacto psicossocial; evitar corticoide sistêmico crônico como estratégia de manutenção.'],avoid:['Não manter ciclos repetidos de corticoide sistêmico sem reavaliar plano poupador.'],source:'AAD 2025; diretrizes S3/EuroGuiDerm'},
    'Hidradenite supurativa':{grade:'A',priority:['Estratificar inflamação ativa (IHS4) e dano estrutural (Hurley), incluindo túneis.','Doença moderada/grave: considerar biológicos e estratégias sistêmicas baseadas em diretriz; cirurgia/deroofing para túneis e cicatrizes persistentes.','Integrar cessação do tabagismo, manejo de dor, comorbidades e avaliação de qualidade de vida.'],avoid:['Não esperar que antibiótico repetido resolva túneis epitelizados.'],source:'AAD-HSF 2026'}
  };
  const panel=document.querySelector('#detailPanel');if(!panel)return;
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  let scheduled=false;
  function inject(){
    const title=panel.querySelector('.detail-title')?.textContent?.trim();
    const c=C[title]; if(!c)return;
    if([...panel.querySelectorAll('details')].some(d=>(d.querySelector('summary > span')?.textContent||'')==='Conduta curada 2026'))return;
    const target=[...panel.querySelectorAll('details.clinical-accordion')].find(d=>/Tratamento completo|Abordagem terapêutica/i.test(d.querySelector('summary')?.textContent||''));if(!target)return;
    const d=document.createElement('details');d.className='clinical-accordion';d.open=true;d.dataset.coreCuration='1';
    d.innerHTML='<summary><span>Conduta curada 2026</span><span class="summary-right"><span class="accordion-badge">EVIDÊNCIA '+esc(c.grade)+'</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"><div class="tri-curation-note"><b>Prioridade clínica</b><span>Diretrizes A/B, individualizar por fenótipo e contraindicações.</span></div><section class="tri-curation-card"><strong>Prioridade terapêutica</strong><ul>'+c.priority.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul></section><section class="tri-curation-card"><strong>Evitar / não fazer</strong><ul>'+c.avoid.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul></section><p class="microcopy">'+esc(c.source)+'</p></div>';
    target.insertAdjacentElement('beforebegin',d);
  }
  const queue=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;inject()})};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});
  queue();
})();