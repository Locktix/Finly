// ======================
// STATISTICS PAGE
// ======================

export function setupStatsPageListeners() {
    const periodButtons = document.querySelectorAll('.period-btn');
    const yearSelect = document.getElementById('statsYearSelect');
    const monthSelect = document.getElementById('statsMonthSelect');
    const weekSelect = document.getElementById('statsWeekSelect');
    const daySelect = document.getElementById('statsDaySelect');
    
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.currentStatsPeriod = btn.getAttribute('data-period');
            updateStatsPeriodControls();
            updateStatsDisplay();
        });
    });

    if (yearSelect) {
        yearSelect.addEventListener('change', () => {
            window.selectedStatsYear = parseInt(yearSelect.value, 10);

            if (!window.selectedStatsMonth || !window.selectedStatsMonth.startsWith(`${window.selectedStatsYear}-`)) {
                window.selectedStatsMonth = `${window.selectedStatsYear}-01`;
            }

            updateStatsPeriodControls();
            updateStatsDisplay();
        });
    }

    if (monthSelect) {
        monthSelect.addEventListener('change', () => {
            window.selectedStatsMonth = monthSelect.value;
            updateStatsPeriodControls();
            updateStatsDisplay();
        });
    }

    if (weekSelect) {
        weekSelect.addEventListener('change', () => {
            const [start, end] = weekSelect.value.split('|');
            window.selectedStatsWeek = start && end ? { start, end } : null;
            updateStatsDisplay();
        });
    }

    if (daySelect) {
        daySelect.addEventListener('change', () => {
            window.selectedStatsDay = daySelect.value || null;
            updateStatsDisplay();
        });
    }

    updateStatsPeriodControls();
}

export function refreshStatsPage() {
    updateStatsPeriodControls();
    updateStatsDisplay();
}

export function updateStatsDisplay() {
    const selection = getCurrentStatsSelection();
    const stats = calculateAllStatistics(transactions, window.currentStatsPeriod, selection);
    const filtered = filterTransactionsByPeriod(transactions, window.currentStatsPeriod, selection);

    // Vue d'ensemble - Totaux
    document.getElementById('statsAvgExpense').textContent = formatCurrency(stats.totalExpense);
    document.getElementById('statsAvgIncome').textContent = formatCurrency(stats.totalIncome);
    
    // Balance
    const balance = stats.totalIncome - stats.totalExpense;
    document.getElementById('statsBalance').textContent = formatCurrency(balance);
    const balanceElement = document.getElementById('statsBalance');
    if (balance < 0) {
        balanceElement.style.color = 'var(--color-expense)';
    } else {
        balanceElement.style.color = 'var(--color-income)';
    }
    
    // Nombre de transactions
    document.getElementById('statsTransactionCount').textContent = filtered.length;

    // Détails - Moyennes, Min, Max
    document.getElementById('statsAvgExpenseValue').textContent = formatCurrency(stats.avgExpense);
    document.getElementById('statsMinExpense').textContent = formatCurrency(stats.minExpense);
    document.getElementById('statsMaxExpense').textContent = formatCurrency(stats.maxExpense);

    document.getElementById('statsAvgIncomeValue').textContent = formatCurrency(stats.avgIncome);
    document.getElementById('statsMinIncome').textContent = formatCurrency(stats.minIncome);
    document.getElementById('statsMaxIncome').textContent = formatCurrency(stats.maxIncome);

    // Categories
    updateStatsByCategory(stats, filtered);
    
    // Update balance chart
    updateBalanceChart(stats, filtered);
    updateDayBalanceChart(stats, filtered);
}

