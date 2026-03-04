// ======================
// MISE À JOUR DU DASHBOARD
// ======================
export function updateDashboard() {
    updateSummary();
    updateTransactionsTable();
    updateCharts();
}

export function getTransactionsForMonth(month) {
    return transactions.filter(t => {
        return t.date.startsWith(month);
    });
}

export function applyFilters(transactionsList) {
    return transactionsList.filter(t => {
        // Filtre recherche
        if (activeFilters.search) {
            const search = activeFilters.search.toLowerCase();
            const matchSearch = t.description.toLowerCase().includes(search) || 
                              t.category.toLowerCase().includes(search);
            if (!matchSearch) return false;
        }

        // Filtre catégories
        if (activeFilters.categories.length > 0) {
            if (!activeFilters.categories.includes(t.category)) return false;
        }

        return true;
    });
}

export function updateSummary() {
    const month = getSelectedMonth();
    const monthTransactions = getTransactionsForMonth(month);
    const filteredTransactions = applyFilters(monthTransactions);
    
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income' && !isInternalSavingsTransfer(t))
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense' && !isInternalSavingsTransfer(t))
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;

    // Calculer l'épargne cumulée (dépenses catégorie "Épargne" = +montant, revenus Épargne = -montant)
    const cumulativeSavings = transactions
        .filter(t => t.category === 'Épargne')
        .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0);

    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);
    document.getElementById('totalBalance').textContent = formatCurrency(balance);
    document.getElementById('totalSavings').textContent = formatCurrency(cumulativeSavings);

    // Couleur dynamique du solde
    const balanceElement = document.getElementById('totalBalance');
    const balanceCard = balanceElement.closest('.summary-card');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (balance < 0) {
        balanceCard.style.borderLeftColor = '#ef4444';
        balanceElement.style.color = '#ef4444';
    } else if (balance > 0) {
        balanceCard.style.borderLeftColor = '#10b981';
        balanceElement.style.color = '#10b981';
    } else {
        balanceCard.style.borderLeftColor = '#3b82f6';
        balanceElement.style.color = isDark ? '#f9fafb' : '#111827';
    }

    // Couleur dynamique de l'épargne cumulée
    const savingsElement = document.getElementById('totalSavings');
    const savingsCard = savingsElement.closest('.summary-card');
    
    if (cumulativeSavings < 0) {
        savingsCard.style.borderLeftColor = '#ef4444';
        savingsElement.style.color = '#ef4444';
    } else if (cumulativeSavings > 0) {
        savingsCard.style.borderLeftColor = '#8b5cf6';
        savingsElement.style.color = '#8b5cf6';
    } else {
        savingsCard.style.borderLeftColor = '#8b5cf6';
        savingsElement.style.color = isDark ? '#f9fafb' : '#111827';
    }
}

