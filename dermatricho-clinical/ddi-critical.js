(() => {
  const panel=document.querySelector('#detailPanel'); if(!panel)return;
  const N=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const has=(text,terms)=>terms.some(t=>N(text).includes(N(t)));
  const rules=[
    {drug:['isotretinoína'],with:['doxiciclina','minociclina','sareciclina','tetraciclina'],level:'BLOQUEIO',mechanism:'Risco aditivo de hipertensão intracraniana/pseudotumor cerebral.',action:'Evitar a associação e escolher alternativa.',source:'Bula profissional de isotretinoína/tetraciclinas.'},
    {drug:['isotretinoína'],with:['vitamina a','retinol','acitretina'],level:'ALTA',mechanism:'Toxicidade retinoide aditiva.',action:'Evitar suplementação de vitamina A/retinoides sistêmicos concomitantes salvo justificativa especializada.',source:'Bula profissional de isotretinoína.'},
    {drug:['espironolactona'],with:['enalapril','lisinopril','ramipril','losartana','valsartana','telmisartana','olmesartana','potássio','potassio','cloreto de potássio','trimetoprim','cotrimoxazol','sulfametoxazol-trimetoprim'],level:'ALTA',mechanism:'Aumento do risco de hipercalemia.',action:'Revisar necessidade; checar potássio/função renal e plano de monitorização.',source:'Bula profissional de espironolactona.'},
    {drug:['minoxidil oral','minoxidil oral em baixa dose'],with:['amlodipino','anlodipino','enalapril','lisinopril','losartana','valsartana','carvedilol','propranolol','metoprolol','atenolol','hidroclorotiazida','furosemida'],level:'MODERADA',mechanism:'Efeito anti-hipertensivo/vasodilatador somado, com hipotensão, taquicardia reflexa ou alterações de volume.',action:'Rever PA/FC, edema e tolerância; titular de forma conservadora.',source:'Bula profissional de minoxidil oral.'},
    {drug:['hidroxicloroquina'],with:['amiodarona','sotalol','azitromicina','claritromicina','haloperidol','quetiapina','ziprasidona','escitalopram','citalopram'],level:'ALTA',mechanism:'Potencial aditivo de prolongamento do QT/arrítmia.',action:'Revisar necessidade, fatores de risco, eletrólitos e ECG quando indicado.',source:'Bula profissional de hidroxicloroquina.'},
    {drug:['terbinafina'],with:['metoprolol','propranolol','amitriptilina','nortriptilina','desipramina','fluoxetina','paroxetina','venlafaxina','tamoxifeno'],level:'MODERADA',mechanism:'Terbinafina inibe CYP2D6 e pode alterar exposição de substratos; com tamoxifeno pode reduzir formação de metabólito ativo.',action:'Revisar interação específica, sintomas e necessidade de ajuste/alternativa.',source:'Bula profissional de terbinafina.'},
    {drug:['itraconazol'],with:['simvastatina','lovastatina'],level:'BLOQUEIO',mechanism:'Inibição potente de CYP3A4 pode elevar muito a exposição à estatina e risco de miopatia/rabdomiólise.',action:'Evitar associação; escolher antifúngico ou estatina alternativa conforme contexto.',source:'Bula profissional de itraconazol.'},
    {drug:['itraconazol'],with:['midazolam','triazolam','quinidina','dofetilida'],level:'BLOQUEIO',mechanism:'Inibição CYP3A4 com risco de sedação excessiva ou arritmia grave, dependendo do fármaco.',action:'Checar bula/interação específica antes de prescrever.',source:'Bula profissional de itraconazol.'},
    {drug:['doxiciclina','minociclina','sareciclina'],with:['ferro','cálcio','calcio','magnésio','magnesio','alumínio','aluminio','antiácido','antiacido'],level:'MODERADA',mechanism:'Quelação reduz absorção da tetraciclina.',action:'Separar horários conforme bula e formulação.',source:'Bulas profissionais das tetraciclinas.'},
    {drug:['metotrexato'],with:['trimetoprim','cotrimoxazol','sulfametoxazol-trimetoprim'],level:'BLOQUEIO',mechanism:'Antagonismo do folato e redução de depuração podem causar mielossupressão grave.',action:'Evitar associação rotineira; buscar alternativa.',source:'Bula profissional de metotrexato.'},
    {drug:['metotrexato'],with:['ibuprofeno','naproxeno','diclofenaco','cetoprofeno'],level:'ALTA',mechanism:'AINEs podem reduzir depuração renal do metotrexato e aumentar toxicidade, sobretudo em doses/risco maiores.',action:'Revisar dose, função renal e necessidade; monitorizar quando a combinação for inevitável.',source:'Bula profissional de metotrexato.'},
    {drug:['ciclosporina'],with:['claritromicina','eritromicina','itraconazol','cetoconazol','voriconazol'],level:'ALTA',mechanism:'Inibição metabólica pode elevar níveis de ciclosporina e nefrotoxicidade.',action:'Evitar ou monitorar níveis/função renal e ajustar conforme protocolo especializado.',source:'Bula profissional de ciclosporina.'},
    {drug:['ciclosporina'],with:['simvastatina','lovastatina'],level:'ALTA',mechanism:'Aumento da exposição à estatina e risco de miopatia/rabdomiólise.',action:'Revisar estatina e dose conforme bula.',source:'Bula profissional de ciclosporina.'},
    {drug:['acitretina'],with:['doxiciclina','minociclina','sareciclina','tetraciclina'],level:'BLOQUEIO',mechanism:'Risco de hipertensão intracraniana com retinoide sistêmico + tetraciclina.',action:'Evitar associação.',source:'Bula profissional de acitretina.'},
    {drug:['acitretina'],with:['metotrexato'],level:'ALTA',mechanism:'Potencial hepatotoxicidade aditiva.',action:'Evitar combinação rotineira e revisar alternativas.',source:'Bulas profissionais de acitretina/metotrexato.'},
    {drug:['baricitinibe','ritlecitinibe'],with:['adalimumabe','infliximabe','secuquinumabe','bimequizumabe','dupilumabe','omalizumabe','ciclosporina','azatioprina'],level:'ALTA',mechanism:'Imunossupressão aditiva com maior risco de infecções e eventos adversos.',action:'Não combinar automaticamente; exigir decisão especializada e checagem de bula.',source:'Bulas profissionais de inibidores JAK.'},
    {drug:['adalimumabe','infliximabe','secuquinumabe','bimequizumabe','dupilumabe'],with:['vacina viva','febre amarela','tríplice viral','triplice viral','varicela'],level:'ALTA',mechanism:'Vacinas vivas podem ser inadequadas durante algumas terapias imunomoduladoras.',action:'Revisar imunização antes do início e seguir bula específica do biológico.',source:'Bulas profissionais dos biológicos.'},
    {drug:['finasterida'],with:['dutasterida'],level:'DUPLICIDADE',mechanism:'Dois inibidores da 5-alfa-redutase com sobreposição terapêutica.',action:'Em AGA, normalmente escolher uma estratégia; associação exige justificativa explícita.',source:'Princípio de duplicidade farmacológica.'},
    {drug:['tacrolimo tópico'],with:['pimecrolimo'],level:'DUPLICIDADE',mechanism:'Inibidores tópicos da calcineurina com finalidade semelhante.',action:'Escolher conforme área, potência e tolerabilidade em vez de duplicar rotineiramente.',source:'Princípio de duplicidade terapêutica.'}
  ];
  function profileMeds(){try{return JSON.parse(localStorage.getItem('dt-rx-patient-profile-v1')||'{}').meds||''}catch{return ''}}
  function currentDrug(){return panel.querySelector('.detail-title')?.textContent?.trim()||''}
  function evaluate(drug,meds){return rules.filter(r=>(has(drug,r.drug)&&has(meds,r.with))||(has(drug,r.with)&&has(meds,r.drug)));}
  function inject(){
    if(document.querySelector('.nav-btn.active')?.dataset.view!=='prescriptions')return;
    const drug=currentDrug();if(!drug)return;
    const anchor=panel.querySelector('.rx-safety-gate')||panel.querySelector('.integration-actions');if(!anchor)return;
    const meds=panel.querySelector('[data-rx-profile="meds"]')?.value ?? profileMeds();
    const signature=JSON.stringify([drug,meds,rules.length]);
    const old=panel.querySelector('.ddi-critical-layer');
    if(old?.dataset.ddiSignature===signature)return;
    old?.remove();
    const hits=evaluate(drug,meds);
    const d=document.createElement('details');d.className='clinical-accordion ddi-critical-layer';
    d.dataset.ddiSignature=signature;
    d.innerHTML=`<summary><span>Interações críticas estruturadas</span><span class="summary-right"><span class="accordion-badge">DDI</span><span class="chevron">⌄</span></span></summary><div class="accordion-body"><p class="microcopy">Camada dirigida a interações de alto valor em Dermatologia/Tricologia. Complementa, mas não substitui, uma base DDI comercial completa nem a bula brasileira vigente.</p>${meds?`<div class="ddi-context"><span class="overview-label">Medicações informadas</span><p>${esc(meds)}</p></div>`:'<div class="rx-alert rx-caution"><b>CAUTELA</b><span>Medicações concomitantes ainda não foram informadas na triagem.</span></div>'}${hits.length?hits.map(h=>`<div class="ddi-hit ddi-${N(h.level)}"><div><b>${esc(h.level)}</b><strong>${esc(h.mechanism)}</strong></div><p>${esc(h.action)}</p><small>${esc(h.source)}</small></div>`).join(''):'<div class="ddi-clear">Nenhuma interação crítica programada foi identificada com o texto informado. Isso não significa ausência de interação.</div>'}</div>`;
    anchor.insertAdjacentElement('afterend',d);
  }
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};
  new MutationObserver(queue).observe(panel,{childList:true,subtree:true});
  panel.addEventListener('input',e=>{if(e.target.matches('[data-rx-profile="meds"]'))queue();});
  panel.addEventListener('change',e=>{if(e.target.matches('[data-rx-profile="meds"]'))queue();});
  window.addEventListener('storage',queue);queue();
  window.DT_DDI_CRITICAL={rules,evaluate};
})();