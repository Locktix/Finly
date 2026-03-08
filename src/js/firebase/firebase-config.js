// ======================
// CONFIGURATION FIREBASE
// ======================
let firebaseApp = null;
let db = null;

Object.defineProperty(window, 'firebaseApp', {
    get: () => firebaseApp,
    set: (value) => { firebaseApp = value; },
    configurable: true
});

Object.defineProperty(window, 'db', {
    get: () => db,
    set: (value) => { db = value; },
    configurable: true
});

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBz97Do0f0cn4_-PMc8PzIODJn0S3MVDjw",
    authDomain: "finly-f82be.firebaseapp.com",
    projectId: "finly-f82be",
    storageBucket: "finly-f82be.firebasestorage.app",
    messagingSenderId: "939430426599",
    appId: "1:939430426599:web:3f79a47ab8bbaaf7e06f42",
    measurementId: "G-GTQCFFKXS1"
};
window.firebaseConfig = firebaseConfig;

// Catégories d'icônes pour les transactions
const categoryIcons = {
    'Assurances': 'fa-shield',
    'Magasins': 'fa-shopping-bag',
    'Épargne': 'fa-piggy-bank',
    'Loisirs': 'fa-gamepad',
    'Transport': 'fa-car',
    'Santé': 'fa-hospital',
    'Restaurants': 'fa-utensils',
    'Dettes': 'fa-hand-holding-dollar',
    'Services': 'fa-wrench',
    'Abonnements': 'fa-file-invoice',
    'Factures': 'fa-file-invoice-dollar',
    'FastFood': 'fa-hamburger',
    'Salaire': 'fa-money-bill-wave',
    'Revenus': 'fa-chart-line',
    'Autres': 'fa-ellipsis-h'
};
window.categoryIcons = categoryIcons;

const expenseCategories = ['Assurances', 'Magasins', 'Épargne', 'Loisirs', 'Transport', 'Santé', 'Restaurants', 'Dettes', 'Services', 'Abonnements', 'Factures', 'FastFood', 'Autres'];
const incomeCategories = ['Salaire', 'Revenus', 'Épargne', 'Dettes', 'Autres'];
window.expenseCategories = expenseCategories;
window.incomeCategories = incomeCategories;

let iconSelectListenersReady = false;

function getCategoryIcon(value) {
    return categoryIcons[value] || 'fa-tag';
}

function closeIconSelects(except = null) {
    document.querySelectorAll('.icon-select.open').forEach(container => {
        if (container === except) return;
        container.classList.remove('open');
        const trigger = container.querySelector('.icon-select-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}

function syncIconSelectValue(container, selectEl) {
    const valueEl = container.querySelector('.icon-select-value');
    const selectedOption = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
    if (!valueEl || !selectedOption) return;

    const iconClass = getCategoryIcon(selectedOption.value);
    valueEl.innerHTML = `<i class="fas ${iconClass}"></i><span>${selectedOption.textContent}</span>`;
    container.classList.toggle('is-placeholder', !selectedOption.value);
}

function handleIconSelectChange(event) {
    const selectEl = event.currentTarget;
    const container = selectEl.iconSelectContainer;
    if (!container) return;
    syncIconSelectValue(container, selectEl);
}

function buildIconSelect(container, selectEl) {
    if (!container || !selectEl) return;

    const existingTrigger = container.querySelector('.icon-select-trigger');
    const existingMenu = container.querySelector('.icon-select-menu');
    if (existingTrigger) existingTrigger.remove();
    if (existingMenu) existingMenu.remove();
    container.classList.remove('open');

    selectEl.iconSelectContainer = container;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'icon-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const valueEl = document.createElement('span');
    valueEl.className = 'icon-select-value';

    const caret = document.createElement('i');
    caret.className = 'fas fa-chevron-down';

    trigger.appendChild(valueEl);
    trigger.appendChild(caret);

    const menu = document.createElement('div');
    menu.className = 'icon-select-menu';
    menu.setAttribute('role', 'listbox');

    Array.from(selectEl.options).forEach(option => {
        const optionButton = document.createElement('button');
        optionButton.type = 'button';
        optionButton.className = 'icon-select-option';
        optionButton.setAttribute('role', 'option');
        optionButton.dataset.value = option.value;
        optionButton.innerHTML = `<i class="fas ${getCategoryIcon(option.value)}"></i><span>${option.textContent}</span>`;

        optionButton.addEventListener('click', (event) => {
            event.preventDefault();
            selectEl.value = option.value;
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            container.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        });

        menu.appendChild(optionButton);
    });

    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const isOpen = !container.classList.contains('open');
        closeIconSelects(container);
        container.classList.toggle('open', isOpen);
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    if (!selectEl.dataset.iconSelectBound) {
        selectEl.addEventListener('change', handleIconSelectChange);
        selectEl.dataset.iconSelectBound = 'true';
    }

    container.appendChild(trigger);
    container.appendChild(menu);

    syncIconSelectValue(container, selectEl);
}

function initializeIconSelects() {
    document.querySelectorAll('.icon-select').forEach(container => {
        const selectId = container.dataset.select;
        const selectEl = selectId ? document.getElementById(selectId) : null;
        if (!selectEl) return;
        buildIconSelect(container, selectEl);
    });

    if (!iconSelectListenersReady) {
        document.addEventListener('click', () => closeIconSelects());
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeIconSelects();
            }
        });
        iconSelectListenersReady = true;
    }
}

function refreshIconSelect(selectId) {
    const selectEl = document.getElementById(selectId);
    const container = document.querySelector(`.icon-select[data-select="${selectId}"]`);
    if (!selectEl || !container) return;
    buildIconSelect(container, selectEl);
}

function formatDateForExport(dateStr) {
    if (!dateStr) return '';
    return dateStr;
}

function formatDateToIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateValue(value) {
    if (!value) return null;

    if (value instanceof Date && !isNaN(value.getTime())) {
        return formatDateToIso(value);
    }

    if (typeof value === 'number') {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(excelEpoch.getTime() + value * 86400000);
        return formatDateToIso(date);
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
            const [day, month, year] = trimmed.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
            return formatDateToIso(parsed);
        }
    }

    return null;
}

