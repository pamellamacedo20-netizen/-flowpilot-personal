(() => {
  window.DT_DECISION_PIVOTS=window.DT_DECISION_PIVOTS||{};
  Object.assign(window.DT_DECISION_PIVOTS,{
    'Líquen escleroso':[
      {finding:'Doença genital ativa típica',action:'Corticosteroide tópico potente/ultrapotente + emoliente é primeira linha; planejar manutenção após controle.',quality:'A',source:'S3/EuroGuiDerm 2026'},
      {finding:'Fimose masculina que não responde ao tratamento tópico',action:'Circuncisão com remoção completa do prepúcio passa a ser opção indicada.',quality:'A/B',source:'S3 guideline 2026'},
      {finding:'Úlcera, hiperqueratose focal, nódulo, sangramento ou mudança persistente',action:'Biopsiar para excluir carcinoma espinocelular antes de simplesmente intensificar tópico.',quality:'A/B',source:'S3 guideline 2026'}
    ],
    'Líquen plano cutâneo/oral':[
      {finding:'Líquen plano cutâneo localizado',action:'Corticosteroide tópico potente é primeira linha; escalar apenas se extenso/refratário.',quality:'B',source:'Consensus/reviews'},
      {finding:'Forma oral erosiva/dolorosa',action:'Corticosteroide tópico de alta potência em formulação mucosa e seguimento; refratários podem exigir sistêmico.',quality:'B',source:'Italian OLP consensus 2025'},
      {finding:'Lesão oral persistente ulcerada, indurada ou focalmente diferente',action:'Biopsiar/rebiopsiar para excluir displasia ou carcinoma.',quality:'B',source:'INCORP 2026'}
    ],
    'Prurido crônico':[
      {finding:'Pele primariamente normal + prurido generalizado',action:'Priorizar investigação sistêmica/medicamentosa/neuropática em etapas, em vez de apenas aumentar tópicos.',quality:'B',source:'S2k Chronic Pruritus 2026'},
      {finding:'Lesões primárias inflamatórias',action:'Tratar a dermatose de base e a barreira cutânea; terapia antipruriginosa é adjuvante.',quality:'B',source:'S2k 2026'},
      {finding:'Perda ponderal, febre, linfadenopatia, icterícia ou alterações laboratoriais',action:'Acelerar investigação sistêmica e sair do fluxo dermatológico simples.',quality:'B',source:'S2k 2026'}
    ],
    'Morfeia (esclerodermia localizada)':[
      {finding:'Forma limitada superficial',action:'Tópicos/fototerapia podem ser suficientes conforme atividade.',quality:'B',source:'S2k 2024 + review 2026'},
      {finding:'Linear, profunda, generalizada, pansclerótica ou risco funcional',action:'MTX + corticosteroide sistêmico sobe para primeira linha sistêmica; tratar cedo para prevenir dano irreversível.',quality:'B',source:'Morphea review 2026'},
      {finding:'Coup de sabre / Parry-Romberg ou sintomas neuro-oftalmológicos',action:'Avaliação multidisciplinar e imagem dirigida; não manejar como placa cutânea simples.',quality:'B',source:'Morphea review 2026'}
    ],
    'Pioderma gangrenoso':[
      {finding:'Úlcera dolorosa de progressão rápida com borda violácea',action:'Excluir infecção/vasculite e evitar desbridamento agressivo; suspeitar patergia.',quality:'B',source:'JAAD 2026 review'},
      {finding:'DII associada',action:'Anti-TNF ganha prioridade relativa por tratar simultaneamente doença intestinal e cutânea.',quality:'B/C',source:'Comorbidity-guided PG 2026'},
      {finding:'Doença extensa/rápida',action:'Corticosteroide sistêmico ou ciclosporina são pilares de indução; escolher conforme comorbidades.',quality:'B',source:'PG reviews/guidance'}
    ],
    'Eritema nodoso':[
      {finding:'Quadro típico e paciente estável',action:'Investigar gatilhos de forma dirigida e tratar sintomaticamente; maioria é autolimitada.',quality:'B',source:'Reviews 2026'},
      {finding:'Ulceração, necrose, unilateralidade marcante ou persistência',action:'Reconsiderar diagnóstico e indicar biópsia profunda/investigação de outra paniculite.',quality:'B',source:'Clinical practice'},
      {finding:'Consideração de corticosteroide sistêmico',action:'Excluir infecção relevante antes de iniciar.',quality:'B',source:'Clinical reviews'}
    ],
    'Eritema multiforme':[
      {finding:'Lesões-alvo típicas + história de HSV recorrente',action:'Em recorrências frequentes, antiviral supressivo passa a ter papel central.',quality:'B',source:'EM review 2024 / cohort 2026'},
      {finding:'Dor cutânea, descolamento epidérmico ou múltiplas mucosas intensamente acometidas',action:'Reclassificar rapidamente para SJS/TEN ou RIME; não manter fluxo de EM simples.',quality:'B',source:'EM/SJS-TEN differential'},
      {finding:'Primeiro episódio leve sem causa grave',action:'Tratamento sintomático geralmente é suficiente.',quality:'B',source:'EM review 2024'}
    ],
    'DRESS (reação medicamentosa com eosinofilia e sintomas sistêmicos)':[
      {finding:'Suspeita de DRESS',action:'Suspender imediatamente o fármaco culpado provável e aplicar RegiSCAR + avaliação orgânica.',quality:'B',source:'International Delphi 2024'},
      {finding:'Doença leve sem órgão grave',action:'Corticosteroide tópico muito potente + monitorização; evitar imunossupressão sistêmica automática.',quality:'B',source:'DRESS Delphi'},
      {finding:'DRESS grave com órgão interno importante',action:'Corticosteroide sistêmico e internação/seguimento especializado; taper prolongado.',quality:'B',source:'DRESS Delphi'}
    ],
    'Síndrome de Stevens-Johnson / necrólise epidérmica tóxica':[
      {finding:'Suspeita clínica',action:'Suspender imediatamente medicamentos suspeitos e encaminhar/internar em ambiente especializado.',quality:'B',source:'SJS/TEN guideline 2026'},
      {finding:'Acometimento ocular ou múltiplas mucosas',action:'Avaliação oftalmológica e por especialidades de mucosa precocemente; prevenção de sequela começa na fase aguda.',quality:'B',source:'SJS/TEN guideline 2026'},
      {finding:'Extensão significativa de descolamento / instabilidade',action:'Cuidados de suporte intensivo e estratificação de gravidade; não é manejo ambulatorial.',quality:'B',source:'SJS/TEN guideline 2026'}
    ],
    'Hiperidrose':[
      {finding:'Focal primária axilar/palmar/plantar',action:'Começar por terapia local; iontoforese ganha prioridade em palmar/plantar e toxina botulínica em doença focal refratária.',quality:'B',source:'Hyperhidrosis review 2026'},
      {finding:'Multifocal ou falha de tratamentos locais',action:'Oxibutinina oral pode ser considerada após revisar efeitos anticolinérgicos e contraindicações.',quality:'B',source:'Hyperhidrosis review 2026'},
      {finding:'Início tardio, noturno ou generalizado',action:'Investigar hiperidrose secundária antes de rotular como primária.',quality:'B',source:'Clinical review 2026'}
    ],
    'Queloide e cicatriz hipertrófica':[
      {finding:'Lesão pequena/recente',action:'Silicone/oclusão e infiltração intralesional entram cedo; tratar sintomas e tensão.',quality:'B',source:'ASAP 2026'},
      {finding:'Queloide espesso/refratário',action:'Combinar intralesional + crioterapia/laser/5-FU conforme morfologia; terapia multimodal supera tentativa isolada repetitiva.',quality:'B',source:'ASAP 2026'},
      {finding:'Planejamento de excisão',action:'Não operar queloide isoladamente; adicionar estratégia adjuvante para reduzir recidiva.',quality:'B',source:'ASAP 2026'}
    ],
    'Eritrasma e intertrigo infectado':[
      {finding:'Fluorescência coral na lâmpada de Wood',action:'Eritrasma torna-se provável; antibiótico tópico é adequado em doença localizada.',quality:'A/B',source:'Systematic review erythrasma 2025'},
      {finding:'Intertrigo doloroso, exsudativo, com edema ou odor e falha de antifúngico',action:'Considerar infecção bacteriana/mista e colher cultura quando útil; reduzir maceração e umidade.',quality:'B',source:'S1 intertrigo 2026'},
      {finding:'Celulite, necrose ou risco vascular/diabetes importante',action:'Escalar para avaliação de partes moles/vascular; antibiótico sistêmico apenas quando indicado.',quality:'B',source:'S1 intertrigo 2026'}
    ]
  });
})();