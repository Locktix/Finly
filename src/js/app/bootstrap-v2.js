import { setupAuthListeners } from '../auth/auth.js';
import { checkAuthState, showAuthPage, hideAppLoader } from '../profile/profile-service.js';
import { updateDashboard } from '../dashboard/dashboard.js';
import { getSelectedMonth, maybePromptRollover, getPreviousMonth } from '../transactions/transactions.js';
import { initializeFirebase } from '../firebase/firebase-init.js';
import { applyResponsiveLayoutState, setupResponsiveListeners, initializeMobileApp } from './mobile-app.js';
import { initializeTheme } from '../settings/theme.js';
import { initializeTimeGrouping } from '../settings/time-grouping-settings.js';
import { setupKeyboardListeners } from '../ui/keyboard-shortcuts.js';
import { setupSettingsMenu } from '../ui/settings-menu.js';
import { loadChangelogs } from '../ui/changelogs.js';
import { setupModalListeners } from '../ui/modals.js';
import { setupFormListeners } from '../transactions/forms.js';
import { initializeCategoryFilter, setupFilterListeners } from '../filters/filters.js';
import { loadTransactionsFromFirebase, loadTransactionsFromLocal, handleMonthChange } from '../transactions/month-navigation.js';

function getDb() {
    return window.db || null;
}

function getCurrentUser() {
    if (window.currentUser) {
        return window.currentUser;
    }

    try {
        if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
            return firebase.auth().currentUser || null;
        }
    } catch (error) {
    }

    return null;
}

async function runAppInitialization() {
    applyResponsiveLayoutState();
    setupResponsiveListeners();

    window.appLoaderTimeout = setTimeout(() => {
        console.warn('Timeout du loader - retrait forcé');
        hideAppLoader();
        showAuthPage();
    }, 10000);

    initializeTheme();
    initializeTimeGrouping();
    setupKeyboardListeners();

    await initializeFirebase();

    setupAuthListeners();
    setupSettingsMenu();
    loadChangelogs();
    if (typeof window.initializeIconSelects === 'function') {
        window.initializeIconSelects();
    }

    await checkAuthState();

    if (getCurrentUser()) {
        if (getDb()) {
            await loadTransactionsFromFirebase();
        } else {
            loadTransactionsFromLocal();
        }

        setupModalListeners();
        setupFormListeners();
        initializeCategoryFilter();
        setupFilterListeners();

        const today = new Date();
        const currentMonth = today.toISOString().slice(0, 7);
        window.selectedMonth = currentMonth;

        const monthFilter = document.getElementById('monthFilter');
        if (monthFilter) {
            monthFilter.value = currentMonth;
            monthFilter.addEventListener('change', (event) => {
                handleMonthChange(event.target.value, getSelectedMonth() || currentMonth);
            });
        }

        updateDashboard();
        maybePromptRollover(getPreviousMonth(currentMonth), currentMonth);

        const todayStr = today.toISOString().split('T')[0];
        const expenseDate = document.getElementById('expenseDate');
        const incomeDate = document.getElementById('incomeDate');
        if (expenseDate) expenseDate.value = todayStr;
        if (incomeDate) incomeDate.value = todayStr;

        initializeMobileApp();
    }
}

export function bootstrapApp() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAppInitialization, { once: true });
    } else {
        runAppInitialization();
    }
}