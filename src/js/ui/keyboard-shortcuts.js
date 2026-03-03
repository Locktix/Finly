// ======================
// KEYBOARD SHORTCUTS
// ======================
export function setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
        // Fermer les modales avec ESC
        if (e.key === 'Escape') {
            // Fermer le menu paramètres
            const settingsDropdown = document.getElementById('settingsDropdown');
            if (settingsDropdown && settingsDropdown.classList.contains('active')) {
                settingsDropdown.classList.remove('active');
                return;
            }

            // Trouver et fermer la modale active
            const activeModals = document.querySelectorAll('.modal.active');
            if (activeModals.length > 0) {
                // Fermer la dernière modale ouverte
                const lastModal = activeModals[activeModals.length - 1];
                if (lastModal.id === 'rolloverModal') {
                    return;
                }
                closeModal(lastModal.id);
            }

            // Aussi fermer le panel filtres avancés s'il est ouvert
            const advancedFilters = document.getElementById('advancedFilters');
            if (advancedFilters && advancedFilters.classList.contains('active')) {
                advancedFilters.classList.remove('active');
            }
        }
    });
}

window.setupKeyboardListeners = setupKeyboardListeners;