export function updateTransactionsTable() {
    const tableBody = document.getElementById('transactionsBody');
    const countElement = document.getElementById('transactionCount');
    const month = getSelectedMonth();
    const readOnly = typeof window.isAdminReadOnlyView === 'function' && window.isAdminReadOnlyView();

    const monthTransactions = getTransactionsForMonth(month);
    const filteredTransactions = applyFilters(monthTransactions);

    if (filteredTransactions.length === 0) {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="6">Aucune transaction pour ce mois.</td></tr>';
        countElement.textContent = '0';
        updateTransactionsList(); // Aussi vider les cartes
        return;
    }

    // Appliquer le tri personnalisé
    const sorted = sortTransactions(filteredTransactions);

    let html = '';

    if (timeGroupingEnabled) {
        // Regrouper par périodes temporelles
        const groups = groupTransactionsByTime(sorted);

        // Définir l'ordre des groupes
        const groupOrder = [
            "Aujourd'hui",
            "Hier",
            "Il y a 2 jours",
            "Il y a 3 jours",
            "Il y a 4 jours",
            "Il y a 5 jours",
            "Il y a 6 jours",
            "Il y a 1 semaine",
            "Il y a 2 semaines",
            "Il y a 3 semaines",
            "Il y a 1 mois"
        ];

        // Trier les clés des groupes selon l'ordre défini
        const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
            const indexA = groupOrder.indexOf(a);
            const indexB = groupOrder.indexOf(b);

            // Si les deux sont dans l'ordre prédéfini
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;

            // Si seulement A est dans l'ordre prédéfini
            if (indexA !== -1) return -1;

            // Si seulement B est dans l'ordre prédéfini
            if (indexB !== -1) return 1;

            // Pour les groupes "Il y a X mois", trier numériquement
            const monthsA = parseInt(a.match(/(\d+) mois/)?.[1] || 999);
            const monthsB = parseInt(b.match(/(\d+) mois/)?.[1] || 999);
            return monthsA - monthsB;
        });

        sortedGroupKeys.forEach(timeLabel => {
            const groupTransactions = groups[timeLabel];

            // Ajouter le séparateur de groupe
            html += `
                <tr class="time-separator">
                    <td colspan="6">
                        <div class="time-separator-line"></div>
                        <span class="time-separator-text">${timeLabel}</span>
                        <div class="time-separator-line"></div>
                    </td>
                </tr>
            `;

            // Ajouter les transactions du groupe
            groupTransactions.forEach((transaction) => {
                const originalIndex = transactions.indexOf(transaction);
                const icon = categoryIcons[transaction.category] || 'fa-ellipsis-h';
                const formattedDate = formatDate(transaction.date);
                const formattedAmount = formatCurrency(transaction.amount);
                const typeClass = transaction.type === 'income' ? 'income' : 'expense';
                const typeLabel = transaction.type === 'income' ? 'Recette' : 'Dépense';
                const actionsHtml = readOnly
                    ? `
                        <div class="action-buttons">
                            <button class="btn-edit" type="button" disabled>
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button class="btn-delete" type="button" disabled>
                                <i class="fas fa-trash-alt"></i> Supprimer
                            </button>
                        </div>
                    `
                    : `
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="openEditModal(${originalIndex})">
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button class="btn-delete" onclick="deleteTransaction(${originalIndex})">
                                <i class="fas fa-trash-alt"></i> Supprimer
                            </button>
                        </div>
                    `;

                html += `
                    <tr>
                        <td>${formattedDate}</td>
                        <td><strong>${transaction.description}</strong></td>
                        <td>
                            <i class="fas ${icon}" style="margin-right: 0.5rem;"></i>
                            ${transaction.category}
                        </td>
                        <td class="transaction-amount ${typeClass}">${formattedAmount}</td>
                        <td><span class="transaction-type ${typeClass}">${typeLabel}</span></td>
                        <td>${actionsHtml}</td>
                    </tr>
                `;
            });
        });
    } else {
        // Affichage sans regroupement temporel
        sorted.forEach((transaction) => {
            const originalIndex = transactions.indexOf(transaction);
            const icon = categoryIcons[transaction.category] || 'fa-ellipsis-h';
            const formattedDate = formatDate(transaction.date);
            const formattedAmount = formatCurrency(transaction.amount);
            const typeClass = transaction.type === 'income' ? 'income' : 'expense';
            const typeLabel = transaction.type === 'income' ? 'Recette' : 'Dépense';
            const actionsHtml = readOnly
                ? `
                    <div class="action-buttons">
                        <button class="btn-edit" type="button" disabled>
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="btn-delete" type="button" disabled>
                            <i class="fas fa-trash-alt"></i> Supprimer
                        </button>
                    </div>
                `
                : `
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="openEditModal(${originalIndex})">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="btn-delete" onclick="deleteTransaction(${originalIndex})">
                            <i class="fas fa-trash-alt"></i> Supprimer
                        </button>
                    </div>
                `;

            html += `
                <tr>
                    <td>${formattedDate}</td>
                    <td><strong>${transaction.description}</strong></td>
                    <td>
                        <i class="fas ${icon}" style="margin-right: 0.5rem;"></i>
                        ${transaction.category}
                    </td>
                    <td class="transaction-amount ${typeClass}">${formattedAmount}</td>
                    <td><span class="transaction-type ${typeClass}">${typeLabel}</span></td>
                    <td>${actionsHtml}</td>
                </tr>
            `;
        });
    }

    tableBody.innerHTML = html;
    countElement.textContent = `${filteredTransactions.length}`;
    updateTransactionsList(); // Aussi mettre à jour les cartes
}

window.updateDashboard = updateDashboard;
window.getTransactionsForMonth = getTransactionsForMonth;
window.applyFilters = applyFilters;
window.updateSummary = updateSummary;
window.updateTransactionsTable = updateTransactionsTable;