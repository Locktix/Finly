import './core/utils.js';
import './core/toast.js';
import './core/sync-status.js';
import './firebase/firebase-config.js';
import './firebase/firebase-init.js';
import './settings/theme.js';
import './settings/time-grouping-settings.js';
import './ui/settings-menu.js';
import './ui/keyboard-shortcuts.js';
import './ui/modals.js';
import './ui/changelogs.js';
import './time/grouping-engine.js';
import './filters/filters.js';
import './auth/auth.js';
import './transactions/transactions.js';
import './transactions/forms.js';
import './transactions/month-navigation.js';
import './mobile/cards-view.js';
import './charts/charts.js';
import './dashboard/dashboard.js';
import './profile/profile-service.js';
import './profile/profile-page.js';
import './stats/statistics-calculations.js';
import './stats/stats-page.js';
import './app/mobile-app.js';

function validateCoreDependencies() {
  const requiredGlobals = [
    'initializeFirebase',
    'setupAuthListeners',
    'checkAuthState',
    'initializeMobileApp',
    'updateDashboard'
  ];

  const missing = requiredGlobals.filter(name => typeof window[name] !== 'function');
  if (missing.length > 0) {
    throw new Error(`Dépendances globales manquantes: ${missing.join(', ')}`);
  }
}

(async function boot() {
  try {
    validateCoreDependencies();
    const { bootstrapApp } = await import('./app/bootstrap-v2.js');
    bootstrapApp();
  } catch (error) {
    console.error('[Finly] Erreur de chargement applicatif:', error);
  }
})();
