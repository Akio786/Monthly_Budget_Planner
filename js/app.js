// ─── State ────────────────────────────────────────────────────
let state = loadData();
let currentPage = 'overview';

// ─── Toast System ─────────────────────────────────────────────
function toast(msg, type = 'info', duration = 3000) {
  const region = document.getElementById('toast-region');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  el.innerHTML = `<span>${icons[type] || icons.info}</span><span>${msg}</span>`;
  region.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 200);
  }, duration);
}

// ─── Navigation ───────────────────────────────────────────────
function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  document.querySelectorAll('.page').forEach(el => {
    el.classList.toggle('active', el.id === `page-${page}`);
  });
  const titles = {
    overview: 'Overview',
    details: 'Budget Details',
    edit: 'Edit Values',
    manage: 'Manage Categories',
    io: 'Import / Export',
    settings: 'Settings'
  };
  document.getElementById('topbar-title').textContent = titles[page] || page;
  closeSidebar();
  render();
}

// ─── Sidebar ──────────────────────────────────────────────────
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ─── Save ─────────────────────────────────────────────────────
function save() {
  saveData(state);
}

// ─── Render ───────────────────────────────────────────────────
function render() {
  switch (currentPage) {
    case 'overview':  renderOverview();  break;
    case 'details':   renderDetails();   break;
    case 'edit':      renderEdit();      break;
    case 'manage':    renderManage();    break;
    case 'io':        renderIO();        break;
    case 'settings':  renderSettings();  break;
  }
}

// ─── Overview Page ────────────────────────────────────────────
function renderOverview() {
  const g = computeGlobal(state.categories);
  const sym = state.meta.currencySymbol;

  // KPIs
  document.getElementById('kpi-container').innerHTML = `
    <div class="kpi-card" style="--kpi-color:#22c55e">
      <div class="kpi-label">Total Income</div>
      <div class="kpi-value text-good">${fmt(g.incomeActual, sym)}</div>
      <div class="kpi-sub">of ${fmt(g.incomeProjected, sym)} projected</div>
    </div>
    <div class="kpi-card" style="--kpi-color:#f87171">
      <div class="kpi-label">Total Expenses</div>
      <div class="kpi-value ${g.expActual > g.expProjected ? 'text-bad' : ''}">${fmt(g.expActual, sym)}</div>
      <div class="kpi-sub">of ${fmt(g.expProjected, sym)} projected</div>
    </div>
    <div class="kpi-card" style="--kpi-color:${g.balActual >= 0 ? '#6ee7b7' : '#f87171'}">
      <div class="kpi-label">Net Balance</div>
      <div class="kpi-value ${g.balActual >= 0 ? 'text-good' : 'text-bad'}">${g.balActual < 0 ? '-' : ''}${fmt(Math.abs(g.balActual), sym)}</div>
      <div class="kpi-sub">
        <span class="kpi-badge ${g.balActual >= 0 ? 'badge-good' : 'badge-bad'}">${g.balActual >= 0 ? '▲' : '▼'} ${g.savingsRate}% savings rate</span>
      </div>
    </div>
    <div class="kpi-card" style="--kpi-color:#6366f1">
      <div class="kpi-label">Budget Variance</div>
      <div class="kpi-value ${(g.balActual - g.balProjected) >= 0 ? 'text-good' : 'text-bad'}">${(g.balActual - g.balProjected) >= 0 ? '+' : ''}${fmt(g.balActual - g.balProjected, sym)}</div>
      <div class="kpi-sub">vs. projected net balance</div>
    </div>
  `;

  // Spending bars
  const expenses = state.categories.filter(c => c.id !== 'cat_income');
  const maxExp = Math.max(...expenses.map(c => {
    const { projectedTotal, actualTotal } = computeCategory(c);
    return Math.max(projectedTotal, actualTotal);
  }), 1);

  document.getElementById('spending-bars').innerHTML = expenses.map(cat => {
    const { projectedTotal, actualTotal } = computeCategory(cat);
    const projPct   = Math.min((projectedTotal / maxExp) * 100, 100);
    const actualPct = Math.min((actualTotal   / maxExp) * 100, 100);
    const over      = actualTotal > projectedTotal;
    return `
      <div class="spend-bar-item">
        <div class="spend-bar-header">
          <span class="spend-bar-icon">${cat.icon}</span>
          <span class="spend-bar-name">${cat.name}</span>
          <span class="spend-bar-amounts ${over ? 'text-bad' : ''}">${fmt(actualTotal, sym)} / ${fmt(projectedTotal, sym)}</span>
        </div>
        <div class="bar-track">
          <div class="bar-proj" style="width:${projPct}%"></div>
          <div class="bar-actual" style="width:${actualPct}%;background:${over ? 'var(--danger)' : cat.color}"></div>
        </div>
      </div>`;
  }).join('');

  // Donut chart
  renderDonut(expenses, sym);

  // Balance summary
  document.getElementById('balance-summary').innerHTML = `
    <div class="balance-row">
      <span class="balance-label">Projected Income</span>
      <span class="balance-val">${fmt(g.incomeProjected, sym)}</span>
    </div>
    <div class="balance-row">
      <span class="balance-label">Projected Expenses</span>
      <span class="balance-val">-${fmt(g.expProjected, sym)}</span>
    </div>
    <div class="balance-row balance-total">
      <span class="balance-label">Projected Balance</span>
      <span class="balance-val ${g.balProjected >= 0 ? 'text-good' : 'text-bad'}">${g.balProjected >= 0 ? '+' : ''}${fmt(g.balProjected, sym)}</span>
    </div>
    <div class="balance-divider" style="margin:12px 0"></div>
    <div class="balance-row">
      <span class="balance-label">Actual Income</span>
      <span class="balance-val text-good">${fmt(g.incomeActual, sym)}</span>
    </div>
    <div class="balance-row">
      <span class="balance-label">Actual Expenses</span>
      <span class="balance-val text-bad">-${fmt(g.expActual, sym)}</span>
    </div>
    <div class="balance-row balance-total">
      <span class="balance-label">Actual Balance</span>
      <span class="balance-val ${g.balActual >= 0 ? 'text-good' : 'text-bad'}">${g.balActual >= 0 ? '+' : ''}${fmt(g.balActual, sym)}</span>
    </div>
  `;
}

