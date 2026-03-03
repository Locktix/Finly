// ======================
// GESTION DU THÈME
// ======================

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    const themeLabel = document.getElementById('themeLabel');
    if (themeLabel) {
        themeLabel.textContent = newTheme === 'dark' ? 'Mode Clair' : 'Mode Sombre';
    }

    // Mettre à jour le dashboard pour les couleurs dynamiques
    updateDashboard();
}