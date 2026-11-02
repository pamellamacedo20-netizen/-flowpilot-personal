(() => {
  const r=window.DT_EVIDENCE_REGISTRY; if(!r?.diseases)return;
  Object.assign(r.diseases,{
    'Rosácea':[
      {title:'An Attempt to Establish the Consensus Regarding the Diagnosis, Classification, and Treatment of Rosacea in Japan: The Japan Rosacea Consensus',year:2026,type:'Consenso modificado Delphi',quality:'B',role:'driver',doi:'10.1111/1346-8138.70213',url:'https://pubmed.ncbi.nlm.nih.gov/41821237/',note:'Atualiza abordagem fenotípica, diagnóstico e tratamento; útil para algoritmo prático.'},
      {title:'Treatment management for rosacea: current pharmacological and non-pharmacological options',year:2025,type:'Revisão clínica contemporânea',quality:'B',role:'support',doi:'10.1080/17512433.2025.2550727',url:'https://pubmed.ncbi.nlm.nih.gov/40836652/',note:'Síntese de tópicos, sistêmicos, dispositivos e cuidados por fenótipo.'},
      {title:'National Delphi consensus on laser and energy-based treatments for rosacea',year:2026,type:'Revisão sistemática + pesquisa de pacientes + Delphi',quality:'B',role:'support',doi:'10.1111/ddg.15976',url:'https://pubmed.ncbi.nlm.nih.gov/41414941/',note:'Melhor referência recente para vascular laser/EBD em eritema e telangiectasias.'}
    ],
    'Dermatite de contato':[
      {title:'European Society of Contact Dermatitis Guideline for Diagnostic Patch Testing—Recommendations on Best Practice (Update 2026)',year:2026,type:'Practice guideline ESCD',quality:'B',role:'driver',doi:'10.1111/cod.70195',url:'https://pubmed.ncbi.nlm.nih.gov/42324086/',note:'Referência atual para técnica, interpretação, séries adicionais, crianças e exposição ocupacional; evitar o alérgeno continua sendo o eixo terapêutico.'}
    ],
    'Psoríase':[
      {title:'S3 Guideline for the treatment of psoriasis vulgaris, adapted from EuroGuiDerm - part 1: Treatment recommendations and monitoring',year:2026,type:'Diretriz S3 baseada em evidência',quality:'A',role:'driver',doi:'10.1111/ddg.16002',url:'https://pubmed.ncbi.nlm.nih.gov/41531416/',note:'Principal fonte para tratamento tópico/sistêmico e monitorização.'},
      {title:'S3 Guideline for the Treatment of Psoriasis vulgaris, adapted from EuroGuiDerm - part 2: Specific clinical and comorbid situations',year:2026,type:'Diretriz S3 baseada em evidência',quality:'A',role:'driver',doi:'10.1111/ddg.16001',url:'https://pubmed.ncbi.nlm.nih.gov/41641952/',note:'Orienta escolha conforme comorbidades, situações especiais e segurança.'}
    ],
    'Urticária crônica espontânea':[
      {title:'The International Guideline for the Definition, Classification, Diagnosis and Management of Urticaria',year:2026,type:'Guideline internacional Cochrane/GRADE',quality:'A',role:'driver',doi:'10.1111/all.70210',url:'https://pubmed.ncbi.nlm.nih.gov/41649409/',note:'Principal fonte para diagnóstico, UCT/UAS7 e escalonamento de anti-H1 para terapias avançadas.'}
    ],
    'Vitiligo':[
      {title:'Canadian Consensus Guidelines for the Management of Vitiligo',year:2025,type:'Revisão sistemática + consenso estruturado',quality:'B',role:'driver',doi:'10.1007/s13555-025-01402-5',url:'https://pubmed.ncbi.nlm.nih.gov/40253664/',note:'Algoritmo prático para estabilização, repigmentação, ruxolitinibe, fototerapia e cirurgia.'},
      {title:'Management of adult vitiligo: approved topical JAK inhibitor and standard therapies',year:2026,type:'Revisão PRISMA com avaliação RoB2/ROBINS-I',quality:'B',role:'support',doi:'10.1080/09546634.2026.2627721',url:'https://pubmed.ncbi.nlm.nih.gov/41696942/',note:'Apoia ruxolitinibe tópico, TCS/TCI e NB-UVB/excimer com estratificação por atividade e extensão.'}
    ],
    'Melasma':[
      {title:'Global consensus on the management of melanin hyperpigmentation disorders',year:2026,type:'Revisão abrangente + Delphi global',quality:'B',role:'driver',doi:'10.1111/jdv.70185',url:'https://pubmed.ncbi.nlm.nih.gov/41362125/',note:'Estrutura fotoproteção, terapias tópicas, tranexâmico e procedimentos conforme profundidade/fototipo.'},
      {title:'Delphi consensus on melasma management by international experts and pigmentary disorders society',year:2025,type:'Consenso Delphi com graduação Oxford',quality:'B',role:'driver',url:'https://pubmed.ncbi.nlm.nih.gov/40996222/',note:'Fotoproteção e tripla combinação com hidroquinona permanecem pilares; TXA e procedimentos são opções selecionadas.'},
      {title:'Efficacy and Safety of Different Treatments for Melasma: Network Meta-Analysis of Updated Data',year:2025,type:'Network meta-analysis de RCTs',quality:'A',role:'support',url:'https://pubmed.ncbi.nlm.nih.gov/41149049/',note:'Compara modalidades recentes; interpretar rankings com cautela pela heterogeneidade e pequenos estudos.'}
    ],
    'Escabiose':[
      {title:'British Association for Sexual Health and HIV National Guideline on the Management of Scabies in adults 2025',year:2025,type:'Guideline nacional evidence-informed',quality:'B',role:'driver',doi:'10.1177/09564624251321264',url:'https://pubmed.ncbi.nlm.nih.gov/40103364/',note:'Atualiza diagnóstico, tratamento, contatos e seguimento em adultos/adolescentes.'},
      {title:'Clinical practice guidelines for the diagnosis and treatment of scabies',year:2024,type:'Clinical practice guideline',quality:'B',role:'support',doi:'10.1111/ijd.17327',url:'https://pubmed.ncbi.nlm.nih.gov/38922701/',note:'Complementa escolha terapêutica, escabiose crostosa e manejo de contatos/ambiente.'}
    ],
    'Herpes-zóster':[
      {title:'Varicella zoster virus infection',year:2026,type:'Revisão clínica atualizada',quality:'B',role:'driver',url:'https://pubmed.ncbi.nlm.nih.gov/42693145/',note:'Valaciclovir/famciclovir/aciclovir são eixos; IV aciclovir para doença grave/disseminada e atenção a apresentações atípicas.'},
      {title:'A Short Review and Update on Epidemiology, Treatment, and Management of Herpes Zoster',year:2026,type:'Revisão atualizada',quality:'C',role:'support',url:'https://pubmed.ncbi.nlm.nih.gov/41832688/',note:'Apoio para antiviral, neuralgia pós-herpética e prevenção; não substitui guideline local de vacinação.'}
    ],
    'Tinea corporis/cruris':[
      {title:'Diagnosis and Management of Tinea Infections',year:2025,type:'Revisão clínica com participação do CDC',quality:'B',role:'driver',url:'https://pubmed.ncbi.nlm.nih.gov/41118183/',note:'Reforça confirmação quando necessário, antifúngico tópico em doença localizada, sistêmico em extensa/refratária e stewardship.'},
      {title:'Consensus recommendations for Trichophyton indotineae: A modified Delphi study',year:2026,type:'Consenso modificado Delphi',quality:'B',role:'support',url:'https://pubmed.ncbi.nlm.nih.gov/42786909/',note:'Aplicável a doença extensa/recalcitrante com suspeita de T. indotineae; recomenda diagnóstico em nível de espécie e itraconazol quando confirmado/suspeito.'},
      {title:'Expert Panel Review of Skin and Hair Dermatophytoses in an Era of Antifungal Resistance',year:2024,type:'Revisão expert panel com foco em resistência',quality:'B',role:'support',doi:'10.1007/s40257-024-00848-1',url:'https://pubmed.ncbi.nlm.nih.gov/38494575/',note:'Base para antifungal stewardship e reconhecimento de dermatófitos resistentes.'}
    ],
    'Onicomicose':[
      {title:'British Association of Dermatologists guideline for managing fungal nail infection (onychomycosis) 2026',year:2026,type:'Guideline BAD com revisão de evidência',quality:'A',role:'driver',doi:'10.1093/bjd/ljag318',url:'https://pubmed.ncbi.nlm.nih.gov/42910426/',note:'Confirma diagnóstico antes de terapia sistêmica; terbinafina é primeira linha para muitos casos, com alternativas e combinações conforme perfil.'}
    ],
    'Paroníquia':[
      {title:'Management of Finger Felons and Paronychia: A Narrative Review',year:2025,type:'Revisão narrativa clínica',quality:'C',role:'driver',doi:'10.1016/j.jemermed.2025.07.054',url:'https://pubmed.ncbi.nlm.nih.gov/40945390/',note:'Distingue quadro precoce de abscesso e indica drenagem quando coleção está presente.'},
      {title:'Efficacy and safety of 0.75% metronidazole gel in patients with mild chronic paronychia: A randomized, double-blind, placebo-controlled trial',year:2026,type:'RCT pequeno',quality:'B',role:'support',doi:'10.1016/j.jaad.2026.02.031',url:'https://pubmed.ncbi.nlm.nih.gov/41692221/',note:'Evidência nova para paroníquia crônica leve; ainda não redefine isoladamente o padrão de cuidado.'}
    ],
    'Ceratose actínica':[
      {title:'Multidisciplinary Delphi Consensus Between Primary Care and Dermatology on Updated Management of Actinic Keratosis in Spain',year:2025,type:'Consenso Delphi multidisciplinar',quality:'B',role:'driver',url:'https://pubmed.ncbi.nlm.nih.gov/41421476/',note:'Estratifica terapia por lesão isolada versus campo de cancerização e destaca 5-FU/tirbanibulina.'},
      {title:'Actinic keratosis: A clinician’s guide to diagnosis and treatment',year:2026,type:'Revisão clínica atualizada',quality:'B',role:'support',doi:'10.3949/ccjm.93a.26005',url:'https://pubmed.ncbi.nlm.nih.gov/42680535/',note:'Enfatiza carga de lesões, campo de cancerização, preferência do paciente e prevenção longitudinal.'},
      {title:'Topical combined 5-fluorouracil and calcipotriene for actinic keratosis and superficial keratinocyte carcinoma',year:2026,type:'Modified Delphi de especialistas',quality:'C',role:'context',doi:'10.1016/j.jaad.2026.03.088',url:'https://pubmed.ncbi.nlm.nih.gov/41933793/',note:'Regime curto promissor, mas painel pequeno e literatura ainda limitada.'}
    ],
    'Carcinoma basocelular':[
      {title:'European consensus-based interdisciplinary guideline for diagnosis and treatment of basal cell carcinoma-update 2023',year:2023,type:'Guideline interdisciplinar europeu',quality:'B',role:'driver',doi:'10.1016/j.ejca.2023.113254',url:'https://pubmed.ncbi.nlm.nih.gov/37604067/',note:'Cirurgia completa é primeira linha; cirurgia micrográfica para alto risco/recorrente/local crítico; tópicos/destrutivos apenas em baixo risco selecionado.'},
      {title:'Basal Cell Skin Cancer, Version 2.2024, NCCN Clinical Practice Guidelines in Oncology',year:2024,type:'NCCN guideline',quality:'A',role:'support',doi:'10.6004/jnccn.2023.0056',url:'https://pubmed.ncbi.nlm.nih.gov/37935106/',note:'Complementa estratificação de risco, margens, cirurgia, radioterapia e terapia sistêmica em doença avançada.'}
    ],
    'Carcinoma espinocelular cutâneo':[
      {title:'European consensus-based interdisciplinary guideline for invasive cutaneous squamous cell carcinoma: Part 1. Diagnostics and prevention - Update 2026',year:2026,type:'Guideline interdisciplinar europeu',quality:'B',role:'driver',doi:'10.1016/j.ejca.2026.116763',url:'https://pubmed.ncbi.nlm.nih.gov/42248744/',note:'Atualiza estadiamento, fatores de risco, diagnóstico, imagem e prevenção.'},
      {title:'European consensus-based interdisciplinary guideline for invasive cutaneous squamous cell carcinoma: Part 2. Treatment - update 2026',year:2026,type:'Guideline interdisciplinar europeu',quality:'B',role:'driver',doi:'10.1016/j.ejca.2026.116764',url:'https://pubmed.ncbi.nlm.nih.gov/42263355/',note:'Cirurgia com margens claras é primeira linha; anti-PD-1 é primeira linha sistêmica em doença avançada não curável localmente.'}
    ],
    'Melanoma cutâneo':[
      {title:'Cutaneous melanoma: ESMO Clinical Practice Guideline for diagnosis, treatment and follow-up',year:2025,type:'ESMO Clinical Practice Guideline',quality:'A',role:'driver',doi:'10.1016/j.annonc.2024.11.006',url:'https://pubmed.ncbi.nlm.nih.gov/39550033/',note:'Principal referência para excisão, SLNB, terapia adjuvante/sistêmica e seguimento por estágio.'},
      {title:'European consensus-based interdisciplinary guideline for melanoma. Part 1: Diagnostics - Update 2024',year:2024,type:'Guideline interdisciplinar europeu',quality:'B',role:'support',url:'https://pubmed.ncbi.nlm.nih.gov/39700658/',note:'Atualiza dermatoscopia, fotografia corporal, imagem e mutação BRAF conforme estágio.'}
    ]
  });
  r.dermatologyReviewComplete=true;
})();
