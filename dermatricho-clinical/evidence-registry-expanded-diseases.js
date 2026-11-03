(() => {
  const r=window.DT_EVIDENCE_REGISTRY; if(!r?.diseases)return;
  Object.assign(r.diseases,{
    'Hanseníase':[
      {title:'Protocolo Clínico e Diretrizes Terapêuticas da Hanseníase',year:2022,type:'PCDT oficial do Ministério da Saúde / SUS',quality:'A',role:'driver',url:'https://www.gov.br/saude/pt-br/assuntos/pcdt/h/hanseniase/view',note:'Fonte prioritária para diagnóstico, classificação PB/MB, PQT-U, reações, incapacidade e investigação de contatos no Brasil; página oficial atualizada em 2025.'},
      {title:'Estratégia Nacional para Enfrentamento à Hanseníase 2024–2030',year:2024,type:'Estratégia nacional de saúde pública',quality:'B',role:'context',url:'https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/hanseniase',note:'Contexto brasileiro para vigilância, contatos, redução de incapacidade e estigma.'}
    ],
    'Lúpus eritematoso cutâneo':[
      {title:'Update on cutaneous lupus erythematosus pathogenesis, diagnosis and management',year:2026,type:'Revisão especializada JEADV',quality:'B',role:'driver',doi:'10.1111/jdv.70186',url:'https://pubmed.ncbi.nlm.nih.gov/41328032/',note:'Atualiza classificação, CLASI, antimaláricos e terapias sistêmicas/dirigidas.'},
      {title:"What's New in Cutaneous Lupus Erythematosus: Guidelines, Biologics, and Beyond",year:2026,type:'Revisão contemporânea',quality:'B',role:'support',url:'https://pubmed.ncbi.nlm.nih.gov/41648089/',note:'Útil para terapias emergentes e integração Dermato-Reumato.'}
    ],
    'Prurigo nodular':[
      {title:'British Association of Dermatologists living guideline for managing people with nodular prurigo 2025',year:2026,type:'Living guideline BAD',quality:'A',role:'driver',doi:'10.1093/bjd/ljag070',url:'https://pubmed.ncbi.nlm.nih.gov/41783941/',note:'Principal referência recente para tratamento escalonado e terapias aprovadas.'},
      {title:'Swiss Practice Recommendations for Chronic Prurigo Including Prurigo Nodularis',year:2026,type:'Revisão estruturada + consenso com GRADE adaptado',quality:'B',role:'support',url:'https://pubmed.ncbi.nlm.nih.gov/42316333/',note:'Recomenda tópicos, NB-UVB, dupilumabe e nemolizumabe; posiciona alternativas sistêmicas.'}
    ],
    'Pênfigo vulgar':[
      {title:'Updated S2K guidelines on the management of pemphigus vulgaris and foliaceus',year:2020,type:'Guideline EADV S2k',quality:'B',role:'driver',doi:'10.1111/jdv.16752',url:'https://pubmed.ncbi.nlm.nih.gov/32830877/',note:'Rituximabe é terapia de primeira linha para PV moderado-grave; segue sendo guideline estrutural de referência.'},
      {title:'Optimizing Pemphigus Management With Rituximab and Short-Term Relapse Predictors',year:2025,type:'Estudo clínico multicêntrico de seguimento',quality:'B',role:'support',doi:'10.1001/jamadermatol.2024.6130',url:'https://pubmed.ncbi.nlm.nih.gov/39908046/',note:'Aprimora monitorização e predição de recaída após rituximabe.'},
      {title:'Treatment of mild to moderate pemphigus with rituximab and topical corticosteroids',year:2026,type:'Estudo clínico contemporâneo',quality:'B',role:'context',doi:'10.1111/jdv.70825',url:'https://pubmed.ncbi.nlm.nih.gov/42929667/',note:'Sugere expansão de estratégias com rituximabe mesmo em doença menos extensa; não substitui guideline formal.'}
    ],
    'Penfigoide bolhoso':[
      {title:'Updated S2K guidelines for the management of bullous pemphigoid',year:2022,type:'Guideline EADV S2k',quality:'B',role:'driver',doi:'10.1111/jdv.18220',url:'https://pubmed.ncbi.nlm.nih.gov/35766904/',note:'Corticosteroide tópico potente é pilar quando viável; prednisona e poupadores conforme gravidade/comorbidades.'},
      {title:'State-of-the-art diagnosis of autoimmune blistering diseases',year:2024,type:'Revisão diagnóstica especializada',quality:'B',role:'support',url:'https://pubmed.ncbi.nlm.nih.gov/38903493/',note:'Reforça imunofluorescência direta perilesional e autoanticorpos específicos.'}
    ],
    'Dermatite periorificial':[
      {title:'Periorificial dermatitis: Pathophysiology, diagnosis, and management',year:2026,type:'Revisão JAAD',quality:'B',role:'driver',doi:'10.1016/j.jaad.2025.10.138',url:'https://pubmed.ncbi.nlm.nih.gov/41197738/',note:'Referência contemporânea para gatilhos, diagnóstico diferencial e tratamento tópico/sistêmico.'}
    ],
    'Pitiríase rósea':[
      {title:'Comparative Efficacy of Different Pharmacological Treatments for Pityriasis Rosea: A Network Meta-Analysis',year:2024,type:'Network meta-analysis de 12 RCTs',quality:'A',role:'driver',url:'https://pubmed.ncbi.nlm.nih.gov/39597810/',note:'A maioria é autolimitada; aciclovir mostrou melhor sinal para melhora da erupção em doença extensa/persistente/sintomática.'}
    ],
    'Pitiríase versicolor':[
      {title:'Systematic Review and Meta-analysis on Synthetic Antifungal versus Keratolytic Agents for Topical Treatment of Pityriasis Versicolor',year:2024,type:'Revisão sistemática + meta-análise de RCTs',quality:'B',role:'support',url:'https://pubmed.ncbi.nlm.nih.gov/38939846/',note:'Azóis tópicos e agentes queratolíticos têm eficácia semelhante com baixa certeza; escolha deve considerar tolerabilidade e conveniência.'},
      {title:'Pityriasis Versicolor—A Narrative Review on the Diagnosis and Management',year:2023,type:'Revisão clínica',quality:'C',role:'driver',url:'https://pubmed.ncbi.nlm.nih.gov/37895478/',note:'Tópicos são primeira linha; sistêmicos em doença extensa/refratária; recorrência é comum.'}
    ],
    'Verrugas virais cutâneas':[
      {title:'Clinical guideline for the diagnosis and treatment of cutaneous warts',year:2022,type:'Guideline baseado em GRADE + Delphi',quality:'A',role:'driver',doi:'10.1111/jebm.12494',url:'https://pubmed.ncbi.nlm.nih.gov/36117295/',note:'Base para verruga vulgar, plantar e plana e escolha de modalidades destrutivas/queratolíticas.'}
    ],
    'Molusco contagioso':[
      {title:'Treatments for molluscum contagiosum: A systematic review',year:2026,type:'Revisão sistemática PRISMA – 89 estudos / 12.955 participantes',quality:'A',role:'driver',url:'https://pubmed.ncbi.nlm.nih.gov/42108718/',note:'Tratamento deve ser individualizado; curetagem, KOH, crioterapia, cantharidina e novas opções têm perfis diferentes.'},
      {title:'CDC Clinical Overview of Molluscum Contagiosum',year:2025,type:'Orientação oficial de saúde pública',quality:'B',role:'context',url:'https://www.cdc.gov/molluscum-contagiosum/hcp/clinical-overview/',note:'Reforça caráter autolimitado e atenção a imunossuprimidos/adultos.'}
    ],
    'Herpes simples cutâneo/genital':[
      {title:'CDC STI Treatment Guidelines – Genital Herpes',year:2021,type:'Guideline oficial com atualizações operacionais vigentes',quality:'A',role:'driver',url:'https://www.cdc.gov/std/treatment-guidelines/herpes.htm',note:'Principal referência para primeiro episódio, terapia episódica, supressiva e situações especiais.'}
    ],
    'Impetigo e ectima':[
      {title:'Evidence-to-Recommendation Framework for 2026 ACE Clinical Guideline on bacterial skin and soft tissue infections',year:2026,type:'Guideline framework GRADE',quality:'A',role:'driver',url:'https://pubmed.ncbi.nlm.nih.gov/42847140/',note:'Estrutura uso racional de antibióticos tópicos/orais para impetigo, ectima e outras SSTIs.'},
      {title:'CDC Clinical Guidance for Group A Streptococcal Impetigo',year:2025,type:'Orientação oficial',quality:'B',role:'support',url:'https://www.cdc.gov/group-a-strep/hcp/clinical-guidance/impetigo.html',note:'Poucas lesões favorecem tópico; múltiplas lesões favorecem antibiótico oral.'},
      {title:'Impetigo: Rapid Evidence Review',year:2026,type:'Rapid evidence review',quality:'B',role:'support',url:'https://pubmed.ncbi.nlm.nih.gov/41839109/',note:'Atualiza tratamento tópico/oral e critérios de gravidade.'}
    ],
    'Sífilis cutânea (primária/secundária)':[
      {title:'CDC STI Treatment Guidelines – Primary and Secondary Syphilis',year:2021,type:'Guideline oficial vigente',quality:'A',role:'driver',url:'https://www.cdc.gov/std/treatment-guidelines/p-and-s-syphilis.htm',note:'Penicilina G benzatina 2,4 milhões UI IM dose única para sífilis primária/secundária em adultos; manejo depende do estágio.'}
    ]
  });
})();