function renderDonut(categories, sym) {
  const items = categories.map(c => {
    const { actualTotal } = computeCategory(c);
    return { name: c.name, icon: c.icon, color: c.color, value: actualTotal };
  }).filter(i => i.value > 0);

  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const size = 200, cx = 100, cy = 100, r = 80, stroke = 28;

  let offset = 0;
  const circumference = 2 * Math.PI * r;
  let paths = '';
  for (const item of items) {
    const pct  = item.value / total;
    const dash = pct * circumference;
    const gap  = circumference - dash;
    paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${item.color}" stroke-width="${stroke}"
      stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
      stroke-dashoffset="${(-offset * circumference).toFixed(2)}"
      style="transition: stroke-dashoffset 0.4s ease">
    </circle>`;
    offset += pct;
  }

  document.getElementById('donut-chart').innerHTML = `
    <svg class="donut-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="${stroke}"/>
      ${paths}
    </svg>
    <div class="donut-label">
      <span class="donut-label-value">${fmt(total, sym)}</span>
      <span class="donut-label-sub">total expenses</span>
    </div>
  `;

  document.getElementById('donut-legend').innerHTML = items.slice(0, 7).map(item => {
    const pct = Math.round((item.value / total) * 100);
    return `<div class="legend-item">
      <span class="legend-dot" style="background:${item.color}"></span>
      <span class="legend-name">${item.icon} ${item.name}</span>
      <span class="legend-pct" style="color:${item.color}">${pct}%</span>
    </div>`;
  }).join('');
}

// ─── Details Page ─────────────────────────────────────────────
function renderDetails() {
  const sym = state.meta.currencySymbol;
  const container = document.getElementById('details-container');

  if (!state.categories.length) {
    container.innerHTML = `<div class="empty-state">
      <span class="empty-state-icon">📂</span>
      <div class="empty-state-title">No categories yet</div>
      <div class="empty-state-sub">Add some in the Manage tab</div>
    </div>`;
    return;
  }

  container.innerHTML = state.categories.map(cat => {
    const { projectedTotal, actualTotal, diff } = computeCategory(cat);
    const isIncome = cat.id === 'cat_income' || cat.name.toLowerCase().includes('income');
    const diffClass = diff === 0 ? 'diff-zero' : (isIncome ? (diff < 0 ? 'diff-good' : 'diff-bad') : (diff > 0 ? 'diff-good' : 'diff-bad'));
    const diffLabel = diff === 0 ? '—' : (diff > 0 ? '+' : '') + fmt(diff, sym);

    const rows = cat.items.map(item => {
      const iProj = Number(item.projected) || 0;
      const iAct  = Number(item.actual)    || 0;
      const iDiff = iProj - iAct;
      const iDiffClass = iDiff === 0 ? 'diff-zero' : (isIncome ? (iDiff < 0 ? 'diff-good' : 'diff-bad') : (iDiff > 0 ? 'diff-good' : 'diff-bad'));
      const iDiffLabel = iDiff === 0 ? '—' : (iDiff > 0 ? '+' : '') + fmt(iDiff, sym);
      return `<tr>
        <td>${item.name}</td>
        <td>${fmt(iProj, sym)}</td>
        <td>${fmt(iAct, sym)}</td>
        <td class="${iDiffClass}">${iDiffLabel}</td>
      </tr>`;
    }).join('');

    return `<div class="cat-accordion" id="acc-${cat.id}">
      <div class="cat-header" data-action="toggle-acc" data-id="${cat.id}">
        <div class="cat-color-bar" style="background:${cat.color}"></div>
        <span class="cat-icon">${cat.icon}</span>
        <span class="cat-name">${cat.name}</span>
        <div class="cat-totals">
          <div class="cat-total-col">
            <div class="cat-total-label">Projected</div>
            <div class="cat-total-val">${fmt(projectedTotal, sym)}</div>
          </div>
          <div class="cat-total-col">
            <div class="cat-total-label">Actual</div>
            <div class="cat-total-val">${fmt(actualTotal, sym)}</div>
          </div>
          <div class="cat-total-col">
            <div class="cat-total-label">Diff</div>
            <div class="cat-total-val ${diffClass}">${diffLabel}</div>
          </div>
        </div>
        <span class="cat-chevron">▼</span>
      </div>
      <div class="cat-body">
        <table class="cat-body-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Projected</th>
              <th>Actual</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }).join('');
}

