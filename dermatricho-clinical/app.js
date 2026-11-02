(() => {
  const data = window.DERMA_TRICHO_DATA || [];
  const searchInput = document.querySelector('#searchInput');
  const categoryChips = document.querySelector('#categoryChips');
  const diseaseList = document.querySelector('#diseaseList');
  const detailPanel = document.querySelector('#detailPanel');
  const resultCount = document.querySelector('#resultCount');
  const listTitle = document.querySelector('#listTitle');
  const aiButton = document.querySelector('#aiButton');
  const aiDialog = document.querySelector('#aiDialog');
  const aiContext = document.querySelector('#aiContext');
  const patientContext = document.querySelector('#patientContext');
  const generateAi = document.querySelector('#generateAi');
  const aiOutput = document.querySelector('#aiOutput');

  const state = {
    view: 'home',
    category: 'Todas',
    query: '',
    selectedId: null,
    favorites: new Set(JSON.parse(localStorage.getItem('dt-favorites') || '[]')),
    recent: JSON.parse(localStorage.getItem('dt-recent') || '[]')
  };

  const normalize = (value='') => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const unique = (items) => [...new Set(items)];

  function getCategories() {
    const base = state.view === 'trichology'
      ? data.filter(x => x.area === 'Tricologia')
      : state.view === 'dermatology'
        ? data.filter(x => x.area === 'Dermatologia')
        : data;
    return ['Todas', ...unique(base.map(x => x.category)).sort((a,b) => a.localeCompare(b,'pt-BR'))];
  }

  function filteredData() {
    let items = [...data];
    if (state.view === 'trichology') items = items.filter(x => x.area === 'Tricologia');
    if (state.view === 'dermatology') items = items.filter(x => x.area === 'Dermatologia');
    if (state.view === 'favorites') items = items.filter(x => state.favorites.has(x.id));
    if (state.view === 'recent') {
      const order = new Map(state.recent.map((id, index) => [id, index]));
      items = items.filter(x => order.has(x.id)).sort((a,b) => order.get(a.id) - order.get(b.id));
    }
    if (state.category !== 'Todas') items = items.filter(x => x.category === state.category);
    const q = normalize(state.query.trim());
    if (q) {
      items = items.filter(x => {
        const haystack = [x.name, x.area, x.category, ...(x.tags || []), x.summary, x.clinic, x.diagnosis, ...(x.differentials || [])].join(' ');
        return normalize(haystack).includes(q);
      });
    }
    return items;
  }

  function renderCategories() {
    const categories = getCategories();
    if (!categories.includes(state.category)) state.category = 'Todas';
    categoryChips.innerHTML = categories.map(category => `
      <button class="chip ${state.category === category ? 'active' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
    `).join('');
    categoryChips.querySelectorAll('[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.category = btn.dataset.category;
        render();
      });
    });
  }

  function renderList() {
    const items = filteredData();
    resultCount.textContent = `${items.length} conteúdo${items.length === 1 ? '' : 's'}`;
    const titles = {
      home:'Todas as doenças', dermatology:'Dermatologia', trichology:'Tricologia', favorites:'Favoritos', recent:'Recentes'
    };
    listTitle.textContent = titles[state.view] || 'Conteúdos';

    if (!items.length) {
      diseaseList.innerHTML = '<div class="empty-state"><p>Nenhum conteúdo encontrado com os filtros atuais.</p></div>';
      return;
    }

    diseaseList.innerHTML = items.map(item => `
      <button class="disease-card ${state.selectedId === item.id ? 'active' : ''}" data-id="${item.id}">
        <div class="title-row">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="star ${state.favorites.has(item.id) ? 'on' : ''}" data-star="${item.id}" role="button" aria-label="Favoritar">★</span>
        </div>
        <small>${escapeHtml(item.summary)}</small>
        <div class="tag-row">
          <span class="tag">${escapeHtml(item.area)}</span>
          <span class="tag">${escapeHtml(item.category)}</span>
        </div>
      </button>
    `).join('');

    diseaseList.querySelectorAll('.disease-card').forEach(card => {
      card.addEventListener('click', event => {
        const star = event.target.closest('[data-star]');
        if (star) {
          event.preventDefault();
          event.stopPropagation();
          toggleFavorite(star.dataset.star);
          return;
        }
        selectDisease(card.dataset.id);
      });
    });
  }

  function toggleFavorite(id) {
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    localStorage.setItem('dt-favorites', JSON.stringify([...state.favorites]));
    renderList();
    if (state.selectedId === id) renderDetail();
  }

  function selectDisease(id) {
    state.selectedId = id;
    state.recent = [id, ...state.recent.filter(x => x !== id)].slice(0, 25);
    localStorage.setItem('dt-recent', JSON.stringify(state.recent));
    renderList();
    renderDetail();
  }

  function section(title, content, className='') {
    if (!content || (Array.isArray(content) && !content.length)) return '';
    const body = Array.isArray(content)
      ? `<ul>${content.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`
      : `<p>${escapeHtml(content).replace(/\n/g,'<br>')}</p>`;
    return `<section class="clinical-section ${className}"><h3>${escapeHtml(title)}</h3>${body}</section>`;
  }

  function renderDetail() {
    const item = data.find(x => x.id === state.selectedId);
    if (!item) {
      detailPanel.className = 'detail-panel empty';
      detailPanel.innerHTML = '<div class="empty-state"><div class="empty-mark">DT</div><h2>Selecione uma condição</h2><p>A ficha clínica aparecerá aqui.</p></div>';
      return;
    }

    detailPanel.className = 'detail-panel';
    detailPanel.innerHTML = `
      <div class="detail-header">
        <div class="detail-title-row">
          <div>
            <div class="eyebrow">${escapeHtml(item.area)} · ${escapeHtml(item.category)}</div>
            <div class="detail-title">${escapeHtml(item.name)}</div>
          </div>
          <button class="star ${state.favorites.has(item.id) ? 'on' : ''}" id="detailStar" aria-label="Favoritar">★</button>
        </div>
        <p class="detail-summary">${escapeHtml(item.summary)}</p>
        <div class="tag-row" style="margin-top:12px">${(item.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
      </div>
      ${section('Clínica', item.clinic)}
      ${section('Diagnóstico', item.diagnosis)}
      ${section('Diagnósticos diferenciais', item.differentials)}
      ${section('Exames / investigação', item.exams)}
      ${item.trichoscopy ? section('Tricoscopia', item.trichoscopy) : ''}
      ${section('Tratamento', item.treatment)}
      <section class="clinical-section"><h3>Prescrição / conduta editável</h3><div class="prescription">${escapeHtml(item.prescription).replace(/\n/g,'<br>')}</div></section>
      ${section('Alertas / contraindicações', item.alerts, 'warning')}
      ${section('Seguimento', item.followup)}
      ${section('Referências-base', item.references)}
      <div class="integration-actions">
        <button class="primary" id="useInPatient">Usar no paciente</button>
        <button class="secondary" id="openAiFromDetail">Perguntar à IA</button>
      </div>
    `;

    detailPanel.querySelector('#detailStar').addEventListener('click', () => toggleFavorite(item.id));
    detailPanel.querySelector('#openAiFromDetail').addEventListener('click', openAiDialog);
    detailPanel.querySelector('#useInPatient').addEventListener('click', () => {
      openAiDialog();
      patientContext.focus();
    });
  }

  function openAiDialog() {
    const item = data.find(x => x.id === state.selectedId);
    aiContext.textContent = item
      ? `Condição selecionada: ${item.name}. O próximo passo na integração será combinar esta ficha com a avaliação, fotos, medicamentos e histórico do paciente no Derma Studio.`
      : 'Selecione uma doença para preparar um contexto clínico estruturado.';
    aiOutput.style.display = 'none';
    aiOutput.textContent = '';
    aiDialog.showModal();
  }

  function generateContext(event) {
    event.preventDefault();
    const item = data.find(x => x.id === state.selectedId);
    if (!item) {
      aiOutput.style.display = 'block';
      aiOutput.textContent = 'Selecione uma condição primeiro.';
      return;
    }
    const patient = patientContext.value.trim() || '[contexto do paciente não informado]';
    aiOutput.style.display = 'block';
    aiOutput.textContent = [
      'CONTEXTO PARA IA CLÍNICA — DERMATRICHO',
      '',
      `Condição-base: ${item.name}`,
      `Resumo: ${item.summary}`,
      `Clínica-chave: ${item.clinic}`,
      `Diferenciais: ${(item.differentials || []).join('; ')}`,
      `Investigação: ${item.exams}`,
      `Tratamento-base: ${item.treatment}`,
      item.trichoscopy ? `Tricoscopia: ${item.trichoscopy}` : '',
      `Alertas: ${item.alerts}`,
      '',
      'DADOS DO PACIENTE:',
      patient,
      '',
      'Tarefa futura da IA integrada: confrontar hipótese e diferenciais com dados do paciente; identificar lacunas; propor plano individualizado; gerar prescrição editável; gerar orientação ao paciente e relatório clínico, sempre distinguindo dado observado de inferência.'
    ].filter(Boolean).join('\n');
  }

  function escapeHtml(value='') {
    return String(value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function renderNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === state.view));
  }

  function render() {
    renderNav();
    renderCategories();
    renderList();
    renderDetail();
  }

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      state.category = 'Todas';
      render();
    });
  });

  searchInput.addEventListener('input', () => {
    state.query = searchInput.value;
    renderList();
  });

  aiButton.addEventListener('click', openAiDialog);
  generateAi.addEventListener('click', generateContext);

  render();
})();