function normalizeTransaction(row) {
    if (!row || typeof row !== 'object') return null;

    const normalized = {};
    Object.keys(row).forEach(key => {
        normalized[key.toLowerCase().trim()] = row[key];
    });

    const rawType = normalized.type || normalized['transaction type'] || normalized['type transaction'] || normalized['type de transaction'];
    const rawDescription = normalized.description || normalized.libelle || normalized['libellé'] || normalized.label;
    const rawCategory = normalized.category || normalized.categorie || normalized['catégorie'] || normalized.catégorie;
    const rawAmount = normalized.amount || normalized.montant;
    const rawDate = normalized.date || normalized['transaction date'] || normalized['date transaction'];
    const rawTimestamp = normalized.timestamp;

    const typeStr = typeof rawType === 'string' ? rawType.toLowerCase() : rawType;
    let type = null;
    if (typeStr === 'expense' || typeStr === 'depense' || typeStr === 'dépense' || typeStr === 'depenses' || typeStr === 'dépenses') {
        type = 'expense';
    } else if (typeStr === 'income' || typeStr === 'recette' || typeStr === 'revenu' || typeStr === 'revenus') {
        type = 'income';
    }

    if (!type || !rawDescription || !rawCategory || rawAmount === undefined || rawAmount === null || rawDate === undefined) {
        return null;
    }

    const amount = typeof rawAmount === 'number'
        ? rawAmount
        : parseFloat(String(rawAmount).replace(',', '.'));

    if (!Number.isFinite(amount)) return null;

    const date = parseDateValue(rawDate);
    if (!date) return null;

    const timestamp = rawTimestamp ? String(rawTimestamp) : new Date().toISOString();

    return {
        type,
        description: String(rawDescription).trim(),
        category: String(rawCategory).trim(),
        amount,
        date,
        timestamp
    };
}

function getExportRows() {
    return transactions.map(transaction => ({
        Type: transaction.type === 'expense' ? 'Depense' : 'Recette',
        Description: transaction.description,
        Categorie: transaction.category,
        Montant: transaction.amount,
        Date: formatDateForExport(transaction.date),
        Timestamp: transaction.timestamp || ''
    }));
}

function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportTransactionsJson() {
    if (!transactions.length) {
        Toast.warning('Aucune donnée', 'Rien à exporter pour le moment');
        return;
    }

    const payload = {
        exportedAt: new Date().toISOString(),
        transactions
    };

    downloadBlob(JSON.stringify(payload, null, 2), 'finly-transactions.json', 'application/json');
    Toast.success('Export JSON', 'Fichier JSON généré');
}

function exportTransactionsExcel() {
    if (!transactions.length) {
        Toast.warning('Aucune donnée', 'Rien à exporter pour le moment');
        return;
    }

    if (typeof XLSX === 'undefined') {
        Toast.error('Excel indisponible', 'La librairie XLSX n\'est pas chargée');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(getExportRows());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, 'finly-transactions.xlsx');
    Toast.success('Export Excel', 'Fichier Excel généré');
}

function readJsonFile(file) {
    return file.text().then(text => JSON.parse(text));
}

function readExcelFile(file) {
    if (typeof XLSX === 'undefined') {
        return Promise.reject(new Error('XLSX indisponible'));
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                resolve(rows);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function parseSemicolonCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        const next = line[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ';' && !inQuotes) {
            values.push(current);
            current = '';
            continue;
        }

        current += char;
    }

    values.push(current);
    return values;
}

