// ======================
// SYNC STATUS INDICATOR
// ======================
let lastSyncTime = null;
let syncTimeout = null;

export function updateSyncStatus(status = 'synced', message = '') {
    const targets = [
        {
            indicator: document.getElementById('syncIndicator'),
            text: document.getElementById('syncText')
        },
        {
            indicator: document.getElementById('profileSyncIndicator'),
            text: document.getElementById('profileSyncText')
        }
    ].filter(target => target.indicator && target.text);

    if (targets.length === 0) return;

    targets.forEach(target => {
        target.indicator.classList.remove('syncing', 'error');

        switch(status) {
            case 'syncing':
                target.indicator.classList.add('syncing');
                target.text.textContent = 'Synchronisation...';
                break;
            case 'synced':
                lastSyncTime = new Date();
                target.text.textContent = 'Synchronisé';
                target.indicator.classList.remove('syncing', 'error');
                break;
            case 'error':
                target.indicator.classList.add('error');
                target.text.textContent = message || 'Erreur de sync';
                break;
            case 'offline':
                target.indicator.classList.add('error');
                target.text.textContent = 'Mode hors ligne';
                break;
        }
    });

    // Auto-reset le statut après 3s
    if (status === 'synced') {
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            targets.forEach(target => {
                target.text.textContent = 'Synchronisé';
                target.indicator.classList.remove('syncing', 'error');
            });
        }, 3000);
    }
}

window.updateSyncStatus = updateSyncStatus;