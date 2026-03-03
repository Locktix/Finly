// ======================
// GESTION DES GRAPHIQUES
// ======================
export function getChartOptions(type = 'doughnut') {
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768;

    const baseOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: isMobile ? 'bottom' : 'bottom',
                labels: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: isMobile ? 10 : 12
                    },
                    color: '#6b7280',
                    padding: isMobile ? 8 : 15
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: { family: "'Inter', sans-serif", size: isMobile ? 10 : 12 },
                bodyFont: { family: "'Inter', sans-serif", size: isMobile ? 9 : 12 },
                callbacks: {
                    label: function(context) {
                        return formatCurrency(context.parsed);
                    }
                }
            }
        }
    };

    if (type === 'doughnut') {
        return baseOptions;
    } else if (type === 'bar') {
        return {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'x',
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: "'Inter', sans-serif",
                            size: isMobile ? 10 : 12
                        },
                        color: '#6b7280',
                        padding: isMobile ? 8 : 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { family: "'Inter', sans-serif", size: isMobile ? 10 : 12 },
                    bodyFont: { family: "'Inter', sans-serif", size: isMobile ? 9 : 12 },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: isMobile ? 8 : 12 },
                        color: '#9ca3af',
                        callback: function(value) {
                            return '€' + (value / 1000).toFixed(0) + 'k';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: { size: isMobile ? 8 : 12 },
                        color: '#9ca3af'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        };
    }
}

export function updateCharts() {
    updateExpensesChart();
    updateIncomeExpenseChart();
}

export function updateExpensesChart() {
    const month = getSelectedMonth();
    const monthTransactions = getTransactionsForMonth(month);
    const filteredTransactions = applyFilters(monthTransactions);

    // Calculer les dépenses par catégorie
    const expensesByCategory = {};
    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);

    // Couleurs pour le pie chart
    const colors = [
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
        '#06b6d4', '#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899'
    ];

    const ctx = document.getElementById('expensesChart').getContext('2d');
    
    if (expensesChartInstance) {
        expensesChartInstance.data.labels = labels;
        expensesChartInstance.data.datasets[0].data = data;
        expensesChartInstance.data.datasets[0].backgroundColor = colors.slice(0, labels.length);
        expensesChartInstance.update();
    } else {
        expensesChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: getChartOptions('doughnut')
        });
    }
}

export function updateIncomeExpenseChart() {
    // Récupérer les 12 derniers mois
    const months = [];
    const incomeData = [];
    const expenseData = [];

    const today = new Date();
    for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        // Créer monthKey au format YYYY-MM sans utiliser toISOString() pour éviter les décalages de fuseau horaire
        const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        months.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));

        const monthTransactions = transactions.filter(t => t.date.startsWith(monthKey));
        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        incomeData.push(income);
        expenseData.push(expense);
    }

    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    
    if (incomeExpenseChartInstance) {
        incomeExpenseChartInstance.data.labels = months;
        incomeExpenseChartInstance.data.datasets[0].data = incomeData;
        incomeExpenseChartInstance.data.datasets[1].data = expenseData;
        incomeExpenseChartInstance.update();
    } else {
        incomeExpenseChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Revenus',
                        data: incomeData,
                        backgroundColor: '#10b981',
                        borderRadius: 4,
                        borderSkipped: false
                    },
                    {
                        label: 'Dépenses',
                        data: expenseData,
                        backgroundColor: '#ef4444',
                        borderRadius: 4,
                        borderSkipped: false
                    }
                ]
            },
            options: getChartOptions('bar')
        });
    }
}

window.getChartOptions = getChartOptions;
window.updateCharts = updateCharts;
window.updateExpensesChart = updateExpensesChart;
window.updateIncomeExpenseChart = updateIncomeExpenseChart;