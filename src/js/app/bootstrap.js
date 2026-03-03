// ======================
// INITIALISATION AU CHARGEMENT
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    // Appliquer l'état responsive immédiatement
    applyResponsiveLayoutState();
    setupResponsiveListeners();
    
    // Timeout de sécurité pour retirer le loader si quelque chose tourne mal
    appLoaderTimeout = setTimeout(() => {
        console.warn('Timeout du loader - retrait forcé');
        hideAppLoader();
        showAuthPage();
    }, 10000); // 10 secondes maximum
    
    // Initialiser le thème
    initializeTheme();

    // Initialiser le regroupement temporel
    initializeTimeGrouping();

    // Initialiser les keyboard shortcuts
    setupKeyboardListeners();

    // Initialiser Firebase
    await initializeFirebase();
    
    // Configuration des écouteurs d'authentification
    setupAuthListeners();

    // Configuration du menu paramètres
    setupSettingsMenu();

    // Charger les changelogs
    loadChangelogs();

    // Initialiser les select avec icones
    initializeIconSelects();

    // Vérifier l'état de l'authentification
    await checkAuthState();
    
    // Configuration des modales et formulaires (seulement si connecté)
    if (currentUser) {
        // Charger les transactions depuis Firebase ou localStorage
        if (db) {
            await loadTransactionsFromFirebase();
        } else {
            loadTransactionsFromLocal();
        }
        
        setupModalListeners();
        setupFormListeners();
        
        // Initialiser les filtres
        initializeCategoryFilter();
        setupFilterListeners();

        // Mise à jour initiale du dashboard
        const today = new Date();
        const currentMonth = today.toISOString().slice(0, 7);
        selectedMonth = currentMonth;
        document.getElementById('monthFilter').value = currentMonth;
        
        updateDashboard();
        maybePromptRollover(getPreviousMonth(currentMonth), currentMonth);

        // Ajouter les valeurs par défaut aux champs de date
        const todayStr = today.toISOString().split('T')[0];
        document.getElementById('expenseDate').value = todayStr;
        document.getElementById('incomeDate').value = todayStr;
        
        // Listener pour le changement de mois
        document.getElementById('monthFilter').addEventListener('change', (e) => {
            handleMonthChange(e.target.value, selectedMonth || getSelectedMonth());
        });

        // Initialiser la navigation mobile
        initializeMobileApp();
    }
});