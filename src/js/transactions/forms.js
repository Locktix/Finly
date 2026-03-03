// ======================
// GESTION DES FORMULAIRES
// ======================
export function setupFormListeners() {
    // Formulaire Dépense
    document.getElementById('expenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button[type="submit"]');
        showSpinner(button, button.textContent);

        try {
            const transaction = {
                type: 'expense',
                description: document.getElementById('expenseName').value,
                category: document.getElementById('expenseCategory').value,
                amount: parseFloat(document.getElementById('expenseAmount').value),
                date: document.getElementById('expenseDate').value,
                timestamp: new Date().toISOString()
            };
            await addTransaction(transaction);
            document.getElementById('expenseForm').reset();
            refreshIconSelect('expenseCategory');
            closeModal('expenseModal');
            hideSpinner(button);
        } catch (error) {
            console.error('Erreur lors de l\'ajout de dépense:', error);
            hideSpinner(button);
        }
    });

    // Formulaire Recette
    document.getElementById('incomeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button[type="submit"]');
        showSpinner(button, button.textContent);

        try {
            const transaction = {
                type: 'income',
                description: document.getElementById('incomeName').value,
                category: document.getElementById('incomeCategory').value,
                amount: parseFloat(document.getElementById('incomeAmount').value),
                date: document.getElementById('incomeDate').value,
                timestamp: new Date().toISOString()
            };
            await addTransaction(transaction);
            document.getElementById('incomeForm').reset();
            refreshIconSelect('incomeCategory');
            closeModal('incomeModal');
            hideSpinner(button);
        } catch (error) {
            console.error('Erreur lors de l\'ajout de recette:', error);
            hideSpinner(button);
        }
    });

    // Formulaire Modifier
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button[type="submit"]');
        showSpinner(button, button.textContent);

        try {
            const updatedTransaction = {
                type: currentEditingType,
                description: document.getElementById('editName').value,
                category: document.getElementById('editCategory').value,
                amount: parseFloat(document.getElementById('editAmount').value),
                date: document.getElementById('editDate').value,
                timestamp: transactions[currentEditingIndex].timestamp
            };

            if (transactions[currentEditingIndex].firebaseId) {
                updatedTransaction.firebaseId = transactions[currentEditingIndex].firebaseId;
            }

            if (transactions[currentEditingIndex].rollover) {
                updatedTransaction.rollover = true;
            }

            if (transactions[currentEditingIndex].rolloverMode) {
                updatedTransaction.rolloverMode = transactions[currentEditingIndex].rolloverMode;
            }

            await updateTransaction(currentEditingIndex, updatedTransaction);
            document.getElementById('editForm').reset();
            closeModal('editModal');
            hideSpinner(button);
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            hideSpinner(button);
        }
    });
}

window.setupFormListeners = setupFormListeners;