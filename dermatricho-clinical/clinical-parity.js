(() => {
  const panel=document.querySelector('#detailPanel');
  const data=window.DERMA_TRICHO_DATA||[];
  if(!panel||!data.length)return;
  const STORE='dt-clinical-notes-v1';
  const UPDATED='02/11/2026';
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const norm=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const cid={
    'Alopecia androgenética masculina':'L64.0','Alopecia androgenética feminina':'L64.9','Eflúvio telógeno':'L65.0','Alopecia areata':'L63.9','Alopecia fibrosante frontal':'L66.1','Líquen plano pilar':'L66.1','Alopecia por tração':'L65.8','Tricotilomania':'F63.3','Foliculite decalvante':'L66.2','Celulite dissecante do couro cabeludo':'L66.3','Tinea capitis':'B35.0','Dermatite seborreica':'L21.9','Psoríase do couro cabeludo':'L40.9','Acne vulgar':'L70.0','Rosácea':'L71.9','Dermatite atópica':'L20.9','Dermatite de contato':'L25.9','Psoríase':'L40.9','Hidradenite supurativa':'L73.2','Urticária crônica espontânea':'L50.8','Vitiligo':'L80','Melasma':'L81.1','Escabiose':'B86','Herpes-zóster':'B02.9','Tinea corporis/cruris':'B35.4 / B35.6','Onicomicose':'B35.1','Paroníquia':'L03.0','Ceratose actínica':'L57.0','Carcinoma basocelular':'C44.9*','Carcinoma espinocelular cutâneo':'C44.9*','Melanoma cutâneo':'C43.9*'
  };
  const special={
    'Alopecia androgenética masculina':['Revisar início, velocidade de progressão, história familiar e exposição a andrógenos/anabolizantes.','Documentar padrão frontotemporal/vértex, densidade e miniaturização; fotografias padronizadas são essenciais.','Planejamento reprodutivo e efeitos sexuais devem ser discutidos antes de inibidores da 5-alfa-redutase.'],
    'Alopecia androgenética feminina':['Investigar início, shedding associado, irregularidade menstrual, acne, hirsutismo e sinais de hiperandrogenismo.','Avaliar risca central, densidade frontal/centroparietal e miniaturização; comparar região frontal com occipital.','Gestação/tentativa de gestação muda radicalmente a escolha de antiandrógenos e inibidores da 5-alfa-redutase.'],
    'Eflúvio telógeno':['Construir linha temporal de 2–4 meses antes do início: febre, cirurgia, parto, perda ponderal, dieta, estresse e medicamentos.','Distinguir shedding sem miniaturização importante de AGA coexistente; pull test pode ajudar na fase ativa.','Suplementar apenas deficiência comprovada ou clinicamente relevante; evitar megadoses empíricas.'],
    'Alopecia areata':['Registrar velocidade de progressão, SALT, sobrancelhas/cílios, unhas, padrão ofiásico e impacto psicossocial.','Na tricoscopia, procurar pontos amarelos/pretos, fios em exclamação e fios quebrados como sinais de atividade.','Antes de terapia sistêmica/JAK, revisar infecções, vacinação, risco trombótico e monitorização específica.'],
    'Alopecia fibrosante frontal':['Medir recessão em pontos padronizados, avaliar sobrancelhas, face, pápulas e sintomas.','Procurar eritema/hiperqueratose perifolicular e pelos solitários na antiga linha frontal.','Objetivo é estabilizar: transplante só deve ser discutido após estabilidade sustentada.'],
    'Líquen plano pilar':['Perguntar prurido, ardor, dor e velocidade de expansão; sintomas podem preceder perda visível.','Examinar bordas ativas para eritema/escama perifolicular e perda de óstios; biópsia deve mirar área ativa.','Perda em área cicatricial é permanente; prioridade é interromper inflamação e progressão.'],
    'Acne vulgar':['Registrar duração, distribuição, nódulos, cicatrizes, manipulação, impacto psicossocial e tratamentos prévios.','Contar/qualificar lesões por região e documentar cicatrizes; usar GAGS como apoio, não como único critério.','Gestação, planejamento reprodutivo e uso concomitante de tetraciclinas são determinantes antes de isotretinoína.'],
    'Rosácea':['Identificar fenótipos: eritema persistente, flushing, telangiectasias, pápulas/pústulas, fimatosa e ocular.','Perguntar gatilhos individuais e sintomas oculares; examinar centro da face e bordas palpebrais.','Dor ocular, fotofobia ou alteração visual exigem avaliação oftalmológica.'],
    'Dermatite atópica':['Registrar prurido, sono, frequência de surtos, infecção, tratamentos prévios e impacto funcional.','Documentar extensão, liquenificação, escoriações, fissuras e sinais de infecção; EASI ajuda no seguimento.','Evitar corticosteroide sistêmico crônico como estratégia de manutenção.'],
    'Psoríase':['Perguntar artralgia/rigidez, unhas, couro cabeludo, genitais, mãos/pés, impacto e tratamentos prévios.','Documentar BSA, PASI quando útil e áreas de alto impacto; examinar unhas e sinais de artrite.','BSA baixo não significa doença leve se houver áreas especiais, falha tópica ou grande impacto.'],
    'Hidradenite supurativa':['Registrar número/local de nódulos, abscessos, túneis, drenagem, dor e cicatrizes.','Calcular IHS4 e Hurley; mapear áreas e dano estrutural com fotografia quando possível.','Doença moderada-grave requer estratégia sistêmica e avaliação de procedimentos, não apenas antibiótico repetido.'],
    'Vitiligo':['Registrar início, velocidade, fenômeno de Koebner, leucotriquia, áreas de alto impacto e doenças autoimunes associadas.','Documentar extensão padronizada; VASI acompanha carga e VIDA registra atividade.','Atividade e impacto importam tanto quanto extensão para decidir estratégia.'],
    'Melasma':['Investigar exposição solar/visível, hormônios, gestação, medicamentos e procedimentos prévios.','Fotografar em iluminação padronizada; mMASI é útil para acompanhamento longitudinal.','Fotoproteção ampla e controle de irritação são pilares; evitar escalada agressiva que induza hiperpigmentação pós-inflamatória.'],
    'Escabiose':['Perguntar prurido noturno, contatos, instituições, falhas prévias e imunossupressão.','Examinar espaços interdigitais, punhos, cintura, genitais e contatos; suspeitar forma crostosa em imunossuprimidos.','Tratamento de contatos e manejo de roupas/ambiente são parte do tratamento do caso.'],
    'Herpes-zóster':['Registrar tempo desde início, dermátomo, dor, imunossupressão e sinais neurológicos/oculares.','Examinar olho/face quando V1 estiver envolvido e procurar disseminação além de dermátomos contíguos.','Acometimento ocular, neurológico, disseminado ou imunossupressão importante muda urgência e via terapêutica.'],
    'Onicomicose':['Confirmar padrão e extensão, número de unhas, matriz, dermatofitoma e hiperqueratose.','Confirmar diagnóstico micológico antes de terapia sistêmica prolongada quando possível.','Doença hepática e interações são relevantes antes de antifúngico sistêmico.'],
    'Carcinoma basocelular':['Registrar tamanho, localização, bordas, recorrência, imunossupressão e tratamento prévio.','Estratificar risco anatômico/histológico; alto risco favorece controle completo de margens.','O CID depende do sítio anatômico; confirmar código definitivo após localização e histologia.'],
    'Carcinoma espinocelular cutâneo':['Registrar tamanho, profundidade, diferenciação, invasão perineural, imunossupressão e recorrência.','Usar estratificação de risco/BWH quando aplicável e examinar cadeias linfonodais regionais.','Tumores de alto risco exigem planejamento oncológico/cirúrgico e eventual estadiamento adicional.'],
    'Melanoma cutâneo':['Documentar Breslow, ulceração, mitoses quando reportadas, margens e exame linfonodal.','AJCC exige T/N/M; não concluir estágio global apenas com espessura.','A indicação de linfonodo sentinela/terapia adjuvante depende de estadiamento e contexto multidisciplinar.']
  };
  const generic=(item)=>[
    `História dirigida: início, duração, evolução, sintomas, tratamentos prévios, exposições/gatilhos e impacto funcional/psicossocial.`,
    `Exame dirigido: distribuição, extensão, morfologia, atividade, sinais de infecção/complicação e documentação fotográfica quando útil.`,
    `Situações especiais: revisar gestação/lactação, idade, imunossupressão, função renal/hepática e interações antes de qualquer terapia sistêmica.`
  ];
  function notes(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
  function saveNote(id,text){const n=notes();n[id]=text;localStorage.setItem(STORE,JSON.stringify(n));}
  function li(arr=[]){return `<ul>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`}
  function details(title,html,badge=''){return `<details class="clinical-accordion parity-added"><summary><span>${esc(title)}</span><span class="summary-right">${badge?`<span class="accordion-badge">${esc(badge)}</span>`:''}<span class="chevron">⌄</span></span></summary><div class="accordion-body">${html}</div></details>`}
  function prognosis(item){
    if(/cicatricial/i.test(item.category)) return 'O controle precoce da atividade reduz progressão, mas folículos já destruídos não costumam recuperar crescimento espontâneo. Documentar estabilidade é parte central do seguimento.';
    if(/carcinoma|melanoma/i.test(item.name)) return 'O prognóstico depende do estadiamento e dos fatores de risco anatomopatológicos. O acompanhamento deve seguir risco individual e recomendações oncológicas/dermatológicas vigentes.';
    if(/crônic|psoríase|atópica|rosácea|hidradenite|vitiligo/i.test(item.name)) return 'Condição potencialmente crônica/recidivante. O objetivo é controle sustentado, prevenção de sequela e redução de impacto, com reavaliação da estratégia conforme resposta.';
    return 'O prognóstico depende da causa, extensão, duração e resposta ao tratamento. Registrar linha de base e critérios objetivos de resposta facilita decisões nas reavaliações.';
  }
  function patientGuide(item){
    const base=['Explicar objetivo do tratamento, tempo esperado de resposta e sinais que justificam retorno antecipado.','Evitar automedicação e manipulação agressiva da pele/couro cabeludo; revisar produtos e rotina conforme a doença.','Fotoproteção e cuidado de barreira devem ser individualizados quando pertinentes.'];
    if(item.area==='Tricologia') base.push('Usar fotografias padronizadas e evitar mudanças simultâneas em múltiplos tratamentos que dificultem avaliar resposta.');
    return base;
  }
  function coding(item){const code=cid[item.name]||'A confirmar';const site=/\*/.test(code);return `<div class="parity-coding"><div><span class="overview-label">CID-10 sugerido</span><strong>${esc(code.replace('*',''))}</strong>${site?'<small>* Confirmar sítio anatômico para codificação definitiva.</small>':''}</div><div><span class="overview-label">Revisão clínica</span><strong>${UPDATED}</strong><small>Conteúdo clean-room baseado em fontes públicas; requer validação médica contínua.</small></div><div><span class="overview-label">Status editorial</span><strong>Estruturado</strong><small>Revisão farmacológica/versão local ainda deve ser conferida antes de uso assistencial definitivo.</small></div></div>`}
  function addDifferentialLinks(item){
    const all=[...panel.querySelectorAll('details.clinical-accordion')];
    const d=all.find(x=>norm(x.querySelector('summary span')?.textContent||'').includes('diagnosticos diferenciais'));
    if(!d||d.querySelector('.diff-links')||!item.differentials?.length)return;
    const box=document.createElement('div');box.className='diff-links';box.innerHTML='<span class="overview-label">Abrir condição relacionada</span>'+item.differentials.map(x=>`<button type="button" class="diff-link" data-diff="${esc(x)}">${esc(x)}</button>`).join('');
    d.querySelector('.accordion-body')?.appendChild(box);
    box.querySelectorAll('[data-diff]').forEach(b=>b.addEventListener('click',()=>{const q=document.querySelector('#searchInput');if(!q)return;q.value=b.dataset.diff;q.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.disease-card')?.click();}));
  }
  function inject(){
    const title=panel.querySelector('.detail-title')?.textContent?.trim(); if(!title)return;
    if(document.querySelector('.nav-btn.active')?.dataset.view==='prescriptions')return;
    const item=data.find(x=>x.name===title);if(!item)return;
    if(panel.querySelector(`[data-parity-for="${CSS.escape(item.id)}"]`)){addDifferentialLinks(item);return;}
    panel.querySelectorAll('.parity-layer').forEach(x=>x.remove());
    const tools=panel.querySelector('.accordion-tools');if(!tools)return;
    const key=special[item.name]||generic(item);
    const wrapper=document.createElement('div');wrapper.className='parity-layer';wrapper.dataset.parityFor=item.id;
    wrapper.innerHTML=`
      <div class="parity-meta">${coding(item)}</div>
      ${details('Definição e contexto clínico',`<p>${esc(item.summary)}</p><p class="microcopy">Categoria: ${esc(item.category)} · Área: ${esc(item.area)}</p>`,'BASE')}
      ${details('Fatores de risco, gatilhos e anamnese dirigida',li(key),'HISTÓRIA')}
      ${details('Exame dermatológico / tricológico dirigido',`<p>${esc(item.clinic||'')}</p>${item.trichoscopy?`<div class="parity-sub"><span class="overview-label">Dermatoscopia / tricoscopia</span><p>${esc(item.trichoscopy)}</p></div>`:''}`,'EXAME')}
      ${details('Situações especiais e individualização',li(['Gestação/lactação: revisar segurança de cada tratamento antes de prescrever.','Pediatria/idosos: ajustar investigação, formulação, dose e monitorização à faixa etária.','Doença renal/hepática, imunossupressão e polifarmácia: revisar contraindicações, interações e necessidade de exames antes de terapia sistêmica.']),'SEGURANÇA')}
      ${details('Prognóstico e objetivos terapêuticos',`<p>${esc(prognosis(item))}</p>`)}
      ${details('Orientações ao paciente',li(patientGuide(item)))}
      ${details('Prescrição ambulatorial x urgência/hospital',`<div class="parity-two"><div><span class="overview-label">Ambulatorial</span><p>${esc(item.prescription||'Individualizar conforme diagnóstico e gravidade.') .replace(/\n/g,'<br>')}</p></div><div><span class="overview-label">Urgência / hospital</span><p>${/Herpes-zóster|Hidradenite|Melanoma|Carcinoma/i.test(item.name)?'Reavaliar sinais de gravidade, necessidade de procedimento, terapia intravenosa, analgesia intensiva ou encaminhamento especializado conforme o caso.':'Não é rotineiramente necessário; indicar apenas diante de complicações, sinais sistêmicos ou necessidade procedimental específica.'}</p></div></div>`,'PRÁTICO')}
      ${details('Anotações clínicas',`<textarea class="clinical-note" data-note-id="${esc(item.id)}" rows="6" placeholder="Anotações pessoais desta condição…">${esc(notes()[item.id]||'')}</textarea><p class="microcopy">Salva neste dispositivo. Na integração final ao Derma Studio, deve migrar para o prontuário/conta autenticada.</p>`,'NOTAS')}`;
    tools.insertAdjacentElement('afterend',wrapper);
    wrapper.querySelector('[data-note-id]')?.addEventListener('input',e=>saveNote(item.id,e.target.value));
    addDifferentialLinks(item);
  }
  let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;inject();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();