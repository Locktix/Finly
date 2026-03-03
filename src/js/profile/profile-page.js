// ======================
// PROFILE PAGE
// ======================

export function setupProfilePageListeners() {
    const themeToggle = document.getElementById('profileThemeToggle');
    const timeGroupingToggle = document.getElementById('profileTimeGroupingToggle');
    const exportBtn = document.getElementById('profileExportBtn');
    const editBtn = document.getElementById('profileEditBtn');
    const changelogBtn = document.getElementById('profileChangelogBtn');
    const logoutBtn = document.getElementById('profileLogoutBtn');
    const adminBtn = document.getElementById('profileAdminBtn');
    const testerBtn = document.getElementById('profileTesterBtn');

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            toggleTheme();
            updateProfileDisplay();
        });
    }

    if (timeGroupingToggle) {
        timeGroupingToggle.addEventListener('change', () => {
            toggleTimeGrouping();
            updateProfileDisplay();
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            openDataTransferModal();
        });
    }

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            openProfileModal();
        });
    }

    if (changelogBtn) {
        changelogBtn.addEventListener('click', () => {
            document.getElementById('changelogs-btn').click();
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

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
}

export function refreshProfilePage() {
    updateProfileDisplay();
}

export function updateProfileDisplay() {
    const user = firebase.auth().currentUser;

    if (user) {
        document.getElementById('profileDisplayName').textContent = user.displayName || 'Utilisateur';
        document.getElementById('profileDisplayEmail').textContent = user.email || 'N/A';
        const createdDate = new Date(user.metadata?.creationTime).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long'
        });
        document.getElementById('profileMemberSince').textContent = `Membre depuis ${createdDate}`;
    }

    // Compter les transactions
    document.getElementById('profileTotalTrans').textContent = transactions.length;

    // Compter les catégories uniques
    const categories = new Set();
    const months = new Set();
    transactions.forEach(t => {
        if (t.category) categories.add(t.category);
        const month = new Date(t.date).toISOString().slice(0, 7);
        months.add(month);
    });

    document.getElementById('profileTotalCats').textContent = categories.size;
    document.getElementById('profileActiveMonths').textContent = months.size;

    // Mettre à jour le toggle du thème
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const themeToggle = document.getElementById('profileThemeToggle');
    if (themeToggle) {
        themeToggle.checked = isDark;
    }

    const profileTimeGroupingToggle = document.getElementById('profileTimeGroupingToggle');
    if (profileTimeGroupingToggle) {
        profileTimeGroupingToggle.checked = timeGroupingEnabled;
    }
}

window.setupProfilePageListeners = setupProfilePageListeners;
window.refreshProfilePage = refreshProfilePage;
window.updateProfileDisplay = updateProfileDisplay;