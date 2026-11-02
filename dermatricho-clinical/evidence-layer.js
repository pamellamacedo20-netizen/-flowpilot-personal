(() => {
  const panel=document.querySelector('#detailPanel');if(!panel)return;const CHECKED='02/11/2026';
  const sources={
    'Acne vulgar':[['AAD — Acne clinical guideline','https://www.aad.org/member/clinical-quality/guidelines/acne']],
    'Dermatite atópica':[['AAD — Atopic dermatitis clinical guideline','https://www.aad.org/member/clinical-quality/guidelines/atopic-dermatitis']],
    'Psoríase':[['AAD — Psoriasis clinical guideline','https://www.aad.org/member/clinical-quality/guidelines/psoriasis']],
    'Psoríase do couro cabeludo':[['AAD — Psoriasis clinical guideline','https://www.aad.org/member/clinical-quality/guidelines/psoriasis']],
    'Hidradenite supurativa':[['AAD/HSF — Hidradenitis suppurativa guideline','https://www.aad.org/news/hidradenitis-suppurativa-guidelines']],
    'Escabiose':[['CDC — Clinical Care of Scabies','https://www.cdc.gov/scabies/hcp/clinical-care/index.html']],
    'Herpes-zóster':[['CDC — Shingles clinical overview','https://www.cdc.gov/shingles/hcp/clinical-overview/index.html']],
    'Carcinoma basocelular':[['NCI — Skin Cancer Treatment','https://www.cancer.gov/types/skin/hp/skin-treatment-pdq']],
    'Carcinoma espinocelular cutâneo':[['NCI — Skin Cancer Treatment','https://www.cancer.gov/types/skin/hp/skin-treatment-pdq']],
    'Melanoma cutâneo':[['NCI — Melanoma Treatment','https://www.cancer.gov/types/skin/hp/melanoma-treatment-pdq']],
    'Alopecia areata':[['AAD — Alopecia areata','https://www.aad.org/public/diseases/hair-loss/types/alopecia/areata']],
    'Rosácea':[['AAD — Rosacea','https://www.aad.org/public/diseases/rosacea']],
    'Vitiligo':[['AAD — Vitiligo','https://www.aad.org/public/diseases/a-z/vitiligo-overview']],
    'Dermatite seborreica':[['AAD — Seborrheic dermatitis','https://www.aad.org/public/diseases/a-z/seborrheic-dermatitis-overview']],
    'Ceratose actínica':[['AAD — Actinic keratosis','https://www.aad.org/public/diseases/skin-cancer/actinic-keratosis-treatment']],
    'Tinea capitis':[['CDC — Ringworm clinical overview','https://www.cdc.gov/ringworm/hcp/clinical-overview/index.html']],
    'Tinea corporis/cruris':[['CDC — Ringworm clinical overview','https://www.cdc.gov/ringworm/hcp/clinical-overview/index.html']]
  };
  const esc=(v='')=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const norm=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function inject(){const title=panel.querySelector('.detail-title')?.textContent?.trim();if(!title||panel.querySelector('.evidence-links'))return;const refs=[...panel.querySelectorAll('details.clinical-accordion')].find(x=>norm(x.querySelector('summary')?.textContent||'').includes('referencias'));if(!refs)return;const arr=sources[title]||[[`PubMed — ${title}`,`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(title)}`]];const d=document.createElement('div');d.className='evidence-links';d.innerHTML=`<span class="overview-label">Fontes públicas complementares</span>${arr.map(([t,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join('')}<small>Verificado em ${CHECKED}. A referência específica da ficha continua prevalecendo quando mais atual ou mais apropriada.</small>`;refs.querySelector('.accordion-body')?.appendChild(d)}
  let q=false;const queue=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;inject();});};new MutationObserver(queue).observe(panel,{childList:true,subtree:true});queue();
})();