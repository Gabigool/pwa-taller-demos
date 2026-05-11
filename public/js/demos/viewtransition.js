const viewTransitionDemo = {
  currentView: 'grid',
  currentTheme: 'blue',
  items: [
    { id: 1, emoji: '🌊', title: 'Océano',     desc: 'Profundo y misterioso' },
    { id: 2, emoji: '🏔️', title: 'Montaña',   desc: 'Alta y majestuosa'     },
    { id: 3, emoji: '🌲', title: 'Bosque',     desc: 'Verde y tranquilo'     },
    { id: 4, emoji: '🌙', title: 'Luna',       desc: 'Serena y luminosa'     },
    { id: 5, emoji: '⚡', title: 'Tormenta',   desc: 'Intensa y poderosa'    },
    { id: 6, emoji: '🌸', title: 'Primavera',  desc: 'Suave y colorida'      },
  ],
  selectedItem: null,

  render() {
    return `
      <h2 style="font-size:18px; font-weight:600; margin-bottom:4px;">ViewTransition</h2>
      <p style="font-size:13px; color:#6b7280; margin-bottom:1rem;">
        Transiciones animadas entre vistas con la View Transitions API
      </p>

      <div id="vt-status" style="
        font-size:12px; color:#6b7280;
        margin-bottom:1rem;
        padding:8px 10px;
        background:#f5f6f8;
        border-radius:8px;
      ">
        ${document.startViewTransition
          ? '✅ View Transitions API disponible'
          : '⚠️ View Transitions no soportado — se usará fallback sin animación'}
      </div>

      <!-- Controles -->
      <div style="display:flex; gap:8px; margin-bottom:1rem; flex-wrap:wrap;">
        <button onclick="viewTransitionDemo.switchView('grid')" class="demo-btn"
          id="btn-vt-grid" style="flex:1; min-width:80px;">
          ⊞ Grid
        </button>
        <button onclick="viewTransitionDemo.switchView('list')" class="demo-btn"
          id="btn-vt-list" style="flex:1; min-width:80px;">
          ☰ Lista
        </button>
        <button onclick="viewTransitionDemo.switchView('focus')" class="demo-btn"
          id="btn-vt-focus" style="flex:1; min-width:80px;">
          ◎ Focus
        </button>
      </div>

      <!-- Área de transición -->
      <div id="vt-container" style="min-height:220px;">
        ${this.renderGrid()}
      </div>

      <!-- Detalle del item seleccionado -->
      <div id="vt-detail" style="display:none; margin-top:1rem;"></div>
    `;
  },

  renderGrid() {
    return `
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
        ${this.items.map(item => `
          <div onclick="viewTransitionDemo.selectItem(${item.id})"
            style="
              background:white; border:1px solid #e8eaed; border-radius:10px;
              padding:14px 8px; text-align:center; cursor:pointer;
              transition:border-color 0.2s;
            "
            onmouseover="this.style.borderColor='#378ADD'"
            onmouseout="this.style.borderColor='#e8eaed'"
          >
            <div style="font-size:28px; margin-bottom:6px;">${item.emoji}</div>
            <div style="font-size:12px; font-weight:500; color:#374151;">${item.title}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderList() {
    return `
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${this.items.map(item => `
          <div onclick="viewTransitionDemo.selectItem(${item.id})"
            style="
              background:white; border:1px solid #e8eaed; border-radius:10px;
              padding:12px 14px; cursor:pointer; display:flex; align-items:center; gap:12px;
              transition:border-color 0.2s;
            "
            onmouseover="this.style.borderColor='#378ADD'"
            onmouseout="this.style.borderColor='#e8eaed'"
          >
            <span style="font-size:24px;">${item.emoji}</span>
            <div>
              <div style="font-size:13px; font-weight:500; color:#374151;">${item.title}</div>
              <div style="font-size:12px; color:#6b7280;">${item.desc}</div>
            </div>
            <span style="margin-left:auto; color:#6b7280; font-size:16px;">›</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderFocus() {
    const item = this.selectedItem
      ? this.items.find(i => i.id === this.selectedItem)
      : this.items[0];
    return `
      <div style="text-align:center; padding:1.5rem 1rem;">
        <div style="font-size:72px; margin-bottom:1rem;">${item.emoji}</div>
        <div style="font-size:22px; font-weight:600; color:#111827; margin-bottom:6px;">${item.title}</div>
        <div style="font-size:14px; color:#6b7280; margin-bottom:1.5rem;">${item.desc}</div>
        <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
          ${this.items.filter(i => i.id !== item.id).map(i => `
            <button onclick="viewTransitionDemo.selectItem(${i.id})" style="
              background:white; border:1px solid #e8eaed; border-radius:8px;
              padding:6px 12px; cursor:pointer; font-size:13px;
              transition:border-color 0.2s;
            "
            onmouseover="this.style.borderColor='#378ADD'"
            onmouseout="this.style.borderColor='#e8eaed'"
            >${i.emoji} ${i.title}</button>
          `).join('')}
        </div>
      </div>
    `;
  },

  getViewContent(view) {
    if (view === 'grid')  return this.renderGrid();
    if (view === 'list')  return this.renderList();
    if (view === 'focus') return this.renderFocus();
    return '';
  },

  switchView(newView) {
    if (newView === this.currentView) return;
    this.currentView = newView;
    this.transition(() => {
      const container = document.getElementById('vt-container');
      if (container) container.innerHTML = this.getViewContent(newView);
    });
    this.updateActiveButton(newView);
  },

  selectItem(id) {
    this.selectedItem = id;
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    if (this.currentView === 'focus') {
      this.transition(() => {
        const container = document.getElementById('vt-container');
        if (container) container.innerHTML = this.renderFocus();
      });
      return;
    }

    // Mostrar detalle con transición
    this.transition(() => {
      const detail = document.getElementById('vt-detail');
      if (!detail) return;
      detail.style.display = 'block';
      detail.innerHTML = `
        <div style="
          background:#E6F1FB; border-radius:12px; padding:14px 16px;
          display:flex; align-items:center; gap:12px;
          border:1px solid #B5D4F4;
        ">
          <span style="font-size:32px;">${item.emoji}</span>
          <div>
            <div style="font-size:14px; font-weight:600; color:#185FA5;">${item.title}</div>
            <div style="font-size:12px; color:#378ADD;">${item.desc}</div>
          </div>
          <button onclick="viewTransitionDemo.closeDetail()" style="
            margin-left:auto; background:none; border:none;
            font-size:18px; cursor:pointer; color:#6b7280;
          ">✕</button>
        </div>
      `;
    });
  },

  closeDetail() {
    this.transition(() => {
      const detail = document.getElementById('vt-detail');
      if (detail) detail.style.display = 'none';
    });
  },

  transition(updateFn) {
    if (document.startViewTransition) {
      document.startViewTransition(updateFn);
    } else {
      updateFn();
    }
  },

  updateActiveButton(view) {
    ['grid', 'list', 'focus'].forEach(v => {
      const btn = document.getElementById(`btn-vt-${v}`);
      if (!btn) return;
      if (v === view) {
        btn.style.borderColor = '#378ADD';
        btn.style.background  = '#E6F1FB';
        btn.style.color       = '#185FA5';
      } else {
        btn.style.borderColor = '#e8eaed';
        btn.style.background  = 'white';
        btn.style.color       = '#374151';
      }
    });
  }
};