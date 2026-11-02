(() => {
  const panel = document.querySelector('#detailPanel');
  const searchInput = document.querySelector('#searchInput');
  if (!panel || !searchInput) return;

  const esc = (v='') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const lower = (v='') => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

  const RX = {
    minoxidilTopico:'Minoxidil tópico', minoxidilOral:'Minoxidil oral em baixa dose', finasterida:'Finasterida', dutasterida:'Dutasterida',
    espironolactona:'Espironolactona', clobetasol:'Clobetasol', triancinolona:'Triancinolona intralesional', hidroxicloroquina:'Hidroxicloroquina',
    doxiciclina:'Doxiciclina', isotretinoina:'Isotretinoína', adapaleno:'Adapaleno tópico', peroxido:'Peróxido de benzoíla', tacrolimo:'Tacrolimo tópico',
    terbinafina:'Terbinafina', cetoconazol:'Cetoconazol', permetrina:'Permetrina', ivermectina:'Ivermectina'
  };

  function baseTier(text){
    const t=lower(text);
    if(/muito grave|grave|alta gravidade|alto risco|t2b|t3|t4|estadio iii|estadio iv|stage iii|stage iv/.test(t)) return 'high';
    if(/moderad|intermediaria|intermediario/.test(t)) return 'mid';
    return 'low';
  }
  function numFrom(text, re){ const m=String(text).match(re); return m ? Number(m[1].replace(',','.')) : null; }

  const disease = {
    'Acne vulgar': ({result}) => {
      const tier=baseTier(result);
      if(tier==='high') return plan('Acne grave / muito grave','Priorizar estratégia que reduza rapidamente inflamação e risco de cicatriz.',[
        'Isotretinoína é recomendada para acne grave ou refratária ao tratamento padrão; confirmar elegibilidade, prevenção gestacional quando aplicável e monitorização.',
        'Evitar associação concomitante de isotretinoína com tetraciclinas.',
        'Manter cuidado de barreira, fotoproteção e manejo ativo de cicatrizes apenas após controle da atividade.'
      ],[RX.isotretinoina],['Cicatriz ativa, nódulos extensos, sofrimento psicossocial ou falha terapêutica justificam escalonamento mesmo que o score isolado subestime o caso.'],'AAD acne guideline 2024');
      if(tier==='mid') return plan('Acne moderada','Combinar mecanismos tópicos e considerar terapia sistêmica por tempo limitado.',[
        'Base: retinoide tópico + peróxido de benzoíla; adicionar antibiótico sistêmico quando inflamação for extensa, sempre associado a BPO.',
        'Em mulheres adultas com padrão hormonal, espironolactona pode ser considerada após revisão de contraindicações e planejamento reprodutivo.',
        'Reavaliar resposta em cerca de 8–12 semanas e evitar prolongar antibiótico sistêmico sem necessidade.'
      ],[RX.adapaleno,RX.peroxido,RX.doxiciclina,RX.espironolactona],[],'AAD acne guideline 2024');
      return plan('Acne leve','Tratar predominantemente com terapia tópica combinada.',[
        'Retinoide tópico é base para comedões e prevenção de novas lesões.',
        'Peróxido de benzoíla pode ser associado para componente inflamatório e para reduzir seleção de resistência quando houver antibiótico.',
        'Ajustar frequência conforme tolerância e reforçar hidratante não comedogênico e fotoproteção.'
      ],[RX.adapaleno,RX.peroxido],[],'AAD acne guideline 2024');
    },
    'Alopecia areata': ({result}) => {
      const salt=numFrom(result,/SALT\s+([0-9.,]+)/i) ?? 0;
      if(salt>=50 || /grave/i.test(result)) return plan('Alopecia areata grave','A doença extensa costuma exigir estratégia sistêmica, com tratamento local como adjuvante.',[
        'Inibidor oral de JAK aprovado para alopecia areata grave pode ser considerado conforme idade, indicação local, comorbidades e triagem de segurança.',
        'Corticoide tópico/intralesional pode permanecer como terapia complementar em áreas selecionadas.',
        'Documentar SALT, sobrancelhas/cílios, unhas, impacto psicossocial e fotografias padronizadas para acompanhar resposta.'
      ],[RX.clobetasol,RX.triancinolona],['Antes de JAK/imunossupressão: revisar infecções, vacinação, eventos trombóticos, malignidade, hemograma e parâmetros específicos do agente.'],'European AA systemic consensus 2024; US severe AA consensus 2026');
      if(salt>=20 || /moderad/i.test(result)) return plan('Alopecia areata moderada','SALT ≥20 é um limiar frequentemente utilizado para considerar terapia sistêmica.',[
        'Avaliar velocidade de progressão, localização, sobrancelhas/cílios, unhas e impacto antes de decidir entre intensificação local e tratamento sistêmico.',
        'Corticoide intralesional/tópico de alta potência é útil em áreas tratáveis; doença progressiva pode justificar escalonamento sistêmico.'
      ],[RX.triancinolona,RX.clobetasol],[],'European AA systemic consensus 2024');
      return plan('Alopecia areata limitada','Priorizar tratamento local e documentação de atividade.',[
        'Corticoide intralesional é opção frequente para placas limitadas em adultos; corticoide tópico potente é alternativa/adjuvante.',
        'Minoxidil pode ser usado como adjuvante de crescimento, mas não substitui o controle da atividade autoimune.',
        'Reavaliar novas placas e repilação em 6–12 semanas.'
      ],[RX.triancinolona,RX.clobetasol,RX.minoxidilTopico],[],'Consensos contemporâneos de alopecia areata');
    },
    'Hidradenite supurativa': ({result}) => {
      const score=numFrom(result,/IHS4\s+([0-9.]+)/i) ?? 0;
      if(score>=11) return plan('HS grave','Tratar inflamação sistêmica e dano estrutural de forma combinada.',[
        'Biológicos com forte recomendação atual incluem adalimumabe, bimequizumabe, infliximabe e secuquinumabe, conforme disponibilidade/indicação.',
        'Túneis e cicatrizes exigem avaliação procedimental/cirúrgica; apenas intensificar antibiótico não corrige dano estrutural estabelecido.',
        'Avaliar dor, tabagismo, obesidade, doença inflamatória intestinal, artrite e impacto psicossocial.'
      ],[RX.doxiciclina],['Doença rapidamente progressiva, múltiplas áreas ou fenótipos destrutivos podem justificar escalonamento precoce.'],'AAD-HSF HS guideline 2026; European S2k 2024');
      if(score>=4) return plan('HS moderada','Escalonar além de tratamento exclusivamente tópico quando inflamação for persistente.',[
        'Tetraciclina oral é opção sistêmica frequente; clindamicina + rifampicina pode ser considerada em cenários selecionados.',
        'Biológico pode ser apropriado em doença moderada com progressão, múltiplas áreas, crises frequentes ou risco de cicatriz/túneis.',
        'Avaliar procedimento precoce para lesões recorrentes fixas.'
      ],[RX.doxiciclina],[],'European S2k HS guideline 2024; AAD-HSF 2026');
      return plan('HS leve','Foco em lesões iniciais, prevenção de progressão e fatores modificáveis.',[
        'Tratamentos tópicos e medidas locais podem ser suficientes em doença realmente limitada; antibiótico oral pode ser usado se componente inflamatório justificar.',
        'Não atrasar escalonamento se houver túneis, cicatriz progressiva ou crises frequentes apesar de IHS4 baixo.'
      ],[RX.doxiciclina],[],'AAD-HSF HS guideline 2026');
    },
    'Dermatite atópica': ({result}) => {
      const easi=numFrom(result,/EASI\s+([0-9.,]+)/i) ?? 0;
      if(easi>21) return plan('Dermatite atópica grave','Considerar tratamento sistêmico moderno quando terapia tópica otimizada for insuficiente.',[
        'Biológicos e inibidores de JAK sistêmicos possuem fortes recomendações em adultos, conforme perfil clínico e risco.',
        'Manter emolientes e terapia tópica dirigida às áreas residuais mesmo quando houver tratamento sistêmico.',
        'Evitar corticosteroide sistêmico crônico como estratégia de manutenção.'
      ],[RX.tacrolimo],['Infecção ativa, eritrodermia, distúrbio importante do sono ou rápida piora exigem reavaliação imediata.'],'AAD atopic dermatitis guideline + focused update 2025');
      if(easi>7) return plan('Dermatite atópica moderada','Otimizar tópicos e considerar fototerapia ou terapia sistêmica se controle continuar inadequado.',[
        'Corticosteroide tópico adequado à área/espessura e inibidor de calcineurina para áreas sensíveis ou manutenção.',
        'Wet-wrap e fototerapia podem ser considerados em cenários selecionados.',
        'Avaliar sono, prurido, infecção secundária e impacto de qualidade de vida antes de manter apenas terapia tópica.'
      ],[RX.tacrolimo],[],'AAD atopic dermatitis guideline 2025');
      return plan('Dermatite atópica leve','Priorizar reparo de barreira e anti-inflamatório tópico dirigido.',[
        'Emoliente regular, banho adequado e corticosteroide tópico durante surtos.',
        'Tacrolimo/pimecrolimo são úteis especialmente em face, pregas e estratégia poupadora de corticosteroide.'
      ],[RX.tacrolimo],[],'AAD atopic dermatitis topical guideline');
    },
    'Urticária crônica espontânea': ({result}) => {
      const uas=numFrom(result,/UAS7\s+([0-9.]+)/i) ?? 0;
      if(uas>=28) return plan('UCE grave / não controlada','Seguir escalonamento terapêutico por controle da doença.',[
        'Anti-histamínico H1 de segunda geração é a base; se insuficiente, a diretriz permite aumentar até quatro vezes a dose padrão.',
        'Persistindo não controlada após anti-histamínico em dose aumentada, omalizumabe é a próxima etapa recomendada.',
        'Ciclosporina é opção para refratariedade a anti-histamínico + omalizumabe em paciente selecionado.'
      ],[],['Evitar corticosteroide sistêmico crônico; curso curto pode ser considerado apenas em exacerbação aguda selecionada.'],'EAACI/GA²LEN/EDF/WAO guideline endorsed by AAD');
      if(uas>=7) return plan('UCE ativa','O objetivo é controle completo, não apenas melhora parcial.',[
        'Usar anti-histamínico H1 de segunda geração diariamente; se inadequado, aumentar gradualmente até quatro vezes a dose padrão conforme tolerância.',
        'Se persistir atividade significativa, preparar escalonamento para omalizumabe.'
      ],[],[],'EAACI/GA²LEN/EDF/WAO guideline');
      return plan(uas===0?'UCE sem atividade no período':'UCE bem controlada','Manter estratégia mínima eficaz e revisar possibilidade de redução após controle sustentado.',[
        'Confirmar se o baixo UAS7 ocorreu com tratamento atual; registrar dose e adesão para interpretar corretamente o score.'
      ],[],[],'EAACI/GA²LEN/EDF/WAO guideline');
    },
    'Psoríase': ({result,detail}) => {
      const advanced=/moderada-a-grave|candidata a abordagem avancada/i.test(lower(detail));
      if(advanced) return plan('Psoríase moderada-a-grave / alto impacto','Considerar fototerapia ou terapia sistêmica, mesmo quando BSA isoladamente não seja alta.',[
        'Áreas de alto impacto, falha tópica, sintomas e repercussão funcional podem justificar escalonamento.',
        'Opções sistêmicas incluem biológicos e não biológicos; a escolha depende de artrite psoriásica, comorbidades, gestação e risco infeccioso.',
        'Ciclosporina é opção para doença grave/recalcitrante ou algumas formas especiais; metotrexato e apremilaste são opções reconhecidas.'
      ],[RX.clobetasol],[],'AAD psoriasis guideline; critérios contemporâneos de alto impacto');
      return plan('Psoríase de baixa extensão / controlável com tópicos','Otimizar terapia tópica e reavaliar impacto além do BSA.',[
        'Corticosteroide tópico e análogo de vitamina D, isolados ou combinados, são pilares para doença localizada.',
        'Face, genitais, pregas, mãos/pés e unhas podem exigir estratégia diferente mesmo com BSA pequeno.'
      ],[RX.clobetasol],[],'AAD psoriasis guideline');
    },
    'Psoríase do couro cabeludo': ({result}) => {
      const pssi=numFrom(result,/PSSI\s+([0-9.]+)/i) ?? 0;
      if(pssi>=24) return plan('Psoríase do couro cabeludo com carga relevante','Avaliar gravidade global da psoríase e impacto, não apenas o PSSI.',[
        'Corticosteroide tópico em veículo adequado ao couro cabeludo, frequentemente associado a análogo de vitamina D.',
        'Se refratária, extensa ou acompanhada de doença moderada-grave em outras áreas, considerar fototerapia/sistêmico conforme avaliação global.'
      ],[RX.clobetasol],[],'AAD psoriasis guideline');
      return plan('Psoríase do couro cabeludo localizada','Priorizar tópicos em veículo cosmético aceitável e controle de escama.',[
        'Corticosteroide tópico é opção de alta eficácia; manutenção/intermitência pode reduzir recorrência conforme produto e tolerância.'
      ],[RX.clobetasol],[],'AAD psoriasis guideline');
    },
    'Onicomicose': ({result}) => {
      const score=numFrom(result,/OSI\s+([0-9.]+)/i) ?? 0;
      if(score>=16) return plan('Onicomicose grave','Confirmar etiologia antes de terapia sistêmica e considerar combinação em doença extensa.',[
        'Terbinafina oral é primeira linha para muitas onicomicoses dermatofíticas, salvo contraindicação ou espécie que demande alternativa.',
        'Acometimento de matriz, múltiplas unhas, dermatofitoma ou hiperqueratose importante reduzem chance de resposta apenas tópica.',
        'Acompanhar crescimento de unha saudável; cura clínica demora meses após erradicação micológica.'
      ],[RX.terbinafina],['Revisar hepatopatia, interações e confirmação micológica antes de tratamento sistêmico prolongado.'],'BAD fungal nail infection guideline 2026');
      if(score>=6) return plan('Onicomicose moderada','A terapia oral costuma oferecer maior chance de cura quando extensão é significativa.',[
        'Confirmar diagnóstico micológico; terbinafina é primeira linha frequente para dermatófitos.',
        'Combinação com tópico/desbridamento pode ser útil em doença persistente ou espessa.'
      ],[RX.terbinafina],[],'BAD fungal nail infection guideline 2026');
      return plan('Onicomicose leve','Terapia tópica pode ser considerada quando acometimento é distal/limitado e matriz está preservada.',[
        'Confirmar diagnóstico antes de meses de tratamento; discutir menor taxa de cura dos tópicos versus menor risco sistêmico.'
      ],[],[],'BAD fungal nail infection guideline 2026');
    },
    'Vitiligo': ({result}) => {
      const vida=numFrom(result,/VIDA\s+(-?[0-9.]+)/i) ?? 0;
      if(vida>=2) return plan('Vitiligo ativo','A prioridade inicial é interromper progressão e iniciar repigmentação.',[
        'Corticosteroide tópico ou inibidor de calcineurina são opções localizadas; NB-UVB/excimer pode ser associado conforme extensão.',
        'Ruxolitinibe 1,5% creme é terapia especificamente aprovada em alguns mercados para vitiligo não segmentar elegível.',
        'Doença rapidamente progressiva pode exigir estratégia sistêmica off-label selecionada por especialista.'
      ],[RX.tacrolimo],[],'Canadian vitiligo consensus 2025; review 2026');
      return plan('Vitiligo estável ou pouco ativo','Escolher terapia pela extensão, localização e objetivo de repigmentação.',[
        'Tacrolimo é útil em face/pregas; corticosteroide tópico pode ser usado em áreas adequadas.',
        'NB-UVB é opção para doença extensa; cirurgia pode ser considerada em doença localizada, estável e refratária.'
      ],[RX.tacrolimo],[],'Canadian vitiligo consensus 2025');
    },
    'Melasma': () => plan('Melasma — tratamento guiado por resposta, não por corte fixo de mMASI','Use o mMASI principalmente como linha de base e desfecho longitudinal.',[
      'Fotoproteção ampla e rigorosa é parte obrigatória do tratamento; protetor com pigmento/óxidos de ferro é útil contra luz visível em pacientes apropriados.',
      'Combinação tripla baseada em hidroquinona permanece referência de eficácia quando utilizada sob supervisão.',
      'Ácido azelaico/kojico e outros despigmentantes são alternativas; ácido tranexâmico oral pode ser considerado após avaliação de risco trombótico.',
      'Peelings/microagulhamento podem ser adjuvantes; lasers devem ficar preferencialmente para casos refratários devido a risco de recorrência/hiperpigmentação.'
    ],[],['Evitar transformar um mMASI alto isolado em indicação automática de procedimento; fototipo, componente vascular, recidiva e risco de PIH importam.'],'International Delphi melasma consensus 2026; Latin American consensus 2025'),
    'Alopecia androgenética masculina': ({result}) => {
      const t=lower(result); const advanced=/vi|vii/.test(t); const mid=/iv|\bv\b/.test(t);
      return advanced?plan('AGA masculina avançada','Preservar/estabilizar fios remanescentes e avaliar restauração cirúrgica após controle.',[
        'Minoxidil e inibidor de 5-alfa-redutase permanecem bases farmacológicas em candidatos adequados.',
        'Planejar transplante apenas com avaliação de área doadora, estabilidade, expectativa realista e estratégia de longo prazo.'
      ],[RX.minoxidilTopico,RX.minoxidilOral,RX.finasterida,RX.dutasterida],[],'Consensos de AGA'):
      mid?plan('AGA masculina moderada','Associar estímulo de crescimento e redução do estímulo androgênico quando apropriado.',[
        'Documentar densidade/miniaturização e resposta em 6–12 meses antes de concluir falha.'
      ],[RX.minoxidilTopico,RX.minoxidilOral,RX.finasterida,RX.dutasterida],[],'Consensos de AGA'):
      plan('AGA masculina inicial','Intervenção precoce visa preservar densidade existente.',[
        'Minoxidil e finasterida são opções fundamentais; discutir adesão prolongada, eventos adversos e expectativas.'
      ],[RX.minoxidilTopico,RX.finasterida],[],'Consensos de AGA');
    },
    'Alopecia androgenética feminina': ({result}) => {
      const grade=numFrom(result,/grau\s+([0-9]+)/i) ?? 1;
      if(grade>=4) return plan('AGA feminina avançada','Combinar tratamento de crescimento, controle hormonal quando indicado e documentação objetiva.',[
        'Minoxidil é base. Antiandrógeno pode ser considerado em pacientes selecionadas após revisar pressão, função renal, potássio e risco reprodutivo.',
        'Investigar hiperandrogenismo quando houver sinais clínicos e considerar transplante apenas após estabilização adequada.'
      ],[RX.minoxidilTopico,RX.minoxidilOral,RX.espironolactona],[],'Consensos de FPHL');
      return plan(grade>=2?'AGA feminina leve-moderada':'AGA feminina inicial','Iniciar tratamento cedo e acompanhar por fotografia/tricoscopia.',[
        'Minoxidil tópico ou oral em baixa dose, quando apropriado, é a base; espironolactona pode ser adicionada em fenótipo selecionado.'
      ],[RX.minoxidilTopico,RX.minoxidilOral,RX.espironolactona],[],'Consensos de FPHL');
    },
    'Carcinoma basocelular': ({result}) => /alto risco/i.test(result)?plan('CBC de alto risco','Priorizar tratamento cirúrgico com controle adequado de margens e considerar Mohs conforme local/limites/recorrência.',[
      'CBC de alto risco em área anatômica de alto risco, especialmente com limites mal definidos, favorece cirurgia micrográfica de Mohs ou excisão com estratégia de margem/reconstrução apropriada.',
      'Não usar terapias tópicas como substituto de cirurgia em CBC de alto risco.',
      'Doença localmente avançada/metastática exige discussão multidisciplinar e pode demandar terapia de via Hedgehog ou outras opções sistêmicas.'
    ],[],['Invasão perineural, recorrência, imunossupressão e histologia agressiva mudam conduta.'],'BAD BCC guideline'):
    plan('CBC de baixo risco','Excisão cirúrgica padrão é primeira linha na maioria dos casos.',[
      'Em CBC superficial/baixo risco selecionado que não seja candidato ou recuse cirurgia, podem ser discutidos imiquimode, 5-FU, crioterapia ou PDT conforme subtipo/local.'
    ],[],[],'BAD BCC guideline'),
    'Carcinoma espinocelular cutâneo': ({result}) => {
      const high=/T2b|T3|alto risco/i.test(result);
      return high?plan('CEC cutâneo de alto risco','Priorizar cirurgia com controle de margens e avaliação oncológica do risco regional.',[
        'Cirurgia permanece o tratamento mais eficaz. Mohs é frequentemente considerada em tumores de alto risco quando apropriado.',
        'Revisar invasão perineural, profundidade, diferenciação, imunossupressão e necessidade de imagem/avaliação nodal conforme risco.',
        'Doença avançada/metastática exige abordagem multidisciplinar e terapias sistêmicas específicas.'
      ],[],['Não substituir cirurgia por terapia destrutiva/tópica em tumor de alto risco.'],'AAD cSCC guideline'):
      plan('CEC cutâneo de menor risco','Cirurgia completa continua sendo a opção preferencial.',[
        'Técnicas não cirúrgicas podem ser consideradas apenas em situações selecionadas de baixo risco ou contraindicação cirúrgica, com menor expectativa de cura.'
      ],[],[],'AAD cSCC guideline');
    },
    'Melanoma cutâneo': ({result}) => {
      const bres=numFrom(result,/([0-9.,]+)\s*mm/i);
      const high=(bres!==null&&bres>=0.8)||/T1b|T2|T3|T4/i.test(result);
      return high?plan('Melanoma invasivo — completar estadiamento','A categoria T não substitui o estadiamento completo N/M.',[
        'Excisão ampla é a base do tratamento localizado, com margem definida pela espessura e localização.',
        'Biópsia de linfonodo sentinela deve ser considerada em tumor primário ≥0,8 mm com linfonodos clinicamente negativos, conforme contexto.',
        'Estágios II de maior risco e III/IV podem demandar terapia adjuvante, neoadjuvante ou sistêmica em centro oncológico.'
      ],[],['Não automatizar prescrição antineoplásica a partir do T isolado. Confirmar anatomopatológico, ulceração, N, M e discussão oncológica.'],'NCI Melanoma PDQ / AJCC 8'):
      plan('Melanoma muito fino / categoria T inicial','Tratamento principal é excisão adequada após microestadiamento completo.',[
        'Confirmar Breslow, ulceração e margens; considerar indicação de linfonodo sentinela quando limiar/risco justificar.'
      ],[],[],'NCI Melanoma PDQ / AJCC 8');
    }
  };

  const named = {
    'Eflúvio telógeno': {
      low:['Identificar e remover gatilho quando possível; educação sobre ciclo capilar e observação são centrais.','Corrigir deficiência apenas se documentada ou clinicamente sustentada.'],
      mid:['Rever gatilhos persistentes, dieta, perda ponderal, ferro/tireoide e medicamentos; excluir AGA concomitante.','Considerar minoxidil se houver alopecia coexistente ou recuperação inadequada em paciente selecionado.'],
      high:['Reavaliar diagnóstico se queda intensa/prolongada, sinais inflamatórios ou rarefação progressiva; considerar biópsia/tricoscopia dirigida.'] , rx:[RX.minoxidilTopico]
    },
    'Alopecia fibrosante frontal': {low:['Controlar inflamação local e documentar linha capilar/sobrancelhas.'],mid:['Associar terapia sistêmica quando houver atividade/progressão objetiva; considerar anti-inflamatório e/ou antiandrogênico conforme fenótipo.'],high:['Doença rapidamente progressiva exige escalonamento sistêmico e seguimento curto; transplante somente após estabilidade sustentada.'],rx:[RX.clobetasol,RX.triancinolona,RX.hidroxicloroquina,RX.dutasterida]},
    'Líquen plano pilar': {low:['Corticoide tópico potente/intralesional para focos ativos e seguimento com sintomas/tricoscopia.'],mid:['Considerar terapia sistêmica poupadora em progressão; hidroxicloroquina é opção frequente em pacientes selecionados.'],high:['Objetivo é interromper perda cicatricial permanente; doença extensa/progressiva requer terapia sistêmica e monitorização próxima.'],rx:[RX.clobetasol,RX.triancinolona,RX.hidroxicloroquina]},
    'Alopecia por tração': {low:['Eliminar tração imediatamente; fase não cicatricial pode repilar.'],mid:['Tratar inflamação e considerar minoxidil em áreas ainda não cicatriciais.'],high:['Perda de óstios/cicatriz sugere dano permanente; discutir opções reconstrutivas apenas após estabilidade.'],rx:[RX.minoxidilTopico,RX.clobetasol]},
    'Tricotilomania': {low:['Abordagem não confrontativa e terapia comportamental são centrais.'],mid:['Integrar saúde mental e avaliar comorbidades; proteger couro cabeludo e evitar tratamentos agressivos desnecessários.'],high:['Se tricofagia, risco gastrointestinal ou autoagressão importante, ampliar avaliação clínica/psiquiátrica.'],rx:[]},
    'Foliculite decalvante': {low:['Controlar inflamação/pústulas cedo e colher cultura quando indicado.'],mid:['Antibiótico sistêmico e estratégias anti-inflamatórias são frequentemente necessários.'],high:['Progressão cicatricial extensa exige regime sistêmico e seguimento próximo; reavaliar diagnóstico diferencial neutrofílico.'],rx:[RX.doxiciclina]},
    'Celulite dissecante do couro cabeludo': {low:['Controlar inflamação precoce e evitar manipulação.'],mid:['Antibiótico sistêmico e/ou retinoide sistêmico podem ser necessários em doença persistente.'],high:['Abscessos/túneis extensos podem exigir combinação sistêmica e procedimentos cirúrgicos.'],rx:[RX.doxiciclina,RX.isotretinoina]},
    'Tinea capitis': {low:['Tratamento deve ser sistêmico; tópico isolado não erradica infecção do folículo.'],mid:['Confirmar agente quando possível e tratar contatos/fômites conforme contexto.'],high:['Kerion, dor importante, secreção ou risco de cicatriz exigem tratamento sistêmico imediato e avaliação de complicações.'],rx:[RX.terbinafina]},
    'Dermatite seborreica': {low:['Antifúngico tópico e shampoo medicamentoso como base.'],mid:['Associar curto curso anti-inflamatório tópico conforme área e gravidade.'],high:['Doença refratária/extensa exige revisar diagnóstico, imunossupressão e terapias sistêmicas selecionadas.'],rx:[RX.cetoconazol]},
    'Rosácea': {low:['Fotoproteção, gatilhos e terapia tópica direcionada ao fenótipo.'],mid:['Doxiciclina em dose anti-inflamatória/sistêmica pode ser considerada para pápulo-pústulas persistentes.'],high:['Fimatosa, ocular importante ou refratária requer escalonamento e possível procedimento; avaliar oftalmologia quando ocular.'],rx:[RX.doxiciclina]},
    'Dermatite de contato': {low:['Identificar e retirar agente; corticosteroide tópico conforme localização/intensidade.'],mid:['Patch test se alergia suspeita/persistente e controle ambiental estruturado.'],high:['Dermatite extensa, bolhosa, facial importante ou ocupacional grave exige investigação e tratamento intensivo.'],rx:[]},
    'Escabiose': {low:['Permetrina tópica é primeira linha frequente; tratar contatos simultaneamente e orientar roupas/ambiente.'],mid:['Ivermectina oral pode ser considerada conforme contexto e contraindicações; repetir esquema conforme protocolo.'],high:['Escabiose crostosa requer combinação sistêmica + tópica e medidas rigorosas de controle de transmissão.'],rx:[RX.permetrina,RX.ivermectina]},
    'Herpes-zóster': {low:['Antiviral sistêmico precoce e analgesia; avaliar vacinação futura conforme elegibilidade.'],mid:['Face/olho/ouvido, imunossupressão ou dor intensa exigem avaliação mais urgente.'],high:['Disseminação, acometimento neurológico/ocular ou imunossupressão importante pode exigir internação e antiviral IV.'],rx:[]},
    'Tinea corporis/cruris': {low:['Antifúngico tópico em doença localizada e evitar corticosteroide isolado.'],mid:['Doença extensa, recorrente ou folicular pode exigir antifúngico sistêmico e confirmação micológica.'],high:['Imunossupressão, falha terapêutica ou suspeita de resistência exige cultura/espécie e estratégia sistêmica.'],rx:[RX.terbinafina]},
    'Paroníquia': {low:['Medidas locais e remover irritante/trauma; diferenciar aguda infecciosa de crônica irritativa.'],mid:['Abscesso exige drenagem; antibiótico apenas quando celulite/risco justificar.'],high:['Progressão proximal, imunossupressão ou dor desproporcional exige reavaliação urgente.'],rx:[]},
    'Ceratose actínica': {low:['Crioterapia ou terapia de campo conforme número/localização.'],mid:['Campo de cancerização favorece terapia de campo e fotoproteção intensiva.'],high:['Lesão espessa, dolorosa, indurada, ulcerada ou rapidamente crescente deve ser biopsiada para excluir CEC.'],rx:[]}
  };

  function plan(label,summary,actions,rx=[],warnings=[],evidence=''){
    return {label,summary,actions,rx,warnings,evidence};
  }

  function genericPlan(name,tier){
    const cfg=named[name];
    if(!cfg){
      const actions=tier==='high'?['Reavaliar diagnóstico, extensão, complicações e necessidade de terapia sistêmica/encaminhamento especializado.']:tier==='mid'?['Intensificar tratamento específico da doença e encurtar intervalo de reavaliação.']:['Manter manejo de primeira linha e documentar resposta.'];
      return plan(tier==='high'?'Alta gravidade clínica sugerida':tier==='mid'?'Gravidade intermediária sugerida':'Baixa gravidade clínica sugerida','Classificação clínica assistida; confirmar com critérios específicos da doença.',actions,[] ,[],'Classificação assistida — não substitui escala validada');
    }
    const actions=cfg[tier]||cfg.low; return plan(tier==='high'?'Conduta para maior gravidade':tier==='mid'?'Conduta para gravidade intermediária':'Conduta inicial / baixa gravidade','Plano ajustado ao nível clínico selecionado.',actions,cfg.rx||[],[],'Síntese clínica baseada em diretrizes e revisões da condição');
  }

  function currentContext(){
    const title=panel.querySelector('.detail-title')?.textContent?.trim();
    const sev=panel.querySelector('.severity-root');
    const strong=sev?.querySelector('[data-sev-result] strong')?.textContent?.trim()||'';
    const p=sev?.querySelector('[data-sev-result] p')?.textContent?.trim()||'';
    return {title,sev,result:strong,detail:p};
  }

  function getPlan(ctx){
    if(!ctx.title) return null;
    if(disease[ctx.title]) return disease[ctx.title](ctx);
    return genericPlan(ctx.title,baseTier(`${ctx.result} ${ctx.detail}`));
  }

  function rxButtons(items=[]){
    if(!items.length) return '<p class="tx-muted">Sem receita automática nesta etapa. A conduta depende de seleção clínica adicional.</p>';
    return `<div class="tx-rx-list">${items.map(x=>`<button class="tx-rx" type="button" data-rx-search="${esc(x)}"><span>${esc(x)}</span><small>Abrir no Guia de prescrição</small></button>`).join('')}</div>`;
  }

  function renderPlan(){
    const ctx=currentContext();
    if(!ctx.sev || !ctx.title) return;
    let details=panel.querySelector('details[data-treatment-engine]');
    const sevDetails=ctx.sev.closest('details.clinical-accordion');
    if(!details){
      details=document.createElement('details'); details.className='clinical-accordion treatment-accordion'; details.dataset.treatmentEngine='1';
      details.innerHTML='<summary><span>Conduta orientada pela gravidade</span><span class="summary-right"><span class="accordion-badge">DINÂMICO</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"><div class="treatment-root"></div></div>';
      sevDetails.insertAdjacentElement('afterend',details);
    }
    const root=details.querySelector('.treatment-root');
    if(ctx.sev.dataset.touched!=='1'){
      root.innerHTML='<div class="tx-await"><strong>Preencha a avaliação acima.</strong><p>Assim que você marcar as características do paciente, o tratamento e as opções de prescrição serão ajustados automaticamente.</p></div>';
      return;
    }
    const p=getPlan(ctx); if(!p) return;
    root.innerHTML=`
      <div class="tx-head"><span class="tx-kicker">Direção terapêutica</span><h4>${esc(p.label)}</h4><p>${esc(p.summary)}</p></div>
      <div class="tx-block"><span class="tx-label">Conduta sugerida</span><ol>${p.actions.map(a=>`<li>${esc(a)}</li>`).join('')}</ol></div>
      <div class="tx-block"><span class="tx-label">Prescrição / guia relacionado</span>${rxButtons(p.rx)}</div>
      ${p.warnings?.length?`<div class="tx-warning"><span class="tx-label">Atenção</span><ul>${p.warnings.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div>`:''}
      <div class="tx-actions"><button type="button" class="primary tx-use">Usar esta conduta no paciente</button></div>
      <p class="tx-source">Base clínica: ${esc(p.evidence)}. O resultado do score orienta, mas não substitui idade, gestação, comorbidades, alergias, interações, preferência do paciente e exame clínico completo.</p>`;
    root.querySelectorAll('[data-rx-search]').forEach(btn=>btn.addEventListener('click',()=>openRx(btn.dataset.rxSearch)));
    root.querySelector('.tx-use')?.addEventListener('click',()=>useInPatient(ctx,p));
  }

  function openRx(term){
    const nav=document.querySelector('.nav-btn[data-view="prescriptions"]');
    nav?.click();
    requestAnimationFrame(()=>{
      searchInput.value=term;
      searchInput.dispatchEvent(new Event('input',{bubbles:true}));
      const first=document.querySelector('[data-rx-id]');
      if(first) first.click();
    });
  }

  function useInPatient(ctx,p){
    document.querySelector('#aiButton')?.click();
    requestAnimationFrame(()=>{
      const ta=document.querySelector('#patientContext'); if(!ta) return;
      const block=[`AVALIAÇÃO: ${ctx.title}`,`GRAVIDADE/CLASSIFICAÇÃO: ${ctx.result}`,ctx.detail?`INTERPRETAÇÃO: ${ctx.detail}`:'',`DIREÇÃO TERAPÊUTICA: ${p.label}`,...p.actions.map(x=>`• ${x}`),p.rx?.length?`GUIA DE PRESCRIÇÃO: ${p.rx.join('; ')}`:''].filter(Boolean).join('\n');
      ta.value=(ta.value?`${ta.value}\n\n`:'')+block;
      ta.focus();
    });
  }

  panel.addEventListener('input',e=>{const sev=e.target.closest('.severity-root');if(sev){sev.dataset.touched='1';requestAnimationFrame(renderPlan);}});
  panel.addEventListener('change',e=>{const sev=e.target.closest('.severity-root');if(sev){sev.dataset.touched='1';requestAnimationFrame(renderPlan);}});

  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;renderPlan();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true,characterData:true});
  queue();
})();