// ─── Edit Page ────────────────────────────────────────────────
function renderEdit() {
  const sym = state.meta.currencySymbol;
  document.getElementById('edit-container').innerHTML = state.categories.map(cat => {
    const rows = cat.items.map(item => `
      <tr>
        <td><span class="edit-item-name">${item.name}</span></td>
        <td>
          <input type="number" class="edit-input"
            data-action="edit-projected"
            data-cat="${cat.id}" data-item="${item.id}"
            value="${Number(item.projected) || 0}" min="0" step="100">
        </td>
        <td>
          <input type="number" class="edit-input"
            data-action="edit-actual"
            data-cat="${cat.id}" data-item="${item.id}"
            value="${Number(item.actual) || 0}" min="0" step="100">
        </td>
      </tr>`).join('');

    return `<div class="edit-cat-block">
      <div class="edit-cat-header">
        <span class="edit-cat-icon">${cat.icon}</span>
        <span class="edit-cat-name" style="color:${cat.color}">${cat.name}</span>
      </div>
      <table class="edit-table">
        <thead>
          <tr>
            <th style="text-align:left">Item</th>
            <th>Projected (${sym})</th>
            <th>Actual (${sym})</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('');
}

// ─── Manage Page ─────────────────────────────────────────────
function renderManage() {
  const container = document.getElementById('manage-container');
  container.innerHTML = state.categories.map(cat => {
    const items = cat.items.map(item => `
      <div class="manage-item-row">
        <span class="manage-item-name">${item.name}</span>
        <button class="btn btn-ghost btn-sm btn-icon" data-action="delete-item" data-cat="${cat.id}" data-item="${item.id}" title="Delete item">🗑</button>
      </div>`).join('');

    return `<div class="manage-cat-block">
      <div class="manage-cat-header">
        <span style="font-size:1.1rem">${cat.icon}</span>
        <span class="manage-cat-name" style="color:${cat.color}">${cat.name}</span>
        <button class="btn btn-ghost btn-sm btn-icon" data-action="delete-cat" data-cat="${cat.id}" title="Delete category">🗑</button>
      </div>
      ${items}
      <div class="add-item-row">
        <input type="text" class="form-input" placeholder="New item name…" id="new-item-name-${cat.id}" style="flex:1">
        <button class="btn btn-secondary btn-sm" data-action="add-item" data-cat="${cat.id}">+ Add Item</button>
      </div>
    </div>`;
  }).join('');

  // Add category form
  container.innerHTML += `
    <div class="add-cat-section">
      <div class="add-cat-title">➕ Add New Category</div>
      <div class="form-row">
        <div class="form-group" style="flex:2">
          <label class="form-label" for="new-cat-name">Category Name</label>
          <input type="text" id="new-cat-name" class="form-input" placeholder="e.g. Kids & Education">
        </div>
        <div class="form-group" style="flex:0.5; min-width:80px">
          <label class="form-label" for="new-cat-icon">Icon</label>
          <input type="text" id="new-cat-icon" class="form-input" placeholder="📚" maxlength="4">
        </div>
        <div class="form-group" style="flex:0.5; min-width:80px">
          <label class="form-label" for="new-cat-color">Color</label>
          <input type="color" id="new-cat-color" class="form-input" value="#6366f1">
        </div>
      </div>
      <button class="btn btn-primary" data-action="add-cat">+ Add Category</button>
    </div>`;
}

// ─── Import / Export Page ────────────────────────────────────
function renderIO() {
  document.getElementById('io-container').innerHTML = `
    <div class="io-grid">
      <div class="io-card">
        <div class="io-card-title">📤 Export</div>
        <div class="io-card-desc">Download a full backup of your budget data as JSON, or export to CSV for use in Excel or Google Sheets.</div>
        <div class="io-card-actions">
          <button class="btn btn-primary" data-action="export-json">↓ Export JSON</button>
          <button class="btn btn-secondary" data-action="export-csv">↓ Export CSV</button>
        </div>
      </div>
      <div class="io-card">
        <div class="io-card-title">📥 Import JSON</div>
        <div class="io-card-desc">Restore from a previously exported JSON backup. This will replace all current data.</div>
        <div class="drop-zone" id="drop-zone" data-action="drop-zone">
          <span class="drop-zone-icon">📂</span>
          Click to browse or drag & drop a JSON file here
        </div>
        <input type="file" id="import-file" accept=".json" style="display:none">
      </div>
    </div>
    <div class="io-card" style="margin-bottom:16px">
      <div class="io-card-title" style="margin-bottom:6px">⚠️ Reset Data</div>
      <div class="io-card-desc">Clear all data and restore the sample budget. This cannot be undone.</div>
      <button class="btn btn-danger" data-action="reset-data">Reset to Defaults</button>
    </div>
  `;
}

// ─── Settings Page ────────────────────────────────────────────
function renderSettings() {
  document.getElementById('settings-container').innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">💱 Currency</div>
      <div class="setting-row">
        <div>
          <div class="setting-label">Currency Symbol</div>
          <div class="setting-sub">Displayed before amounts</div>
        </div>
        <input type="text" class="form-input" id="set-sym"
          value="${state.meta.currencySymbol}" maxlength="5" style="width:80px;text-align:center">
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-label">Budget Label</div>
          <div class="setting-sub">Shown in the sidebar</div>
        </div>
        <input type="text" class="form-input" id="set-label"
          value="${state.meta.monthLabel}" style="width:180px">
      </div>
      <div style="margin-top:14px">
        <button class="btn btn-primary" data-action="save-settings">Save Settings</button>
      </div>
    </div>
  `;
}

// ─── Event Delegation ─────────────────────────────────────────
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action, id, cat: catId, item: itemId, page } = el.dataset;

  if (action === 'nav') { navigate(page); return; }
  if (action === 'open-sidebar') { openSidebar(); return; }
  if (action === 'close-sidebar') { closeSidebar(); return; }

  if (action === 'toggle-acc') {
    const acc = document.getElementById(`acc-${id || el.dataset.id}`);
    if (acc) acc.classList.toggle('open');
    return;
  }

  if (action === 'delete-item') {
    const cat = state.categories.find(c => c.id === catId);
    if (!cat) return;
    cat.items = cat.items.filter(i => i.id !== itemId);
    save(); render(); toast('Item deleted', 'info');
    return;
  }

  if (action === 'delete-cat') {
    if (!confirm('Delete this entire category and all its items?')) return;
    state.categories = state.categories.filter(c => c.id !== catId);
    save(); render(); toast('Category deleted', 'info');
    return;
  }

  if (action === 'add-item') {
    const input = document.getElementById(`new-item-name-${catId}`);
    const name  = input ? input.value.trim() : '';
    if (!name) { toast('Enter an item name', 'error'); return; }
    const cat = state.categories.find(c => c.id === catId);
    if (!cat) return;
    cat.items.push({ id: genId('item'), name, projected: 0, actual: 0 });
    save(); render(); toast(`"${name}" added`, 'success');
    return;
  }

  if (action === 'add-cat') {
    const name  = document.getElementById('new-cat-name')?.value.trim();
    const icon  = document.getElementById('new-cat-icon')?.value.trim() || '📁';
    const color = document.getElementById('new-cat-color')?.value || '#6366f1';
    if (!name) { toast('Enter a category name', 'error'); return; }
    state.categories.push({ id: genId('cat'), name, icon, color, items: [] });
    save(); render(); toast(`"${name}" added`, 'success');
    return;
  }

  if (action === 'export-json') {
    const json = JSON.stringify(state, null, 2);
    downloadFile(json, 'budget-backup.json', 'application/json');
    toast('JSON exported', 'success');
    return;
  }
  if (action === 'export-csv') {
    exportCSV(state);
    toast('CSV exported', 'success');
    return;
  }
  if (action === 'drop-zone') {
    document.getElementById('import-file')?.click();
    return;
  }
  if (action === 'reset-data') {
    if (!confirm('Reset ALL budget data to defaults? This cannot be undone.')) return;
    state = resetData();
    save(); navigate('overview'); toast('Data reset to defaults', 'info');
    return;
  }
  if (action === 'save-settings') {
    const sym   = document.getElementById('set-sym')?.value.trim();
    const label = document.getElementById('set-label')?.value.trim();
    if (sym) state.meta.currencySymbol = sym;
    if (label) state.meta.monthLabel = label;
    save(); render();
    document.querySelector('.sidebar-label')?.textContent && updateSidebarLabel();
    toast('Settings saved', 'success');
    return;
  }
});

