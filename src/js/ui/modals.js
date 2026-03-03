// ======================
// GESTION DES MODALES
// ======================
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

export function setupModalListeners() {
    // Modal Dépense
    document.getElementById('addExpenseBtn').addEventListener('click', () => {
        document.getElementById('expenseDate').valueAsDate = new Date();
        openModal('expenseModal');
    });

    document.getElementById('closeExpenseBtn').addEventListener('click', () => {
        closeModal('expenseModal');
    });

    // Modal Recette
    document.getElementById('addIncomeBtn').addEventListener('click', () => {
        document.getElementById('incomeDate').valueAsDate = new Date();
        openModal('incomeModal');
    });

    document.getElementById('closeIncomeBtn').addEventListener('click', () => {
        closeModal('incomeModal');
    });

    // Modal Modifier
    document.getElementById('closeEditBtn').addEventListener('click', () => {
        closeModal('editModal');
    });

    // Toggle Thème (si présent)
    const settingsThemeToggle = document.getElementById('themeToggle');
    if (settingsThemeToggle) {
        settingsThemeToggle.addEventListener('click', toggleTheme);
    }

    // Toggle Regroupement Temporel (si présent)
    const settingsTimeGroupingToggle = document.getElementById('timeGroupingToggle');
    if (settingsTimeGroupingToggle) {
        settingsTimeGroupingToggle.addEventListener('click', toggleTimeGrouping);
    }

    // Modal Configuration
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        configBtn.addEventListener('click', () => {
            const uidEl = document.getElementById('configUid');
            if (uidEl) {
                uidEl.textContent = (currentUser && currentUser.uid) ? currentUser.uid : 'N/A';
            }
            openModal('configModal');
        });
    }

    document.getElementById('closeConfigBtn').addEventListener('click', () => {
        closeModal('configModal');
    });

    document.getElementById('closeConfigBtn2').addEventListener('click', () => {
        closeModal('configModal');
    });

    // Modal Admin Panel
    const adminBtn = document.getElementById('adminPanelBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', async () => {
            if (currentUserRole !== 'Administrateur') {
                Toast.error('Accès refusé', 'Réservé aux administrateurs');
                return;
            }
            const searchInput = document.getElementById('adminUserSearch');
            if (searchInput) {
                searchInput.value = '';
            }
            await loadAdminUsers();
            openModal('adminPanelModal');
        });
    }

    const adminSearchInput = document.getElementById('adminUserSearch');
    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', () => {
            renderAdminUsers();
        });
    }

    document.getElementById('closeAdminPanel').addEventListener('click', () => {
        closeModal('adminPanelModal');
    });

    document.getElementById('closeAdminPanel2').addEventListener('click', () => {
        closeModal('adminPanelModal');
    });

    // Modal Data Transfer
    const dataTransferBtn = document.getElementById('dataTransferBtn');
    if (dataTransferBtn) {
        dataTransferBtn.addEventListener('click', openDataTransferModal);
    }

    document.getElementById('closeDataTransfer').addEventListener('click', () => {
        closeModal('dataTransferModal');
    });

    document.getElementById('closeDataTransfer2').addEventListener('click', () => {
        closeModal('dataTransferModal');
    });

    document.getElementById('exportJsonBtn').addEventListener('click', exportTransactionsJson);
    document.getElementById('exportExcelBtn').addEventListener('click', exportTransactionsExcel);

    document.getElementById('importFinlyBtn').addEventListener('click', async () => {
        const file = document.getElementById('importFinlyFile').files[0];
        const errorEl = document.getElementById('importFinlyError');
        const successEl = document.getElementById('importFinlySuccess');
        const mode = document.querySelector('input[name="importFinlyMode"]:checked')?.value || 'merge';

        errorEl.style.display = 'none';
        successEl.style.display = 'none';

        if (!file) {
            errorEl.textContent = 'Sélectionnez un fichier Finly (JSON ou Excel)';
            errorEl.style.display = 'block';
            return;
        }

        try {
            let data = null;

            if (file.name.endsWith('.json')) {
                data = await readJsonFile(file);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                data = await readExcelFile(file);
            } else {
                errorEl.textContent = 'Format non supporté pour Finly. Utilisez JSON ou Excel.';
                errorEl.style.display = 'block';
                return;
            }

            const result = await importTransactionsData(data, mode);
            successEl.textContent = `${result.imported} transaction(s) importée(s) avec succès`;
            successEl.style.display = 'block';
            Toast.success('Import Finly réussi', `${result.imported} transaction(s) importée(s)`);

            setTimeout(() => {
                closeModal('dataTransferModal');
                successEl.style.display = 'none';
            }, 2000);
        } catch (error) {
            console.error('Erreur lors de l\'import Finly:', error);
            errorEl.textContent = `Erreur: ${error.message}`;
            errorEl.style.display = 'block';
            Toast.error('Erreur import Finly', error.message);
        }
    });

    document.getElementById('importBankBtn').addEventListener('click', async () => {
        const file = document.getElementById('importBankFile').files[0];
        const errorEl = document.getElementById('importBankError');
        const successEl = document.getElementById('importBankSuccess');
        const mode = document.querySelector('input[name="importBankMode"]:checked')?.value || 'merge';

        errorEl.style.display = 'none';
        successEl.style.display = 'none';

        if (!file) {
            errorEl.textContent = 'Sélectionnez un fichier Bank (CSV ING)';
            errorEl.style.display = 'block';
            return;
        }

        if (!file.name.endsWith('.csv')) {
            errorEl.textContent = 'Format non supporté pour Bank. Utilisez un CSV ING.';
            errorEl.style.display = 'block';
            return;
        }

        try {
            const data = await readIngCsvFile(file);
            Toast.warning('Import ING (bêta)', 'La description ou la catégorie peut être inexacte. Vérifie les transactions importées.');

            const result = await importTransactionsData(data, mode);
            successEl.textContent = `${result.imported} transaction(s) importée(s) avec succès`;
            successEl.style.display = 'block';
            Toast.success('Import Bank réussi', `${result.imported} transaction(s) importée(s)`);

            setTimeout(() => {
                closeModal('dataTransferModal');
                successEl.style.display = 'none';
            }, 2000);
        } catch (error) {
            console.error('Erreur lors de l\'import Bank:', error);
            errorEl.textContent = `Erreur: ${error.message}`;
            errorEl.style.display = 'block';
            Toast.error('Erreur import Bank', error.message);
        }
    });

    // Modal Report Solde
    const closeRolloverBtn = document.getElementById('closeRollover');
    if (closeRolloverBtn) {
        closeRolloverBtn.addEventListener('click', (event) => {
            event.preventDefault();
        });
    }

    const declineRolloverBtn = document.getElementById('declineRollover');
    if (declineRolloverBtn) {
        declineRolloverBtn.addEventListener('click', () => {
            dismissRolloverPrompt(true);
        });
    }

    const deferRolloverBtn = document.getElementById('deferRollover');
    if (deferRolloverBtn) {
        deferRolloverBtn.addEventListener('click', () => {
            dismissRolloverPrompt(false);
        });
    }

    const acceptRolloverBtn = document.getElementById('acceptRollover');
    if (acceptRolloverBtn) {
        acceptRolloverBtn.addEventListener('click', () => {
            applyRolloverTransaction();
        });
    }

    const acceptRolloverSavingsBtn = document.getElementById('acceptRolloverSavings');
    if (acceptRolloverSavingsBtn) {
        acceptRolloverSavingsBtn.addEventListener('click', () => {
            applyRolloverTransaction('savings');
        });
    }

    // Modal Tester Panel
    const testerBtn = document.getElementById('testerPanelBtn');
    if (testerBtn) {
        testerBtn.addEventListener('click', () => {
            if (currentUserRole !== 'Administrateur' && currentUserRole !== 'testeur') {
                Toast.error('Accès refusé', 'Réservé aux testeurs et admins');
                return;
            }
            testerOutputBuffer = [];
            const output = document.getElementById('testerOutput');
            if (output) {
                output.classList.remove('active');
                output.textContent = '';
            }
            openModal('testerPanelModal');
        });
    }

    document.getElementById('closeTesterPanel').addEventListener('click', () => {
        closeModal('testerPanelModal');
    });

    document.getElementById('closeTesterPanel2').addEventListener('click', () => {
        closeModal('testerPanelModal');
    });

    // Tester Panel Tests
    document.getElementById('testToastSuccess').addEventListener('click', () => {
        Toast.success('Test Success', 'Ceci est un test de notification success');
        logToTester('[Toast] Success notification triggered');
    });

    document.getElementById('testToastError').addEventListener('click', () => {
        Toast.error('Test Error', 'Ceci est un test de notification error');
        logToTester('[Toast] Error notification triggered');
    });

    document.getElementById('testToastInfo').addEventListener('click', () => {
        Toast.info('Test Info', 'Ceci est un test de notification info');
        logToTester('[Toast] Info notification triggered');
    });

    document.getElementById('testToastWarning').addEventListener('click', () => {
        Toast.warning('Test Warning', 'Ceci est un test de notification warning');
        logToTester('[Toast] Warning notification triggered');
    });

    document.getElementById('testToastLoading').addEventListener('click', () => {
        const loadingToast = Toast.loading('Test Loading', 'Chargement en cours...');
        logToTester('[Toast] Loading notification triggered');
        setTimeout(() => {
            removeToast(loadingToast);
            logToTester('[Toast] Loading notification removed after 3s');
        }, 3000);
    });

    document.getElementById('testLogUserData').addEventListener('click', () => {
        if (currentUser) {
            const info = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                role: currentUserRole,
                emailVerified: currentUser.emailVerified
            };
            logToTester(`[User] ${JSON.stringify(info, null, 2)}`);
        } else {
            logToTester('[User] Aucun utilisateur connecté');
        }
    });

    document.getElementById('testLogUsersCount').addEventListener('click', () => {
        logToTester(`[Admin] Total utilisateurs en cache: ${adminUsersCache.length}`);
        if (adminUsersCache.length > 0) {
            const roles = {};
            adminUsersCache.forEach(u => {
                roles[u.role] = (roles[u.role] || 0) + 1;
            });
            logToTester(`[Admin] Par rôle: ${JSON.stringify(roles, null, 2)}`);
        }
    });

    document.getElementById('testLogTransactions').addEventListener('click', () => {
        logToTester(`[Transactions] Total: ${transactions.length}`);
        if (transactions.length > 0) {
            const income = transactions.filter(t => t.type === 'income').length;
            const expense = transactions.filter(t => t.type === 'expense').length;
            logToTester(`[Transactions] Recettes: ${income}, Dépenses: ${expense}`);
            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            logToTester(`[Transactions] Totaux: Recettes ${totalIncome}€, Dépenses ${totalExpense}€`);
        }
    });

    document.getElementById('testClearStorage').addEventListener('click', () => {
        localStorage.clear();
        logToTester('[Storage] localStorage cleared');
        Toast.success('Storage', 'localStorage a été vidé');
    });

    document.getElementById('testLogStorage').addEventListener('click', () => {
        const keys = Object.keys(localStorage);
        logToTester(`[Storage] ${keys.length} items in localStorage:`);
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            logToTester(`  ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
        });
    });

    document.getElementById('testReloadTransactions').addEventListener('click', async () => {
        logToTester('[Performance] Reloading transactions...');
        const start = performance.now();
        if (db) {
            await loadTransactionsFromFirebase();
        } else {
            loadTransactionsFromLocal();
        }
        const end = performance.now();
        logToTester(`[Performance] Transactions reloaded in ${(end - start).toFixed(2)}ms`);
        logToTester(`[Performance] Loaded ${transactions.length} transactions`);
    });

    document.getElementById('testUpdateDashboard').addEventListener('click', () => {
        logToTester('[Performance] Updating dashboard...');
        const start = performance.now();
        updateDashboard();
        const end = performance.now();
        logToTester(`[Performance] Dashboard updated in ${(end - start).toFixed(2)}ms`);
    });

    document.getElementById('testAddFakeData').addEventListener('click', async () => {
        logToTester('[Test Data] Generating fake data...');
        const start = performance.now();
        await addFakeData();
        const end = performance.now();
        logToTester(`[Test Data] Fake data generated in ${(end - start).toFixed(2)}ms`);
        logToTester(`[Test Data] Total transactions: ${transactions.length}`);
        Toast.success('Fausses données ajoutées', `${transactions.length} transactions au total`);
    });

    document.getElementById('testClearAllTransactions').addEventListener('click', async () => {
        const confirmed = window.confirm('Êtes-vous sûr ? Cela supprimera TOUTES les transactions.');
        if (!confirmed) return;

        logToTester('[Test Data] Clearing all transactions...');
        const start = performance.now();
        await clearAllTransactions();
        const end = performance.now();
        logToTester(`[Test Data] All transactions cleared in ${(end - start).toFixed(2)}ms`);
        Toast.success('Transactions supprimées', 'Tous les données ont été effacées');
    });

    // Modal Profil (si raccourci présent)
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', openProfileModal);
    }

    document.getElementById('closeProfile').addEventListener('click', () => {
        closeModal('profileModal');
    });

    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);

    // Fermer modales en cliquant en dehors
    document.querySelectorAll('.modal').forEach(modal => {
        let mouseDownTarget = null;

        modal.addEventListener('mousedown', (e) => {
            mouseDownTarget = e.target;
        });

        modal.addEventListener('mouseup', (e) => {
            // Fermer seulement si mousedown et mouseup sont tous les deux sur le fond de la modale
            if (e.target === modal && mouseDownTarget === modal) {
                if (modal.id === 'rolloverModal') {
                    return;
                }
                closeModal(modal.id);
            }
            mouseDownTarget = null;
        });
    });
}

window.openModal = openModal;
window.closeModal = closeModal;
window.setupModalListeners = setupModalListeners;