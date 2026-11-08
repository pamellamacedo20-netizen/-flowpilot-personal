/* Protocolos por condição, revisão clínica estruturada 08/11/2026.
   Nomes e doses não substituem bula profissional brasileira nem decisão individual. */
(() => {
  const T={
    'Hanseníase':{
      risk:'Sinais cardinais, exame dermatoneurológico, classificação PB/MB, grau de incapacidade e presença de reação/neurite.',
      first:['Confirmar diagnóstico clínico e classificar PB (1–5 lesões e baciloscopia negativa) versus MB (>5 lesões e/ou baciloscopia positiva) conforme PCDT brasileiro.','Iniciar PQT-U (rifampicina + clofazimina + dapsona) com dose mensal supervisionada e doses diárias autoadministradas; duração PB 6 meses, MB 12 meses. Não prescrever como monoterapia.','Avaliar contatos, notificação compulsória, prevenção de incapacidades, sensibilidade, força e nervos periféricos.'],
      escalate:['Neurite, perda sensitiva ou motora nova: avaliação prioritária e tratamento da reação para preservar função; não suspender automaticamente a PQT-U.','Reações tipo 1/tipo 2 e intolerância a componentes exigem protocolo e equipe de referência; talidomida é altamente restrita e teratogênica.'],
      monitor:['Visitas mensais, adesão, exame neural e grau de incapacidade, reações e toxicidade medicamentosa.','Conferir interações da rifampicina (incluindo contraceptivos), hematotoxicidade da dapsona/G6PD e QT quando pertinente.'],
      urgent:'Neuropatia aguda, perda motora, dor neural incapacitante ou dano ocular exige atenção especializada rápida.',
      reference:'PCDT Ministério da Saúde 2022, página oficial de hanseníase no SUS.'
    },
    'Lúpus eritematoso cutâneo':{
      risk:'Diferenciar ACLE, SCLE, CCLE/DLE, fotossensibilidade, cicatrização no couro cabeludo e sinais de acometimento sistêmico.',
      first:['Fotoproteção contínua, cessar tabagismo, reduzir gatilhos e considerar biópsia em fenótipo atípico.','Corticoide tópico conforme localização e duração; tacrolimo/pimecrolimo são alternativas úteis em face e áreas sensíveis.','Hidroxicloroquina é opção sistêmica central quando extensa, persistente ou com risco de cicatrização; dose individualizada por peso real e risco ocular.'],
      escalate:['Se refratário, confirmar adesão, subtipo, tabagismo e comorbidades; discutir metotrexato, micofenolato ou biológicos com equipe especializada.','Risco de cicatriz em DLE do couro cabeludo aumenta prioridade de supressão inflamatória e monitorização tricoscópica.'],
      monitor:['Fotografias, atividade lesional, pigmentação e óstios; investigar LES somente conforme história e exame.','Com antimaláricos, revisar função renal, medicamentos, dose por peso real e rastreamento oftalmológico.'],
      urgent:'Lesões com suspeita de neoplasia, vasculite sistêmica, nefrite ou sinais neurológicos exigem avaliação dirigida.',
      reference:'BSR guideline 2026 para manifestações cutâneas do LES; EULAR 2023 e PCDT SUS.'
    },
    'Prurigo nodular':{
      risk:'Prurido crônico e nódulos de coçadura; medir intensidade, sono, DLQI e investigar causas associadas de forma direcionada.',
      first:['Emolientes e redução do ciclo prurido-coçadura; corticoide tópico apropriado, inclusive oclusão em lesões selecionadas.','Corticoide intralesional em nódulos localizados persistentes e NB-UVB em doença disseminada quando disponível.'],
      escalate:['Para prurigo moderado/grave candidato a sistêmico, considerar dupilumabe ou nemolizumabe conforme elegibilidade e disponibilidade local.','Gabapentinoides, antidepressivos e imunossupressores convencionais são alternativas com evidência e perfil de risco diferentes, não equivalentes aos biológicos.'],
      monitor:['Contagem de nódulos, escala de prurido, sono, qualidade de vida, adesão e efeitos adversos.','Antes de biológico, revisar história de hipersensibilidade, gestação e vacinação; confirmar registro brasileiro/indicação.'],
      urgent:'Prurido com sintomas sistêmicos inexplicados, infecção cutânea importante ou sofrimento psíquico grave exige avaliação adicional.',
      reference:'BAD living guideline 2025 (publicada 2026) e Swiss recommendations 2026.'
    },
    'Pênfigo vulgar':{
      risk:'Confirmar por biópsia adequada para histopatologia e imunofluorescência direta; avaliar mucosas, extensão e atividade (PDAI).',
      first:['Em doença moderada/grave, rituximabe associado a corticoide sistêmico é estratégia de referência em protocolos especializados.','Cuidado de erosões, analgesia, proteção de pele/mucosa, nutrição e prevenção de infecção são essenciais.','Doença muito limitada requer avaliação especializada antes de decidir por terapêutica exclusivamente tópica.'],
      escalate:['Se refratário, considerar agentes poupadores (azatioprina/micofenolato) ou estratégias de centro de referência, após revisão de diagnóstico e riscos.','Rituximabe requer triagem HBV (HBsAg/anti-HBc), infecções, vacinas e protocolo de infusão; não liberar no carrinho como receita comum.'],
      monitor:['PDAI, novas bolhas/erosões, mucosa oral, adesão e efeitos de imunossupressão.'],
      urgent:'Erosões extensas, disfagia, desidratação, infecção ou descompensação sistêmica justificam avaliação hospitalar.',
      reference:'AWMF S2k 2026 (pênfigo/penfigoide); revisões de doenças bolhosas autoimunes 2026.'
    },
    'Penfigoide bolhoso':{
      risk:'Idoso com prurido e placas urticariformes mesmo SEM bolhas. Confirmar histologia e IF direta; considerar BP180/BP230.',
      first:['Corticoide tópico superpotente é tratamento central se aplicação e área forem viáveis; adequar extensão, fragilidade e apoio do cuidador.','Em doença moderada/grave, prednisona sistêmica ou estratégias poupadoras devem ser individualizadas, evitando exposição cumulativa elevada.'],
      escalate:['Doxiciclina, dapsona, metotrexato e biológicos como dupilumabe podem ter papel conforme doença, toxicidade e registro; não são intercambiáveis.','Rever diagnóstico e comorbidades em refratariedade; considerar centro de referência para imunobiológicos.'],
      monitor:['BPDAI ou área de bolhas, prurido, feridas, superinfecção, glicemia e efeitos de corticoide em idosos.','Dapsona necessita G6PD, hemograma e monitorização hematológica; confirmar bula de qualquer biológico usado no Brasil.'],
      urgent:'Bolhas disseminadas com desidratação, infecção, pouca autonomia ou comprometimento sistêmico exigem suporte hospitalar.',
      reference:'EADV 2022; AWMF S2k 2026; revisão terapêutica de doenças bolhosas 2026.'
    },
    'Dermatite periorificial':{
      risk:'Diferenciar acne, rosácea, eczema e infecção; investigar corticoides faciais (inclusive combinação cosmética), oclusão e irritantes.',
      first:['Suspender uso facial de corticoide desnecessário com plano para rebote e reduzir produtos irritantes/oclusivos.','Considerar metronidazol, ácido azelaico ou calcineurínico tópico em casos selecionados; veículo suave.'],
      escalate:['Doença extensa/persistente: doxiciclina ou outro tratamento sistêmico conforme idade, gravidez e contraindicações.'],
      monitor:['Reavaliar inflamação e tolerância em 4–8 semanas; explicar piora transitória após retirada do corticoide.'],
      urgent:'Pústulas disseminadas com febre ou acometimento ocular importante requerem reavaliação diagnóstica.',
      reference:'Diretrizes e revisões clínicas cadastradas na própria ficha.'
    },
    'Pitiríase rósea':{
      risk:'Morfologia e distribuição típicas; investigar sífilis secundária se palmas/plantas, mucosa, exposição sexual ou apresentação atípica.',
      first:['Em caso típico, observar; usar emoliente, anti-histamínico sintomático e corticoide tópico para prurido quando necessário.'],
      escalate:['Aciclovir oral pode ser discutido em casos muito extensos, intensamente sintomáticos ou precoces selecionados, revisando função renal.'],
      monitor:['Curso usual autolimitado; reavaliar se não evolui como esperado ou se gestante, com atenção ao diagnóstico diferencial.'],
      urgent:'Não rotular como pitiríase rósea uma erupção febril, mucosa grave ou suspeita de sífilis sem investigação.',
      reference:'Revisões e consenso cadastrados.'
    },
    'Pitiríase versicolor':{
      risk:'Máculas descamativas típicas; confirmar com KOH se dúvida, diferenciais incluem vitiligo e hipopigmentação pós-inflamatória.',
      first:['Antifúngico tópico ou sulfeto de selênio em doença limitada; orientar tempo de contato e prevenção de recidiva.'],
      escalate:['Doença muito extensa ou recorrente: considerar azólico oral em paciente elegível, checando função hepática, interações e gestação; evitar cetoconazol oral.'],
      monitor:['Explicar persistência de discromia após erradicação fúngica; avaliar descamação/atividade, não apenas cor da pele.'],
      urgent:'Alteração objetiva de sensibilidade ou neuropatia é sinal para investigar hanseníase e outros diagnósticos.',
      reference:'Revisões antifúngicas e guias clínicos cadastrados.'
    },
    'Verrugas virais cutâneas':{
      risk:'Verificar localização, idade, imunossupressão e sinais suspeitos; lesão pigmentada/ulcerada não deve ser destruída sem diagnóstico.',
      first:['Ácido salicílico e crioterapia são estratégias centrais para verrugas comuns/plantares; escolher pela dor, área e preferência.'],
      escalate:['Lesões resistentes: revisar diagnóstico, aderência e técnica; curetagem, imunoterapia ou outros procedimentos em casos selecionados.'],
      monitor:['Registrar lesões e resposta em sessões; explicar recidiva e evitar ferimentos desnecessários.'],
      urgent:'Lesão atípica, de crescimento progressivo, sangrante ou em imunossuprimido pode exigir biópsia.',
      reference:'Revisões dermatológicas e diretrizes de verrugas cadastradas.'
    },
    'Molusco contagioso':{
      risk:'Identificar lesões típicas, eczema associado, local genital e imunossupressão; considerar diferenciais se atípicas.',
      first:['Observação é apropriada em grande parte das crianças imunocompetentes, pela natureza autolimitada.','Quando houver indicação de tratar, individualizar curetagem, crioterapia ou agente tópico autorizado para idade/sítio e disponibilidade.'],
      escalate:['Lesões extensas/atípicas ou persistentes em imunossuprimido: ampliar investigação e discutir manejo especializado.'],
      monitor:['Tratar dermatite associada e reduzir manipulação; orientar que podem surgir novas lesões durante o curso.'],
      urgent:'Acometimento genital em criança deve receber avaliação cuidadosa, sem concluir a causa apenas pela localização.',
      reference:'Diretrizes pediátricas e dermatológicas cadastradas.'
    },
    'Herpes simples cutâneo/genital':{
      risk:'Diferenciar primeiro episódio, recorrência e supressão; quando necessário, confirmar por PCR de lesão. Verificar gestação, imunossupressão e localização ocular.',
      first:['Primeiro episódio de herpes genital: antiviral sistêmico (aciclovir/valaciclovir/famciclovir) conforme CDC, sem aguardar resultado se quadro clínico compatível.','Recorrência: iniciar tratamento episódico precocemente; orientar transmissão e proteção de parceiros.'],
      escalate:['Recorrências frequentes ou impacto: discutir supressão antiviral contínua com dose/tempo adequados.'],
      monitor:['Função renal antes de antivirais sistêmicos em pacientes de risco e ajuste de dose/intervalo; avaliar outras IST conforme exposição.'],
      urgent:'HSV ocular, disseminado, neonatal, encefalite, retenção urinária ou gestação com quadro genital próximo ao parto requerem fluxo especializado.',
      reference:'CDC STI Treatment Guidelines — genital herpes.'
    },
    'Impetigo e ectima':{
      risk:'Distinguir impetigo limitado de ectima, celulite, abscesso ou doença sistêmica; considerar cultura em surtos, recorrência e falha.',
      first:['Poucas lesões superficiais: tratamento tópico apropriado, como mupirocina, por curso limitado.','Lesões numerosas, surtos ou ectima: antibiótico oral dirigido a estreptococo/S. aureus conforme resistência local, idade e alergias.'],
      escalate:['Falha ou suspeita de MRSA: cultura e adequação conforme epidemiologia, sem repetir indiscriminadamente o mesmo antibiótico.'],
      monitor:['Resposta em poucos dias, higiene, prevenção de transmissão e dermatose de base.'],
      urgent:'Febre, progressão rápida, dor intensa ou celulite extensa: avaliar necessidade de serviço de maior complexidade.',
      reference:'CDC e guias de infecções cutâneas.'
    },
    'Sífilis cutânea (primária/secundária)':{
      risk:'Estadiar pela história, exame, testes treponêmicos/não treponêmicos e avaliação de sinais neuro-oculares/óticos.',
      first:['Sífilis primária/secundária em adulto: penicilina G benzatina 2,4 milhões de unidades IM, dose única, conforme protocolo e estágio.','Aconselhar parceiros, notificação/vigilância, avaliação de outras IST e documentação de título quantitativo não treponêmico basal.'],
      escalate:['Sífilis tardia ou de duração ignorada usa esquema diferente; neurossífilis, sífilis ocular/ótica demandam regime específico e encaminhamento.'],
      monitor:['Monitorar títulos não treponêmicos em intervalos indicados pelo protocolo e contexto de HIV/gestação.'],
      urgent:'Gestante alérgica à penicilina precisa abordagem específica com dessensibilização; sintomas neuro-oculares/óticos exigem avaliação urgente.',
      reference:'CDC STI Guidelines e protocolos oficiais de IST do Ministério da Saúde.'
    },
    'Líquen escleroso':{
      risk:'Identificar acometimento anogenital, prurido, fissuras, alterações anatômicas, dispareunia, sintomas urinários e lesões neoplásicas suspeitas.',
      first:['Corticosteroide tópico potente/ultrapotente em esquema de indução seguido de manutenção individualizada; emolientes e cuidados não irritantes.'],
      escalate:['Falha: confirmar aderência, técnica, infecção coexistente e diagnóstico; opções alternativas ou cirurgia em complicações anatômicas selecionadas.'],
      monitor:['Examinar alterações cicatriciais, qualidade de vida, resposta e necessidade de seguimento longitudinal.'],
      urgent:'Área indurada, úlcera persistente, lesão nodular ou hiperqueratose focal exige biópsia para descartar carcinoma.',
      reference:'S3/EuroGuiDerm 2026 e diretrizes de líquen escleroso.'
    },
    'Líquen plano cutâneo/oral':{
      risk:'Diferenciar formas cutânea, oral erosiva, ungueal e do couro cabeludo; investigar medicamentos e hepatite C quando clinicamente indicado.',
      first:['Forma cutânea localizada: corticosteroide tópico potente por curso adequado; oral erosiva: formulação tópica específica de mucosa.'],
      escalate:['Doença extensa, erosiva refratária, ungueal ou com perda cicatricial de cabelos pode requerer terapia sistêmica sob acompanhamento especializado.'],
      monitor:['Registrar mucosa, sintomas, impacto alimentar e potenciais alterações persistentes; cuidado com atrofia por corticoide.'],
      urgent:'Úlcera oral persistente, induração ou lesão assimétrica deve ser biopsiada para excluir neoplasia.',
      reference:'Diretrizes clínicas de líquen plano cadastradas.'
    },
    'Prurido crônico':{
      risk:'Distinguir pele primariamente inflamada de pele sem lesão primária; revisar fármacos, colestase, DRC, anemia, tireoide, neuropatia e causas hematológicas conforme contexto.',
      first:['Emoliente e tratamento de xerose; corrigir causa identificada. Evitar antipruriginoso indiscriminado sem hipótese mecanística.'],
      escalate:['Prurido neuropático/urêmico ou sistêmico pode exigir gabapentinoide ou medicação dirigida, com ajuste renal e avaliação de sedação/idosos.'],
      monitor:['Escalas de prurido, sono, evolução de lesões por coçadura e resultados da investigação etiológica.'],
      urgent:'Prurido associado a febre, perda ponderal importante, icterícia ou outras alterações sistêmicas requer investigação prioritária.',
      reference:'Revisões e consensos de prurido crônico.'
    },
    'Morfeia (esclerodermia localizada)':{
      risk:'Classificar limitada, linear, generalizada, profunda e mista; pesquisar progressão, limitação articular, assimetria e envolvimento craniofacial.',
      first:['Forma superficial limitada: corticosteroide tópico e/ou fototerapia conforme área/atividade.'],
      escalate:['Forma linear, profunda, generalizada ativa ou risco musculoesquelético: metotrexato sistêmico é primeira linha (off-label) geralmente com corticosteroide sistêmico como ponte inicial.','Refratária/intolerância: considerar micofenolato ou outra terapia especializada.'],
      monitor:['Medir atividade e dano (LoSCAT quando aplicável), amplitude de movimento, crescimento em crianças e efeitos da imunossupressão.'],
      urgent:'Morfeia linear craniofacial em criança, déficit neurológico/ocular ou progressão de deformidade necessita avaliação interdisciplinar.',
      reference:'S2k guideline 2024; revisão clínica 2026.'
    },
    'Pioderma gangrenoso':{
      risk:'Úlcera inflamatória dolorosa e progressiva; excluir infecção, vascular, neoplasia e vasculite. Procurar DII/artrite/doença hematológica.',
      first:['Curativo atraumático, analgesia, controle de doença associada; corticoide tópico/intralesional em doença realmente localizada.'],
      escalate:['Doença extensa/progressiva: prednisona sistêmica ou ciclosporina são pilares; anti-TNF e outras terapias em refratários/comorbidades selecionados.','Evitar desbridamento cirúrgico agressivo durante atividade por risco de patergia.'],
      monitor:['Dor, tamanho, borda inflamatória, cultura/biópsia conforme diferencial e segurança da imunossupressão.'],
      urgent:'Úlcera necrosante rapidamente progressiva com sinais de infecção, dor desproporcional ou sepse requer avaliação hospitalar — nunca assumir PG sem excluir emergência infecciosa.',
      reference:'STOP GAP trial, diretrizes especializadas e revisão PCDS 2026.'
    },
    'Eritema nodoso':{
      risk:'Paniculite nodular dolorosa, tipicamente pré-tibial; pesquisar infecção estreptocócica, tuberculose, sarcoidose, gravidez, DII e medicamentos por pistas.',
      first:['Tratar causa quando encontrada; repouso relativo, elevação, compressão tolerada e analgesia/AINE se não contraindicado.'],
      escalate:['Corticosteroide sistêmico só em casos selecionados depois de avaliar infecção relevante; não usar empiricamente diante de etiologia indefinida.'],
      monitor:['Regressão das lesões e manifestação da causa; adaptar investigação à epidemiologia e exposição.'],
      urgent:'Febre persistente, sintomas respiratórios importantes ou sinais sistêmicos direcionam a investigação.',
      reference:'Revisões de paniculites e diretrizes de doenças associadas.'
    },
    'Eritema multiforme':{
      risk:'Lesões em alvo típicas; distinguir de SJS/TEN, urticária, farmacodermia e doença bolhosa; avaliar mucosa e HSV precedente.',
      first:['Forma menor não complicada: sintomáticos e tratamento do gatilho; HSV pode motivar antiviral nas recorrências.'],
      escalate:['Episódios recorrentes HSV-associados podem se beneficiar de antiviral supressivo por período definido.'],
      monitor:['Documentar recorrência, lesões mucosas e tolerância medicamentosa.'],
      urgent:'Mucosite extensa, dor cutânea difusa, descolamento epidérmico ou estado geral alterado: excluir imediatamente SJS/TEN.',
      reference:'Consensos e revisões clínicas de eritema multiforme.'
    },
    'DRESS (reação medicamentosa com eosinofilia e sintomas sistêmicos)':{
      risk:'Identificar medicamento iniciado nas semanas anteriores; febre, exantema, linfadenopatia, eosinofilia/atipia e lesão hepática, renal, cardíaca ou pulmonar. Considerar RegiSCAR.',
      first:['Suspender imediatamente suspeitos de maior probabilidade, evitar reexposição e documentar alergia grave.','Estratificar comprometimento orgânico e considerar internação quando sistêmico/moderado-grave.'],
      escalate:['Mild confirmado: terapia tópica potente com seguimento estreito. Moderado/grave: corticosteroide sistêmico conforme consenso e comprometimento orgânico; reduzir gradualmente para evitar recidiva.','Refratariedade/órgãos graves exige equipe especializada e possibilidade de imunomodulação adicional.'],
      monitor:['Hemograma, transaminases, função renal e órgãos afetados; seguimento prolongado inclusive tireoide e autoimunidade pós-DRESS.'],
      urgent:'Qualquer miocardite, insuficiência hepática/renal, pneumonite ou deterioração sistêmica é emergência hospitalar.',
      reference:'Consenso internacional JAMA Dermatology 2024 (Delphi).'
    },
    'Síndrome de Stevens-Johnson / necrólise epidérmica tóxica':{
      risk:'Dor cutânea, mucosite, lesões purpúricas e descolamento; estimar superfície destacada; rastrear medicamento e aplicar SCORTEN/ALDEN em equipe de referência.',
      first:['Suspender medicamento culpado e organizar hospitalização imediata em centro experiente em SJS/TEN.','Cuidados de suporte, reposição, analgesia, proteção de pele e mucosas e avaliação oftalmológica precoce são fundamentais.'],
      escalate:['A escolha de ciclosporina, etanercepte, IVIG ou corticosteroide sistêmico depende do protocolo e especialista; não existe receita ambulatorial automática.'],
      monitor:['Complicações infecciosas, hídricas, oculares, respiratórias e sequelas de mucosas; seguimento multidisciplinar após alta.'],
      urgent:'Emergência potencialmente fatal — NÃO tratar em consultório ou atrasar transferência para discutir imunomodulador.',
      reference:'Diretrizes latino-americanas 2025; consensos internacionais de suporte.'
    },
    'Hiperidrose':{
      risk:'Focal primária versus sudorese generalizada/secundária; verificar início, febre, emagrecimento, drogas e impacto em qualidade de vida.',
      first:['Cloreto de alumínio antiperspirante é primeira linha para muitas formas focais; manejo por sítio.','Palmar/plantar: iontoforese; axilar: toxina botulínica ou glicopirrônio tópico conforme registro e acesso.'],
      escalate:['Oxibutinina oral é alternativa off-label selecionada, mas exige revisar glaucoma de ângulo fechado, retenção urinária e carga anticolinérgica. Cirurgia apenas refratários bem selecionados.'],
      monitor:['Hiperidrose Disease Severity Scale, irritação local, tolerabilidade, termorregulação e efeitos autonômicos.'],
      urgent:'Sudorese noturna generalizada nova com febre, perda de peso ou sinais de infecção/neoplasia exige investigação etiológica.',
      reference:'Revisões de hiperidrose e guias de anticolinérgicos tópicos.'
    },
    'Queloide e cicatriz hipertrófica':{
      risk:'Distinguir cicatriz confinada à lesão de queloide que ultrapassa limites; registrar local, prurido, dor e tensão.',
      first:['Silicone e controle de tensão, corticosteroide intralesional individualizado e/ou crioterapia conforme espessura e local.'],
      escalate:['5-fluorouracil intralesional, laser e combinação com cirurgia são opções especializadas; cirurgia isolada do queloide tem alta recidiva.'],
      monitor:['Altura/volume, cor, sintomas, atrofia e hipopigmentação; discutir múltiplas sessões e recorrência.'],
      urgent:'Cicatriz de crescimento atípico, ulcerada ou com mudança importante requer reconsiderar diagnóstico.',
      reference:'Consensos e revisões de cicatrizes patológicas.'
    },
    'Eritrasma e intertrigo infectado':{
      risk:'Diferenciar intertrigo irritativo, candidíase, dermatófito e eritrasma; Wood coral-avermelhado favorece Corynebacterium.',
      first:['Reduzir umidade, fricção e oclusão; eritrasma localizado pode responder a antibiótico tópico.','Suspeita de Candida ou dermatófito: confirmar quando dúvida e tratar especificamente, evitando misturas prolongadas desnecessárias.'],
      escalate:['Doença extensa/recorrente requer avaliar obesidade, diabetes, maceração e potencial antibiótico sistêmico conforme agente e gravidade.'],
      monitor:['Resposta da coloração/descamação, recorrência e controle dos fatores predisponentes.'],
      urgent:'Febre, dor progressiva, celulite extensa ou sinais de fasciíte não devem ser atribuídos a simples intertrigo.',
      reference:'Diretrizes clínicas e revisões de infecções em dobras.'
    }
  };
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const list=a=>'<ul>'+a.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
  const box=(heading,val)=>val?'<section class="tri-curation-card"><strong>'+esc(heading)+'</strong>'+(Array.isArray(val)?list(val):'<p>'+esc(val)+'</p>')+'</section>':'';
  const panel=document.querySelector('#detailPanel');
  window.DT_EXPANDED_TREATMENT_PROTOCOLS=T;
  if(!panel)return;
  function inject(){
    if(document.querySelector('.nav-btn.active')?.dataset.view==='prescriptions')return;
    const title=panel.querySelector('.detail-title')?.textContent?.trim(),data=T[title];if(!data)return;
    let existing=panel.querySelector('[data-expanded-protocol]');
    if(existing&&existing.dataset.expandedProtocol===title)return;
    existing?.remove();
    const treatment=[...panel.querySelectorAll('details.clinical-accordion')].find(x=>/Tratamento completo/i.test(x.querySelector('summary')?.textContent||''));if(!treatment)return;
    const sources=window.DT_EVIDENCE_REGISTRY?.diseases?.[title]||[];
    const d=document.createElement('details');d.className='clinical-accordion expanded-deep-protocol';d.dataset.expandedProtocol=title;
    d.innerHTML='<summary><span>Protocolo aprofundado · por cenários</span><span class="summary-right"><span class="accordion-badge">CLÍNICO</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"><p class="microcopy">Decisões estratificadas para consultório, sem emissão automática de doses. Fontes vinculadas à ficha; a revisão de bula e farmacologia deve ocorrer medicamento a medicamento.</p>'+box('Classificação e decisão inicial',data.risk)+box('Conduta inicial',data.first)+box('Escalonamento / alternativas',data.escalate)+box('Segurança e monitorização',data.monitor)+box('Sinais de urgência e encaminhamento',data.urgent)+'<p class="tc-evidence"><strong>Referência clínica:</strong> '+esc(data.reference)+' · '+sources.length+' fonte(s) cadastrada(s) para esta doença.</p></div>';
    treatment.insertAdjacentElement('afterend',d);
  }
  let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;inject()})};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();