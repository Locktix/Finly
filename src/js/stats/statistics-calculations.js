// ======================
// STATISTICS CALCULATIONS
// ======================

function calculateAllStatistics(transactionsList, period = 'allTime', selection = {}) {
    const filtered = filterTransactionsByPeriod(transactionsList, period, selection);
    
    const expenses = filtered.filter(t => t.type === 'expense');
    const incomes = filtered.filter(t => t.type === 'income');

    const stats = {
        avgExpense: 0,
        maxExpense: 0,
        minExpense: 0,
        totalExpense: 0,
        avgIncome: 0,
        maxIncome: 0,
        minIncome: 0,
        totalIncome: 0,
        byCategory: {}
    };

    // Dépenses
    if (expenses.length > 0) {
        const amounts = expenses.map(e => e.amount);
        stats.totalExpense = amounts.reduce((a, b) => a + b, 0);
        stats.avgExpense = stats.totalExpense / amounts.length;
        stats.maxExpense = Math.max(...amounts);
        stats.minExpense = Math.min(...amounts);
    }

    // Recettes
    if (incomes.length > 0) {
        const amounts = incomes.map(i => i.amount);
        stats.totalIncome = amounts.reduce((a, b) => a + b, 0);
        stats.avgIncome = stats.totalIncome / amounts.length;
        stats.maxIncome = Math.max(...amounts);
        stats.minIncome = Math.min(...amounts);
    }

    // Par catégorie
    filtered.forEach(transaction => {
        const cat = transaction.category || 'Non catégorisé';
        if (!stats.byCategory[cat]) {
            stats.byCategory[cat] = {
                total: 0,
                count: 0,
                amounts: [],
                type: transaction.type
            };
        }
        stats.byCategory[cat].total += transaction.amount;
        stats.byCategory[cat].count += 1;
        stats.byCategory[cat].amounts.push(transaction.amount);
    });

    // Calculer moyennes, min, max par catégorie
    Object.keys(stats.byCategory).forEach(cat => {
        const catData = stats.byCategory[cat];
        const amounts = catData.amounts;
        catData.avg = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
        catData.min = amounts.length > 0 ? Math.min(...amounts) : 0;
        catData.max = amounts.length > 0 ? Math.max(...amounts) : 0;
    });

    return stats;
}

function filterTransactionsByPeriod(transactionsList, period, selection = {}) {
    const filtered = [];

    transactionsList.forEach(t => {
        const date = new Date(t.date);
        if (Number.isNaN(date.getTime())) {
            return;
        }
        let include = false;

        switch(period) {
            case 'allTime':
                include = true;
                break;
            case 'year':
                include = date.getFullYear() === selection.year;
                break;
            case 'month':
                if (selection.month) {
                    const [year, month] = selection.month.split('-').map(Number);
                    include = date.getFullYear() === year && (date.getMonth() + 1) === month;
                }
                break;
            case 'week':
                if (selection.week?.start && selection.week?.end) {
                    const weekStart = new Date(selection.week.start);
                    const weekEnd = new Date(selection.week.end);
                    weekStart.setHours(0, 0, 0, 0);
                    weekEnd.setHours(23, 59, 59, 999);
                    include = date >= weekStart && date <= weekEnd;
                }
                break;
        }

        if (include) {
            filtered.push(t);
        }
    });

    return filtered;
}

function getCategoryIconClass(category) {
    const iconMap = {
        'Salaire': 'fas fa-briefcase',
        'Revenus': 'fas fa-coins',
        'Épargne': 'fas fa-piggy-bank',
        'Assurances': 'fas fa-shield-alt',
        'Magasins': 'fas fa-shopping-bag',
        'Loisirs': 'fas fa-gamepad',
        'Transport': 'fas fa-bus',
        'Santé': 'fas fa-heart',
        'Restaurants': 'fas fa-utensils',
        'Abonnements': 'fas fa-subscript',
        'Factures': 'fas fa-file-invoice',
        'FastFood': 'fas fa-hamburger',
        'Services': 'fas fa-tools',
        'Autres': 'fas fa-tag'
    };
    return iconMap[category] || 'fas fa-circle';
}
