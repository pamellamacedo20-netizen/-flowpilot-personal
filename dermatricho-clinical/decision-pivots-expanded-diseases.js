(() => {
  window.DT_DECISION_PIVOTS=window.DT_DECISION_PIVOTS||{};
  Object.assign(window.DT_DECISION_PIVOTS,{
    'Hanseníase':[
      {finding:'Nova perda sensitiva/motora, dor neural ou neurite',action:'Priorizar avaliação e tratamento de reação/neurite para prevenir incapacidade; não esperar apenas a evolução da PQT-U.',quality:'A/B',source:'PCDT Hanseníase – Ministério da Saúde'},
      {finding:'1–5 lesões + baciloscopia negativa',action:'Classificar como PB e usar duração de 6 meses da PQT-U, salvo situação especial.',quality:'A',source:'PCDT Hanseníase – Ministério da Saúde'},
      {finding:'>5 lesões e/ou baciloscopia positiva',action:'Classificar como MB e usar duração de 12 meses da PQT-U.',quality:'A',source:'PCDT Hanseníase – Ministério da Saúde'},
      {finding:'Criança <15 anos ou caso em contato domiciliar',action:'Intensificar investigação de contatos por sinalizar transmissão recente/ativa.',quality:'B',source:'Ministério da Saúde'},
      {finding:'Suspeita de hanseníase neural pura ou diagnóstico duvidoso',action:'Encaminhar para unidade de referência para exame neurológico especializado, baciloscopia/biópsia/eletrofisiologia conforme caso.',quality:'B',source:'PCDT Hanseníase – Ministério da Saúde'}
    ],
    'Lúpus eritematoso cutâneo':[
      {finding:'Lesão ativa no couro cabeludo com risco de cicatriz',action:'Escalar tratamento anti-inflamatório precocemente; atraso aumenta risco de alopecia cicatricial definitiva.',quality:'B',source:'JEADV 2026 CLE review'},
      {finding:'Sinais de envolvimento sistêmico',action:'Ampliar investigação e coordenar com reumatologia; a decisão deixa de ser exclusivamente dermatológica.',quality:'B',source:'CLE/SLE guidelines'},
      {finding:'Doença disseminada ou refratária a tópico',action:'Hidroxicloroquina passa a ocupar posição central; refratários podem exigir terapia sistêmica adicional.',quality:'B',source:'JEADV 2026 CLE review'}
    ],
    'Prurigo nodular':[
      {finding:'Prurido intenso + doença moderada-grave + múltiplos nódulos',action:'Subir dupilumabe/nemolizumabe na hierarquia, em vez de insistir apenas em tópicos/anti-histamínicos.',quality:'A',source:'BAD living guideline 2025/2026'},
      {finding:'Prurido desproporcional ou causa cutânea insuficiente',action:'Investigar doença sistêmica, medicamentosa, neuropática ou psiquiátrica conforme história.',quality:'B',source:'Prurigo guidelines 2025–2026'}
    ],
    'Pênfigo vulgar':[
      {finding:'Doença moderada-grave ou mucosa extensa',action:'Rituximabe + corticosteroide de curto prazo passa a ser estratégia preferencial.',quality:'B',source:'EADV S2k + estudos contemporâneos'},
      {finding:'Disfagia, erosões extensas, desidratação ou infecção',action:'Sair do fluxo ambulatorial comum e considerar hospitalização/centro de referência.',quality:'B',source:'AIBD guidance'},
      {finding:'Dsg3 persistente elevado/queda insuficiente após rituximabe',action:'Aumenta preocupação com recaída e pode justificar vigilância/retreatment mais próximo.',quality:'B',source:'JAMA Dermatology 2025'}
    ],
    'Penfigoide bolhoso':[
      {finding:'Idoso frágil com doença extensa',action:'Preferir estratégia que minimize corticosteroide sistêmico; corticoide tópico superpotente pode ser primeira linha mesmo em doença extensa se viável.',quality:'B',source:'EADV S2k bullous pemphigoid'},
      {finding:'Prurido novo persistente sem bolhas em idoso',action:'Considerar forma não bolhosa e indicar biópsia/DIF se o quadro for compatível.',quality:'B',source:'EADV/diagnostic review'},
      {finding:'Refratariedade ou contraindicação a corticoide',action:'Subir poupadores e terapias-alvo/biológicas conforme perfil e aprovação.',quality:'B',source:'EADV + contemporary reviews'}
    ],
    'Dermatite periorificial':[
      {finding:'Uso atual de corticoide facial',action:'Retirada planejada é parte obrigatória do tratamento; alertar para rebote transitório.',quality:'B',source:'JAAD 2026 review'},
      {finding:'Doença moderada-grave ou refratária',action:'Tetraciclina oral sobe na hierarquia em relação a tópicos isolados.',quality:'B',source:'JAAD 2026 review'}
    ],
    'Pitiríase rósea':[
      {finding:'Erupção típica e pouco sintomática',action:'Observação e sintomáticos; não há necessidade de terapia sistêmica.',quality:'B',source:'NMA 2024'},
      {finding:'Extensa, persistente ou muito sintomática',action:'Considerar aciclovir para abreviar erupção.',quality:'A/B',source:'Network meta-analysis'},
      {finding:'Palmas/plantas, mucosa ou risco sexual',action:'Excluir sífilis secundária antes de assumir pitiríase rósea.',quality:'B',source:'Clinical differential practice'}
    ],
    'Pitiríase versicolor':[
      {finding:'Doença limitada',action:'Manter terapia tópica como primeira linha.',quality:'B',source:'Systematic review + clinical review'},
      {finding:'Doença extensa/recorrente/refratária',action:'Considerar antifúngico sistêmico e manutenção preventiva.',quality:'B/C',source:'Pityriasis versicolor reviews'},
      {finding:'Alteração objetiva de sensibilidade',action:'Interromper raciocínio de micose superficial e investigar hanseníase.',quality:'B',source:'PCDT Hanseníase + diferencial clínico'}
    ],
    'Verrugas virais cutâneas':[
      {finding:'Lesão plantar dolorosa ou poucas verrugas comuns',action:'Ácido salicílico/crioterapia seguem como opções centrais.',quality:'A',source:'Cutaneous warts GRADE guideline'},
      {finding:'Lesão atípica, ulcerada ou refratária em imunossuprimido',action:'Biopsiar antes de novas destruições para excluir neoplasia.',quality:'B',source:'Warts guideline'}
    ],
    'Molusco contagioso':[
      {finding:'Poucas lesões assintomáticas em imunocompetente',action:'Observação é aceitável; tratamento ativo não é obrigatório.',quality:'B',source:'CDC 2025'},
      {finding:'Numerosos, gigantes, refratários ou adulto atípico',action:'Avaliar imunossupressão/HIV e considerar tratamento ativo.',quality:'B',source:'CDC + systematic review 2026'},
      {finding:'Eczema perilesional importante',action:'Tratar a dermatite associada para reduzir coçadura e autoinoculação.',quality:'B',source:'Clinical practice'}
    ],
    'Herpes simples cutâneo/genital':[
      {finding:'Primeiro episódio genital',action:'Tratar sempre com antiviral sistêmico por 7–10 dias.',quality:'A',source:'CDC STI Guidelines'},
      {finding:'Recorrência frequente ou alto impacto/transmissão',action:'Oferecer terapia supressiva diária em vez de apenas episódica.',quality:'A',source:'CDC STI Guidelines'},
      {finding:'Ocular, neurológico, disseminado ou imunossupressão grave',action:'Escalar para avaliação especializada/hospitalar e antiviral IV quando indicado.',quality:'A/B',source:'CDC STI Guidelines'}
    ],
    'Impetigo e ectima':[
      {finding:'Poucas lesões superficiais',action:'Preferir antibiótico tópico e reduzir exposição sistêmica.',quality:'A/B',source:'CDC 2025 + SSTI GRADE 2026'},
      {finding:'Múltiplas lesões, surto ou ectima',action:'Usar antibiótico oral cobrindo S. aureus e estreptococo conforme epidemiologia local.',quality:'A/B',source:'SSTI GRADE 2026'},
      {finding:'Falha em 3–5 dias ou recorrência',action:'Cultivar e revisar MRSA, adesão e diagnóstico.',quality:'B',source:'Rapid Evidence Review 2026'}
    ],
    'Sífilis cutânea (primária/secundária)':[
      {finding:'Sífilis primária/secundária bem estadiada',action:'Penicilina G benzatina 2,4 milhões UI IM dose única é o esquema padrão no adulto.',quality:'A',source:'CDC STI Guidelines'},
      {finding:'Sintoma ocular, auditivo ou neurológico',action:'Mudar investigação e tratamento para via de neurossífilis/ocular/ótica; não usar apenas esquema IM simples.',quality:'A',source:'CDC STI Guidelines'},
      {finding:'Gestação + alergia à penicilina',action:'Dessensibilização e penicilina; alternativas não substituem adequadamente a prevenção fetal.',quality:'A',source:'CDC STI Guidelines'}
    ]
  });
})();