(() => {
  const panel=document.querySelector('#detailPanel'); if(!panel)return;
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const C={
    'Líquen escleroso':{grade:'A',priority:['Corticosteroide tópico potente/ultrapotente + emoliente é primeira linha.','Manutenção e seguimento longitudinal reduzem recidiva e permitem detectar cicatriz/neoplasia cedo.'],avoid:['Não atribuir úlcera ou hiperqueratose persistente apenas à inflamação sem considerar biópsia.']},
    'Líquen plano cutâneo/oral':{grade:'B',priority:['Cutâneo localizado: corticosteroide tópico potente.','Oral erosivo/sintomático: terapia tópica de alta potência em formulação mucosa e seguimento.'],avoid:['Não acompanhar lesão oral ulcerada/indurada persistente sem histologia.']},
    'Prurido crônico':{grade:'B',priority:['Definir primeiro se há dermatose primária ou prurido em pele inicialmente normal.','Investigar causas sistêmicas em etapas, guiado por história e sinais de alarme.'],avoid:['Evitar “painel de exames” indiscriminado e polifarmácia antipruriginosa sem hipótese etiológica.']},
    'Morfeia (esclerodermia localizada)':{grade:'B',priority:['Formas profundas/lineares/generalizadas ou com risco funcional merecem tratamento sistêmico precoce.','MTX + corticosteroide sistêmico continua a estratégia sistêmica de referência; MMF é alternativa em refratariedade/intolerância.'],avoid:['Não esperar fibrose madura antes de tratar doença ativa com risco de dano.']},
    'Pioderma gangrenoso':{grade:'B',priority:['Excluir infecção e outras causas de úlcera antes de imunossuprimir.','Corticosteroide sistêmico/ciclosporina são pilares; selecionar terapia-alvo conforme comorbidade.'],avoid:['Evitar desbridamento agressivo em fase ativa por patergia.']},
    'Eritema nodoso':{grade:'B/C',priority:['Tratar a causa quando identificada e controlar dor/inflamação.','Investigar apenas gatilhos plausíveis: infecção, TB, sarcoidose, DII, fármacos e gestação conforme contexto.'],avoid:['Evitar corticosteroide sistêmico antes de excluir infecção relevante.']},
    'Eritema multiforme':{grade:'B',priority:['Na maioria, manejo sintomático; em recorrência HSV-associada, antiviral supressivo é opção central.','Diferenciar de SJS/TEN e RIME muda completamente o nível de urgência.'],avoid:['Não chamar todo exantema targetoide com mucosite de EM sem revisar SJS/TEN/RIME.']},
    'DRESS (reação medicamentosa com eosinofilia e sintomas sistêmicos)':{grade:'B',priority:['Suspender imediatamente a droga suspeita e estratificar gravidade/órgãos.','Corticosteroide tópico em doença leve; sistêmico em moderada-grave, com taper lento.'],avoid:['Não dar alta sem plano de seguimento de fígado/rim/tireoide e risco de recidiva.']},
    'Síndrome de Stevens-Johnson / necrólise epidérmica tóxica':{grade:'B',priority:['Reconhecimento e suspensão precoce do culpado são críticos.','Encaminhamento/internação e suporte especializado são parte do tratamento, não “último recurso”.'],avoid:['Não manejar em consultório como farmacodermia comum.']},
    'Hiperidrose':{grade:'B',priority:['Escolher terapia pela localização e impacto: alumínio → iontoforese/anticolinérgico tópico → toxina botulínica ou sistêmico conforme perfil.','Investigar causa secundária se início tardio, noturno ou generalizado.'],avoid:['Não usar anticolinérgico oral sem revisar glaucoma, retenção urinária e intolerância ao calor.']},
    'Queloide e cicatriz hipertrófica':{grade:'B',priority:['Combinação de modalidades é regra em doença relevante.','Intralesional, silicone, crioterapia/laser/5-FU podem ser combinados conforme espessura e local.'],avoid:['Evitar cirurgia isolada de queloide por alta recidiva.']},
    'Eritrasma e intertrigo infectado':{grade:'A/B',priority:['Wood com fluorescência coral apoia eritrasma.','Reduzir umidade/fricção é parte essencial do tratamento de intertrigo, além de tratar o agente.'],avoid:['Evitar combinações prolongadas de corticoide+antifúngico+antibiótico sem diagnóstico.']}
  };
  const item=(title,arr)=>arr?.length?`<section class="tri-curation-card"><strong>${esc(title)}</strong><ul>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:'';
  function inject(){
    const name=panel.querySelector('.detail-title')?.textContent?.trim(); const c=C[name]; if(!c)return;
    if(panel.querySelector(`[data-expanded-curation-2="${CSS.escape(name)}"]`))return;
    const details=[...panel.querySelectorAll('details.clinical-accordion')];
    const treatment=details.find(d=>(d.querySelector('summary')?.textContent||'').toLowerCase().includes('tratamento completo'));
    if(!treatment)return;
    const d=document.createElement('details'); d.className='clinical-accordion'; d.open=true; d.dataset.expandedCuration2=name;
    d.innerHTML=`<summary><span>Conduta curada 2026</span><span class="summary-right"><span class="accordion-badge">EVIDÊNCIA ${esc(c.grade)}</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"><div class="tri-curation-note"><b>Esta seção tem prioridade clínica</b><span>Curadoria baseada na melhor evidência disponível até 03/11/2026.</span></div>${item('Prioridade terapêutica',c.priority)}${item('Evitar / não fazer',c.avoid)}</div>`;
    treatment.insertAdjacentElement('beforebegin',d);
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();