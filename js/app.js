// Constantes de configuración
const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const WEEK_AMOUNTS = [70000, 80000, 90000, 95000, 110000, 125000, 130000]; // Suma exacta: $700.000 ARS

const MONTH_AMOUNTS = [
  10, 12, 14, 15, 16, 18,
  20, 22, 24, 25, 26, 28,
  30, 32, 33, 34, 35, 36,
  38, 40, 42, 44, 45, 46,
  48, 50, 52, 54, 55, 56
];

const CATEGORIES = {
  income: ['Producción / Recaudación Diaria', 'Ingresos Extra', 'Rendimientos / Inversión', 'Otros Ingresos'],
  expense: ['Alquiler del Auto', 'Combustible / Nafta', 'Mantenimiento / Auto', 'Comida / Supermercado', 'Servicios / Hogar', 'Educación / Cursos', 'Ocio & Salidas', 'Imprevistos'],
  saving: ['Ahorro Real Semanal ($700k)', 'Fondo de Emergencia', 'Reto 30 Días ($1k)', 'Inversión / CEDEARs', 'Capital para Proyectos']
};

let state = {
  transactions: JSON.parse(localStorage.getItem('sys_transactions')) || [],
  weekChecked: JSON.parse(localStorage.getItem('sys_week_challenge')) || [],
  monthChecked: JSON.parse(localStorage.getItem('sys_month_challenge')) || []
};

function switchTab(e, tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('[id^="view-"]').forEach(view => view.classList.add('hidden'));

  if (e && e.target) e.target.classList.add('active');
  document.getElementById(`view-${tabId}`).classList.remove('hidden');
}

function switchTabDirect(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  document.querySelectorAll('[id^="view-"]').forEach(view => view.classList.add('hidden'));
  document.getElementById(`view-${tabId}`).classList.remove('hidden');
}

function updateCategories() {
  const type = document.getElementById('txType').value;
  const catSelect = document.getElementById('txCategory');
  catSelect.innerHTML = CATEGORIES[type].map(c => `<option value="${c}">${c}</option>`).join('');
}

function addTransaction(e) {
  e.preventDefault();
  const type = document.getElementById('txType').value;
  const amount = parseFloat(document.getElementById('txAmount').value);
  const category = document.getElementById('txCategory').value;
  const date = document.getElementById('txDate').value;
  const desc = document.getElementById('txDesc').value;

  if (!amount || amount <= 0) return;

  const newTx = {
    id: Date.now(),
    type,
    amount,
    category,
    date,
    desc
  };

  state.transactions.unshift(newTx);
  saveData();
  document.getElementById('txForm').reset();
  document.getElementById('txDate').valueAsDate = new Date();
  updateCategories();
  renderAll();
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveData();
  renderAll();
}

function toggleWeekCell(idx) {
  if (state.weekChecked.includes(idx)) {
    state.weekChecked = state.weekChecked.filter(i => i !== idx);
  } else {
    state.weekChecked.push(idx);
  }
  saveData();
  renderChallenges();
}

function toggleMonthCell(idx) {
  if (state.monthChecked.includes(idx)) {
    state.monthChecked = state.monthChecked.filter(i => i !== idx);
  } else {
    state.monthChecked.push(idx);
  }
  saveData();
  renderChallenges();
}

function saveData() {
  localStorage.setItem('sys_transactions', JSON.stringify(state.transactions));
  localStorage.setItem('sys_week_challenge', JSON.stringify(state.weekChecked));
  localStorage.setItem('sys_month_challenge', JSON.stringify(state.monthChecked));
}

function renderAll() {
  renderKPIs();
  renderHistory();
  renderChallenges();
  renderAllocation();
}

function renderKPIs() {
  let income = 0, expense = 0, saving = 0;
  state.transactions.forEach(t => {
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
    else if (t.type === 'saving') saving += t.amount;
  });

  const net = income - expense - saving;

  document.getElementById('kpiIncome').textContent = `$${income.toLocaleString('es-AR')}`;
  document.getElementById('kpiExpense').textContent = `$${expense.toLocaleString('es-AR')}`;
  document.getElementById('kpiSaving').textContent = `$${saving.toLocaleString('es-AR')}`;
  document.getElementById('kpiNet').textContent = `$${net.toLocaleString('es-AR')}`;
}

