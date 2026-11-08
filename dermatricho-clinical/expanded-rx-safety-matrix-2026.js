/* Cobertura complementar de segurança para 41 fármacos.
   Regras de triagem, não banco exaustivo de DDIs nem substituto de bula ANVISA. */
(() => {
  // Cada campo é uma precaução por medicamento; não equivale a monografia revisada.
  const rules={
    'rx-finasteride-topical':'Finasterida tópica pode ter absorção sistêmica: evitar exposição na gestação, avaliar potencial reprodutivo e confirmar manipulação/formulação e dose. Uso capilar é off-label em muitas apresentações.',
    'rx-bicalutamide':'Bicalutamida antiandrogênica em mulheres para alopecia é off-label; revisar hepatotoxicidade, função hepática e potencial gestacional/contracepção. Não usar como proteção para manter anabolizantes.',
    'rx-azelaic':'Ácido azelaico tópico: irritação, ardor e tolerabilidade variam com concentração/veículo; revisar indicação e uso na gestação sem extrapolar bula.',
    'rx-hydroquinone':'Hidroquinona: evitar durante gestação; limitar a duração e monitorar irritação/ocronose exógena; fotoproteção indispensável.',
    'rx-ivermectin-topical':'Ivermectina tópica: verificar formulação aprovada, faixa etária, hipersensibilidade e condição gestacional; não confundir com ivermectina oral.',
    'rx-metronidazole-topical':'Metronidazol tópico: confirmar indicação (rosácea), formulação, irritação e restrições específicas; não extrapolar doses sistêmicas.',
    'rx-baricitinib':'JAK oral: riscos de infecção grave, zóster, trombose, eventos cardiovasculares e neoplasia; rastrear TB/hepatites, hemograma, lipídios, função renal e vacinação.',
    'rx-ritlecitinib':'Inibidor de JAK3/TEC oral: revisar infecções, TB/hepatites, citopenias, vacinas e risco cardiovascular/trombótico; idade e indicação são específicas.',
    'rx-dupilumab':'Bloqueio IL-4/IL-13: revisar conjuntivite/queratite, helmintíase conforme risco, vacinação e doença ocular; não equivale a JAK oral.',
    'rx-omalizumab':'Anti-IgE: observar hipersensibilidade/anafilaxia pós-administração, indicação específica e avaliação da resposta; dose depende da indicação.',
    'rx-adalimumab':'Anti-TNF: rastrear TB ativa/latente, hepatite B, infecções, vacinação, demielinização e insuficiência cardíaca.',
    'rx-secukinumab':'Anti-IL-17A: rastreio de TB/infecção e vacinas; doença inflamatória intestinal pode ser agravada; candidíase mucocutânea é evento relevante.',
    'rx-itraconazole':'Itraconazol oral: potente inibidor CYP3A4, numerosas interações, risco hepático e de insuficiência cardíaca; absorção depende da formulação.',
    'rx-valacyclovir':'Valaciclovir sistêmico: ajustar conforme função renal, hidratar quando apropriado e não transpor esquemas entre HSV e zóster.',
    'rx-minocycline':'Minociclina: tontura, hiperpigmentação, hepatite autoimune e hipersensibilidade; evitar associação com isotretinoína; revisar gestação.',
    'rx-sarecycline':'Sareciclina: antibiótico tetraciclina, evitar associação com isotretinoína; uso em acne exige terapia tópica concomitante, limitação temporal e avaliação reprodutiva.',
    'rx-clascoterone':'Clascoterona tópica: revisar gravidez, idade/área, irritação e potencial supressão adrenal em usos extensos; verificar disponibilidade brasileira.',
    'rx-clindamycin-topical':'Clindamicina tópica: evitar monoterapia antibiótica na acne, combinar com peróxido de benzoíla quando apropriado e limitar curso por resistência.',
    'rx-dapsone-topical':'Dapsona tópica: uso em acne não equivale à dapsona oral. Pode causar descoloração temporária com peróxido de benzoíla; revisar histórico de metemoglobinemia.',
    'rx-pimecrolimus':'Pimecrolimo tópico: confirmar idade, indicação, local e pele infectada; rever orientação de fotoproteção e uso intermitente.',
    'rx-ruxolitinib-topical':'Ruxolitinibe tópico: não extrapolar bula ou riscos quantitativos de JAK oral; verificar área máxima tratada, indicação, idade, gestação e registro local.',
    'rx-apremilast':'Apremilaste: revisar perda ponderal, diarreia, náusea, humor/depressão e ajuste renal em insuficiência grave.',
    'rx-deucravacitinib':'Inibidor alostérico TYK2: não confundir com inibidor oral de JAK1/2; verificar infecção, vacina, hepatopatias e interações pela bula específica.',
    'rx-bimekizumab':'Anti-IL-17A/F: rastrear TB e infecção; candidíase mucocutânea, DII e vacinação exigem atenção.',
    'rx-infliximab':'Anti-TNF IV: protocolo especializado de infusão, reações infusionais, TB/HBV e insuficiência cardíaca; não é receita ambulatorial simples.',
    'rx-fluorouracil-topical':'5-FU tópico: reação inflamatória local intensa, fotosensibilidade e exposição inadvertida; contraindicar durante gestação e revisar deficiência DPD quando clinicamente relevante.',
    'rx-imiquimod':'Imiquimode tópico: inflamação intensa e reação sistêmica rara; confirmar indicação, área e esquema; evitar manipulação de mucosa sem indicação.',
    'rx-tirbanibulin':'Tirbanibulina tópica: indicação limitada por área/sítio e tempo; verificar bula brasileira, idade, gestação e irritação.',
    'rx-griseofulvin':'Griseofulvina oral: interações, hepatotoxicidade, gestação e contracepção; escolher conforme agente fúngico e duração.',
    'rx-ciclopirox':'Ciclopirox tópico: duração prolongada na unha, remoção/adesão e baixa eficácia em doença extensa; confirmar onicomicose antes de sistêmico.',
    'rx-efinaconazole':'Efinaconazol tópico: indicação/tempo são específicos e disponibilidade brasileira deve ser verificada; evitar prometer cura em onicomicose com matriz extensa.',
    'rx-methotrexate':'Metotrexato: uso dermatológico SEMANAL, NUNCA diário. Exige monitorização hematológica, hepática, renal, interações e suplementação com ácido fólico conforme protocolo; teratogênico.',
    'rx-cyclosporine':'Ciclosporina: monitorar PA, função renal, eletrólitos, infecção e interações por CYP3A4; atenção a macrolídeos, azóis e toranja.',
    'rx-mmf':'Micofenolato: teratogênico; revisar contracepção, hemograma, infecções, função renal/hepática e interações; imunossupressão requer seguimento.',
    'rx-acitretin':'Acitretina: teratogênica; evitar gravidez durante e por pelo menos 3 anos após interrupção conforme bula de referência, revisar álcool/etretinato, lipídios e enzimas hepáticas.',
    'rx-azathioprine':'Azatioprina: hemograma e função hepática; avaliar TPMT/NUDT15 conforme protocolo, risco infeccioso e interação crítica com alopurinol/febuxostate.',
    'rx-upadacitinib':'JAK1 sistêmico: revisar risco de infecção grave, TB, herpes-zóster, trombose, eventos CV e neoplasia; hemograma e lipídios, vacinação e gravidez.',
    'rx-abrocitinib':'JAK1 sistêmico: risco de citopenias, infecção grave, zóster e eventos trombóticos/cardiovasculares; avaliação basal e monitorização específica.',
    'rx-tralokinumab':'Anti-IL-13: conjuntivite/infecções oculares, helmintos, hipersensibilidade e vacinação; não aplicar checklist de JAK oral automaticamente.',
    'rx-risankizumab':'Anti-IL-23: verificar TB/infecção e vacinas; monitorização difere de anti-TNF e JAKs.',
    'rx-mupirocin':'Mupirocina tópica: uso curto e indicado (impetigo localizado); recorrência e uso prolongado favorecem resistência.'
  };
  const JAK=new Set(['rx-baricitinib','rx-ritlecitinib','rx-upadacitinib','rx-abrocitinib']);
  const checkTB=new Set([...JAK,'rx-adalimumab','rx-infliximab','rx-secukinumab','rx-bimekizumab','rx-risankizumab']);
  const systemicAntiInfectious=new Set(['rx-itraconazole','rx-griseofulvin','rx-valacyclovir']);
  const teratogens=new Set(['rx-acitretin','rx-methotrexate','rx-mmf','rx-bicalutamide']);
  const avoidGestation=new Set(['rx-finasteride-topical','rx-hydroquinone','rx-clascoterone','rx-fluorouracil-topical','rx-minocycline','rx-sarecycline','rx-griseofulvin',...JAK]);
  const severeImmuno=new Set([...checkTB,'rx-methotrexate','rx-cyclosporine','rx-mmf','rx-azathioprine']);
  function has(v,a){const t=String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return a.some(s=>t.includes(s))}
  function evaluate(rx,p){
    const id=rx?.id;if(!rules[id])return [];
    const result=[{level:'caution',text:rules[id]}];
    const preg=['possible','trying','pregnant'].includes(p.pregnancy);
    if(teratogens.has(id)&&preg)result.push({level:'block',text:'Uso para indicação dermatológica bloqueado diante de gestação/tentativa/possibilidade. Rever contraindicação e plano reprodutivo.'});
    if(avoidGestation.has(id)&&preg)result.push({level:'block',text:'Gestação/tentativa/possibilidade: não liberar esta opção dermatológica sem revisar contraindicação e alternativa.'});
    if(teratogens.has(id)&&p.sex==='female'&&p.pregnancy==='no'&&(!p.contraception||['unknown','no'].includes(p.contraception)))
      result.push({level:'incomplete',text:'Medicamento com risco fetal: registrar situação reprodutiva e plano de prevenção de gestação conforme bula local.'});
    if(['rx-methotrexate','rx-mmf','rx-acitretin'].includes(id)&&p.sex==='female'&&p.pregnancy==='no'&&(!p.pregtest||p.pregtest==='unknown'))
      result.push({level:'incomplete',text:'Confirmar teste de gestação/documentação de ausência de potencial reprodutivo antes de iniciar o fármaco.'});
    if(checkTB.has(id)){
      if(!p.tb||p.tb==='unknown')result.push({level:'incomplete',text:'Rastreio de tuberculose necessário para esta classe/indicação antes do início; registrar resultado.'});
      if(p.tb==='positive')result.push({level:'caution',text:'TB ativa/latente ou teste positivo: discutir investigação e tratamento conforme protocolo antes do imunobiológico/JAK.'});
    }
    if(severeImmuno.has(id)&&p.infection==='yes')result.push({level:'block',text:'Infecção ativa: interromper liberação e revisar risco/benefício de imunossupressão com especialista.'});
    if(JAK.has(id)){
      if(!p.hbv||p.hbv==='unknown')result.push({level:'incomplete',text:'Rever hepatites virais (HBV entre elas), vacinação, hemograma e risco de trombose/CV antes do JAK oral.'});
      if(p.pregnancy==='no'&&p.sex==='female'&&(!p.contraception||p.contraception==='unknown'))result.push({level:'incomplete',text:'Registrar avaliação reprodutiva/contracepção para uso de JAK oral.'});
    }
    if(id==='rx-infliximab')result.push({level:'block',text:'Infliximabe exige protocolo de infusão e rastreamento em centro especializado; não liberar pelo carrinho de receita simples.'});
    if(id==='rx-methotrexate'){
      if(p.renal==='unknown'||!p.renal)result.push({level:'incomplete',text:'Metotrexato exige função renal conhecida e revisão de dose/monitorização.'});
      if(has(p.meds,['trimetoprim','sulfametoxazol']))result.push({level:'block',text:'Metotrexato + trimetoprim-sulfametoxazol pode causar mielotoxicidade grave: revisar/evitar associação.'});
      if(p.hepatic!=='normal')result.push({level:'caution',text:'Alteração hepática ou não avaliada: monitorização e contraindicações específicas do MTX.'});
    }
    if(id==='rx-azathioprine'){
      if(has(p.meds,['alopurinol','febuxostate']))result.push({level:'block',text:'Azatioprina + alopurinol/febuxostate: interação grave; não liberar sem plano especializado de ajuste/alternativa.'});
      result.push({level:'caution',text:'Antes de iniciar, avaliar hemograma, função hepática e TPMT/NUDT15 quando indicado; risco de mielossupressão.'});
    }
    if(id==='rx-cyclosporine'&&(p.renal==='reduced'||p.renal==='dialysis'||p.bp==='high'))result.push({level:'caution',text:'Função renal reduzida ou hipertensão aumentam toxicidade por ciclosporina; rever alternativa/monitorização.'});
    if(id==='rx-itraconazole'&&(p.cardiac==='cardiac'||p.cardiac==='angina_pericardial'))result.push({level:'caution',text:'Itraconazol pode agravar insuficiência cardíaca; revisar risco e contraindicações conforme indicação.'});
    if(id==='rx-valacyclovir'&&(p.renal==='unknown'||!p.renal))result.push({level:'incomplete',text:'Valaciclovir: confirmar função renal para definir esquema, principalmente em idosos.'});
    if(systemicAntiInfectious.has(id)&&p.hepatic==='active'&&id!=='rx-valacyclovir')result.push({level:'caution',text:'Hepatopatia ativa: revisar uso de antifúngico sistêmico e alternativa.'});
    if(id==='rx-minocycline'||id==='rx-sarecycline'){
      if(has(p.meds,['isotretinoina']))result.push({level:'block',text:'Tetraciclina + isotretinoína: risco de hipertensão intracraniana; evitar associação.'});
    }
    if(id==='rx-ruxolitinib-topical')result.push({level:'info',text:'Ruxolitinibe tópico não é automaticamente intercambiável com JAK sistêmico; revisar limites de área e bula específica.'});
    if(id==='rx-deucravacitinib')result.push({level:'info',text:'TYK2 seletivo não deve receber automaticamente o mesmo rótulo de risco/alertas dos JAK1/2 sistêmicos.'});
    return result;
  }
  window.DT_DRUG_SAFETY_MATRIX={rules,evaluate,lastReview:'2026-11-08',coverage:Object.keys(rules).length};
})();