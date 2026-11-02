(() => {
  const panel=document.querySelector('#detailPanel'); if(!panel)return;
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const norm=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const data={
    'Alopecia por tração':{
      top:['Eliminar imediatamente o penteado/alongamento tensionante; isso é o tratamento etiológico.','Minoxidil tópico 2–5% pode ser usado quando ainda há folículos viáveis; minoxidil oral em baixa dose pode ser considerado em casos selecionados.'],
      sys:['Se houver inflamação perifolicular ativa, corticosteroide tópico potente por curto período ou intralesional pode ser usado.'],
      proc:['Transplante capilar somente após estabilidade clínica prolongada e confirmação de que a alopecia está cicatricial/estável.'],
      low:['PRP/mesoterapia não substituem remoção da tração e têm evidência limitada.']
    },
    'Tricotilomania':{
      top:['Intervenção comportamental estruturada, especialmente habit-reversal training, é a base terapêutica.'],
      sys:['N-acetilcisteína 1.200–2.400 mg/dia tem evidência em adultos selecionados; clomipramina/olanzapina podem ser consideradas com psiquiatria conforme comorbidades e risco.'],
      proc:['Tratar dermatoses coexistentes e complicações traumáticas; abordagem deve ser não confrontativa.'],
      low:['Minoxidil/PRP não tratam o comportamento causal e não devem ser apresentados como terapia principal.']
    },
    'Foliculite decalvante':{
      top:['Corticosteroide tópico ou intralesional como adjuvante à terapia sistêmica; tacrolimo 0,1% ou dapsona 5% tópica podem ser alternativas de segunda linha.'],
      sys:['Inflamação moderada-grave: antibiótico oral é recomendado; combinações como clindamicina + rifampicina são usadas, mas recidiva após suspensão é frequente.','Isotretinoína oral deve ser considerada em doença ativa leve sem pústulas/crostas e é recomendada em doença refratária/persistente; terapias avançadas (adalimumabe, JAK, dapsona, hidroxicloroquina, ciclosporina) ficam para refratários selecionados.'],
      proc:['Cirurgia/laser em doença localizada selecionada; transplante apenas com doença inativa.'],
      low:['Objetivo é interromper inflamação; não prometer repilação em área cicatricial.']
    },
    'Celulite dissecante do couro cabeludo':{
      top:['Antissépticos/tópicos são adjuvantes; corticoide intralesional pode ajudar em nódulos inflamatórios selecionados.'],
      sys:['Retinoide oral, sobretudo isotretinoína, permanece primeira linha sistêmica frequente; antibióticos sistêmicos podem controlar componente infeccioso/inflamatório.','Refratária/moderada-grave: biológicos anti-TNF e, em séries recentes, IL-17/IL-23/JAK podem ser considerados em centros experientes.'],
      proc:['Drenagem quando abscesso flutuante; laser/PDT ou excisão cirúrgica em doença estrutural persistente.'],
      low:['Evidência de terapias avançadas ainda é majoritariamente observacional.']
    },
    'Tinea capitis':{
      top:['Xampu com cetoconazol 2% ou sulfeto de selênio é adjuvante para reduzir transmissão; não cura isoladamente.'],
      sys:['Tratamento deve ser sistêmico: terbinafina, griseofulvina, itraconazol ou fluconazol conforme espécie, idade/peso, disponibilidade e interações.','Kerion pode exigir manejo anti-inflamatório adicional e seguimento próximo para reduzir cicatriz.'],
      proc:['Avaliar/contactar conviventes conforme contexto epidemiológico e orientar não compartilhar pentes/toalhas.'],
      low:['Não usar apenas antifúngico tópico no couro cabeludo.']
    },
    'Dermatite de contato':{
      top:['Evitar o agente causal é a intervenção mais importante.','Corticosteroide tópico de potência adequada à área e espessura; tacrolimo/pimecrolimo em face/pregas ou manutenção poupadora.'],
      sys:['Curso sistêmico de corticosteroide pode ser necessário em dermatite alérgica extensa/intensa, individualizando duração e desmame; não usar cronicamente.'],
      proc:['Patch test é a principal ferramenta para dermatite alérgica recorrente/crônica ou com suspeita ocupacional/cosmética.'],
      low:['Antifúngico/antibiótico empírico não deve substituir investigação de alérgeno/irritante.']
    },
    'Urticária crônica espontânea':{
      top:['Terapias tópicas têm papel mínimo; foco é controle sistêmico e identificação de agravantes.'],
      sys:['1ª linha: anti-histamínico H1 de segunda geração diariamente; se insuficiente, aumentar até 4x a dose padrão conforme guideline e tolerabilidade.','Persistência após otimização: omalizumabe 300 mg SC a cada 4 semanas é o biológico de referência.','Refratariedade: ciclosporina em paciente selecionado; atualizações recentes também incluem opções como dupilumabe/remibrutinibe conforme aprovação local.'],
      proc:['Monitorar UAS7/UCT para decidir escalonamento e redução.'],
      low:['Evitar corticosteroide sistêmico crônico; curso curto apenas em exacerbação selecionada.']
    },
    'Escabiose':{
      top:['Permetrina 5% do pescoço para baixo por 8–14 h; repetir conforme protocolo/ciclo, frequentemente após 7–14 dias.','Tratar contatos simultaneamente e descontaminar roupas/roupa de cama.'],
      sys:['Ivermectina 200 mcg/kg VO, com segunda dose necessária por baixa atividade ovicida; CDC usa repetição em 14 dias.','Escabiose crostosa: combinar permetrina intensiva + ivermectina em múltiplas doses (dias 1, 2, 8, 9 e 15; casos graves podem exigir dias 22 e 29).'],
      proc:['Reavaliar persistência >2 semanas: falha de aplicação, reinfestação, resistência ou prurido pós-escabiose.'],
      low:['Evitar lindano quando houver alternativas devido risco neurotóxico.']
    },
    'Herpes-zóster':{
      top:['Cuidados locais suaves; antibiótico tópico não é rotina sem infecção bacteriana secundária.'],
      sys:['Valaciclovir 1 g VO 3x/dia por 7 dias é esquema usual em adulto imunocompetente; aciclovir ou famciclovir são alternativas. Ajustar função renal.','Analgesia escalonada; dor neuropática pode exigir gabapentinoide/TCA conforme perfil.'],
      proc:['Encaminhar imediatamente se acometimento ocular, neurológico, disseminado ou imunossupressão importante.'],
      low:['Corticosteroide sistêmico não substitui antiviral e não previne neuralgia pós-herpética.']
    },
    'Tinea corporis/cruris':{
      top:['Terbinafina 1% 1–2x/dia por 1–2 semanas ou azólicos tópicos geralmente por 2–4 semanas em doença limitada.'],
      sys:['Terbinafina 250 mg/dia ou itraconazol em esquemas curtos podem ser usados em doença extensa, folicular ou refratária; confirmar diagnóstico/interações.'],
      proc:['Pesquisar reservatório (pé/unha/contato/animal) quando recorrente.'],
      low:['Evitar combinações antifúngico + corticosteroide sem indicação clara, pois podem mascarar tinea.']
    },
    'Paroníquia':{
      top:['Aguda sem abscesso: medidas locais e, quando necessário, antibiótico tópico direcionado.','Crônica: reduzir umidade/irritantes + corticosteroide tópico; antifúngico apenas se Candida/dermatofitose contribuírem.'],
      sys:['Antibiótico oral se celulite extensa, imunossupressão ou falha após drenagem/medidas locais.'],
      proc:['Abscesso: drenagem é tratamento central; avaliar corpo estranho/unha encravada.'],
      low:['Antibiótico sistêmico isolado não resolve abscesso fechado.']
    },
    'Ceratose actínica':{
      top:['5-fluorouracil 5% 1–2x/dia por 2–4 semanas é terapia de campo clássica.','Imiquimode conforme concentração/protocolo; diclofenaco 2x/dia por 2–3 meses; tirbanibulina 1% 1x/dia por 5 dias em face/couro cabeludo conforme bula.'],
      sys:['Não há tratamento sistêmico de rotina para AK isolada.'],
      proc:['Crioterapia para lesões isoladas; PDT para campo de cancerização; laser em casos selecionados.'],
      low:['Biópsia antes de “tratamento de campo” se houver induração, ulceração, dor ou crescimento sugestivo de CEC.']
    },
    'Carcinoma basocelular':{
      top:['Imiquimode ou 5-FU apenas em CBC superficial, baixo risco e situações selecionadas quando cirurgia não é a melhor opção.'],
      sys:['Doença localmente avançada/inoperável: inibidores de Hedgehog (vismodegibe/sonidegibe); anti-PD-1 como cemiplimabe em cenários selecionados conforme oncologia.'],
      proc:['Excisão convencional para baixo risco; Mohs/controle completo de margens para alto risco, recorrente ou áreas críticas; curetagem/eletrodissecção em baixo risco selecionado.'],
      low:['Não usar terapias tópicas em tumor de alto risco/agressivo sem indicação adequada.']
    },
    'Carcinoma espinocelular cutâneo':{
      top:['Terapias tópicas não são tratamento de CEC invasivo; podem ter papel apenas em doença intraepidérmica selecionada.'],
      sys:['CEC localmente avançado/metastático: anti-PD-1 (ex.: cemiplimabe/pembrolizumabe) conforme estadiamento, aprovação e oncologia.'],
      proc:['Cirurgia é tratamento mais eficaz; excisão ou Mohs conforme NCCN/BWH, localização, PNI, profundidade e recorrência. Radioterapia é alternativa/adjuvante selecionada.'],
      low:['Tumor de alto risco exige avaliação linfonodal/estadiamento conforme fatores; não tratar como lesão ambulatorial simples.']
    },
    'Melanoma cutâneo':{
      top:['Não há terapia tópica para melanoma invasivo.'],
      sys:['Estágio III/IV e alguns estágios II de alto risco podem requerer imunoterapia anti-PD-1 ou terapia BRAF/MEK quando BRAF V600 mutado; esquema depende do estágio e oncologia.'],
      proc:['Excisão ampla com margens conforme Breslow; considerar linfonodo sentinela conforme espessura/ulceração e fatores clínicos.'],
      low:['Não concluir tratamento ou prognóstico apenas pelo Breslow sem N/M e histopatologia completa.']
    }
  };
  function block(title,items){return `<section class="tc-section"><h5>${esc(title)}</h5><ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`}
  function inject(){
    if(document.querySelector('.nav-btn.active')?.dataset.view==='prescriptions')return;
    const name=panel.querySelector('.detail-title')?.textContent?.trim(); const cfg=data[name]; if(!cfg)return;
    const d=[...panel.querySelectorAll('details.clinical-accordion')].find(x=>norm(x.querySelector('summary')?.textContent||'').includes('tratamento completo'));
    if(!d||d.dataset.extraDeep==='1')return; d.dataset.extraDeep='1';
    const body=d.querySelector('.accordion-body'); if(!body)return;
    body.innerHTML=`<div class="tc-compendium"><div class="tc-hero"><span>Tratamento completo</span><h4>Opções organizadas por modalidade e momento de uso</h4></div>${block('Tópicos / medidas locais',cfg.top)}${block('Orais / sistêmicos',cfg.sys)}${block('Procedimentos / estratégia prática',cfg.proc)}${cfg.low?.length?`<section class="tc-section tc-avoid"><h5>Evitar / limitações</h5><ul>${cfg.low.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}<p class="tc-evidence">Síntese clean-room baseada em diretrizes/revisões públicas atuais. Confirmar bula local, idade, gestação, comorbidades e interações antes da prescrição.</p></div>`;
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();