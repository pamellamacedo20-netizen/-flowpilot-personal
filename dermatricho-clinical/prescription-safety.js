(() => {
  const panel = document.querySelector('#detailPanel');
  const prescriptions = window.DERMA_TRICHO_PRESCRIPTIONS || [];
  if (!panel || !prescriptions.length) return;

  const STORE='dt-rx-patient-profile-v1';
  const norm=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const n=v=>Number(v)||0;
  const has=(text,keys)=>keys.some(k=>norm(text).includes(norm(k)));
  const pregnant=p=>['possible','trying','pregnant'].includes(p.pregnancy);
  const reproductiveRisk=p=>['possible','trying','pregnant'].includes(p.pregnancy);
  const alertItem=(level,text)=>({level,text});

  function load(){ try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}} }
  function save(p){ localStorage.setItem(STORE,JSON.stringify(p)); }

  const allergyTerms={
    'rx-isotretinoin':['isotretinoina'], 'rx-adapalene':['adapaleno'], 'rx-tretinoin':['tretinoina'],
    'rx-bpo':['peroxido de benzoila'], 'rx-doxycycline':['doxiciclina','tetraciclina'], 'rx-spironolactone':['espironolactona'],
    'rx-minoxidil-topical':['minoxidil'], 'rx-minoxidil-oral':['minoxidil'], 'rx-finasteride':['finasterida'],
    'rx-dutasteride':['dutasterida','inibidor 5 alfa redutase'], 'rx-clobetasol':['clobetasol'],
    'rx-triamcinolone-il':['triancinolona'], 'rx-hydroxychloroquine':['hidroxicloroquina','cloroquina'],
    'rx-terbinafine':['terbinafina'], 'rx-ketoconazole-shampoo':['cetoconazol'], 'rx-permethrin':['permetrina','piretroide'],
    'rx-ivermectin':['ivermectina'], 'rx-tacrolimus':['tacrolimo']
  };

  function genericRules(rx,p){
    const out=[];
    if(!p.age || !p.weight || !p.sex || !p.pregnancy || !p.renal || !p.hepatic || !p.potassium || !p.cardiac){
      out.push(alertItem('incomplete','Complete idade, peso e os campos clínicos essenciais antes de liberar a prescrição.'));
    }
    if(p.allergies && !/^\s*(nega|nenhuma|nenhum|nao|não)\s*$/i.test(p.allergies)){
      if(has(p.allergies,allergyTerms[rx.id]||[rx.name])) out.push(alertItem('block','Alergia/hipersensibilidade informada compatível com este medicamento ou sua classe.'));
    }
    if(!p.allergies) out.push(alertItem('caution','Alergias não informadas.'));
    if(!p.meds) out.push(alertItem('caution','Medicações em uso não informadas — o rastreio de interação fica incompleto.'));
    if(!p.comorbidities) out.push(alertItem('info','Comorbidades não descritas.'));
    return out;
  }

  function drugRules(rx,p){
    const a=[]; const meds=p.meds||'', com=p.comorbidities||''; const dose=n(p.dose), wt=n(p.weight), age=n(p.age);
    switch(rx.id){
      // Regras específicas para fármacos acrescentados ao módulo dermatológico.
      // "Ausência de alerta" não significa revisão medicamentosa completa.
      case 'rx-rifampicin':
        a.push(alertItem('caution','Rifampicina é potente indutor enzimático. Em hanseníase NÃO usar como monoterapia: seguir PQT-U e dispensação/protocolo SUS.'));
        if(has(meds,['anticoncepcional','contraceptivo','etinilestradiol','levonorgestrel','desogestrel','warfarina','varfarina','apixabana','rivaroxabana','itraconazol','voriconazol','tacrolimo','ciclosporina','ritonavir','dolutegravir']))a.push(alertItem('caution','Interação farmacocinética potencialmente relevante detectada; conferir par específico, ajuste e necessidade de contracepção não hormonal.'));
        if(p.hepatic!=='normal')a.push(alertItem('caution','Revisar hepatopatia, hepatotoxicidade, interações e monitorização hepática.'));
        if(reproductiveRisk(p))a.push(alertItem('caution','Gestação: PQT-U para hanseníase requer condução conforme PCDT; não suspender automaticamente rifampicina por gestação.'));
        break;
      case 'rx-dapsone-systemic':
        if(p.g6pd==='deficient')a.push(alertItem('block','Deficiência de G6PD: risco elevado de hemólise com dapsona; discutir alternativa específica.'));
        if(!p.g6pd||p.g6pd==='unknown')a.push(alertItem('incomplete','Dapsona sistêmica: registrar atividade de G6PD antes de liberar este fluxo.'));
        a.push(alertItem('caution','Dapsona exige hemograma, avaliação de anemia, função hepática/renal e vigilância de hemólise, metemoglobinemia e síndrome de hipersensibilidade.'));
        if(has(com,['anemia','metemoglobinemia','dispneia','hipoxia','cianose']))a.push(alertItem('caution','Condição que aumenta risco/gravidade de toxicidade hematológica por dapsona informada.'));
        if(has(meds,['trimetoprim','sulfametoxazol','nitrofurantoina','primaquina']))a.push(alertItem('caution','Coexposição potencialmente hematotóxica/oxidante: conferir interação e contexto.'));
        break;
      case 'rx-clofazimine':
        a.push(alertItem('caution','Hanseníase: clofazimina integra a PQT-U, não prescrever isoladamente. Revisar efeitos pigmentares e gastrointestinais.'));
        if(p.qt==='yes'||has(meds,['amiodarona','sotalol','azitromicina','claritromicina','haloperidol','hidroxicloroquina']))a.push(alertItem('caution','Possível aumento de risco de QT: conferir ECG e interações por medicamento.'));
        break;
      case 'rx-benzathine-penicillin':
        if(has(p.allergies,['penicilina','amoxicilina','ampicilina','benzatina','beta-lactamico']))a.push(alertItem('block','História de alergia a penicilina/betalactâmico: revisar tipo e gravidade, eventual investigação ou dessensibilização conforme indicação.'));
        a.push(alertItem('caution','Confirmar estadiamento da sífilis: neurossífilis, sífilis ocular/ótica e fase tardia NÃO usam o mesmo esquema da sífilis precoce. Aplicação por via apropriada e atenção à anafilaxia.'));
        break;
      case 'rx-acyclovir': case 'rx-famciclovir':
        if(p.renal==='unknown'||!p.renal)a.push(alertItem('incomplete','Antiviral sistêmico: determinar função renal/eTFG ou ClCr antes de liberar posologia.'));
        if(['reduced','dialysis'].includes(p.renal))a.push(alertItem('caution','Ajustar dose e intervalo segundo depuração renal, idade e apresentação; não usar automaticamente esquema padrão.'));
        if(has(meds,['ciclosporina','tacrolimo','aminoglicosideo','anfotericina','tenofovir']))a.push(alertItem('caution','Coexposição com nefrotóxicos: avaliar hidratação e função renal.'));
        a.push(alertItem('info','Dose e duração variam para primeiro episódio de HSV, recorrência, supressão e zóster.'));
        break;
      case 'rx-rituximab':
        if(!p.hbv||p.hbv==='unknown')a.push(alertItem('incomplete','Rituximabe: triagem de HBV obrigatória (HBsAg e anti-HBc) antes da administração; considerar anti-HBs e avaliação especializada.'));
        if(p.hbv==='positive')a.push(alertItem('caution','HBsAg ou anti-HBc positivo: consultar especialista em hepatite B para profilaxia/monitorização de reativação.'));
        if(p.infection==='yes')a.push(alertItem('block','Infecção ativa informada; rituximabe não deve ser liberado sem avaliação especializada.'));
        a.push(alertItem('block','Rituximabe é terapia por infusão em protocolo especializado. Esta interface de receita ambulatorial simples NÃO libera administração nem substitui protocolo de infusão, vacinas e rastreio.'));
        break;
      case 'rx-nemolizumab':
        if(age&&age<18)a.push(alertItem('block','Prurigo nodular: verificar faixa etária aprovada para a indicação; não aplicar o esquema adulto a crianças.'));
        if(reproductiveRisk(p)||p.lactation==='yes')a.push(alertItem('caution','Gestação/lactação: verificar evidência específica e bula local; não presumir segurança.'));
        if(has(meds,['vacina viva','febre amarela','sarampo','varicela','bcg']))a.push(alertItem('caution','Evitar vacina viva durante o tratamento e revisar vacinação antes de iniciar.'));
        a.push(alertItem('caution','Biológico: peso, indicação, aplicação, controle de resposta e regularização no Brasil devem ser verificados, sem extrapolar a bula norte-americana.'));
        break;
      case 'rx-prednisone':
        if(p.infection==='yes')a.push(alertItem('caution','Infecção ativa informada: avaliar risco de piora sob imunossupressão sistêmica.'));
        if(has(com,['diabetes','osteoporose','hipertensao','glaucoma','transtorno bipolar','tuberculose']))a.push(alertItem('caution','Comorbidade que pode aumentar o risco de glicocorticoide sistêmico: revisar proteção e seguimento.'));
        a.push(alertItem('caution','Dose, duração e redução gradual dependem da indicação; não transpor dose de pênfigo para DRESS ou outra doença. Avaliar hiperglicemia, PA, infecção, osso e supressão adrenal.'));
        break;
      case 'rx-oxybutynin':
        if(has(com,['glaucoma de angulo fechado','glaucoma de angulo estreito','retencao urinaria','obstrucao urinaria','miastenia','obstrucao intestinal']))a.push(alertItem('block','Possível contraindicação antimuscarínica: glaucoma de ângulo fechado/retensão ou obstrução informados.'));
        if(age>=65)a.push(alertItem('caution','Idoso: risco de carga anticolinérgica, confusão, constipação e quedas; preferir alternativa quando possível.'));
        a.push(alertItem('caution','Hiperidrose: uso geralmente off-label; avaliar boca seca, intolerância ao calor, retenção urinária e outras drogas anticolinérgicas.'));
        break;
      case 'rx-glycopyrronium-topical':
        if(has(com,['glaucoma de angulo fechado','retencao urinaria','miastenia']))a.push(alertItem('caution','Antimuscarínico tópico: revisar contraindicações e transferência mão-olho (midríase/visão borrada).'));
        a.push(alertItem('caution','Não assumir que glicopirrônio 2,4% em lenço/solução de bula estrangeira esteja registrado ou comercializado no Brasil; conferir Anvisa.'));
        break;
      case 'rx-aluminum-chloride':
        a.push(alertItem('info','Aplicar conforme formulação em pele seca/íntegra e revisar irritação/dermatite de contato. Não usar em pele fissurada ou imediatamente após depilação.'));
        break;
      case 'rx-isotretinoin':
        if(reproductiveRisk(p)) a.push(alertItem('block','Isotretinoína é contraindicada na gestação; possibilidade/tentativa de gestação exige interromper este fluxo e seguir protocolo de prevenção gestacional.'));
        if(p.lactation==='yes') a.push(alertItem('caution','Aleitamento: a bula recomenda não amamentar durante o tratamento.'));
        if(has(meds,['doxiciclina','minociclina','tetraciclina'])) a.push(alertItem('block','Associação com tetraciclinas deve ser evitada pelo risco de hipertensão intracraniana.'));
        if(has(meds,['vitamina a','retinol','acitretina'])) a.push(alertItem('caution','Rever vitamina A/retinoides concomitantes para reduzir toxicidade aditiva.'));
        if(p.hepatic!=='normal') a.push(alertItem('caution','Alteração hepática informada: revisar transaminases e risco/benefício antes de prescrever.'));
        if(dose&&wt) a.push(alertItem('info',`Dose planejada corresponde a ${(dose/wt).toFixed(2)} mg/kg/dia.`));
        break;
      case 'rx-adapalene': case 'rx-tretinoin':
        if(reproductiveRisk(p)) a.push(alertItem('caution','Retinoide tópico: evitar durante gestação/tentativa por princípio de precaução; reavaliar alternativa.'));
        break;
      case 'rx-doxycycline':
        if(reproductiveRisk(p)) a.push(alertItem('caution','Doxiciclina não é opção dermatológica rotineira na gestação; reavaliar indicação e alternativa.'));
        if(age>0&&age<8) a.push(alertItem('caution','Paciente <8 anos: uso exige indicação específica e revisão pediátrica; não aplicar automaticamente o esquema dermatológico de adulto.'));
        if(has(meds,['isotretinoina'])) a.push(alertItem('block','Não associar doxiciclina a isotretinoína pelo risco de hipertensão intracraniana.'));
        if(has(meds,['ferro','calcio','cálcio','magnesio','magnésio','antiacido','antiácido'])) a.push(alertItem('caution','Ferro/cálcio/magnésio/antiácidos podem reduzir absorção; revisar separação de horários.'));
        break;
      case 'rx-spironolactone':
        if(p.potassium==='high') a.push(alertItem('block','Hipercalemia é contraindicação à espironolactona.'));
        if(has(com,['addison'])) a.push(alertItem('block','Doença de Addison é contraindicação à espironolactona.'));
        if(has(meds,['eplerenona'])) a.push(alertItem('block','Uso concomitante de eplerenona é contraindicado.'));
        if(reproductiveRisk(p)) a.push(alertItem('block','Bloqueio do protocolo dermatológico: evitar espironolactona na gestação/tentativa pelo efeito antiandrogênico fetal potencial.'));
        if(['reduced','dialysis'].includes(p.renal)) a.push(alertItem('caution','Disfunção renal aumenta risco de hiperpotassemia; revisar creatinina/eGFR e potássio.'));
        if(has(meds,['losartana','valsartana','telmisartana','enalapril','lisinopril','ramipril','potassio','potássio','trimetoprim'])) a.push(alertItem('caution','Há medicamento concomitante que pode elevar potássio; revisar necessidade de monitorização laboratorial.'));
        break;
      case 'rx-minoxidil-topical':
        if(reproductiveRisk(p)) a.push(alertItem('caution','Evitar minoxidil tópico durante gestação; reavaliar risco/benefício.'));
        break;
      case 'rx-minoxidil-oral':
        if(reproductiveRisk(p)) a.push(alertItem('caution','Minoxidil oral para alopecia é off-label e deve ser evitado durante gestação.'));
        if(p.cardiac==='angina_pericardial') a.push(alertItem('block','Angina/doença pericárdica informada: não liberar minoxidil oral capilar sem avaliação cardiovascular específica.'));
        if(p.cardiac==='cardiac') a.push(alertItem('caution','Cardiopatia informada: avaliar risco cardiovascular antes do uso off-label.'));
        if(p.bp==='low') a.push(alertItem('caution','Pressão arterial baixa: risco de hipotensão/sintomas com vasodilatação.'));
        if(has(com,['feocromocitoma'])) a.push(alertItem('block','Feocromocitoma é contraindicação do minoxidil oral.'));
        if(has(meds,['losartana','valsartana','enalapril','lisinopril','amlodipino','anlodipino','propranolol','atenolol','metoprolol','carvedilol','hidroclorotiazida','furosemida'])) a.push(alertItem('caution','Uso de anti-hipertensivo/diurético identificado: revisar pressão, frequência cardíaca e risco de hipotensão/edema.'));
        break;
      case 'rx-finasteride':
        if(age>0&&age<18) a.push(alertItem('block','Finasterida não é indicada para pacientes pediátricos neste fluxo.'));
        if(p.sex==='female' && reproductiveRisk(p)) a.push(alertItem('block','Finasterida é contraindicada em gestantes e em pessoas que possam estar grávidas pelo risco ao feto masculino.'));
        if(p.sex==='female') a.push(alertItem('caution','Uso em mulher para alopecia é off-label e exige revisão reprodutiva individual.'));
        break;
      case 'rx-dutasteride':
        if(age>0&&age<18) a.push(alertItem('block','Dutasterida é contraindicada/ não indicada para pacientes pediátricos neste fluxo.'));
        if(p.sex==='female' && ['no','possible','trying','pregnant'].includes(p.pregnancy)) a.push(alertItem('block','Dutasterida é contraindicada na gestação e, conforme rotulagem, em mulheres com potencial reprodutivo.'));
        if(p.sex==='female') a.push(alertItem('caution','Uso capilar em mulheres é off-label; revisar contexto reprodutivo e longa meia-vida.'));
        if(has(meds,['ritonavir','cobicistat','itraconazol','claritromicina'])) a.push(alertItem('caution','Potente inibidor de CYP3A4 identificado: pode aumentar exposição à dutasterida.'));
        break;
      case 'rx-clobetasol':
        if(age>0&&age<12) a.push(alertItem('caution','Criança: potência, formulação, área e duração devem ser revistas; maior risco de absorção sistêmica.'));
        if(reproductiveRisk(p)) a.push(alertItem('caution','Gestação: usar menor potência/quantidade eficaz pelo menor tempo possível quando corticosteroide tópico for necessário.'));
        break;
      case 'rx-triamcinolone-il':
        if(reproductiveRisk(p)) a.push(alertItem('caution','Gestação: individualizar necessidade, concentração, área e dose total do corticoide intralesional.'));
        if(has(com,['diabetes'])) a.push(alertItem('caution','Diabetes informado: considerar potencial efeito glicêmico se dose total/repetição forem relevantes.'));
        break;
      case 'rx-hydroxychloroquine':
        if(wt){ const max=5*wt; a.push(alertItem('info',`Referência de segurança retiniana: evitar dose diária ≥5 mg/kg de peso real; para ${wt} kg, 5 mg/kg = ${max.toFixed(0)} mg/dia.`)); if(dose>=max) a.push(alertItem('caution',`Dose planejada ${dose} mg/dia atinge/excede 5 mg/kg de peso real, fator associado a maior risco de toxicidade retiniana.`)); }
        if(['reduced','dialysis'].includes(p.renal)) a.push(alertItem('caution','Disfunção renal aumenta risco de toxicidade retiniana; revisar dose e frequência de rastreio oftalmológico.'));
        if(p.retinal==='yes') a.push(alertItem('caution','Doença macular/retiniana prévia: exige avaliação oftalmológica e individualização.'));
        if(p.qt==='yes' || has(meds,['amiodarona','sotalol','azithromicina','azitromicina','haloperidol','quetiapina','ziprasidona'])) a.push(alertItem('caution','Risco de prolongamento do QT/interação pró-arrítmica identificado; revisar ECG, eletrólitos e medicamentos concomitantes.'));
        break;
      case 'rx-terbinafine':
        if(p.hepatic==='active') a.push(alertItem('block','Doença hepática crônica ou ativa é contraindicação à terbinafina oral.'));
        if(p.hepatic==='enzymes') a.push(alertItem('caution','Enzimas hepáticas alteradas: revisar causa e função hepática antes de iniciar terbinafina.'));
        if(reproductiveRisk(p)) a.push(alertItem('caution','Evitar tratamento eletivo sistêmico durante gestação quando houver alternativa/possibilidade de adiar.'));
        break;
      case 'rx-permethrin':
        if(age>0&&age<(2/12)) a.push(alertItem('caution','Idade <2 meses: confirmar alternativa/protocolo pediátrico antes do uso.'));
        break;
      case 'rx-ivermectin':
        if(wt&&wt<15) a.push(alertItem('caution','Peso <15 kg: segurança da ivermectina oral para escabiose não está estabelecida no protocolo CDC; preferir alternativa apropriada.'));
        if(reproductiveRisk(p)) a.push(alertItem('caution','Gestação: segurança para escabiose não está estabelecida; preferir permetrina quando apropriado.'));
        if(wt){ const ref=.2*wt; a.push(alertItem('info',`Para escabiose, referência usual de 200 mcg/kg = ${ref.toFixed(1)} mg por dose para ${wt} kg; converter para a apresentação disponível e revisar protocolo.`)); if(dose) a.push(alertItem('info',`Dose informada: ${dose} mg por dose (${(dose/wt*1000).toFixed(0)} mcg/kg).`)); }
        break;
      case 'rx-tacrolimus':
        if(age>0&&age<2) a.push(alertItem('block','Tacrolimo tópico não é indicado para menores de 2 anos na rotulagem de referência.'));
        if(age>=2&&age<16) a.push(alertItem('caution','Entre 2 e 15 anos, revisar concentração apropriada; não aplicar automaticamente a formulação de adulto.'));
        if(reproductiveRisk(p)) a.push(alertItem('caution','Gestação: individualizar risco/benefício e extensão de uso.'));
        break;
      case 'rx-ketoconazole-shampoo': case 'rx-bpo':
        break;
    }
    return a;
  }

  function read(root){
    const get=k=>root.querySelector(`[data-rx-profile="${k}"]`)?.value||'';
    return {age:get('age'),weight:get('weight'),sex:get('sex'),pregnancy:get('pregnancy'),lactation:get('lactation'),renal:get('renal'),hepatic:get('hepatic'),potassium:get('potassium'),bp:get('bp'),cardiac:get('cardiac'),retinal:get('retinal'),qt:get('qt'),g6pd:get('g6pd'),hbv:get('hbv'),infection:get('infection'),allergies:get('allergies'),meds:get('meds'),comorbidities:get('comorbidities'),dose:get('dose')};
  }

  function profileSummary(p){
    return [
      `Idade: ${p.age||'não informada'} anos`, `Peso: ${p.weight||'não informado'} kg`, `Sexo: ${p.sex||'não informado'}`,
      `Gestação: ${p.pregnancy||'não informada'}`, `Lactação: ${p.lactation||'não informada'}`, `Função renal: ${p.renal||'não informada'}`,
      `Função hepática: ${p.hepatic||'não informada'}`, `Potássio: ${p.potassium||'não informado'}`, `PA: ${p.bp||'não informada'}`,
      `Cardiovascular: ${p.cardiac||'não informado'}`, `Retina/mácula: ${p.retinal||'não informado'}`, `QT/arritmia: ${p.qt||'não informado'}`,
      `G6PD: ${p.g6pd||'não investigado'} | HBV: ${p.hbv||'não investigado'} | Infecção ativa: ${p.infection||'não investigada'}`,
      `Alergias: ${p.allergies||'não informadas'}`, `Medicações: ${p.meds||'não informadas'}`, `Comorbidades: ${p.comorbidities||'não informadas'}`,
      p.dose?`Dose planejada: ${p.dose} mg/dia ou mg/dose conforme o medicamento`:''
    ].filter(Boolean).join('\n');
  }

  function renderStatus(root,rx,p){
    const items=[...genericRules(rx,p),...drugRules(rx,p)];
    const blocks=items.filter(x=>x.level==='block'); const cautions=items.filter(x=>x.level==='caution'); const incomplete=items.filter(x=>x.level==='incomplete');
    const status=root.querySelector('[data-rx-safety-status]');
    const list=root.querySelector('[data-rx-safety-list]');
    const ack=root.querySelector('[data-rx-ack]');
    const action=panel.querySelector('#useRxInPatient');
    list.innerHTML=items.length?items.map(x=>`<div class="rx-alert rx-${x.level}"><b>${x.level==='block'?'BLOQUEIO':x.level==='caution'?'CAUTELA':x.level==='incomplete'?'DADOS PENDENTES':'INFO'}</b><span>${esc(x.text)}</span></div>`).join(''):'<div class="rx-alert rx-ok"><b>OK</b><span>Nenhum alerta estruturado identificado com os dados informados.</span></div>';
    let label,tone;
    if(blocks.length){label='PRESCRIÇÃO BLOQUEADA';tone='blocked'}
    else if(incomplete.length){label='PREENCHA OS DADOS ESSENCIAIS';tone='pending'}
    else if(cautions.length){label='REVISÃO MÉDICA NECESSÁRIA';tone='caution'}
    else {label='TRIAGEM SEM ALERTA CRÍTICO';tone='clear'}
    status.className=`rx-safety-status ${tone}`; status.textContent=label;
    const canRelease=!blocks.length&&!incomplete.length&&(!cautions.length||ack.checked);
    if(action){
      action.disabled=!canRelease;
      action.classList.toggle('rx-disabled',!canRelease);
      action.textContent=blocks.length?'Prescrição bloqueada':incomplete.length?'Complete a triagem de segurança':cautions.length&&!ack.checked?'Confirme as cautelas para continuar':'Adicionar à prescrição do paciente';
    }
    window.DT_RX_SAFETY_LAST={drug:rx.name,profile:p,items,status:label,canRelease};
    return {blocks,cautions,incomplete,canRelease};
  }

  function field(label,key,type='text',extra=''){
    return `<label class="rx-profile-field"><span>${label}</span><input type="${type}" data-rx-profile="${key}" ${extra}></label>`;
  }
  function select(label,key,opts){return `<label class="rx-profile-field"><span>${label}</span><select data-rx-profile="${key}"><option value="">Selecione…</option>${opts.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></label>`}

  function html(rx){
    return `<details class="clinical-accordion rx-safety-gate" open data-drug-id="${esc(rx.id)}">
      <summary><span>Triagem de segurança antes da prescrição</span><span class="summary-right"><span class="accordion-badge">OBRIGATÓRIO</span><span class="chevron">⌄</span></span></summary>
      <div class="accordion-body">
        <div class="rx-safety-head"><div><span class="overview-label">Paciente atual</span><h4>Contraindicações, interações e ajuste por perfil</h4></div><div class="rx-safety-status pending" data-rx-safety-status>Preencha os dados</div></div>
        <div class="rx-profile-grid">
          ${field('Idade','age','number','min="0" max="120" step="1"')}${field('Peso','weight','number','min="0" max="400" step="0.1"')}
          ${select('Sexo biológico','sex',[['male','Masculino'],['female','Feminino'],['other','Outro / não binário']])}
          ${select('Situação gestacional','pregnancy',[['na','Não se aplica'],['no','Não grávida'],['possible','Possibilidade de gestação'],['trying','Tentando engravidar'],['pregnant','Gestante']])}
          ${select('Lactação','lactation',[['na','Não se aplica'],['no','Não'],['yes','Sim']])}
          ${select('Função renal','renal',[['normal','Normal'],['unknown','Desconhecida'],['reduced','Redução importante / DRC'],['dialysis','Diálise']])}
          ${select('Função hepática','hepatic',[['normal','Normal'],['unknown','Desconhecida'],['enzymes','Enzimas elevadas'],['active','Doença hepática ativa/crônica']])}
          ${select('Potássio','potassium',[['normal','Normal'],['unknown','Desconhecido'],['high','Elevado / hipercalemia']])}
          ${select('Pressão arterial','bp',[['normal','Normal'],['unknown','Desconhecida'],['low','Baixa / hipotensão'],['high','Hipertensão']])}
          ${select('Cardiovascular','cardiac',[['none','Nega cardiopatia relevante'],['unknown','Desconhecido'],['cardiac','Cardiopatia / arritmia / edema'],['angina_pericardial','Angina ou doença/derrame pericárdico']])}
          ${select('Doença retiniana/macular','retinal',[['no','Não'],['unknown','Desconhecida'],['yes','Sim']])}
          ${select('QT longo/arritmia relevante','qt',[['no','Não'],['unknown','Desconhecido'],['yes','Sim']])}
          ${select('G6PD (para dapsona)','g6pd',[['normal','Normal documentado'],['deficient','Deficiência conhecida'],['unknown','Não investigado']])}
          ${select('Hepatite B / HBsAg e anti-HBc','hbv',[['negative','Triagem negativa documentada'],['positive','HBsAg ou anti-HBc positivo'],['unknown','Não investigado']])}
          ${select('Infecção ativa','infection',[['no','Não / investigada'],['yes','Sim'],['unknown','Não investigada']])}
          ${field('Dose sistêmica planejada (mg)','dose','number','min="0" step="0.1" placeholder="se aplicável"')}
        </div>
        <div class="rx-profile-texts">
          <label><span>Alergias</span><textarea data-rx-profile="allergies" rows="2" placeholder="Ex.: nega / tetraciclinas"></textarea></label>
          <label><span>Medicações em uso</span><textarea data-rx-profile="meds" rows="2" placeholder="Ex.: nenhuma / losartana, lítio…"></textarea></label>
          <label><span>Comorbidades / observações</span><textarea data-rx-profile="comorbidities" rows="2" placeholder="Ex.: nega / Addison, diabetes, cardiopatia…"></textarea></label>
        </div>
        <div class="rx-safety-list" data-rx-safety-list></div>
        <label class="rx-ack"><input type="checkbox" data-rx-ack><span>Revisei as cautelas acima e confirmo que a prescrição será individualizada.</span></label>
        <div class="rx-safety-actions"><button type="button" class="secondary" data-rx-clear-profile>Limpar dados do paciente</button></div>
        <p class="microcopy">Triagem estruturada de apoio à decisão. Não substitui bula local, verificação completa de interações, exames necessários ou julgamento clínico. Regras críticas foram priorizadas para os medicamentos atualmente cadastrados.</p>
      </div>
    </details>`;
  }

  function hydrate(root,p){ Object.entries(p||{}).forEach(([k,v])=>{const el=root.querySelector(`[data-rx-profile="${k}"]`); if(el) el.value=v;}); }

  function inject(){
    const title=panel.querySelector('.detail-title')?.textContent?.trim(); if(!title)return;
    const rx=prescriptions.find(x=>x.name===title); if(!rx)return;
    const actions=panel.querySelector('.integration-actions'); if(!actions)return;
    const existing=panel.querySelector('.rx-safety-gate');
    if(existing?.dataset.drugId===rx.id)return;
    existing?.remove();
    actions.insertAdjacentHTML('beforebegin',html(rx));
    const root=panel.querySelector('.rx-safety-gate'); const p=load(); hydrate(root,p);
    const recalc=()=>{const current=read(root);save(current);renderStatus(root,rx,current);};
    root.querySelectorAll('input,select,textarea').forEach(el=>{el.addEventListener('input',recalc);el.addEventListener('change',recalc);});
    root.querySelector('[data-rx-clear-profile]').addEventListener('click',()=>{localStorage.removeItem(STORE);root.querySelectorAll('input[type="number"],textarea').forEach(x=>x.value='');root.querySelectorAll('select').forEach(x=>x.value='');root.querySelector('[data-rx-ack]').checked=false;recalc();});
    const btn=panel.querySelector('#useRxInPatient');
    if(btn) btn.addEventListener('click',()=>{
      const last=window.DT_RX_SAFETY_LAST; if(!last?.canRelease)return;
      const box=document.querySelector('#patientContext'); if(box){const summary=`TRIAGEM DE SEGURANÇA — ${rx.name}\n${profileSummary(last.profile)}\nStatus: ${last.status}\nAlertas: ${last.items.map(x=>`${x.level.toUpperCase()}: ${x.text}`).join(' | ')}`;box.value=box.value.trim()?`${box.value.trim()}\n\n${summary}`:summary;}
    });
    recalc();
  }

  let queued=false; function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;inject();});}
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true}); queue();
})();