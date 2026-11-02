(() => {
  const panel=document.querySelector('#detailPanel');
  const search=document.querySelector('#searchInput');
  if(!panel||!search)return;
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const N=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const med=(name,dose,when,status='Uso consolidado',monitor='Individualizar conforme perfil clínico.',note='')=>({name,dose,when,status,monitor,note});
  const proc=(name,when,status='Adjuvante',note='')=>({name,when,status,note});

  const C={
    'Alopecia androgenética masculina':{
      goal:'Reduzir miniaturização, estabilizar progressão e aumentar densidade/calibre; tratamento é de manutenção contínua.',
      first:['Minoxidil tópico 5% e/ou inibidor de 5-alfa-redutase constituem o núcleo terapêutico.','Combinação costuma ser preferida em doença moderada, progressiva ou com resposta parcial à monoterapia.'],
      topical:[
        med('Minoxidil tópico 5%','Solução: 1 mL 2x/dia; espuma: cerca de 1/2 tampa 2x/dia.','Primeira linha; útil em vértex e região frontal.','Primeira linha','Avaliar irritação, hipertricose facial e adesão. Resposta costuma exigir ≥4–6 meses.'),
        med('Finasterida tópica','Formulações estudadas em torno de 0,1–0,25%, 1–2x/dia.','Alternativa quando se deseja reduzir exposição sistêmica.','Off-label / evidência crescente','Ainda pode haver absorção sistêmica; revisar fertilidade, efeitos sexuais e risco reprodutivo em contato com gestantes.'),
        med('Cetoconazol xampu 2%','2–3x/semana quando houver dermatite seborreica/oleosidade.','Adjuvante para controle de inflamação/descamação coexistente.','Adjuvante','Não substitui minoxidil ou bloqueio androgênico.')
      ],
      systemic:[
        med('Minoxidil oral em baixa dose','Início usual 1,25–2,5 mg/dia; máximo consensual 5 mg/dia em homens adultos.','Baixa adesão/intolerância ao tópico, doença extensa ou preferência por via oral.','Off-label com consenso','Checar PA, edema, taquicardia, cardiopatia/pericárdio e interações anti-hipertensivas.'),
        med('Finasterida','1 mg VO 1x/dia.','Primeira linha oral para AGA masculina; melhor para estabilização e ganho progressivo.','Aprovada para AGA masculina em vários mercados','Discutir efeitos sexuais, fertilidade, humor e redução do PSA; ajustar interpretação do PSA.'),
        med('Dutasterida','0,5 mg VO 1x/dia.','Resposta insuficiente à finasterida, progressão importante ou necessidade de maior supressão de DHT.','Off-label para AGA em muitos países','Maior potência e meia-vida longa; revisar efeitos sexuais, fertilidade e PSA.'),
      ],
      procedures:[
        proc('PRP','Pode ser combinado a terapia farmacológica, especialmente quando se busca ganho adicional de densidade.','Recomendado em consenso','Protocolos variam; usar protocolo validado da clínica e registrar fotos/tricoscopia.'),
        proc('Microagulhamento','Adjuvante em combinação com minoxidil ou outros esquemas.','Recomendado em consenso','Profundidade e intervalo variam entre estudos; evitar padronização fictícia.'),
        proc('LLLT / laser de baixa intensidade','Adjuvante quando paciente prefere dispositivo domiciliar ou deseja combinação não farmacológica.','Quase consenso','Efeito geralmente modesto; seguir protocolo do dispositivo.'),
        proc('Mesoterapia / dutasterida intradérmica','Pode ser considerada em casos selecionados.','Evidência limitada / quase consenso','Dutasterida intralesional tem evidência inferior à via oral em comparação indireta; minoxidil injetável não é recomendado pelo consenso canadense.'),
        proc('Transplante capilar FUE/FUT','AGA estável, boa área doadora e expectativa realista.','Tratamento restaurador','Manter terapia clínica para preservar fios nativos; planejar desenho e reserva doadora a longo prazo.')
      ],
      avoid:['Suplementos sem deficiência documentada não substituem terapias efetivas.','Carboxiterapia, fios/implantes de microfilamento, cafeína tópica e múltiplos “growth factors” têm evidência insuficiente ou não foram recomendados em consenso recente.'],
      evidence:'Consenso canadense de AGA 2025; consenso internacional de minoxidil oral 2025; consenso de transplante/minoxidil 2026; revisões sistemáticas 2024–2026.'
    },
    'Alopecia androgenética feminina':{
      goal:'Estabilizar miniaturização e recuperar densidade preservando segurança reprodutiva e cardiovascular.',
      first:['Minoxidil é a terapia com melhor base de evidência.','Antiandrógenos entram sobretudo em hiperandrogenismo, progressão apesar de minoxidil ou padrão moderado-grave.'],
      topical:[
        med('Minoxidil tópico','5% espuma 1x/dia ou 2% solução 2x/dia.','Primeira linha na maioria das mulheres.','Primeira linha','Avaliar irritação, hipertricose e shedding inicial; resposta em 6–12 meses.'),
        med('Finasterida tópica','0,1–0,25% em formulações estudadas.','Alternativa selecionada quando se deseja menor exposição sistêmica.','Off-label','Evitar em gestação/tentativa; absorção sistêmica não é zero.')
      ],
      systemic:[
        med('Minoxidil oral em baixa dose','Início consensual 0,625–1,25 mg/dia; máximo consensual 2,5 mg/dia em mulheres adultas no contexto de AGA/transplante.','Intolerância/baixa adesão ao tópico ou necessidade de combinação.','Off-label com consenso','Checar PA, edema, taquicardia, hipertricose; evitar gestação/lactação.'),
        med('Espironolactona','25–200 mg/dia; prática comum iniciar 25–50 mg e titular.','Mais útil quando há acne, hirsutismo, hiperandrogenismo ou progressão apesar de minoxidil.','Off-label / uso consolidado','Evitar gestação; revisar função renal, potássio, PA e fármacos que elevem K.'),
        med('Finasterida oral','1–5 mg/dia em séries/estudos; maior uso em pós-menopausa.','Casos selecionados, especialmente pós-menopausa.','Off-label / evidência limitada em mulheres','Contraindicada na gestação; exigir planejamento reprodutivo rigoroso quando aplicável.'),
        med('Dutasterida','0,5 mg/dia em casos selecionados.','Doença refratária, geralmente pós-menopausa.','Off-label','Contraindicada na gestação; meia-vida longa.'),
        med('Bicalutamida','Dose variável em estudos; não há faixa universal padronizada para AGA.','Casos selecionados de hiperandrogenismo/refratariedade sob especialista.','Evidência emergente','Monitorização hepática e contracepção são essenciais; não é primeira linha.')
      ],
      procedures:[
        proc('PRP','Adjuvante quando se deseja ganho adicional de densidade.','Recomendado em consenso','Protocolos heterogêneos; padronizar internamente.'),
        proc('Microagulhamento','Adjuvante associado a minoxidil.','Recomendado em consenso','Evitar uso isolado como substituto de terapia médica.'),
        proc('LLLT','Adjuvante não farmacológico.','Quase consenso','Benefício modesto; adesão ao protocolo é crítica.'),
        proc('Mesoterapia / dutasterida intradérmica','Pode ser considerada em paciente selecionada.','Evidência limitada','Exigir contracepção quando houver 5ARI e consentimento sobre off-label.'),
        proc('Transplante capilar','Melhor para padrão não difuso, área doadora adequada e doença estabilizada.','Tratamento restaurador','Avaliar miniaturização difusa da área doadora antes de indicar.')
      ],
      avoid:['Evitar antiandrógenos/5ARI em gestação ou tentativa de gestação.','Suplementação indiscriminada sem deficiência não é tratamento de AGA.'],
      evidence:'Consenso canadense de AGA 2025; revisão FPHL 2025–2026; consensos de minoxidil oral 2025–2026.'
    },
    'Alopecia areata':{
      goal:'Controlar atividade autoimune e recuperar cobertura capilar, escolhendo terapia conforme SALT, áreas especiais, duração e impacto.',
      first:['Doença limitada: corticosteroide intralesional/tópico é base.','Doença extensa/grave: JAK oral tornou-se terapia central quando elegível.'],
      topical:[med('Clobetasol tópico','Alta potência em ciclos conforme área e idade.','Placas limitadas ou adjuvante.','Uso consolidado','Monitorar atrofia/telangiectasias.'),med('Minoxidil tópico','2–5% 1–2x/dia.','Adjuvante para repilação; não controla autoimunidade.','Adjuvante','Útil em combinação.')],
      systemic:[med('Baricitinibe','2–4 mg 1x/dia em adultos conforme indicação/rotulagem local.','AA grave em adulto elegível.','Aprovado em diversos mercados','Rastrear infecção/TB/hepatites, hemograma, lipídios e risco trombótico conforme bula.'),med('Ritlecitinibe','50 mg 1x/dia.','AA grave; aprovado a partir de 12 anos em alguns mercados.','Aprovado em diversos mercados','Monitorização e contraindicações conforme bula local.'),med('Deuruxolitinibe','8 mg 2x/dia em adultos nos mercados em que aprovado.','AA grave em adulto.','Aprovação dependente do país','Checar disponibilidade/registro local.'),med('Corticosteroide sistêmico','Esquemas variáveis e geralmente de curto prazo.','Progressão rápida/ponte terapêutica selecionada.','Off-label','Recidiva após suspensão é frequente.')],
      procedures:[proc('Triancinolona intralesional','Placas limitadas, sobrancelhas selecionadas.','Primeira linha local','Concentração/volume dependem da área; evitar excesso para reduzir atrofia.'),proc('Imunoterapia de contato','Doença extensa em centros experientes.','Opção especializada'),proc('PRP / microagulhamento','Adjuvantes com evidência inferior às terapias imunomoduladoras.','Evidência limitada')],
      avoid:['Não atrasar terapia sistêmica efetiva em doença grave por insistência prolongada em procedimentos de baixa evidência.'],evidence:'Consensos europeu 2024, espanhol 2026 e norte-americano 2026.'
    },
    'Alopecia fibrosante frontal':{
      goal:'Parar progressão; repilação em área cicatricial já estabelecida é improvável.',
      first:['Combinar controle anti-inflamatório local com terapia sistêmica quando progressiva.','5ARI têm papel relevante mesmo sem AGA coexistente.'],
      topical:[med('Corticoide tópico potente','Uso intermitente/cíclico.','Sinais inflamatórios perifoliculares.','Uso consolidado'),med('Tacrolimo/pimecrolimo','1–2x/dia conforme área.','Face/linha frontal como poupador de corticoide.','Off-label')],
      systemic:[med('Finasterida','2,5 mg/dia foi a dose com maior consenso no SOFFIA 2024.','Progressão clínica, especialmente com componente androgenético.','Off-label','Evitar gestação.'),med('Dutasterida','0,5 mg/dia.','Progressão ou resposta insuficiente.','Off-label','Evitar gestação; meia-vida longa.'),med('Hidroxicloroquina','200–400 mg/dia conforme peso/risco ocular.','Doença inflamatória ativa/progressiva.','Off-label','Usar dose ≤5 mg/kg/dia de peso real como referência de segurança ocular; rastreio oftalmológico.'),med('Isotretinoína','Em consenso SOFFIA, 0,25 mg/kg/dia foi opção para fenótipos selecionados.','Pápulas faciais/seborreia/atividade selecionada.','Off-label','Teratogenicidade e monitorização padrão.')],
      procedures:[proc('Triancinolona intralesional','Linha frontal/sobrancelhas ativas.','Adjuvante'),proc('Transplante capilar','Somente após estabilidade sustentada e consentimento sobre risco de reativação.','Restaurador')],
      avoid:['Procedimentos cosméticos não devem anteceder controle da atividade.'],evidence:'SOFFIA 2024 e revisões contemporâneas de FFA.'
    },
    'Líquen plano pilar':{
      goal:'Suprimir inflamação e impedir expansão da alopecia cicatricial.',
      first:['Corticosteroide tópico/intralesional para atividade localizada.','Doença progressiva costuma exigir agente sistêmico.'],
      topical:[med('Clobetasol tópico','0,05% em ciclos.','Bordas ativas/localizadas.','Uso consolidado'),med('Tacrolimo tópico','0,1% 1–2x/dia.','Poupador de corticoide em áreas selecionadas.','Off-label')],
      systemic:[med('Hidroxicloroquina','200–400 mg/dia, respeitando ≤5 mg/kg/dia de peso real.','Atividade persistente/progressiva.','Uso frequente off-label','Oftalmologia e revisão de QT/interações.'),med('Doxiciclina','100 mg 1–2x/dia em cenários inflamatórios selecionados.','Quando se busca efeito anti-inflamatório.','Off-label'),med('Metotrexato / ciclosporina / micofenolato','Esquemas conforme agente e perfil.','Refratariedade/progressão rápida.','Especializado','Exigem monitorização laboratorial específica.')],
      procedures:[proc('Triancinolona intralesional','Bordas ativas e focais.','Adjuvante')],avoid:['Não prometer repilação em áreas com perda definitiva de óstios.'],evidence:'Consensos/revisões de alopecias cicatriciais.'
    },
    'Eflúvio telógeno':{
      goal:'Identificar gatilho, corrigir causa e evitar tratamentos desnecessários.',
      first:['Remover/corrigir gatilho quando possível e explicar curso temporal.','Tratar AGA coexistente se houver miniaturização.'],
      topical:[med('Minoxidil tópico','2–5% conforme contexto.','Pode ser útil em eflúvio crônico ou AGA coexistente.','Adjuvante')],
      systemic:[med('Minoxidil oral em baixa dose','Dose individualizada, frequentemente 0,625–2,5 mg/dia em mulheres e 1,25–5 mg/dia em homens conforme perfil.','Casos crônicos selecionados/refratários.','Off-label','Avaliação cardiovascular e reprodutiva.')],
      procedures:[],avoid:['Ferro, zinco, vitamina D ou outros suplementos só quando deficiência/indicação clínica estiver presente.'],evidence:'Revisões contemporâneas de eflúvio telógeno e consenso de minoxidil oral.'
    },
    'Acne vulgar':{
      goal:'Controlar comedões/inflamação, prevenir cicatriz e reduzir recorrência.',
      first:['Combinar mecanismos tópicos.','Evitar antibiótico oral isolado; associar peróxido de benzoíla.'],
      topical:[med('Adapaleno','0,1–0,3% à noite.','Comedonal/inflamatória; manutenção.','Recomendado AAD'),med('Tretinoína','0,025–0,1% à noite conforme tolerância.','Comedonal e manutenção.','Recomendado'),med('Peróxido de benzoíla','2,5–5% 1x/dia, ajustando tolerância.','Inflamatória e sempre que usar antibiótico.','Recomendado AAD'),med('Ácido azelaico','15–20% 1–2x/dia.','Acne + hiperpigmentação; opção útil na gestação conforme avaliação.','Recomendado'),med('Clascoterona','1% 2x/dia.','Componente hormonal, ambos os sexos conforme disponibilidade.','Recomendação condicional AAD')],
      systemic:[med('Doxiciclina','100 mg/dia ou 100 mg 2x/dia conforme gravidade; limitar duração.','Acne inflamatória moderada-grave.','Recomendado AAD','Associar BPO/retinoide; evitar com isotretinoína.'),med('Espironolactona','50–200 mg/dia, titulada.','Mulher adulta com acne hormonal.','Recomendado AAD','Revisar gestação, K, função renal e PA.'),med('Isotretinoína','Em geral 0,5 mg/kg/dia inicialmente, ajustando ~0,5–1 mg/kg/dia conforme tolerância.','Acne grave, cicatricial ou refratária.','Fortemente recomendada para grave/refratária','Programa de prevenção gestacional, lipídios/função hepática conforme protocolo; não associar tetraciclina.')],
      procedures:[proc('Triancinolona intralesional','Nódulo/cisto inflamatório isolado para alívio rápido.','Recomendado como adjuvante'),proc('Peelings / lasers / cicatrizes','Após controlar atividade, conforme fototipo e tipo de cicatriz.','Adjuvante')],avoid:['Evitar monoterapia antibiótica e cursos prolongados sem reavaliação.'],evidence:'AAD acne guideline 2024.'
    },
    'Rosácea':{
      goal:'Tratar por fenótipo dominante: eritema, telangiectasia, papulopústulas, ocular ou fimatosa.',
      first:['Fotoproteção, skincare suave e identificação de gatilhos são base para todos os fenótipos.'],
      topical:[med('Ivermectina 1%','1x/dia.','Papulopustular.','Evidência alta'),med('Metronidazol','0,75–1% 1–2x/dia.','Papulopustular.','Uso consolidado'),med('Ácido azelaico','15% 1–2x/dia.','Papulopustular e eritema inflamatório.','Uso consolidado'),med('Brimonidina / oximetazolina','1x/dia conforme produto.','Eritema persistente.','Aprovado em alguns mercados')],
      systemic:[med('Doxiciclina','40 mg liberação modificada/dia ou doses antimicrobianas em casos selecionados.','Papulopustular moderada-grave/ocular.','Uso consolidado'),med('Isotretinoína','Baixa dose individualizada.','Refratária/fimatosa inflamatória selecionada.','Off-label')],
      procedures:[proc('PDL / IPL / lasers vasculares','Telangiectasias e eritema persistente.','Recomendado por fenótipo'),proc('Laser ablativo / cirurgia','Fimatosa estabelecida.','Procedimental')],avoid:['Evitar corticosteroide tópico crônico facial.'],evidence:'Consenso fenotípico internacional e revisões de rosácea.'
    },
    'Dermatite atópica':{
      goal:'Controlar prurido/inflamação, restaurar barreira e prevenir surtos.',
      first:['Emoliente + anti-inflamatório tópico adequado à área.','Doença moderada-grave refratária: fototerapia, biológico ou JAK sistêmico.'],
      topical:[med('Corticosteroide tópico','Potência conforme área/idade; cursos curtos e manutenção intermitente.','Surtos.','Fortemente recomendado'),med('Tacrolimo/pimecrolimo','1–2x/dia.','Face/pregas/manutenção poupadora.','Fortemente recomendado'),med('Crisaborole / roflumilaste / ruxolitinibe / tapinarof','Conforme produto e indicação local.','Alternativas poupadoras e doença leve-moderada.','Recomendados em atualizações AAD')],
      systemic:[med('Dupilumabe / tralokinumabe / lebrikizumabe / nemolizumabe','Dose conforme bula.','Moderada-grave.','Fortemente recomendados em diretrizes atuais'),med('Upadacitinibe / abrocitinibe / baricitinibe','Dose conforme bula e país.','Moderada-grave com necessidade de resposta rápida/seleção apropriada.','Fortemente recomendados','Rastrear riscos infecciosos/trombóticos/laboratoriais conforme agente.'),med('Ciclosporina / metotrexato / azatioprina / micofenolato','Dose conforme agente.','Alternativas selecionadas.','Recomendação condicional')],
      procedures:[proc('Fototerapia NB-UVB','Doença moderada-grave quando disponível.','Condicional')],avoid:['Diretrizes recomendam contra corticosteroide sistêmico crônico.'],evidence:'AAD AD guideline 2023 + focused update 2025.'
    },
    'Psoríase':{
      goal:'Alcançar controle sustentado de pele e áreas especiais, considerando artrite e comorbidades.',
      first:['Tópicos em doença localizada; sistêmicos/biológicos ou fototerapia quando moderada-grave/alto impacto.'],
      topical:[med('Corticosteroide tópico','Potência conforme área; uso >12 semanas apenas sob supervisão.','Placas localizadas.','Recomendado AAD'),med('Calcipotriol / combinação calcipotriol-betametasona','1–2x/dia conforme apresentação.','Placas e manutenção.','Recomendado'),med('Tacrolimo/pimecrolimo','1–2x/dia.','Face/pregas/genitais.','Off-label útil'),med('Tazaroteno','Conforme produto.','Placas selecionadas.','Recomendado')],
      systemic:[med('Metotrexato','Esquema semanal conforme peso/comorbidades.','Moderada-grave, inclusive artrite em cenários selecionados.','Recomendado','Monitorização hematológica/hepática e fibrose.'),med('Apremilaste','Dose conforme bula.','Moderada-grave, preferência oral e perfil selecionado.','Recomendado'),med('Ciclosporina','Dose por peso conforme bula/protocolo.','Grave, recalcitrante, pustulosa/eritrodérmica.','Recomendado'),med('Acitretina','Dose individualizada.','Pustulosa, palmoplantar, imunossupressão indesejada.','Recomendado','Teratogenicidade prolongada.'),med('Biológicos IL-17/IL-23/TNF/IL-12/23','Dose conforme agente.','Moderada-grave, alto impacto ou falha de terapias convencionais.','Fortemente estabelecidos')],
      procedures:[proc('NB-UVB / excimer / PUVA','Quando fototerapia é adequada.','Recomendado')],avoid:['Não classificar como leve apenas pelo BSA se há áreas especiais ou grande impacto.'],evidence:'AAD-NPF psoriasis guidelines.'
    },
    'Hidradenite supurativa':{
      goal:'Controlar inflamação e dor, prevenir túneis/cicatrizes e tratar dano estrutural.',
      first:['IHS4/Hurley guiam escalonamento, mas túneis e recorrência local exigem avaliação procedimental.'],
      topical:[med('Clindamicina tópica','1–2x/dia conforme produto.','Doença localizada.','Recomendação condicional 2026'),med('Resorcinol','Uso localizado em surtos conforme formulação.','Lesões selecionadas.','Condicional')],
      systemic:[med('Doxiciclina/tetraciclina','Dose antimicrobiana usual por curso limitado.','Leve-moderada inflamatória.','Condicional'),med('Clindamicina + rifampicina','Esquema por curso limitado conforme protocolo.','Moderada/refratária.','Condicional'),med('Espironolactona','Dose individualizada.','Mulheres selecionadas com componente hormonal.','Condicional 2026'),med('Adalimumabe / bimequizumabe / secuquinumabe / infliximabe','Dose conforme bula/protocolo.','Moderada-grave.','Fortemente recomendados 2026'),med('Upadacitinibe','Dose conforme bula/uso local.','Moderada-grave selecionada.','Condicional 2026')],
      procedures:[proc('Triancinolona intralesional','Nódulo doloroso em flare.','Condicional'),proc('Deroofing','Túneis recorrentes/localizados.','Procedimento recomendado'),proc('Excisão cirúrgica','Doença estrutural persistente.','Procedimento'),proc('Laser de depilação','Redução de flares em áreas pilosas selecionadas.','Condicional')],avoid:['Retinoides orais não são terapia padrão de primeira linha para HS na diretriz AAD-HSF 2026.'],evidence:'AAD-HSF HS guideline 2026.'
    },
    'Vitiligo':{
      goal:'Parar progressão ativa e repigmentar áreas prioritárias; tratar impacto psicossocial.',
      first:['Tópicos em doença localizada; fototerapia quando extensa/ativa; ruxolitinibe tópico onde disponível.'],
      topical:[med('Corticosteroide tópico','Intermitente, potência conforme área.','Tronco/extremidades localizadas.','Uso consolidado'),med('Tacrolimo/pimecrolimo','1–2x/dia.','Face/pregas.','Uso consolidado'),med('Ruxolitinibe creme','Conforme bula local.','Vitiligo não segmentar selecionado.','Aprovado em alguns mercados')],
      systemic:[med('Corticosteroide oral em minipulso','Protocolos variáveis.','Doença rapidamente progressiva selecionada.','Off-label','Usado para estabilização, não como manutenção crônica.')],
      procedures:[proc('NB-UVB','Extensa/ativa ou repigmentação ampla.','Pilar terapêutico'),proc('Excimer','Áreas localizadas.','Adjuvante'),proc('Enxertos/cirurgia de melanócitos','Vitiligo estável e refratário selecionado.','Procedimental')],avoid:['Não usar VASI isoladamente para decidir tratamento; atividade (VIDA) e área especial importam.'],evidence:'Consensos internacionais e revisões 2024–2026.'
    },
    'Melasma':{
      goal:'Reduzir pigmento e prevenir recidiva minimizando irritação e PIH.',
      first:['Fotoproteção UVA/UVB/luz visível + despigmentante tópico.','Estratégia de manutenção é obrigatória.'],
      topical:[med('Hidroquinona','2–4% à noite por ciclos.','Primeira linha clássica.','Uso consolidado','Monitorar irritação/ocronose em uso inadequado.'),med('Combinação tripla','Hidroquinona + tretinoína + corticosteroide em formulação padronizada.','Melasma moderado-grave em ciclos.','Alta evidência'),med('Ácido azelaico / tranexâmico tópico / cisteamina','Conforme formulação.','Alternativas/manutenção.','Evidência variável')],
      systemic:[med('Ácido tranexâmico oral','Dose varia em estudos, frequentemente 250 mg 2x/dia por cursos limitados.','Refratário selecionado.','Off-label','Rastrear risco trombótico, contracepção hormonal e história pessoal/familiar.')],
      procedures:[proc('Peelings superficiais','Adjuvante em fototipo apropriado.','Adjuvante'),proc('Lasers / luz','Somente em casos selecionados e com cautela por PIH/recidiva.','Evidência variável')],avoid:['Evitar procedimentos agressivos sem controle de fotoproteção/irritação.'],evidence:'Revisões sistemáticas e consensos contemporâneos.'
    },
    'Dermatite seborreica':{
      goal:'Controlar Malassezia/inflamação e manter prevenção de recidivas.',
      first:['Antifúngico tópico é base; corticoide curto para surtos inflamatórios.'],
      topical:[med('Cetoconazol xampu 2%','2–3x/semana na indução; manutenção 1x/semana ou conforme recidiva.','Couro cabeludo.','Primeira linha'),med('Ciclopirox','Xampu/creme conforme produto.','Alternativa antifúngica.','Uso consolidado'),med('Corticosteroide tópico','Baixa-média potência por poucos dias.','Surto intenso.','Curto prazo'),med('Tacrolimo/pimecrolimo','1–2x/dia.','Face/pregas para poupar corticoide.','Off-label')],systemic:[],procedures:[],avoid:['Evitar corticosteroide crônico facial.'],evidence:'Revisões e guidelines de dermatite seborreica.'
    },
    'Psoríase do couro cabeludo':{
      goal:'Controlar eritema, escama e prurido com veículo aceitável; avaliar psoríase global.',
      first:['Corticosteroide tópico em veículo para couro cabeludo ± análogo de vitamina D.'],
      topical:[med('Clobetasol','0,05% solução/espuma/xampu em cursos curtos.','Doença moderada/intensa localizada.','Alta eficácia'),med('Calcipotriol-betametasona','Gel/espuma 1x/dia conforme produto.','Indução e manutenção selecionada.','Uso consolidado'),med('Ácido salicílico','Queratolítico conforme formulação.','Escama espessa.','Adjuvante')],systemic:[med('Sistêmicos/biológicos de psoríase','Conforme gravidade global.','Couro cabeludo refratário + doença moderada-grave/alto impacto.','Conforme guideline')],procedures:[proc('Fototerapia direcionada / excimer','Áreas selecionadas.','Adjuvante')],avoid:[],evidence:'AAD-NPF psoriasis guidelines.'
    },
    'Onicomicose':{
      goal:'Erradicação micológica e crescimento de unha saudável, confirmando diagnóstico antes de sistêmico prolongado.',
      first:['Oral costuma ser superior em doença moderada-grave/matriz; tópico em doença limitada.'],
      topical:[med('Ciclopirox / efinaconazol / tavaborole','Aplicação conforme bula, por meses.','Doença superficial/limitada, sem matriz.','Opção tópica')],
      systemic:[med('Terbinafina','250 mg/dia; usualmente 6 semanas mãos e 12 semanas pés.','Dermatofítica moderada-grave, matriz ou múltiplas unhas.','Primeira linha oral','Revisar hepatopatia e interações.'),med('Itraconazol','Contínuo ou pulsoterapia conforme protocolo.','Candida, dermatófitos selecionados ou intolerância à terbinafina.','Alternativa','Interações CYP3A4 e cardiopatia são relevantes.')],
      procedures:[proc('Desbridamento','Reduz carga/espessura e melhora penetração.','Adjuvante')],avoid:['Não tratar “unha distrófica” sem considerar psoríase/trauma e confirmação micológica quando sistêmico for planejado.'],evidence:'Guidelines/revisões de onicomicose.'
    }
  };

  const fallback={
    'Alopecia por tração':[['Suspender tração e penteados tensionantes imediatamente.','Minoxidil tópico/oral pode ser adjuvante em fase não cicatricial.'],['Corticoide tópico/intralesional se inflamação ativa.'],['Transplante apenas após estabilidade e confirmação de cicatriz.']],
    'Tricotilomania':[['Terapia comportamental/habit reversal é o tratamento central.'],['N-acetilcisteína ou psicofármacos podem ser considerados com saúde mental em casos selecionados.'],['Tratar dermatoses coexistentes; não focar em procedimentos capilares.']],
    'Foliculite decalvante':[['Antibióticos antiestafilocócicos e anti-inflamatórios guiados por cultura/contexto.'],['Clindamicina + rifampicina é esquema usado em casos selecionados; isotretinoína pode ser considerada em refratários.'],['Controle precoce para evitar cicatriz permanente.']],
    'Celulite dissecante do couro cabeludo':[['Isotretinoína é opção sistêmica frequente; antibióticos podem ser usados em flares/infeção secundária.'],['Corticoide intralesional, drenagem/procedimentos e biológicos entram em refratários selecionados.'],['Doença destrutiva avançada pode exigir cirurgia.']],
    'Tinea capitis':[['Tratamento deve ser sistêmico: terbinafina, griseofulvina, itraconazol ou fluconazol conforme agente/idade.'],['Xampu antifúngico é apenas adjuvante para reduzir transmissão.'],['Kerion requer manejo rápido para reduzir risco de cicatriz.']],
    'Dermatite de contato':[['Identificar e evitar alérgeno/irritante é o tratamento definitivo.'],['Corticosteroide tópico conforme área/gravidade; calcineurínico em áreas sensíveis.'],['Patch test quando alergia de contato for suspeita/persistente.']],
    'Urticária crônica espontânea':[['Anti-histamínico H1 de segunda geração diariamente; se insuficiente, aumentar até 4x a dose padrão conforme guideline.'],['Persistência: omalizumabe; refratária selecionada: ciclosporina.'],['Evitar corticosteroide sistêmico crônico.']],
    'Escabiose':[['Permetrina 5% tópica e/ou ivermectina oral conforme contexto e população.'],['Repetir esquema conforme ciclo e tratar contatos simultaneamente.'],['Forma crostosa requer combinação/intensificação e controle ambiental rigoroso.']],
    'Herpes-zóster':[['Antiviral sistêmico precoce: aciclovir, valaciclovir ou famciclovir.'],['Analgesia individualizada; avaliar dor neuropática.'],['Oftálmico, disseminado, neurológico ou imunossuprimido exige encaminhamento/conduta específica.']],
    'Tinea corporis/cruris':[['Azólico ou terbinafina tópica em doença limitada.'],['Terbinafina/itraconazol oral em extensa, folicular ou refratária.'],['Evitar combinação antifúngico+corticoide sem indicação.']],
    'Paroníquia':[['Aguda com abscesso: drenagem é central; antibiótico quando celulite/imunossupressão.'],['Crônica: evitar umidade/irritantes e tratar inflamação com corticoide tópico; antifúngico só quando indicado.']],
    'Ceratose actínica':[['Crioterapia para lesões isoladas.'],['Tratamento de campo: 5-FU, imiquimode, diclofenaco, tirbanibulina ou PDT conforme disponibilidade.'],['Biópsia se induração, dor, crescimento ou suspeita de CEC.']],
    'Carcinoma basocelular':[['Excisão convencional ou cirurgia de Mohs conforme risco/localização.'],['Curetagem/eletrodissecção ou terapias tópicas apenas em subtipos superficiais/baixo risco selecionados.'],['Doença avançada: inibidores de Hedgehog e imunoterapia conforme oncologia/dermatologia.']],
    'Carcinoma espinocelular cutâneo':[['Excisão ou Mohs conforme risco; avaliar linfonodos em alto risco.'],['Radioterapia em cenários selecionados.'],['Doença avançada/metastática: imunoterapia anti-PD-1 conforme estadiamento.']],
    'Melanoma cutâneo':[['Excisão ampla com margem conforme Breslow.'],['Considerar linfonodo sentinela conforme espessura/ulceração e fatores de risco.'],['Adjuvância e terapia sistêmica dependem de estágio/mutação e decisão oncológica.']]
  };

  function statusClass(s=''){const n=N(s);return /primeira|forte|recomendado|aprovad/.test(n)?'tc-good':/off-label|limitada|emergente|condicional|variavel/.test(n)?'tc-warn':'tc-neutral'}
  function medCard(x){return `<div class="tc-card"><div class="tc-card-head"><strong>${esc(x.name)}</strong><span class="tc-status ${statusClass(x.status)}">${esc(x.status)}</span></div>${x.dose?`<div class="tc-row"><b>Dose/faixa</b><span>${esc(x.dose)}</span></div>`:''}<div class="tc-row"><b>Quando prefiro</b><span>${esc(x.when)}</span></div>${x.monitor?`<div class="tc-row"><b>Monitorização</b><span>${esc(x.monitor)}</span></div>`:''}${x.note?`<p class="tc-note">${esc(x.note)}</p>`:''}<button type="button" class="tc-open-rx" data-tc-rx="${esc(x.name)}">Abrir no Guia de Prescrição</button></div>`}
  function procCard(x){return `<div class="tc-card tc-proc"><div class="tc-card-head"><strong>${esc(x.name)}</strong><span class="tc-status ${statusClass(x.status)}">${esc(x.status)}</span></div><div class="tc-row"><b>Quando considerar</b><span>${esc(x.when)}</span></div>${x.note?`<p class="tc-note">${esc(x.note)}</p>`:''}</div>`}
  function section(title,arr,renderer){if(!arr?.length)return'';return `<section class="tc-section"><h5>${esc(title)}</h5><div class="tc-grid">${arr.map(renderer).join('')}</div></section>`}
  function deepHtml(cfg){return `<div class="tc-compendium"><div class="tc-hero"><span>Tratamento completo</span><h4>${esc(cfg.goal)}</h4>${cfg.first?.length?`<ul>${cfg.first.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</div>${section('Tratamentos tópicos',cfg.topical,medCard)}${section('Tratamentos orais / sistêmicos',cfg.systemic,medCard)}${section('Procedimentos e tecnologias',cfg.procedures,procCard)}${cfg.avoid?.length?`<section class="tc-section tc-avoid"><h5>Evitar / baixa evidência</h5><ul>${cfg.avoid.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}<p class="tc-evidence">Base: ${esc(cfg.evidence||'revisões e diretrizes contemporâneas')}. Confirmar registro, bula local e particularidades do paciente antes de prescrever.</p></div>`}
  function fallbackHtml(name,rows){return `<div class="tc-compendium"><div class="tc-hero"><span>Tratamento completo</span><h4>Opções terapêuticas organizadas por prioridade clínica</h4></div>${rows.map((r,i)=>`<section class="tc-section"><h5>${i===0?'Primeira linha / base':i===1?'Escalonamento / alternativas':'Procedimentos, situações especiais e seguimento'}</h5><ul>${r.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`).join('')}<p class="tc-evidence">Estrutura de apoio à decisão. Para dose exata de fármacos não cadastrados, abrir o Guia de Prescrição ou a busca farmacológica externa.</p></div>`}
  function openRx(term){document.querySelector('.nav-btn[data-view="prescriptions"]')?.click();requestAnimationFrame(()=>{search.value=term;search.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-rx-id]')?.click();});}
  function inject(){
    if(document.querySelector('.nav-btn.active')?.dataset.view==='prescriptions')return;
    const name=panel.querySelector('.detail-title')?.textContent?.trim();if(!name)return;
    const treatment=[...panel.querySelectorAll('details.clinical-accordion')].find(d=>/Abordagem terapêutica|Tratamento completo/i.test(d.querySelector('summary')?.textContent||''));
    if(!treatment)return;
    const key=`tc-${N(name).replace(/[^a-z0-9]+/g,'-')}`;if(treatment.dataset.tcKey===key)return;
    treatment.dataset.tcKey=key;treatment.open=false;
    const sum=treatment.querySelector('summary span');if(sum)sum.textContent='Tratamento completo — todas as opções';
    const body=treatment.querySelector('.accordion-body');if(!body)return;
    body.innerHTML=C[name]?deepHtml(C[name]):fallback[name]?fallbackHtml(name,fallback[name]):`<div class="tc-compendium"><p>Conteúdo terapêutico estruturado em revisão editorial. Use a conduta orientada pela gravidade e o Guia de Prescrição enquanto esta ficha é aprofundada.</p></div>`;
    body.querySelectorAll('[data-tc-rx]').forEach(b=>b.addEventListener('click',()=>openRx(b.dataset.tcRx)));
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();