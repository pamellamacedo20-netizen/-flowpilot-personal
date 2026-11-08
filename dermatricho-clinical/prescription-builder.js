(() => {
  const STORE='dt-prescription-cart-v1';
  const prescriptions=()=>window.DERMA_TRICHO_PRESCRIPTIONS||[];
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const norm=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const load=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch{return []}};
  const save=x=>{localStorage.setItem(STORE,JSON.stringify(x));updateBadge();};
  const parseSample=(rx)=>String(rx.sample||'').replace(/^MODELO EDITÁVEL[^\n]*\n?/i,'').trim();
  function add(rx){
    const cart=load();
    const existing=cart.find(x=>x.id===rx.id);
    if(existing){existing.qty=(existing.qty||1)+1;} else {
      cart.push({id:rx.id,name:rx.name,class:rx.class||'',instructions:parseSample(rx)||rx.adultDose||'',quantity:'',notes:'',qty:1,createdAt:new Date().toISOString()});
    }
    save(cart); open();
  }
  function remove(id){save(load().filter(x=>x.id!==id));render();}
  function clear(){save([]);render();}
  function updateItem(id,key,value){const cart=load();const x=cart.find(y=>y.id===id);if(!x)return;x[key]=value;save(cart);}
  function updateBadge(){
    const b=document.querySelector('[data-rx-cart-count]'); if(b)b.textContent=String(load().length);
  }
  function ensureButton(){
    if(document.querySelector('[data-open-rx-cart]'))return;
    const side=document.querySelector('.sidebar'); if(!side)return;
    const b=document.createElement('button');
    b.type='button';b.className='rx-cart-sidebar';b.dataset.openRxCart='1';
    b.innerHTML='<span>Receita</span><b data-rx-cart-count>0</b>';
    const note=side.querySelector('.sidebar-note');
    note?side.insertBefore(b,note):side.appendChild(b);
    updateBadge();
  }
  function ensureDialog(){
    if(document.querySelector('#rxCartDialog'))return;
    const d=document.createElement('dialog');d.id='rxCartDialog';d.className='rx-cart-dialog';
    d.innerHTML=`<div class="rx-cart-shell"><header><div><span class="eyebrow">Prescrição ambulatorial</span><h2>Receita do paciente</h2></div><button type="button" class="icon-btn" data-close-rx-cart>×</button></header><div class="rx-cart-body" data-rx-cart-body></div><footer><button type="button" class="secondary" data-clear-rx-cart>Limpar</button><div class="rx-cart-footer-actions"><button type="button" class="secondary" data-copy-rx-cart>Copiar receita</button><button type="button" class="primary" data-print-rx-cart>Imprimir / PDF</button></div></footer></div>`;
    document.body.appendChild(d);
  }
  function interactionSummary(cart){
    const n=cart.map(x=>norm(x.name)); const out=[];
    const has=x=>n.some(v=>v.includes(norm(x)));
    if(has('isotretinoina')&&(has('doxiciclina')||has('minociclina')||has('sareciclina'))) out.push(['BLOQUEIO','Retinoide sistêmico + tetraciclina: evitar associação pelo risco de hipertensão intracraniana.']);
    if(has('espironolactona')&&has('trimetoprim')) out.push(['ALTA','Espironolactona + trimetoprim pode aumentar o risco de hipercalemia.']);
    if((has('finasterida')&&has('dutasterida'))) out.push(['DUPLICIDADE','Finasterida + dutasterida: duplicidade de bloqueio da 5-alfa-redutase; justificar explicitamente se mantida.']);
    if(has('tacrolimo')&&has('pimecrolimo')) out.push(['DUPLICIDADE','Tacrolimo + pimecrolimo tópicos: mesma finalidade imunomoduladora; normalmente escolher um conforme área/formulação.']);
    if(has('adalimumabe')&&has('infliximabe')) out.push(['BLOQUEIO','Dois anti-TNF concomitantes não constituem esquema dermatológico rotineiro; revisar antes de prescrever.']);
    const biologics=['adalimumabe','infliximabe','secuquinumabe','bimequizumabe','dupilumabe','omalizumabe'];
    const selected=biologics.filter(has); if(selected.length>1) out.push(['ALTA','Mais de um biológico foi selecionado. Combinação de biológicos exige justificativa especializada e não deve ocorrer automaticamente.']);
    const jaks=['baricitinibe','ritlecitinibe','deucravacitinibe','ruxolitinibe'];const sj=jaks.filter(has); if(sj.length>1) out.push(['ALTA','Mais de um inibidor de via JAK/TYK foi selecionado; revisar duplicidade imunomoduladora.']);
    return out;
  }
  function hardBlocks(){
    const cart=load();const names=cart.map(x=>norm(x.name));const has=x=>names.some(n=>n.includes(norm(x)));
    const blocks=[];
    if(has('isotretinoina')&&(has('doxiciclina')||has('minociclina')||has('sareciclina')))blocks.push('Isotretinoína + tetraciclina: não liberar receita combinada.');
    if(has('metotrexato')&&(has('trimetoprim')||has('sulfametoxazol')))blocks.push('Metotrexato + TMP-SMX: risco de mielotoxicidade grave.');
    if(has('azatioprina')&&(has('alopurinol')||has('febuxostate')))blocks.push('Azatioprina + alopurinol/febuxostate: interação grave.');
    if(cart.some(x=>['rx-rituximab','rx-infliximab'].includes(x.id)))blocks.push('Biológico de infusão exige protocolo e serviço especializado, não receita simples.');
    const mtx=cart.find(x=>x.id==='rx-methotrexate');
    if(mtx&&/(?:diariamente|todos\s+os\s+dias|1x\s*\/\s*dia|a\s+cada\s+dia|24\s*horas|24\s*h\b)/i.test(mtx.instructions||'')){
      blocks.push('Metotrexato dermatológico: possível posologia DIÁRIA — erro potencialmente fatal; revisar e corrigir para esquema apropriado.');
    }
    return blocks;
  }
  function recipeText(){
    const cart=load();
    return cart.map((x,i)=>`${i+1}. ${x.name}${x.quantity?` — Quantidade: ${x.quantity}`:''}\n${x.instructions||''}${x.notes?`\nObservações: ${x.notes}`:''}`).join('\n\n');
  }
  function render(){
    ensureDialog(); const body=document.querySelector('[data-rx-cart-body]'); if(!body)return;
    const cart=load();
    const interactions=interactionSummary(cart);
    const dangerous=hardBlocks();
    body.innerHTML=`${dangerous.length?`<section class="rx-cart-alerts"><strong>EXPORTAÇÃO BLOQUEADA — SEGURANÇA</strong>${dangerous.map(x=>`<div class="rx-cart-alert"><b>BLOQUEIO</b><span>${esc(x)}</span></div>`).join('')}</section>`:''}${interactions.length?`<section class="rx-cart-alerts"><span class="overview-label">Checagem entre itens selecionados</span>${interactions.map(x=>`<div class="rx-cart-alert"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('')}</section>`:''}
    ${!cart.length?'<div class="empty-state"><h3>Receita vazia</h3><p>Abra um medicamento e toque em “Adicionar à receita”.</p></div>':cart.map((x,i)=>`<article class="rx-cart-item" data-cart-item="${esc(x.id)}"><div class="rx-cart-item-head"><div><span class="rx-cart-number">${i+1}</span><strong>${esc(x.name)}</strong><small>${esc(x.class||'')}</small></div><button type="button" class="text-btn" data-remove-rx="${esc(x.id)}">Remover</button></div><label><span>Posologia / modo de usar</span><textarea rows="4" data-cart-field="instructions">${esc(x.instructions||'')}</textarea></label><div class="rx-cart-grid"><label><span>Quantidade</span><input data-cart-field="quantity" value="${esc(x.quantity||'')}" placeholder="Ex.: 30 comprimidos"></label><label><span>Observações</span><input data-cart-field="notes" value="${esc(x.notes||'')}" placeholder="Opcional"></label></div></article>`).join('')}`;
    body.querySelectorAll('[data-remove-rx]').forEach(b=>b.addEventListener('click',()=>remove(b.dataset.removeRx)));
    body.querySelectorAll('[data-cart-item]').forEach(item=>item.querySelectorAll('[data-cart-field]').forEach(el=>el.addEventListener('input',()=>updateItem(item.dataset.cartItem,el.dataset.cartField,el.value))));
  }
  function open(){ensureDialog();render();document.querySelector('#rxCartDialog')?.showModal();}
  function close(){document.querySelector('#rxCartDialog')?.close();}
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-open-rx-cart]')){e.preventDefault();open();return;}
    if(e.target.closest('[data-close-rx-cart]')){e.preventDefault();close();return;}
    if(e.target.closest('[data-clear-rx-cart]')){e.preventDefault();clear();return;}
    if(e.target.closest('[data-copy-rx-cart]')){e.preventDefault();e.stopImmediatePropagation();const b=hardBlocks();if(b.length){window.DT_UI?.notify?.('Receita bloqueada: revise os riscos.','warning');alert('Não foi possível copiar a receita:\\n'+b.join('\\n'));return;}const text=recipeText();if(window.DT_UI?.copyText){window.DT_UI.copyText(text,'Receita copiada.');}else if(text){window.prompt('Copie a receita:',text);}return;}
    if(e.target.closest('[data-print-rx-cart]')){e.preventDefault();e.stopImmediatePropagation();const b=hardBlocks();if(b.length){window.DT_UI?.notify?.('Receita bloqueada: revise as interações/posologia');alert('Não foi possível imprimir a receita:\n'+b.join('\n'));return;}const w=window.open('','_blank');if(!w)return;w.document.write(`<html><head><title>Receita</title><style>body{font-family:Arial,sans-serif;padding:40px;white-space:pre-wrap;line-height:1.6}h1{font-size:20px}</style></head><body><h1>Prescrição</h1>${esc(recipeText()).replace(/\n/g,'<br>')}</body></html>`);w.document.close();w.focus();w.print();return;}
    const btn=e.target.closest('#useRxInPatient');
    if(btn){
      const title=document.querySelector('#detailPanel .detail-title')?.textContent?.trim(); const rx=prescriptions().find(x=>x.name===title);
      if(!rx)return;
      const safety=window.DT_RX_SAFETY_LAST;
      if(!safety || safety.drug!==rx.name || !safety.canRelease){e.preventDefault();e.stopImmediatePropagation();window.DT_UI?.notify?.('Complete e confirme a triagem do medicamento antes de adicionar à receita.');return;}
      e.preventDefault();e.stopImmediatePropagation();add(rx);
    }
  },true);
  const mo=new MutationObserver(()=>{
    ensureButton();
    const btn=document.querySelector('#useRxInPatient');
    if(btn && btn.dataset.cartRenamed!=='1'){btn.dataset.cartRenamed='1';if(!btn.disabled)btn.textContent='Adicionar à receita';}
  });
  mo.observe(document.body,{childList:true,subtree:true});
  ensureButton();ensureDialog();updateBadge();
  window.DT_PRESCRIPTION_CART={addById(id){const rx=prescriptions().find(x=>x.id===id);const s=window.DT_RX_SAFETY_LAST;if(rx&&s?.drug===rx.name&&s.canRelease){add(rx);return true;}window.DT_UI?.notify?.('Abra o medicamento e conclua a triagem antes de adicionar.');return false;},open,clear,get:load};
})();