(() => {
  const panel=document.querySelector('#detailPanel'); if(!panel)return;
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const phys={
    'Alopecia androgenética masculina':'Miniaturização progressiva de folículos geneticamente suscetíveis sob ação da di-hidrotestosterona (DHT), principalmente via 5-alfa-redutase, com encurtamento do anágeno e aumento relativo de fios miniaturizados.',
    'Alopecia androgenética feminina':'Miniaturização folicular progressiva multifatorial, com participação variável de sinalização androgênica, genética, idade e microambiente folicular; hiperandrogenismo clínico não é obrigatório.',
    'Eflúvio telógeno':'Mudança sincronizada de maior número de folículos do anágeno para telógeno após gatilho sistêmico/metabólico/medicamentoso; o shedding aparece tipicamente semanas a meses depois.',
    'Alopecia areata':'Doença autoimune mediada por linfócitos T contra o folículo em fase anágena, com perda do privilégio imune folicular e inflamação perifolicular não cicatricial.',
    'Alopecia fibrosante frontal':'Alopecia cicatricial linfocítica do espectro do líquen plano pilar, com inflamação dirigida ao epitélio folicular superior e destruição permanente de unidades foliculares.',
    'Líquen plano pilar':'Inflamação linfocítica de interface envolvendo infundíbulo/istmo e região de células-tronco foliculares, levando a fibrose e alopecia cicatricial irreversível.',
    'Alopecia por tração':'Tensão mecânica repetitiva causa inflamação e dano folicular; inicialmente é não cicatricial, mas exposição prolongada pode destruir permanentemente o folículo.',
    'Tricotilomania':'Transtorno de comportamento repetitivo focado no corpo em que arrancamento recorrente causa trauma mecânico, quebra e interrupção variável do ciclo capilar.',
    'Foliculite decalvante':'Alopecia cicatricial neutrofílica crônica associada a disbiose/colonização bacteriana e resposta inflamatória anormal, produzindo pústulas, tufting e fibrose progressiva.',
    'Celulite dissecante do couro cabeludo':'Doença de oclusão folicular com ruptura do folículo, inflamação profunda, abscessos e túneis, pertencente ao espectro das doenças de oclusão folicular.',
    'Tinea capitis':'Infecção dermatofítica da haste e do folículo piloso; padrão endothrix/ectothrix e intensidade inflamatória dependem da espécie e da resposta do hospedeiro.',
    'Dermatite seborreica':'Inflamação em áreas seborreicas associada à interação entre sebo, Malassezia, barreira cutânea e resposta imune individual.',
    'Psoríase do couro cabeludo':'Doença imune mediada por eixo IL-23/Th17 com hiperproliferação queratinocitária e inflamação crônica, manifestando-se em placas eritematoescamosas do couro cabeludo.',
    'Acne vulgar':'Unidade pilossebácea afetada por hiperseborreia, hiperqueratinização folicular, Cutibacterium acnes e inflamação; andrógenos e genética modulam gravidade.',
    'Rosácea':'Disfunção neurovascular e imune inata com aumento de reatividade vascular, inflamação e participação variável de Demodex/microbioma e barreira cutânea.',
    'Dermatite atópica':'Disfunção de barreira e inflamação predominantemente tipo 2, com participação de IL-4/IL-13 e outros eixos imunes, além de alteração do microbioma e prurido neuroimune.',
    'Dermatite de contato':'Na forma irritativa há dano direto da barreira; na alérgica ocorre hipersensibilidade tardia mediada por células T após sensibilização ao alérgeno.',
    'Psoríase':'Doença inflamatória sistêmica imune mediada principalmente pelo eixo IL-23/Th17, com proliferação queratinocitária acelerada e associação com comorbidades metabólicas/articulares.',
    'Hidradenite supurativa':'Oclusão e ruptura folicular com inflamação profunda crônica e formação de túneis/cicatrizes; vias TNF, IL-17 e outras redes inflamatórias participam da perpetuação.',
    'Urticária crônica espontânea':'Ativação de mastócitos/basófilos com liberação de histamina e mediadores, frequentemente por mecanismos autoimunes/autoalérgicos, produzindo urticas e/ou angioedema recorrentes.',
    'Vitiligo':'Destruição autoimune de melanócitos em indivíduos suscetíveis, com papel de estresse oxidativo, IFN-γ/JAK-STAT e memória imune cutânea.',
    'Melasma':'Hiperpigmentação adquirida multifatorial com aumento de melanogênese, fotoexposição, influência hormonal, alterações vasculares e sinais de fotoenvelhecimento dérmico.',
    'Escabiose':'Infestação pelo Sarcoptes scabiei; sintomas decorrem da presença do ácaro e de resposta de hipersensibilidade a antígenos do parasita.',
    'Herpes-zóster':'Reativação do vírus varicela-zóster latente em gânglios sensitivos, com replicação neural/cutânea ao longo de um dermátomo e inflamação neurítica.',
    'Tinea corporis/cruris':'Infecção dermatofítica da camada córnea por Trichophyton/Microsporum/Epidermophyton, favorecida por umidade, contato e reservatórios em pés/unhas/animais.',
    'Onicomicose':'Infecção fúngica da lâmina/leito ungueal, principalmente por dermatófitos, com progressão lenta e dificuldade de penetração terapêutica.',
    'Paroníquia':'Inflamação da prega ungueal; aguda costuma envolver ruptura de barreira e infecção bacteriana, enquanto crônica é predominantemente inflamatória por umidade/irritantes com colonização secundária variável.',
    'Ceratose actínica':'Proliferação clonal de queratinócitos atípicos induzida por dano ultravioleta cumulativo, representando marcador de campo de cancerização e risco de progressão para CEC.',
    'Carcinoma basocelular':'Neoplasia de queratinócitos basaloides fortemente relacionada à ativação aberrante da via Hedgehog, geralmente induzida por dano UV e predisposição genética.',
    'Carcinoma espinocelular cutâneo':'Neoplasia maligna de queratinócitos associada a dano UV, imunossupressão e mutações acumuladas, com risco metastático dependente de fatores histológicos/anatômicos.',
    'Melanoma cutâneo':'Neoplasia maligna de melanócitos impulsionada por alterações oncogênicas como BRAF/NRAS/NF1 e dano UV, com potencial precoce de disseminação linfática/hematogênica.'
  };
  function maintenance(name){
    if(/androgenética|androgenetica/.test(name))return 'Manter terapia efetiva de forma contínua; interrupção tende a reverter ganhos. Fotografias/tricoscopia a cada 3–6 meses e ajuste de combinação conforme estabilização.';
    if(/areata/.test(name))return 'Após repilação, manter seguimento porque recaídas são frequentes. Registrar SALT e áreas especiais; redução de terapia sistêmica deve ser individualizada.';
    if(/fibrosante|Líquen plano pilar|Foliculite decalvante|Celulite dissecante/.test(name))return 'Objetivo de manutenção é ausência sustentada de atividade/progressão. Só discutir cirurgia/transplante após estabilidade documentada.';
    if(/Acne/.test(name))return 'Após controle, manter retinoide tópico e/ou agente não antibiótico; tratar cicatrizes apenas quando atividade estiver controlada. Evitar antibiótico crônico.';
    if(/Rosácea/.test(name))return 'Manter fotoproteção/skincare e terapia dirigida ao fenótipo; reduzir gatilhos individualmente. Recidiva é comum após suspensão total.';
    if(/Dermatite atópica/.test(name))return 'Emoliente contínuo e terapia proativa intermitente em áreas de recaída; revisar técnica, adesão, infecção e necessidade de escalonamento.';
    if(/^Psoríase/.test(name))return 'Doença crônica: manter a menor estratégia eficaz, rastrear artrite/comorbidades e evitar suspensão abrupta inadequada de terapias sistêmicas.';
    if(/Hidradenite/.test(name))return 'Controle de inflamação deve ser contínuo quando doença é recorrente; tratar túneis/dano estrutural e reduzir fatores agravantes sem responsabilização do paciente.';
    if(/Urticária/.test(name))return 'Avaliar controle por UCT/UAS7 e reduzir tratamento apenas após controle sustentado; reescalonar rapidamente se houver recorrência.';
    if(/Vitiligo/.test(name))return 'Após repigmentação, manutenção tópica intermitente pode reduzir recaída em áreas selecionadas; monitorar atividade e novas lesões.';
    if(/Melasma/.test(name))return 'Manutenção é essencial: fotoproteção ampla, controle de irritação e despigmentante não irritativo; recaídas são esperadas com fotoexposição.';
    if(/Escabiose/.test(name))return 'Prevenir reinfestação tratando contatos e ambiente. Prurido residual pode persistir após erradicação e não significa automaticamente falha.';
    if(/Herpes-zóster/.test(name))return 'Após episódio, avaliar vacinação contra zóster conforme idade/imunossupressão e recomendações vigentes.';
    if(/Tinea|Onicomicose/.test(name))return 'Eliminar reservatórios, reduzir umidade/oclusão e tratar tinea pedis/unhas concomitantes para reduzir recorrência.';
    if(/Ceratose actínica|Carcinoma|Melanoma/.test(name))return 'Fotoproteção rigorosa e vigilância periódica para recorrência/novos tumores; intervalo depende do risco e do diagnóstico histológico.';
    return 'Reavaliar resposta objetiva, adesão, efeitos adversos e fatores desencadeantes; manter apenas intervenções com benefício demonstrado e revisar necessidade de prevenção de recidiva.';
  }
  function details(title,body,badge=''){const d=document.createElement('details');d.className='clinical-accordion core-extra';d.innerHTML=`<summary><span>${esc(title)}</span><span class="summary-right">${badge?`<span class="accordion-badge">${badge}</span>`:''}<span class="chevron">⌄</span></span></summary><div class="accordion-body"><p>${esc(body)}</p></div>`;return d}
  function inject(){
    if(document.querySelector('.nav-btn.active')?.dataset.view==='prescriptions')return;
    const name=panel.querySelector('.detail-title')?.textContent?.trim();if(!name||!phys[name])return;
    if(panel.dataset.coreExtra===name)return;panel.dataset.coreExtra=name;
    panel.querySelectorAll('.core-extra').forEach(x=>x.remove());
    const tools=panel.querySelector('.accordion-tools');if(!tools)return;
    const p=details('Fisiopatologia / mecanismo',phys[name],'MECANISMO');tools.insertAdjacentElement('afterend',p);
    const follow=[...panel.querySelectorAll('details.clinical-accordion')].find(d=>/Acompanhamento e reavaliação/i.test(d.querySelector('summary')?.textContent||''));
    const m=details('Manutenção, prevenção e recidiva',maintenance(name),'LONGO PRAZO');
    if(follow)follow.insertAdjacentElement('afterend',m);else panel.querySelector('.integration-actions')?.insertAdjacentElement('beforebegin',m);
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();