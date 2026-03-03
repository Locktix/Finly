// ======================
// NAVIGATION MOIS
// ======================
export function navigateMonth(direction) {
    const currentMonth = getSelectedMonth();
    const [year, month] = currentMonth.split('-');
    let newYear = parseInt(year);
    let newMonth = parseInt(month) + direction;

    // Gérer le dépassement des mois
    if (newMonth > 12) {
        newMonth = 1;
        newYear++;
    } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
    }

    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    handleMonthChange(newMonthStr, currentMonth);
}

export function handleMonthChange(newMonthStr, previousMonth = null) {
    const prevMonth = previousMonth || selectedMonth || getSelectedMonth();
    selectedMonth = newMonthStr;
    document.getElementById('monthFilter').value = newMonthStr;
    updateMonthDisplay();
    updateDashboard();
    maybePromptRollover(prevMonth, newMonthStr);
}

export function updateMonthDisplay() {
    const currentMonth = getSelectedMonth();
    const [year, month] = currentMonth.split('-');

    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const monthDisplay = document.getElementById('monthDisplay');
    const monthName = monthNames[parseInt(month) - 1];
    monthDisplay.textContent = `${monthName} ${year}`;
}

export async function addTransaction(transaction) {
    transactions.push(transaction);
    Toast.success('Transaction ajoutée', `${transaction.description} - ${formatCurrency(transaction.amount)}`);
    updateSyncStatus('syncing');

    if (db) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('transactions').add(transaction);
            console.log('Transaction ajoutée à Firebase');
            updateSyncStatus('synced');
        } catch (error) {
            console.error('Erreur lors de l\'ajout à Firebase:', error);
            Toast.error('Sync. échouée', 'Les données seront synchronisées quand la connexion sera rétablie');
            updateSyncStatus('error', 'Sync échouée');
        }
    } else {
        // Sauvegarde locale
        localStorage.setItem('transactions', JSON.stringify(transactions));
        Toast.warning('Mode hors ligne', 'Données stockées localement');
        updateSyncStatus('offline');
    }

    updateDashboard();
}

export async function deleteTransaction(index) {
    const transaction = transactions[index];

    const confirmed = window.confirm(`Voulez-vous vraiment supprimer cette transaction : "${transaction.description}" (${formatCurrency(transaction.amount)}) ?`);
    if (!confirmed) return;

    transactions.splice(index, 1);
    Toast.success('Supprimée', transaction.description);
    updateSyncStatus('syncing');

    if (db && transaction.firebaseId) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('transactions').doc(transaction.firebaseId).delete();
            console.log('Transaction supprimée de Firebase');
            updateSyncStatus('synced');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            Toast.error('Erreur', 'La transaction n\'a pas pu être supprimée de la sauvegarde');
            updateSyncStatus('error', 'Suppression échouée');
        }
    } else {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateSyncStatus('offline');
    }

    updateDashboard();
}

export async function updateTransaction(index, updatedTransaction) {
    const oldTransaction = transactions[index];
    transactions[index] = updatedTransaction;
    Toast.success('Mise à jour', updatedTransaction.description);
    updateSyncStatus('syncing');

    if (db && oldTransaction.firebaseId) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('transactions').doc(oldTransaction.firebaseId).update(updatedTransaction);
            console.log('Transaction mise à jour sur Firebase');
            updateSyncStatus('synced');
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            Toast.error('Erreur', 'La modification n\'a pas pu être synchronisée');
            updateSyncStatus('error', 'Mise à jour échouée');
        }
    } else {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateSyncStatus('offline');
    }

    updateDashboard();
}

export function openEditModal(index) {
    const transaction = transactions[index];
    currentEditingIndex = index;
    currentEditingType = transaction.type;
    
    // Mettre à jour le titre et les catégories
    const titleEl = document.getElementById('editTitle');
    const categorySelect = document.getElementById('editCategory');
    
    if (transaction.type === 'expense') {
        titleEl.textContent = 'Modifier une Dépense';
        categorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>';
        expenseCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    } else {
        titleEl.textContent = 'Modifier une Recette';
        categorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>';
        incomeCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }
    
    // Pré-remplir les champs
    document.getElementById('editName').value = transaction.description;
    document.getElementById('editCategory').value = transaction.category;
    document.getElementById('editAmount').value = transaction.amount;
    document.getElementById('editDate').value = transaction.date;

    refreshIconSelect('editCategory');
    
    openModal('editModal');
}

export async function loadTransactionsFromFirebase() {
    try {
        // Charger les transactions de l'utilisateur connecté
        const querySnapshot = await db.collection('users')
            .doc(currentUser.uid)
            .collection('transactions')
            .get();
        transactions = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.firebaseId = doc.id;
            transactions.push(data);
        });
        console.log(`${transactions.length} transactions chargées depuis Firebase pour l'utilisateur ${currentUser.uid}`);
        updateDashboard();
    } catch (error) {
        console.error('Erreur lors de la récupération:', error);
        if (error.code === 'permission-denied') {
            console.warn('Permissions insuffisantes pour accéder à Firebase. Basculement en mode local.');
            useLocalStorage();
        }
    }
}

export function loadTransactionsFromLocal() {
    const stored = localStorage.getItem('transactions');
    transactions = stored ? JSON.parse(stored) : [];
}

window.navigateMonth = navigateMonth;
window.handleMonthChange = handleMonthChange;
window.updateMonthDisplay = updateMonthDisplay;
window.addTransaction = addTransaction;
window.deleteTransaction = deleteTransaction;
window.updateTransaction = updateTransaction;
window.openEditModal = openEditModal;
window.loadTransactionsFromFirebase = loadTransactionsFromFirebase;
window.loadTransactionsFromLocal = loadTransactionsFromLocal;