function renderHistory() {
  const fullList = document.getElementById('fullHistoryList');
  const recentList = document.getElementById('dashboardRecentList');

  if (state.transactions.length === 0) {
    const emptyMsg = '<div style="text-align:center; color:var(--text-muted); padding:20px;">Sin registros guardados.</div>';
    fullList.innerHTML = emptyMsg;
    recentList.innerHTML = emptyMsg;
    return;
  }

  const generateHTML = (tx) => {
    const isInc = tx.type === 'income';
    const isSav = tx.type === 'saving';
    const sign = isInc ? '+' : '-';
    const colorClass = isInc ? 'val-income' : (isSav ? 'val-saving' : 'val-expense');
    
    return `
      <div class="tx-item">
        <div class="tx-info">
          <div class="tx-concept">${tx.desc}</div>
          <div class="tx-meta">${tx.date} • ${tx.category}</div>
        </div>
        <div class="tx-amount-group">
          <div class="tx-amount ${colorClass}">${sign}$${tx.amount.toLocaleString('es-AR')}</div>
          <button class="btn-del" onclick="deleteTransaction(${tx.id})" title="Eliminar">✕</button>
        </div>
      </div>
    `;
  };

  fullList.innerHTML = state.transactions.map(generateHTML).join('');
  recentList.innerHTML = state.transactions.slice(0, 5).map(generateHTML).join('');
}

function renderChallenges() {
  // Reto Semanal Real ($700.000)
  const weekContainer = document.getElementById('weekContainer');
  weekContainer.innerHTML = WEEK_AMOUNTS.map((amt, idx) => {
    const done = state.weekChecked.includes(idx);
    return `
      <div class="challenge-cell ${done ? 'completed' : ''}" onclick="toggleWeekCell(${idx})">
        <span class="day">${WEEK_DAYS[idx]}</span>
        <span class="amt">$${amt.toLocaleString('es-AR')}</span>
      </div>
    `;
  }).join('');

  const weekSaved = state.weekChecked.reduce((acc, idx) => acc + WEEK_AMOUNTS[idx], 0);
  const weekPct = Math.round((weekSaved / 700000) * 100);
  document.getElementById('weekSaved').textContent = `$${weekSaved.toLocaleString('es-AR')}`;
  document.getElementById('weekPct').textContent = `${weekPct}%`;

  // Reto 30 Días ($1.000)
  const monthContainer = document.getElementById('monthContainer');
  monthContainer.innerHTML = MONTH_AMOUNTS.map((amt, idx) => {
    const done = state.monthChecked.includes(idx);
    return `
      <div class="challenge-cell ${done ? 'completed' : ''}" onclick="toggleMonthCell(${idx})">
        <span class="day">D${idx + 1}</span>
        <span class="amt">$${amt}</span>
      </div>
    `;
  }).join('');

  const monthSaved = state.monthChecked.reduce((acc, idx) => acc + MONTH_AMOUNTS[idx], 0);
  const monthPct = Math.round((monthSaved / 1000) * 100);
  document.getElementById('monthSaved').textContent = `$${monthSaved.toLocaleString('es-AR')}`;
  document.getElementById('monthPct').textContent = `${monthPct}%`;
}

function renderAllocation() {
  let income = 0, expense = 0, saving = 0;
  state.transactions.forEach(t => {
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
    else if (t.type === 'saving') saving += t.amount;
  });

  const totalOutflow = expense + saving;
  if (totalOutflow === 0) {
    document.getElementById('allocNeedsPct').textContent = '0%';
    document.getElementById('allocWantsPct').textContent = '0%';
    document.getElementById('allocSavingsPct').textContent = '0%';
    return;
  }

  const needsPct = Math.round((expense * 0.7 / totalOutflow) * 100);
  const wantsPct = Math.round((expense * 0.3 / totalOutflow) * 100);
  const savingPct = Math.max(0, 100 - needsPct - wantsPct);

  document.getElementById('barNeeds').style.width = `${needsPct}%`;
  document.getElementById('barWants').style.width = `${wantsPct}%`;
  document.getElementById('barSavings').style.width = `${savingPct}%`;

  document.getElementById('allocNeedsPct').textContent = `${needsPct}%`;
  document.getElementById('allocWantsPct').textContent = `${wantsPct}%`;
  document.getElementById('allocSavingsPct').textContent = `${savingPct}%`;
}

function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `capitalflow_backup_${new Date().toISOString().slice(0,10)}.json`);
  dlAnchor.click();
}

function triggerImport() {
  document.getElementById('importInput').click();
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const loaded = JSON.parse(evt.target.result);
      if (loaded.transactions) {
        state = loaded;
        saveData();
        renderAll();
        alert('¡Datos restaurados con éxito!');
      }
    } catch (err) {
      alert('Error al leer el archivo JSON.');
    }
  };
  reader.readAsText(file);
}

// Inicializar al cargar
document.getElementById('txDate').valueAsDate = new Date();
updateCategories();
renderAll();