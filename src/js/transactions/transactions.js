// ======================
// GESTION DES TRANSACTIONS
// ======================
let transactions = [];
let selectedMonth = null; // Format: "YYYY-MM"
let pendingRollover = null;
const declinedRolloverMonths = new Set();
let activeFilters = {
    search: '',
    categories: []
};
let timeGroupingEnabled = false; // Désactiver le regroupement temporel par défaut
const SWIPE_TRIGGER_DISTANCE = 90;
const SWIPE_MAX_OFFSET = 120;

Object.defineProperty(window, 'transactions', {
    get: () => transactions,
    set: (value) => { transactions = value; },
    configurable: true
});

Object.defineProperty(window, 'selectedMonth', {
    get: () => selectedMonth,
    set: (value) => { selectedMonth = value; },
    configurable: true
});

Object.defineProperty(window, 'pendingRollover', {
    get: () => pendingRollover,
    set: (value) => { pendingRollover = value; },
    configurable: true
});

Object.defineProperty(window, 'activeFilters', {
    get: () => activeFilters,
    set: (value) => { activeFilters = value; },
    configurable: true
});

Object.defineProperty(window, 'timeGroupingEnabled', {
    get: () => timeGroupingEnabled,
    set: (value) => { timeGroupingEnabled = value; },
    configurable: true
});

Object.defineProperty(window, 'currentSort', {
    get: () => currentSort,
    set: (value) => { currentSort = value; },
    configurable: true
});

window.SWIPE_TRIGGER_DISTANCE = SWIPE_TRIGGER_DISTANCE;
window.SWIPE_MAX_OFFSET = SWIPE_MAX_OFFSET;

// État du tri
let currentSort = {
    field: null,
    direction: 'asc' // 'asc' ou 'desc'
};

export function getSelectedMonth() {
    return selectedMonth || new Date().toISOString().slice(0, 7);
}

export function formatMonthLabel(monthStr) {
    if (!monthStr) return '';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function getMonthBalance(monthStr) {
    const monthTransactions = getTransactionsForMonth(monthStr);
    const income = monthTransactions
        .filter(t => t.type === 'income' && !isInternalSavingsTransfer(t))
        .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions
        .filter(t => t.type === 'expense' && !isInternalSavingsTransfer(t))
        .reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
}

export function isInternalSavingsTransfer(transaction) {
    if (!transaction) return false;

    if (transaction.rolloverMode === 'savings-transfer') {
        return true;
    }

    const description = typeof transaction.description === 'string' ? transaction.description.toLowerCase() : '';
    return transaction.rollover === true
        && transaction.type === 'expense'
        && transaction.category === 'Épargne'
        && description.startsWith('épargne report solde');
}

export function getMonthLastDate(monthStr) {
    const [year, month] = monthStr.split('-').map(value => parseInt(value, 10));
    const lastDay = new Date(year, month, 0).getDate();
    return `${monthStr}-${String(lastDay).padStart(2, '0')}`;
}

export function getPreviousMonth(monthStr) {
    const [year, month] = monthStr.split('-').map(value => parseInt(value, 10));
    const date = new Date(year, month - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function hasRolloverForMonth(monthStr) {
    return transactions.some(t => t.rollover === true && t.date && t.date.startsWith(monthStr));
}

export function setRolloverModalContent(previousMonth, balance) {
    const labelEl = document.getElementById('rolloverSourceLabel');
    const amountEl = document.getElementById('rolloverAmount');
    if (labelEl) {
        labelEl.textContent = formatMonthLabel(previousMonth);
    }
    if (amountEl) {
        amountEl.textContent = formatCurrency(balance);
        amountEl.classList.toggle('positive', balance > 0);
        amountEl.classList.toggle('negative', balance < 0);
    }
}

export function maybePromptRollover(previousMonth, targetMonth) {
    if (!previousMonth || !targetMonth) return;
    if (targetMonth <= previousMonth) return;
    if (declinedRolloverMonths.has(targetMonth)) return;
    if (hasRolloverForMonth(targetMonth)) return;

    const balance = getMonthBalance(previousMonth);
    if (Math.abs(balance) < 0.01) return;

    pendingRollover = { previousMonth, targetMonth, balance };
    setRolloverModalContent(previousMonth, balance);
    openModal('rolloverModal');
}

export async function applyRolloverTransaction(mode = 'balance') {
    if (!pendingRollover) return;

    const { previousMonth, targetMonth, balance } = pendingRollover;
    const monthLabel = formatMonthLabel(previousMonth);

    if (mode === 'savings' && balance <= 0) {
        Toast.warning('Épargne impossible', 'Le solde à épargner doit être positif');
        return;
    }

    const openingTransaction = mode === 'savings'
        ? {
            type: 'expense',
            description: `Épargne report solde ${monthLabel}`,
            category: 'Épargne',
            amount: Math.abs(balance),
            date: `${targetMonth}-01`,
            timestamp: new Date().toISOString(),
            rollover: true,
            rolloverMode: 'savings-transfer'
        }
        : {
            type: balance >= 0 ? 'income' : 'expense',
            description: `Report solde ${monthLabel}`,
            category: 'Autres',
            amount: Math.abs(balance),
            date: `${targetMonth}-01`,
            timestamp: new Date().toISOString(),
            rollover: true
        };

    const closingTransaction = {
        type: balance >= 0 ? 'expense' : 'income',
        description: `Clôture report solde ${monthLabel}`,
        category: 'Autres',
        amount: Math.abs(balance),
        date: getMonthLastDate(previousMonth),
        timestamp: new Date().toISOString(),
        rollover: true,
        rolloverMode: 'closing-entry'
    };

    pendingRollover = null;
    await addTransaction(closingTransaction);
    await addTransaction(openingTransaction);
    closeModal('rolloverModal');
}

export function dismissRolloverPrompt(markDeclined = true) {
    if (pendingRollover && markDeclined) {
        declinedRolloverMonths.add(pendingRollover.targetMonth);
    }
    pendingRollover = null;
    closeModal('rolloverModal');
}

// Sauvegarder automatiquement les transactions locales quand elles changent
window.addEventListener('beforeunload', () => {
    if (!db) {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
});

window.getSelectedMonth = getSelectedMonth;
window.formatMonthLabel = formatMonthLabel;
window.getMonthBalance = getMonthBalance;
window.isInternalSavingsTransfer = isInternalSavingsTransfer;
window.getMonthLastDate = getMonthLastDate;
window.getPreviousMonth = getPreviousMonth;
window.hasRolloverForMonth = hasRolloverForMonth;
window.setRolloverModalContent = setRolloverModalContent;
window.maybePromptRollover = maybePromptRollover;
window.applyRolloverTransaction = applyRolloverTransaction;
window.dismissRolloverPrompt = dismissRolloverPrompt;
