// ======================
// GESTION DU REGROUPEMENT TEMPOREL
// ======================

export function initializeTimeGrouping() {
    // Charger la préférence de regroupement temporel sauvegardée
    const saved = localStorage.getItem('timeGroupingEnabled');
    timeGroupingEnabled = saved === null ? false : saved === 'true';
    updateTimeGroupingLabel();
}

export function toggleTimeGrouping() {
    timeGroupingEnabled = !timeGroupingEnabled;
    localStorage.setItem('timeGroupingEnabled', timeGroupingEnabled);
    updateTimeGroupingLabel();
    updateDashboard();
}

export function updateTimeGroupingLabel() {
    const label = document.getElementById('timeGroupingLabel');
    if (label) {
        label.textContent = timeGroupingEnabled ? 'Regroupement: Activé' : 'Regroupement: Désactivé';
    }

    const profileTimeGroupingToggle = document.getElementById('profileTimeGroupingToggle');
    if (profileTimeGroupingToggle) {
        profileTimeGroupingToggle.checked = timeGroupingEnabled;
    }
}

export function openProfileModal() {
    loadProfileData().then(() => {
        openModal('profileModal');
    });
}

export function openDataTransferModal() {
    const importFinlyFile = document.getElementById('importFinlyFile');
    const importBankFile = document.getElementById('importBankFile');
    const importFinlyError = document.getElementById('importFinlyError');
    const importFinlySuccess = document.getElementById('importFinlySuccess');
    const importBankError = document.getElementById('importBankError');
    const importBankSuccess = document.getElementById('importBankSuccess');

    if (importFinlyFile) importFinlyFile.value = '';
    if (importBankFile) importBankFile.value = '';
    if (importFinlyError) importFinlyError.style.display = 'none';
    if (importFinlySuccess) importFinlySuccess.style.display = 'none';
    if (importBankError) importBankError.style.display = 'none';
    if (importBankSuccess) importBankSuccess.style.display = 'none';

    openModal('dataTransferModal');
}

window.initializeTimeGrouping = initializeTimeGrouping;
window.toggleTimeGrouping = toggleTimeGrouping;
window.updateTimeGroupingLabel = updateTimeGroupingLabel;
window.openProfileModal = openProfileModal;
window.openDataTransferModal = openDataTransferModal;