function toFlatLower(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseIngAmount(value) {
    if (value === undefined || value === null) return null;
    const cleaned = String(value)
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    const amount = parseFloat(cleaned);
    return Number.isFinite(amount) ? amount : null;
}

function inferIngDescription(row) {
    const labels = String(row.labels || '').trim();
    const details = String(row.details || '').trim();
    const primary = labels || details;
    if (!primary) return 'Transaction ING';

    const cardMatch = primary.match(/-\s*(.+?)\s+(?:\d{4}\s*-|Numero de carte|Numéro de carte)/i);
    if (cardMatch && cardMatch[1]) {
        return cardMatch[1].replace(/\s+-\s+BEL$/i, '').trim();
    }

    const transferFrom = primary.match(/de\s*:\s*([^\-;]+?)(?:\s*-\s*[A-Z]{2}\d+|\s{2,}|$)/i);
    if (transferFrom && transferFrom[1]) {
        return `Virement de ${transferFrom[1].trim()}`;
    }

    const transferTo = primary.match(/vers\s*:\s*([^\-;]+?)(?:\s*-\s*[A-Z]{2}\d+|\s{2,}|$)/i);
    if (transferTo && transferTo[1]) {
        return `Virement vers ${transferTo[1].trim()}`;
    }

    const directDebit = primary.match(/domiciliation[^\w]*(.+?)(?:avis|$)/i);
    if (directDebit && directDebit[1]) {
        return `Domiciliation ${directDebit[1].trim()}`;
    }

    return primary.length > 90 ? `${primary.slice(0, 90).trim()}...` : primary;
}

function inferIngCategory(transactionType, description, row) {
    const haystack = toFlatLower(`${description} ${row.labels || ''} ${row.details || ''}`);

    if (transactionType === 'income') {
        if (/salaire|loon|wedde|interim/.test(haystack)) return 'Salaire';
        if (/epargne|epagne|savings/.test(haystack)) return 'Épargne';
        return 'Revenus';
    }

    if (/uber\s*\*\s*eats|burger king|o\s*'?tacos|o\s*'?cheese|dunkin|khan|restaurant|snack|pizza/.test(haystack)) return 'Restaurants';
    if (/lidl|delhaize|carrefour|intermarche|action|jefar|magasin|courses/.test(haystack)) return 'Magasins';
    if (/lukoil|seety|parking|bolt|resa|carburant|essence|pony\b|transport/.test(haystack)) return 'Transport';
    if (/apple\.com|instant ink|abonnement|membership|domiciliation/.test(haystack)) return 'Abonnements';
    if (/vet|pharmacie|hopital|hopital|sante/.test(haystack)) return 'Santé';
    if (/facture|electricite|gaz|eau|internet|telecom/.test(haystack)) return 'Factures';
    if (/epargne|savings/.test(haystack)) return 'Épargne';

    return 'Autres';
}

function parseIngCsvText(text) {
    const rows = String(text || '')
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (rows.length < 2) {
        throw new Error('Fichier CSV ING vide ou incomplet');
    }

    const headers = parseSemicolonCsvLine(rows[0]).map(item => toFlatLower(item));
    const indexOf = (name) => headers.indexOf(toFlatLower(name));

    const amountIndex = indexOf('Montant');
    const bookingDateIndex = indexOf('Date comptable');
    const labelsIndex = indexOf('Libellés');
    const detailsIndex = indexOf('Détails du mouvement');
    const currencyIndex = indexOf('Devise');

    if (amountIndex < 0 || bookingDateIndex < 0 || labelsIndex < 0) {
        throw new Error('Format CSV ING non reconnu');
    }

    const parsedTransactions = [];

    for (let i = 1; i < rows.length; i += 1) {
        const values = parseSemicolonCsvLine(rows[i]);
        if (!values.length) continue;

        const amount = parseIngAmount(values[amountIndex]);
        if (!Number.isFinite(amount) || amount === 0) continue;

        const row = {
            labels: values[labelsIndex] || '',
            details: detailsIndex >= 0 ? (values[detailsIndex] || '') : '',
            currency: currencyIndex >= 0 ? (values[currencyIndex] || '') : 'EUR'
        };

        const date = parseDateValue(values[bookingDateIndex]);
        if (!date) continue;

        const type = amount < 0 ? 'expense' : 'income';
        const description = inferIngDescription(row);
        const category = inferIngCategory(type, description, row);

        parsedTransactions.push({
            type,
            description,
            category,
            amount: Math.abs(amount),
            date,
            timestamp: new Date().toISOString()
        });
    }

    if (!parsedTransactions.length) {
        throw new Error('Aucune transaction ING valide trouvée dans le CSV');
    }

    return parsedTransactions;
}

function readIngCsvFile(file) {
    return file.text().then(parseIngCsvText);
}

async function clearFirebaseTransactions() {
    if (!db || !currentUser) return;
    const snapshot = await db.collection('users')
        .doc(currentUser.uid)
        .collection('transactions')
        .get();

    if (snapshot.empty) return;

    let batch = db.batch();
    let count = 0;
    const commits = [];

    snapshot.forEach(doc => {
        batch.delete(doc.ref);
        count += 1;
        if (count >= 400) {
            commits.push(batch.commit());
            batch = db.batch();
            count = 0;
        }
    });

    if (count > 0) {
        commits.push(batch.commit());
    }

    await Promise.all(commits);
}

async function addTransactionsToFirebase(list) {
    if (!db || !currentUser || !list.length) return;
    const collectionRef = db.collection('users').doc(currentUser.uid).collection('transactions');

    let batch = db.batch();
    let count = 0;
    const commits = [];

    list.forEach(item => {
        const docRef = collectionRef.doc();
        batch.set(docRef, item);
        count += 1;
        if (count >= 400) {
            commits.push(batch.commit());
            batch = db.batch();
            count = 0;
        }
    });

    if (count > 0) {
        commits.push(batch.commit());
    }

    await Promise.all(commits);
}

async function importTransactionsData(rawData, mode = 'merge') {
    const list = Array.isArray(rawData)
        ? rawData
        : (rawData && Array.isArray(rawData.transactions) ? rawData.transactions : []);

    const cleaned = list.map(normalizeTransaction).filter(Boolean);

    if (!cleaned.length) {
        Toast.error('Import échoué', 'Aucune transaction valide trouvée');
        return { imported: 0 };
    }

    updateSyncStatus('syncing');

    if (db && currentUser) {
        if (mode === 'replace') {
            await clearFirebaseTransactions();
        }
        await addTransactionsToFirebase(cleaned);
        await loadTransactionsFromFirebase();
    } else {
        if (mode === 'replace') {
            transactions = cleaned;
        } else {
            transactions = transactions.concat(cleaned);
        }
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateDashboard();
    }

    updateSyncStatus('synced');

    return { imported: cleaned.length };
}

let currentEditingIndex = null;
let currentEditingType = null;

Object.defineProperty(window, 'currentEditingIndex', {
    get: () => currentEditingIndex,
    set: (value) => { currentEditingIndex = value; },
    configurable: true
});

Object.defineProperty(window, 'currentEditingType', {
    get: () => currentEditingType,
    set: (value) => { currentEditingType = value; },
    configurable: true
});

// Instances des graphiques
let expensesChartInstance = null;
let incomeExpenseChartInstance = null;
let balanceChartInstance = null;
let dayBalanceChartInstance = null;

Object.defineProperty(window, 'expensesChartInstance', {
    get: () => expensesChartInstance,
    set: (value) => { expensesChartInstance = value; },
    configurable: true
});

Object.defineProperty(window, 'incomeExpenseChartInstance', {
    get: () => incomeExpenseChartInstance,
    set: (value) => { incomeExpenseChartInstance = value; },
    configurable: true
});

Object.defineProperty(window, 'balanceChartInstance', {
    get: () => balanceChartInstance,
    set: (value) => { balanceChartInstance = value; },
    configurable: true
});

Object.defineProperty(window, 'dayBalanceChartInstance', {
    get: () => dayBalanceChartInstance,
    set: (value) => { dayBalanceChartInstance = value; },
    configurable: true
});

window.getCategoryIcon = getCategoryIcon;
window.closeIconSelects = closeIconSelects;
window.syncIconSelectValue = syncIconSelectValue;
window.handleIconSelectChange = handleIconSelectChange;
window.buildIconSelect = buildIconSelect;
window.initializeIconSelects = initializeIconSelects;
window.refreshIconSelect = refreshIconSelect;
window.formatDateForExport = formatDateForExport;
window.formatDateToIso = formatDateToIso;
window.parseDateValue = parseDateValue;
window.normalizeTransaction = normalizeTransaction;
window.getExportRows = getExportRows;
window.downloadBlob = downloadBlob;
window.exportTransactionsJson = exportTransactionsJson;
window.exportTransactionsExcel = exportTransactionsExcel;
window.readJsonFile = readJsonFile;
window.readExcelFile = readExcelFile;
window.parseSemicolonCsvLine = parseSemicolonCsvLine;
window.toFlatLower = toFlatLower;
window.parseIngAmount = parseIngAmount;
window.inferIngDescription = inferIngDescription;
window.inferIngCategory = inferIngCategory;
window.parseIngCsvText = parseIngCsvText;
window.readIngCsvFile = readIngCsvFile;
window.clearFirebaseTransactions = clearFirebaseTransactions;
window.addTransactionsToFirebase = addTransactionsToFirebase;
window.importTransactionsData = importTransactionsData;