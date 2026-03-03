// ======================
// MOBILE APP SYSTEM
// ======================

let currentMobilePage = 'homePage';
let currentStatsPeriod = 'allTime';
let selectedStatsYear = new Date().getFullYear();
let selectedStatsMonth = `${selectedStatsYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
let selectedStatsWeek = null;
let mobileAppInitialized = false;
let responsiveListenersInitialized = false;

function isMobileViewport() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function updateViewportCssVariable() {
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const vh = viewportHeight * 0.01;
    document.documentElement.style.setProperty('--app-vh', `${vh}px`);
}

function isAuthenticatedSession() {
    if (currentUser) {
        return true;
    }

    try {
        const hasFirebaseApp = typeof firebase !== 'undefined' && Array.isArray(firebase.apps) && firebase.apps.length > 0;
        if (!hasFirebaseApp || typeof firebase.auth !== 'function') {
            return false;
        }

        return !!firebase.auth().currentUser;
    } catch (error) {
        return false;
    }
}

function applyResponsiveLayoutState() {
    if (!isAuthenticatedSession()) {
        document.body.classList.remove('mobile-layout', 'desktop-layout');

        const mainContainer = document.getElementById('mainContainer');
        const chartsSection = document.getElementById('chartsSection');
        const mobileNavbar = document.getElementById('mobileNavbar');

        if (mainContainer) {
            mainContainer.classList.remove('active-page');
            mainContainer.style.display = 'none';
        }
        if (chartsSection) {
            chartsSection.classList.remove('active-page');
            chartsSection.style.display = 'none';
        }
        if (mobileNavbar) {
            mobileNavbar.style.display = 'none';
        }

        document.querySelectorAll('.app-page').forEach(page => {
            page.classList.remove('active-page');
            page.style.display = 'none';
        });

        return;
    }

    const mobile = isMobileViewport();
    
    // Ajouter/retirer la classe mobile-layout sur le body
    if (mobile) {
        document.body.classList.add('mobile-layout');
        document.body.classList.remove('desktop-layout');
    } else {
        document.body.classList.add('desktop-layout');
        document.body.classList.remove('mobile-layout');
    }

    if (!mobile) {
        // En mode desktop, s'assurer que la page actuelle est affichée correctement
        if (currentMobilePage && currentMobilePage !== 'homePage') {
            switchPage(currentMobilePage);
        } else {
            switchPage('homePage');
        }
        return;
    }

    // En mode mobile, gérer les pages
    if (currentMobilePage && currentMobilePage !== 'homePage') {
        switchMobilePage(currentMobilePage);
    } else {
        switchMobilePage('homePage');
    }
}

function setupResponsiveListeners() {
    if (responsiveListenersInitialized) {
        return;
    }

    const handleViewportChange = debounce(() => {
        updateViewportCssVariable();
        applyResponsiveLayoutState();
    }, 120);

    // Écouter les changements de resize
    window.addEventListener('resize', handleViewportChange, { passive: true });
    window.addEventListener('orientationchange', handleViewportChange, { passive: true });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange, { passive: true });
    }

    // Écouter les changements de media query (pour les devtools)
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleMediaQueryChange = (e) => {
        updateViewportCssVariable();
        applyResponsiveLayoutState();
    };
    
    // Ancien navigateurs
    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleMediaQueryChange);
    } else {
        mediaQuery.addListener(handleMediaQueryChange);
    }

    responsiveListenersInitialized = true;
}

function initializeMobileApp() {
    const mobileNavButtons = document.querySelectorAll('.navbar-btn');
    const desktopNavButtons = document.querySelectorAll('.desktop-nav-btn');

    if (!mobileAppInitialized) {
        // Ajouter les événements de navigation mobile
        mobileNavButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const pageId = btn.getAttribute('data-page');
                switchPage(pageId);
            });
        });

        // Ajouter les événements de navigation desktop
        desktopNavButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const pageId = btn.getAttribute('data-page');
                switchPage(pageId);
            });
        });

        // Initialiser les pages
        setupStatsPageListeners();
        setupProfilePageListeners();
        mobileAppInitialized = true;
    }

    updateViewportCssVariable();
    applyResponsiveLayoutState();
    setupResponsiveListeners();
}

function switchPage(pageId) {
    if (!isAuthenticatedSession()) {
        return;
    }

    // Retirer la classe active de toutes les pages
    const pages = document.querySelectorAll('.app-page');
    pages.forEach(page => page.classList.remove('active-page'));

    // Retirer la classe active du mainContainer et chartsSection
    const mainContainer = document.getElementById('mainContainer');
    const chartsSection = document.getElementById('chartsSection');
    
    if (mainContainer) {
        mainContainer.classList.remove('active-page');
    }
    if (chartsSection) {
        chartsSection.classList.remove('active-page');
    }

    // Afficher la page appropriée
    if (pageId === 'homePage') {
        if (mainContainer) {
            mainContainer.classList.add('active-page');
        }
        if (chartsSection) {
            chartsSection.classList.add('active-page');
        }
    } else {
        const newPage = document.getElementById(pageId);
        if (newPage) {
            newPage.classList.add('active-page');
            
            // Mettre à jour les données
            if (pageId === 'statsPage') {
                refreshStatsPage();
            } else if (pageId === 'profilePage') {
                refreshProfilePage();
            }
        }
    }

    // Mettre à jour les boutons de navigation mobile
    document.querySelectorAll('.navbar-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageId) {
            btn.classList.add('active');
        }
    });

    // Mettre à jour les boutons de navigation desktop
    document.querySelectorAll('.desktop-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageId) {
            btn.classList.add('active');
        }
    });

    currentMobilePage = pageId;
}

// Alias pour compatibilité
function switchMobilePage(pageId) {
    switchPage(pageId);
}

function formatDateFrShort(date) {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function formatMonthLabelFr(monthValue) {
    const [year, month] = monthValue.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function getStatsYears(transactionsList = []) {
    const years = new Set([new Date().getFullYear()]);
    transactionsList.forEach(t => {
        const date = new Date(t.date);
        if (!Number.isNaN(date.getTime())) {
            years.add(date.getFullYear());
        }
    });
    return Array.from(years).sort((a, b) => b - a);
}

function getMonthOptionsForYear(year) {
    const options = [];
    for (let month = 1; month <= 12; month++) {
        const value = `${year}-${String(month).padStart(2, '0')}`;
        options.push({
            value,
            label: formatMonthLabelFr(value)
        });
    }
    return options;
}

function getMonthWeekRanges(year, month) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    monthStart.setHours(0, 0, 0, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const weekRanges = [];
    let cursor = new Date(monthStart);

    while (cursor <= monthEnd) {
        const dayOfWeek = cursor.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(cursor);
        weekStart.setDate(cursor.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const rangeStart = new Date(Math.max(weekStart.getTime(), monthStart.getTime()));
        const rangeEnd = new Date(Math.min(weekEnd.getTime(), monthEnd.getTime()));

        const index = weekRanges.length + 1;
        weekRanges.push({
            id: `${rangeStart.toISOString().slice(0, 10)}|${rangeEnd.toISOString().slice(0, 10)}`,
            start: rangeStart.toISOString().slice(0, 10),
            end: rangeEnd.toISOString().slice(0, 10),
            label: `Semaine ${index} (du ${formatDateFrShort(rangeStart)} au ${formatDateFrShort(rangeEnd)})`
        });

        cursor = new Date(weekEnd);
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(0, 0, 0, 0);
    }

    return weekRanges;
}

function getCurrentStatsSelection() {
    return {
        year: selectedStatsYear,
        month: selectedStatsMonth,
        week: selectedStatsWeek
    };
}

function setSelectOptions(selectEl, options, selectedValue) {
    if (!selectEl) return;

    selectEl.innerHTML = '';
    options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        selectEl.appendChild(optionEl);
    });

    if (selectedValue && options.some(option => option.value === selectedValue)) {
        selectEl.value = selectedValue;
    } else if (options.length > 0) {
        selectEl.value = options[0].value;
    }
}

function updateStatsPeriodControls() {
    const controlsContainer = document.getElementById('statsPeriodControls');
    const yearControl = document.getElementById('statsYearControl');
    const monthControl = document.getElementById('statsMonthControl');
    const weekControl = document.getElementById('statsWeekControl');
    const yearSelect = document.getElementById('statsYearSelect');
    const monthSelect = document.getElementById('statsMonthSelect');
    const weekSelect = document.getElementById('statsWeekSelect');

    if (!controlsContainer || !yearControl || !monthControl || !weekControl || !yearSelect || !monthSelect || !weekSelect) {
        return;
    }

    if (currentStatsPeriod === 'allTime') {
        controlsContainer.style.display = 'none';
        yearControl.style.display = 'none';
        monthControl.style.display = 'none';
        weekControl.style.display = 'none';
        return;
    }

    controlsContainer.style.display = 'flex';

    const yearOptions = getStatsYears(transactions).map(year => ({ value: String(year), label: String(year) }));
    const selectedYearValue = String(selectedStatsYear);
    setSelectOptions(yearSelect, yearOptions, selectedYearValue);
    selectedStatsYear = parseInt(yearSelect.value, 10);

    const monthOptions = getMonthOptionsForYear(selectedStatsYear);
    const selectedMonthValue = selectedStatsMonth && selectedStatsMonth.startsWith(`${selectedStatsYear}-`)
        ? selectedStatsMonth
        : `${selectedStatsYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    setSelectOptions(monthSelect, monthOptions, selectedMonthValue);
    selectedStatsMonth = monthSelect.value;

    const [weekYear, weekMonth] = selectedStatsMonth.split('-').map(Number);
    const weekRanges = getMonthWeekRanges(weekYear, weekMonth);
    const weekOptions = weekRanges.map(range => ({ value: range.id, label: range.label }));
    const defaultWeekValue = selectedStatsWeek ? `${selectedStatsWeek.start}|${selectedStatsWeek.end}` : null;
    setSelectOptions(weekSelect, weekOptions, defaultWeekValue);

    const selectedWeekRange = weekRanges.find(range => range.id === weekSelect.value) || weekRanges[0] || null;
    selectedStatsWeek = selectedWeekRange
        ? { start: selectedWeekRange.start, end: selectedWeekRange.end }
        : null;

    yearControl.style.display = (currentStatsPeriod === 'year' || currentStatsPeriod === 'month' || currentStatsPeriod === 'week') ? 'flex' : 'none';
    monthControl.style.display = (currentStatsPeriod === 'month' || currentStatsPeriod === 'week') ? 'flex' : 'none';
    weekControl.style.display = currentStatsPeriod === 'week' ? 'flex' : 'none';
}