export function updateDayBalanceChart(stats, filteredTransactions) {
    const mainChartCard = document.getElementById('statsMainBalanceChartCard');
    const chartCard = document.getElementById('dayBalanceChartCard');
    const canvas = document.getElementById('dayBalanceChart');
    if (!chartCard || !canvas) return;

    const isDayPeriod = window.currentStatsPeriod === 'day';
    chartCard.style.display = isDayPeriod ? 'block' : 'none';
    if (mainChartCard) {
        mainChartCard.style.display = isDayPeriod ? 'none' : 'block';
    }

    if (!isDayPeriod) {
        if (dayBalanceChartInstance) {
            dayBalanceChartInstance.destroy();
            dayBalanceChartInstance = null;
        }
        return;
    }

    const filtered = filteredTransactions || [];
    const withTime = [...filtered].sort((a, b) => {
        const dateA = new Date(a.timestamp || `${a.date}T00:00:00`);
        const dateB = new Date(b.timestamp || `${b.date}T00:00:00`);
        return dateA - dateB;
    });

    const labels = [];
    const balanceData = [];
    let cumulativeBalance = 0;

    withTime.forEach((transaction, index) => {
        const rawDate = new Date(transaction.timestamp || `${transaction.date}T00:00:00`);
        const hasValidTime = !Number.isNaN(rawDate.getTime()) && transaction.timestamp;
        const label = hasValidTime
            ? rawDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : `Transaction ${index + 1}`;

        const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
        cumulativeBalance += amount;

        labels.push(label);
        balanceData.push(cumulativeBalance);
    });

    if (balanceData.length === 0) {
        labels.push('Aucune transaction');
        balanceData.push(stats.totalIncome - stats.totalExpense);
    }

    if (dayBalanceChartInstance) {
        dayBalanceChartInstance.destroy();
    }

    dayBalanceChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Solde (jour)',
                data: balanceData,
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 2,
                fill: true,
                tension: 0.35,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    callbacks: {
                        label: function(context) {
                            return 'Solde: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        font: { size: 10 },
                        color: '#9ca3af',
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: { size: 10 },
                        color: '#9ca3af',
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

export function updateBalanceChart(stats, filteredTransactions) {
    if (window.currentStatsPeriod === 'day') {
        if (balanceChartInstance) {
            balanceChartInstance.destroy();
            balanceChartInstance = null;
        }
        return;
    }

    const canvas = document.getElementById('balanceChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const filtered = filteredTransactions || [];
    
    // Regrouper par date et calculer le solde cumulatif
    const balanceData = [];
    const labels = [];
    let cumulativeBalance = 0;
    
    // Trier par date
    const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculer le solde jour par jour
    const dailyData = {};
    sorted.forEach(t => {
        const date = t.date;
        if (!dailyData[date]) {
            dailyData[date] = 0;
        }
        const amount = t.type === 'income' ? t.amount : -t.amount;
        dailyData[date] += amount;
    });
    
    // Créer les points pour le graphique
    const dates = Object.keys(dailyData).sort();
    dates.forEach(date => {
        cumulativeBalance += dailyData[date];
        labels.push(new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
        balanceData.push(cumulativeBalance);
    });
    
    // Si pas de données, afficher au moins le solde actuel
    if (balanceData.length === 0) {
        labels.push('Maintenant');
        balanceData.push(stats.totalIncome - stats.totalExpense);
    }
    
    if (balanceChartInstance) {
        balanceChartInstance.destroy();
    }
    
    balanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Solde',
                data: balanceData,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    callbacks: {
                        label: function(context) {
                            return 'Solde: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        font: { size: 10 },
                        color: '#9ca3af',
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: { size: 10 },
                        color: '#9ca3af',
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

export function updateStatsByCategory(stats, filteredTransactions) {
    const container = document.getElementById('categoriesStatsList');
    container.innerHTML = '';

    const sortedCategories = Object.entries(stats.byCategory)
        .sort((a, b) => b[1].total - a[1].total);

    // Filtrer les transactions pour la période actuelle
    const filtered = filteredTransactions || [];

    sortedCategories.forEach(([name, data]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-item';
        let currentSort = 'date'; // Par défaut : tri par date

        const icon = getCategoryIconClass(name);
        const iconColor = data.type === 'income' ? 'income' : 'expense';

        // Récupérer les transactions de cette catégorie
        let categoryTransactions = filtered.filter(t => 
            (t.category || 'Non catégorisé') === name
        );

        // Fonction pour trier les transactions
        const sortTransactions = (sortType) => {
            let sorted = [...categoryTransactions];
            switch(sortType) {
                case 'date':
                    sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
                    break;
                case 'amount-asc':
                    sorted.sort((a, b) => a.amount - b.amount);
                    break;
                case 'amount-desc':
                    sorted.sort((a, b) => b.amount - a.amount);
                    break;
            }
            return sorted;
        };

        // Fonction pour rendre les transactions
        const renderTransactions = (sortType) => {
            currentSort = sortType;
            const sorted = sortTransactions(sortType);
            const transactionsContainer = categoryDiv.querySelector('.category-transactions-list');
            
            transactionsContainer.innerHTML = sorted.length > 0 ? 
                sorted.map(t => `
                    <div class="category-transaction-item">
                        <div class="category-transaction-left">
                            <div class="category-transaction-desc">${t.description || 'Sans description'}</div>
                            <div class="category-transaction-date">${new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <div class="category-transaction-amount ${iconColor}">
                            ${formatCurrency(t.amount)}
                        </div>
                    </div>
                `).join('') : 
                '<div class="category-dropdown-empty">Aucune transaction</div>';
            
            // Mettre à jour les boutons actifs
            categoryDiv.querySelectorAll('.category-sort-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-sort') === sortType) {
                    btn.classList.add('active');
                }
            });
        };

        categoryDiv.innerHTML = `
            <div class="category-item-header">
                <div class="category-left">
                    <div class="category-icon ${iconColor}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="category-text">
                        <h4>${name}</h4>
                        <p>${data.count} transaction${data.count > 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div class="category-values-wrap">
                    <div class="category-values-meta">
                        <div class="category-total-label">Total</div>
                        <div class="category-total-value ${iconColor}">${formatCurrency(data.total)}</div>
                        <div class="category-value ${iconColor}">Moyenne: ${formatCurrency(data.avg)}</div>
                        <div class="category-range-value">
                            ${formatCurrency(data.min)} - ${formatCurrency(data.max)}
                        </div>
                    </div>
                    <i class="fas fa-chevron-down category-chevron"></i>
                </div>
            </div>
            <div class="category-dropdown">
                <div class="category-sort-header">
                    <button class="category-sort-btn active" data-sort="date" title="Tri par date">
                        <i class="fas fa-calendar"></i>
                        <span>Date</span>
                    </button>
                    <button class="category-sort-btn" data-sort="amount-asc" title="Du moins cher au plus cher">
                        <i class="fas fa-sort-amount-up"></i>
                        <span>Prix ↑</span>
                    </button>
                    <button class="category-sort-btn" data-sort="amount-desc" title="Du plus cher au moins cher">
                        <i class="fas fa-sort-amount-down"></i>
                        <span>Prix ↓</span>
                    </button>
                </div>
                <div class="category-transactions-list"></div>
            </div>
        `;
        
        // Ajouter l'event listener pour le toggle
        const header = categoryDiv.querySelector('.category-item-header');
        header.addEventListener('click', () => {
            categoryDiv.classList.toggle('expanded');
        });
        
        // Ajouter les event listeners pour le tri
        categoryDiv.querySelectorAll('.category-sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sortType = btn.getAttribute('data-sort');
                renderTransactions(sortType);
            });
        });
        
        container.appendChild(categoryDiv);
        
        // Rendu initial avec tri par date
        renderTransactions('date');
    });
}

window.setupStatsPageListeners = setupStatsPageListeners;
window.refreshStatsPage = refreshStatsPage;
window.updateStatsDisplay = updateStatsDisplay;
window.updateBalanceChart = updateBalanceChart;
window.updateDayBalanceChart = updateDayBalanceChart;
window.updateStatsByCategory = updateStatsByCategory;