// ─── Edit inputs (live save) ──────────────────────────────────
document.addEventListener('change', (e) => {
  const el = e.target;
  if (!el.dataset.action) return;

  if (el.dataset.action === 'edit-projected' || el.dataset.action === 'edit-actual') {
    const cat  = state.categories.find(c => c.id === el.dataset.cat);
    if (!cat) return;
    const item = cat.items.find(i => i.id === el.dataset.item);
    if (!item) return;
    const key  = el.dataset.action === 'edit-projected' ? 'projected' : 'actual';
    const val  = parseFloat(el.value);
    item[key]  = isNaN(val) || val < 0 ? 0 : val;
    save();
    // no full re-render to preserve input focus
    return;
  }
});

// ─── Import file ──────────────────────────────────────────────
document.addEventListener('change', (e) => {
  if (e.target.id !== 'import-file') return;
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!parsed.categories || !Array.isArray(parsed.categories)) throw new Error('Invalid format');
      state = { ...DEFAULT_DATA, ...parsed };
      state.meta = { ...DEFAULT_DATA.meta, ...parsed.meta };
      save(); navigate('overview'); toast('Budget imported!', 'success');
    } catch (err) {
      toast('Import failed: invalid JSON file', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// ─── Drag & Drop on drop zone ─────────────────────────────────
document.addEventListener('dragover', (e) => {
  const dz = e.target.closest('#drop-zone');
  if (dz) { e.preventDefault(); dz.classList.add('drag-over'); }
});
document.addEventListener('dragleave', (e) => {
  const dz = e.target.closest('#drop-zone');
  if (dz) dz.classList.remove('drag-over');
});
document.addEventListener('drop', (e) => {
  const dz = e.target.closest('#drop-zone');
  if (!dz) return;
  e.preventDefault();
  dz.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file || !file.name.endsWith('.json')) { toast('Please drop a JSON file', 'error'); return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!parsed.categories) throw new Error();
      state = { ...DEFAULT_DATA, ...parsed };
      state.meta = { ...DEFAULT_DATA.meta, ...parsed.meta };
      save(); navigate('overview'); toast('Budget imported!', 'success');
    } catch { toast('Invalid JSON file', 'error'); }
  };
  reader.readAsText(file);
});

// ─── Sidebar overlay click ────────────────────────────────────
document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);

// ─── Init ─────────────────────────────────────────────────────
navigate('overview');
