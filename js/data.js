// ─── Constants ────────────────────────────────────────────────
const STORAGE_KEY = 'hb_data_v4';

// ─── Default Data ─────────────────────────────────────────────
const DEFAULT_DATA = {
  categories: [
    {
      id: 'cat_housing',
      name: 'Housing',
      icon: '🏠',
      color: '#6366f1',
      items: [
        { id: 'item_rent',        name: 'Rent / Mortgage', projected: 25000, actual: 25000 },
        { id: 'item_utilities',   name: 'Utilities',        projected: 4000,  actual: 4500  },
        { id: 'item_internet',    name: 'Internet',         projected: 2000,  actual: 1800  },
        { id: 'item_maintenance', name: 'Maintenance',      projected: 3000,  actual: 1200  },
      ]
    },
    {
      id: 'cat_food',
      name: 'Food & Dining',
      icon: '🍽️',
      color: '#f59e0b',
      items: [
        { id: 'item_groceries',  name: 'Groceries',     projected: 15000, actual: 16200 },
        { id: 'item_dining',     name: 'Dining Out',    projected: 5000,  actual: 7800  },
        { id: 'item_delivery',   name: 'Food Delivery', projected: 2000,  actual: 3100  },
      ]
    },
    {
      id: 'cat_transport',
      name: 'Transport',
      icon: '🚗',
      color: '#10b981',
      items: [
        { id: 'item_fuel',       name: 'Fuel',          projected: 8000,  actual: 7500  },
        { id: 'item_insurance',  name: 'Car Insurance', projected: 6000,  actual: 6000  },
        { id: 'item_parking',    name: 'Parking / Toll',projected: 1500,  actual: 900   },
        { id: 'item_service',    name: 'Car Service',   projected: 3000,  actual: 0     },
      ]
    },
    {
      id: 'cat_health',
      name: 'Health',
      icon: '❤️',
      color: '#ef4444',
      items: [
        { id: 'item_insurance_h', name: 'Health Insurance', projected: 5000, actual: 5000 },
        { id: 'item_gym',         name: 'Gym',              projected: 1500, actual: 1500 },
        { id: 'item_medicine',    name: 'Medicine / Pharmacy', projected: 2000, actual: 800 },
      ]
    },
    {
      id: 'cat_entertainment',
      name: 'Entertainment',
      icon: '🎬',
      color: '#8b5cf6',
      items: [
        { id: 'item_streaming',  name: 'Streaming (Netflix etc.)', projected: 1500, actual: 1500 },
        { id: 'item_outings',    name: 'Outings & Events',         projected: 3000, actual: 4200 },
        { id: 'item_hobbies',    name: 'Hobbies',                  projected: 2000, actual: 1100 },
      ]
    },
    {
      id: 'cat_savings',
      name: 'Savings & Investments',
      icon: '💰',
      color: '#06b6d4',
      items: [
        { id: 'item_emergency',  name: 'Emergency Fund',  projected: 10000, actual: 10000 },
        { id: 'item_invest',     name: 'Investments',     projected: 15000, actual: 10000 },
        { id: 'item_retirement', name: 'Retirement Fund', projected: 5000,  actual: 5000  },
      ]
    },
    {
      id: 'cat_income',
      name: 'Income',
      icon: '💼',
      color: '#22c55e',
      items: [
        { id: 'item_salary',     name: 'Salary',          projected: 120000, actual: 120000 },
        { id: 'item_freelance',  name: 'Freelance',       projected: 15000,  actual: 8000   },
        { id: 'item_other_inc',  name: 'Other Income',    projected: 5000,   actual: 3500   },
      ]
    }
  ],
  meta: {
    currency: 'PKR',
    currencySymbol: '₨',
    monthLabel: 'Monthly Budget',
    createdAt: new Date().toISOString()
  }
};

// ─── Storage Helpers ──────────────────────────────────────────
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
    const parsed = JSON.parse(raw);
    // Merge meta defaults in case schema was extended
    parsed.meta = { ...DEFAULT_DATA.meta, ...parsed.meta };
    return parsed;
  } catch (e) {
    console.warn('Failed to load data from localStorage, using defaults.', e);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data to localStorage.', e);
  }
}

function resetData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset data.', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

// ─── ID Generator ─────────────────────────────────────────────
function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Compute Helpers ──────────────────────────────────────────
function computeCategory(cat) {
  const projectedTotal = cat.items.reduce((s, i) => s + (Number(i.projected) || 0), 0);
  const actualTotal    = cat.items.reduce((s, i) => s + (Number(i.actual)    || 0), 0);
  const diff = projectedTotal - actualTotal;
  return { projectedTotal, actualTotal, diff };
}

function computeGlobal(categories) {
  const income = categories.find(c => c.id === 'cat_income');
  const expenses = categories.filter(c => c.id !== 'cat_income');

  const incomeProjected = income ? income.items.reduce((s, i) => s + (Number(i.projected)||0), 0) : 0;
  const incomeActual    = income ? income.items.reduce((s, i) => s + (Number(i.actual)   ||0), 0) : 0;
  const expProjected    = expenses.reduce((s, cat) => s + cat.items.reduce((ss, i) => ss + (Number(i.projected)||0), 0), 0);
  const expActual       = expenses.reduce((s, cat) => s + cat.items.reduce((ss, i) => ss + (Number(i.actual)   ||0), 0), 0);

  return {
    incomeProjected, incomeActual,
    expProjected, expActual,
    balProjected: incomeProjected - expProjected,
    balActual:    incomeActual - expActual,
    savingsRate:  incomeActual > 0 ? Math.round(((incomeActual - expActual) / incomeActual) * 100) : 0
  };
}

// ─── CSV Export ───────────────────────────────────────────────
function exportCSV(data) {
  const sym = data.meta.currencySymbol;
  const rows = [['Category', 'Item', `Projected (${sym})`, `Actual (${sym})`, 'Difference', 'Status']];
  for (const cat of data.categories) {
    for (const item of cat.items) {
      const proj = Number(item.projected) || 0;
      const act  = Number(item.actual)    || 0;
      const diff = proj - act;
      const isIncome = cat.id === 'cat_income';
      let status = '';
      if (diff === 0) status = 'On Target';
      else if (isIncome) status = diff < 0 ? 'Above Target ✓' : 'Below Target ✗';
      else status = diff > 0 ? 'Under Budget ✓' : 'Over Budget ✗';
      rows.push([cat.name, item.name, proj, act, diff, status]);
    }
    const { projectedTotal, actualTotal, diff } = computeCategory(cat);
    rows.push([`TOTAL — ${cat.name}`, '', projectedTotal, actualTotal, diff, '']);
    rows.push([]);
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadFile(csv, 'budget.csv', 'text/csv');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function fmt(n, sym = '₨') {
  const abs = Math.abs(Number(n) || 0);
  if (abs >= 1000000) return `${sym}${(abs/1000000).toFixed(1)}M`;
  if (abs >= 1000)    return `${sym}${Math.round(abs/1000)}K`;
  return `${sym}${Math.round(abs).toLocaleString()}`;
}
