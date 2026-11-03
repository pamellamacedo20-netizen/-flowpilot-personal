(() => {
  window.DT_DECISION_PIVOTS=window.DT_DECISION_PIVOTS||{};
  Object.assign(window.DT_DECISION_PIVOTS,{
    'Acne vulgar':[
      {finding:'Acne papulopustulosa grave, moderadamente nodular ou nodular/conglobata grave',action:'Isotretinoína sistêmica passa a ser a opção preferencial quando possível; a EuroGuiDerm 2026 faz recomendação forte.',quality:'A',source:'EuroGuiDerm acne guideline 2026'},
      {finding:'Cicatriz presente/risco de cicatriz, carga psicossocial importante ou falha de terapia padrão',action:'Isotretinoína ganha prioridade mesmo sem acne nodulocística clássica.',quality:'A',source:'AAD acne guideline 2024'},
      {finding:'Acne moderada com recorrência frequente + cicatriz significativa, forte história familiar ou alto impacto psicossocial',action:'Considerar isotretinoína mais precocemente; isso é apoiado por consenso Delphi recente, não por RCT comparativo direto.',quality:'B',source:'ERAISE ACNE consensus 2026'},
      {finding:'Lesões no tronco, mas sem gravidade nodular/cicatricial',action:'Tronco isoladamente não torna isotretinoína obrigatória. Trifaroteno tem evidência específica para acne truncal; terapia sistêmica pode ser considerada conforme extensão e resposta.',quality:'A/B',source:'EuroGuiDerm 2026; truncal acne review 2026'},
      {finding:'Tronco extenso + nódulos, cicatriz ou grande carga inflamatória',action:'A presença truncal reforça a indicação de terapia sistêmica e, quando enquadrada em acne grave/moderadamente nodular, favorece isotretinoína.',quality:'A',source:'EuroGuiDerm 2026'},
      {finding:'Mulher adulta com padrão hormonal/persistente',action:'Espironolactona é alternativa sistêmica útil; EuroGuiDerm sugere iniciar 50 mg/dia e subir para 100 mg após 4 semanas se tolerado.',quality:'A/B',source:'EuroGuiDerm 2026'},
      {finding:'Uso de antibiótico sistêmico',action:'Limitar em geral a ~3 meses; exceções podem existir em acne grave ou truncal com resposta parcial contínua, sempre com tópico não antibiótico.',quality:'A',source:'EuroGuiDerm 2026'},
      {finding:'Acne conglobata muito inflamada, dolorosa ou fulminante',action:'Pode ser necessário controlar inflamação antes/ao iniciar isotretinoína; combinação temporária com corticosteroide sistêmico aparece como recomendação de especialista.',quality:'B/C',source:'EuroGuiDerm 2026'}
    ],
    'Rosácea':[
      {finding:'Fenótipo papulopustular predominante',action:'Ivermectina, metronidazol ou ácido azelaico tópicos ganham prioridade; doxiciclina entra em moderada-grave/refratária.',quality:'B',source:'Rosacea consensus/review 2025-2026'},
      {finding:'Eritema persistente/telangiectasias predominantes',action:'Tópicos vasoconstritores e/ou laser/IPL tornam-se mais relevantes que antibiótico.',quality:'B',source:'Laser/EBD Delphi 2026'},
      {finding:'Doença refratária importante',action:'Isotretinoína em baixa dose pode ser considerada em pacientes selecionados.',quality:'B/C',source:'Rosacea reviews/consensus'},
      {finding:'Dor ocular, fotofobia ou alteração visual',action:'Mudar prioridade para avaliação oftalmológica; rosácea ocular pode ameaçar superfície ocular.',quality:'B',source:'Rosacea consensus'}
    ],
    'Dermatite atópica':[
      {finding:'Doença leve/localizada',action:'Emoliente + anti-inflamatório tópico adequado à área continuam sendo base; TCS/TCI e novos tópicos têm forte suporte.',quality:'A',source:'AAD AD guideline/focused update 2025'},
      {finding:'Moderada-grave, refratária ou alto impacto apesar de tópicos',action:'Escalar para biológico/JAK ou fototerapia conforme perfil; dupilumabe, tralokinumabe, lebrikizumabe, nemolizumabe e JAKs têm recomendações fortes em cenários apropriados.',quality:'A',source:'AAD 2025; S3 2026'},
      {finding:'Necessidade recorrente de corticosteroide sistêmico',action:'Isso sinaliza controle inadequado e favorece migração para terapia poupadora; AAD recomenda contra corticosteroide sistêmico de rotina.',quality:'A',source:'AAD AD guideline'},
      {finding:'Conjuntivite/doença ocular com biológico',action:'Reavaliar agente, manejo ocular e necessidade de oftalmologia conforme gravidade.',quality:'A/B',source:'Biologic safety data/guidelines'}
    ],
    'Dermatite de contato':[
      {finding:'Dermatite recorrente/persistente ou padrão ocupacional',action:'Patch test torna-se central; tratamento sem identificar exposição tende a falhar.',quality:'B',source:'ESCD patch testing guideline 2026'},
      {finding:'Distribuição facial/capilar/mãos com cosméticos/produtos profissionais',action:'Ampliar bateria guiada pela exposição, incluindo produtos próprios quando apropriado.',quality:'B',source:'ESCD 2026'},
      {finding:'Melhora incompleta apesar de corticoide tópico',action:'Revisar exposição contínua antes de simplesmente aumentar potência/duração.',quality:'B',source:'Contact dermatitis best practice'}
    ],
    'Psoríase':[
      {finding:'BSA baixo, mas couro cabeludo/genitais/palmas/plantas/unhas ou grande impacto funcional',action:'Não classificar como “leve” só pelo BSA; área especial pode justificar terapia sistêmica.',quality:'A/B',source:'EuroGuiDerm/S3 2026'},
      {finding:'Artrite psoriásica ou sintomas articulares',action:'Mudar escolha sistêmica e considerar avaliação reumatológica; classes com benefício articular ganham prioridade.',quality:'A',source:'S3/EuroGuiDerm 2026'},
      {finding:'DII, insuficiência cardíaca, doença desmielinizante, obesidade ou malignidade prévia',action:'Comorbidade passa a dirigir classe sistêmica; não existe um biológico universalmente melhor.',quality:'A/B',source:'S3 2026; JAAD patient-selection review 2026'},
      {finding:'Falha tópica + alto impacto',action:'Escalonar para fototerapia/sistêmico em vez de manter ciclos tópicos indefinidos.',quality:'A/B',source:'S3 2026'}
    ],
    'Hidradenite supurativa':[
      {finding:'Moderada-grave',action:'Biológicos com recomendação forte — adalimumabe, bimequizumabe, infliximabe e secuquinumabe — passam a ter prioridade sobre ciclos prolongados de antibiótico.',quality:'A',source:'AAD-HSF guideline 2026'},
      {finding:'Túneis/lesão estrutural recorrente',action:'Deroofing ou cirurgia deve entrar cedo; tratamento farmacológico isolado não remove dano estrutural.',quality:'A/B',source:'AAD-HSF 2026'},
      {finding:'Abscesso muito doloroso',action:'Incisão/drenagem pode aliviar dor aguda, mas não substitui manejo definitivo da doença.',quality:'B',source:'AAD-HSF 2026'},
      {finding:'Mulher com padrão hormonal',action:'Espironolactona pode ser considerada como adjuvante; evidência é condicional.',quality:'B',source:'AAD-HSF 2026'},
      {finding:'Em biológico e vai operar',action:'A guideline recomenda continuidade do adalimumabe em cirurgia de HS selecionada, em vez de suspensão automática.',quality:'A/B',source:'AAD-HSF 2026'}
    ],
    'Urticária crônica espontânea':[
      {finding:'Sintomas persistentes com anti-H1 de 2ª geração em dose padrão',action:'Escalonar até 4x a dose padrão conforme guideline e tolerabilidade.',quality:'A',source:'International urticaria guideline 2026'},
      {finding:'Controle inadequado apesar de anti-H1 otimizado',action:'Omalizumabe torna-se próximo passo principal.',quality:'A',source:'International urticaria guideline 2026'},
      {finding:'Refratária ao omalizumabe',action:'Ciclosporina ou outra estratégia avançada pode ser considerada; reavaliar diagnóstico e urticária induzível.',quality:'A/B',source:'International urticaria guideline 2026'},
      {finding:'Lesões >24 h, dor, púrpura ou hiperpigmentação residual',action:'Questionar vasculite urticariforme; muda investigação e tratamento.',quality:'B',source:'International guideline diagnostic algorithm'}
    ],
    'Vitiligo':[
      {finding:'Doença ativa/progressiva',action:'Priorizar estabilização; fototerapia e, em casos selecionados, terapia sistêmica curta entram antes de cirurgia.',quality:'B',source:'Canadian vitiligo consensus 2025'},
      {finding:'Localizado não segmentar elegível',action:'Ruxolitinibe tópico é opção importante onde aprovado; TCS/TCI continuam válidos.',quality:'B',source:'Vitiligo consensus/review 2025-2026'},
      {finding:'Extenso',action:'NB-UVB ganha relevância, isolada ou combinada.',quality:'B',source:'Vitiligo consensus 2025'},
      {finding:'Leucotriquia/acral',action:'Expectativa de repigmentação é menor; isso deve alterar prognóstico e decisão de escalada.',quality:'B/C',source:'Vitiligo consensus'}
    ],
    'Melasma':[
      {finding:'Qualquer paciente',action:'Fotoproteção ampla e, quando relevante, proteção contra luz visível são base permanente.',quality:'B',source:'Global pigment consensus 2026'},
      {finding:'Melasma moderado/persistente',action:'Tripla combinação com hidroquinona sob supervisão continua entre as opções de maior eficácia.',quality:'B',source:'International Delphi 2025'},
      {finding:'Refratário e sem contraindicação trombótica',action:'Ácido tranexâmico oral pode ser considerado após triagem de risco.',quality:'B',source:'Global consensus/NMA 2025-2026'},
      {finding:'Alto risco de PIH/fototipo alto',action:'Procedimentos e lasers devem ser selecionados com maior cautela; tratamento agressivo pode piorar pigmentação.',quality:'B/C',source:'Global consensus 2026'}
    ],
    'Escabiose':[
      {finding:'Caso típico não complicado',action:'Permetrina 5% ou ivermectina oral são opções principais conforme idade, gestação, adesão e contexto.',quality:'B',source:'Scabies guidelines 2024-2025'},
      {finding:'Escabiose crostosa',action:'Combinar terapia tópica + ivermectina em múltiplas doses e adotar controle rigoroso de contatos/ambiente.',quality:'B',source:'Scabies guideline'},
      {finding:'Prurido persiste após tratamento, sem novas lesões/túneis',action:'Não repetir escabicida automaticamente; considerar prurido pós-escabiose.',quality:'B',source:'Scabies guideline'}
    ],
    'Herpes-zóster':[
      {finding:'Início <72 h',action:'Antiviral deve ser iniciado precocemente.',quality:'B',source:'Updated herpes zoster review 2026'},
      {finding:'>72 h com novas vesículas, imunossupressão ou localização de alto risco',action:'Ainda considerar antiviral; a janela de 72 h não é um corte absoluto nesses cenários.',quality:'B',source:'Updated reviews/guidance'},
      {finding:'V1/ocular, ouvido, déficit neurológico ou disseminação',action:'Encaminhamento urgente e manejo específico; IV aciclovir em doença grave selecionada.',quality:'B',source:'Herpes zoster reviews/guidance'}
    ],
    'Tinea corporis/cruris':[
      {finding:'Localizada e típica',action:'Antifúngico tópico é suficiente na maioria.',quality:'B',source:'Tinea management review 2025'},
      {finding:'Extensa, folicular, imunossuprimida ou refratária',action:'Terapia sistêmica e confirmação micológica ganham prioridade.',quality:'B',source:'Tinea management review 2025'},
      {finding:'Falha à terbinafina, doença extensa/recalcitrante ou epidemiologia compatível com T. indotineae',action:'Suspeitar resistência; confirmar espécie quando possível. Consensos 2026 favorecem itraconazol como primeira linha para T. indotineae.',quality:'B',source:'T. indotineae Delphi 2026'}
    ],
    'Onicomicose':[
      {finding:'Planeja terapia sistêmica',action:'Confirmar micose antes de tratar; não assumir que distrofia ungueal é onicomicose.',quality:'A',source:'BAD onychomycosis guideline 2026'},
      {finding:'Dermatófito, doença moderada/extensa ou matriz acometida',action:'Terbinafina oral é primeira linha para muitos pacientes.',quality:'A',source:'BAD 2026'},
      {finding:'Doença leve/distal limitada ou contraindicação a sistêmico',action:'Tópico pode ser apropriado; combinação pode ajudar em doença difícil.',quality:'A/B',source:'BAD 2026'}
    ],
    'Paroníquia':[
      {finding:'Abscesso/coleção',action:'Drenagem passa a ser prioridade; antibiótico isolado não resolve coleção fechada.',quality:'B/C',source:'Paronychia review 2025'},
      {finding:'Crônica por irritação/umidade',action:'Proteção de barreira e anti-inflamatório são centrais; antifúngico isolado frequentemente é insuficiente.',quality:'B/C',source:'Paronychia review'},
      {finding:'Crônica leve',action:'Metronidazol gel tem RCT pequeno de 2026 com sinal de benefício, mas ainda não substitui medidas de barreira.',quality:'B',source:'RCT 2026'}
    ],
    'Ceratose actínica':[
      {finding:'Poucas lesões isoladas',action:'Crioterapia é adequada como terapia dirigida à lesão.',quality:'B',source:'AK review 2026'},
      {finding:'Campo de cancerização/múltiplas lesões',action:'Terapia de campo ganha prioridade: 5-FU, imiquimode, tirbanibulina ou PDT conforme perfil.',quality:'A/B',source:'Systematic review 2024; AK review 2026'},
      {finding:'Induração, dor, ulceração, crescimento rápido, sangramento ou falha',action:'Biopsiar/descartar cSCC antes de repetir destruição empírica.',quality:'B',source:'AK review 2026'}
    ],
    'Carcinoma basocelular':[
      {finding:'Baixo risco, superficial, área não crítica',action:'Terapias tópicas/destrutivas podem ser consideradas em pacientes selecionados.',quality:'A/B',source:'European/NCCN BCC guidance'},
      {finding:'Alto risco, recorrente, bordas mal definidas ou área crítica',action:'Cirurgia micrográfica/Mohs ganha prioridade; tópicos não devem ser usados apenas para evitar cirurgia.',quality:'A/B',source:'European/NCCN BCC guidance'},
      {finding:'Localmente avançado não operável',action:'Encaminhar para terapia-alvo Hedgehog e/ou imunoterapia conforme linha e contexto oncológico.',quality:'A',source:'NCCN/European guidance'}
    ],
    'Carcinoma espinocelular cutâneo':[
      {finding:'Tumor ressecável comum',action:'Excisão com avaliação histológica de margens é primeira linha.',quality:'B',source:'European cSCC guideline 2026'},
      {finding:'Alto risco/local crítico/recorrente',action:'Cirurgia micrográfica e avaliação de linfonodos/imagem podem ganhar prioridade conforme fatores de risco.',quality:'B',source:'European cSCC guideline 2026'},
      {finding:'Localmente avançado/metastático sem opção curativa local',action:'Anti-PD-1 é primeira linha sistêmica atual.',quality:'A/B',source:'European cSCC guideline 2026'}
    ],
    'Melanoma cutâneo':[
      {finding:'Lesão altamente suspeita e ressecável',action:'Biópsia excisional de espessura total com pequena margem é preferida para preservar Breslow.',quality:'A/B',source:'ESMO/European melanoma guidelines'},
      {finding:'Breslow ≥1,0 mm ou ≥0,8 mm com fatores de risco',action:'Oferecer/discutir biópsia do linfonodo sentinela conforme guideline.',quality:'A/B',source:'European melanoma guideline 2024/ESMO 2025'},
      {finding:'Estágio IIB ou superior',action:'Mudar de simples seguimento dermatológico para discussão oncológica de terapia adjuvante/estadiamento.',quality:'A',source:'ESMO 2025'},
      {finding:'BRAF V600 mutado em cenário apropriado',action:'Terapia-alvo BRAF/MEK entra nas opções; escolha depende do estágio e linha.',quality:'A',source:'ESMO 2025'}
    ]
  });
})();
