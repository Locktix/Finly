// ======================
// SETTINGS MENU
// ======================
export function setupSettingsMenu() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDropdown = document.getElementById('settingsDropdown');

    if (!settingsBtn || !settingsDropdown) return;

    // Toggle menu on button click
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsBtn.contains(e.target) && !settingsDropdown.contains(e.target)) {
            settingsDropdown.classList.remove('active');
        }
    });

    // Close menu when clicking on a menu item (except for toggle buttons)
    const settingsItems = settingsDropdown.querySelectorAll('.settings-item');
    settingsItems.forEach(item => {
        // Ne pas fermer si c'est le thème toggle (il est cliquable)
        if (!item.id.includes('theme')) {
            item.addEventListener('click', () => {
                setTimeout(() => {
                    settingsDropdown.classList.remove('active');
                }, 100);
            });
        }
    });
}

window.setupSettingsMenu = setupSettingsMenu;