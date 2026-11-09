/* Alertas regulatórios de classe e fluxo de conferência.
   Nunca afirma registro ANVISA de uma apresentação sem documento e número atual. */
(() => {
  const panel=document.querySelector('#detailPanel');if(!panel)return;
  const BASE='https://www.gov.br/anvisa/pt-br/sistemas/';
  const CONSULTA='https://consultas.anvisa.gov.br/#/medicamentos/';
  const BULAS='https://consultas.anvisa.gov.br/#/bulario/';
  const RETINOIDS='https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/sncr/receituario-fisico';
  const SNCR='https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/inicio-de-nova-etapa-do-sncr-o-que-muda-a-partir-de-30-de-setembro';
  const LEPROSY='https://www.gov.br/saude/pt-br/assuntos/pcdt/h/hanseniase/view';
  const cases={
    'rx-isotretinoin':{title:'Retinoide sistêmico sujeito a Notificação de Receita Especial',msg:'Isotretinoína sistêmica: usar modelo de Notificação de Receita para retinoides vigente, procedimentos do SNCR quando eletrônica e requisitos de prevenção gestacional. O PDF simples do carrinho NÃO substitui receita oficial.',url:RETINOIDS,link:'Modelos oficiais de retinoides'},
    'rx-acitretin':{title:'Retinoide sistêmico sujeito a Notificação de Receita Especial',msg:'Acitretina sistêmica: notificação especial de retinoides, prevenção gestacional prolongada, orientação sobre álcool e conferência individual de bula. O carrinho gera apenas rascunho.',url:RETINOIDS,link:'Modelos oficiais de retinoides'},
    'rx-rifampicin':{title:'Hanseníase — seguir PQT-U/PCDT do SUS',msg:'Rifampicina para hanseníase faz parte de combinação supervisionada do SUS; não converter em monoterapia nem usar esquema isolado de outras indicações. Conferir classificação operacional, dose supervisionada e interações.',url:LEPROSY,link:'PCDT oficial de hanseníase'},
    'rx-dapsone-systemic':{title:'Hanseníase — seguir PQT-U/PCDT do SUS',msg:'Dapsona sistêmica para hanseníase é componente da PQT-U; atentar a G6PD, anemia, hemólise e metemoglobinemia. A apresentação do SUS não pode ser presumida como produto comercial avulso.',url:LEPROSY,link:'PCDT oficial de hanseníase'},
    'rx-clofazimine':{title:'Hanseníase — seguir PQT-U/PCDT do SUS',msg:'Clofazimina faz parte da PQT-U para PB/MB no Brasil. Confirmar doses, acompanhamento e acesso pelo SUS. A ficha do app não comprova registro comercial isolado.',url:LEPROSY,link:'PCDT oficial de hanseníase'}
  };
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  function inject(){
    if(document.querySelector('.nav-btn.active')?.dataset.view!=='prescriptions')return;
    const title=panel.querySelector('.detail-title')?.textContent?.trim();if(!title)return;
    const rx=(window.DERMA_TRICHO_PRESCRIPTIONS||[]).find(x=>x.name===title);if(!rx)return;
    const info=cases[rx.id];
    const current=panel.querySelector('[data-dt-reg-workflow]');
    if(current?.dataset.dtRegWorkflow===rx.id)return;
    current?.remove();
    const anchor=panel.querySelector('.anvisa-layer')||panel.querySelector('.detail-header');
    if(!anchor)return;
    const d=document.createElement('section');d.className='tri-curation-note dt-regulatory-workflow';
    d.dataset.dtRegWorkflow=rx.id;
    d.innerHTML='<div><strong>Conferência regulatória brasileira</strong><p><b>Registro/apresentação:</b> NÃO validado automaticamente neste aplicativo. O sistema não consulta em tempo real status ANVISA, lote ou disponibilidade.</p><p>Antes de prescrever, identificar produto, fabricante, número do registro, situação ativa e bula profissional vigente. A indicação off-label deve ser avaliada separadamente.</p></div>'+(info?'<div><strong>'+esc(info.title)+'</strong><p>'+esc(info.msg)+'</p><a href="'+esc(info.url)+'" target="_blank" rel="noopener noreferrer">'+esc(info.link)+'</a></div>':'')+'<div><a href="'+CONSULTA+'" target="_blank" rel="noopener noreferrer">Consultar registro oficial</a> · <a href="'+BULAS+'" target="_blank" rel="noopener noreferrer">Abrir Bulário Eletrônico</a>'+(info&&rx.id.startsWith('rx-')&&['rx-isotretinoin','rx-acitretin'].includes(rx.id)?' · <a href="'+SNCR+'" target="_blank" rel="noopener noreferrer">Regras eletrônicas SNCR</a>':'')+'</div>';
    anchor.insertAdjacentElement('afterend',d);
  }
  let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;inject()})}
  new MutationObserver(schedule).observe(panel,{childList:true,subtree:true});schedule();
  window.DT_REGULATORY_NOTES={cases,lastReview:'2026-11-08',verifiedProductRegistrations:0};
})();
