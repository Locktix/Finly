// ======================
// GESTION DES CHANGELOGS
// ======================
const CHANGELOG_SEEN_KEY = 'finly:lastSeenChangelogVersion';
let latestChangelogVersion = null;

function setProfileChangelogBadge(hasUpdate) {
    const profileChangelogBtn = document.getElementById('profileChangelogBtn');
    const profileNavButtons = document.querySelectorAll('[data-page="profilePage"]');
    const enabled = Boolean(hasUpdate);

    if (profileChangelogBtn) {
        profileChangelogBtn.classList.toggle('has-update', enabled);
    }

    profileNavButtons.forEach(button => {
        button.classList.toggle('has-update', enabled);
    });
}

function getSeenChangelogVersion() {
    return localStorage.getItem(CHANGELOG_SEEN_KEY) || null;
}

function markChangelogAsSeen() {
    if (!latestChangelogVersion) return;
    localStorage.setItem(CHANGELOG_SEEN_KEY, latestChangelogVersion);
    setProfileChangelogBadge(false);
}

function refreshChangelogBadge() {
    if (!latestChangelogVersion) {
        setProfileChangelogBadge(false);
        return;
    }

    const seenVersion = getSeenChangelogVersion();
    setProfileChangelogBadge(seenVersion !== latestChangelogVersion);
}

export function loadChangelogs() {
    fetch('changelogs.json')
        .then(response => response.json())
        .then(data => {
            latestChangelogVersion = data?.versions?.[0]?.version || null;
            refreshChangelogBadge();

            const container = document.getElementById('changelogsContainer');
            container.innerHTML = '';
            container.classList.add('roadmap-timeline');

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            data.versions.forEach(version => {
                const roadmapItem = document.createElement('article');
                const releaseDate = new Date(version.date);
                releaseDate.setHours(0, 0, 0, 0);

                const isPlanned = releaseDate > today;
                roadmapItem.className = `roadmap-item ${isPlanned ? 'planned' : 'done'}`;

                roadmapItem.innerHTML = `
                    <div class="roadmap-marker" aria-hidden="true">
                        <span></span>
                    </div>
                    <div class="roadmap-card">
                        <div class="roadmap-header">
                            <span class="roadmap-version">v${version.version}</span>
                            <span class="roadmap-date">${new Date(version.date).toLocaleDateString('fr-FR')}</span>
                            <span class="roadmap-status">${isPlanned ? 'Prévu' : 'Livré'}</span>
                        </div>
                        <h3 class="roadmap-title">${version.title}</h3>
                        <ul class="roadmap-changes">
                            ${version.changes.map(change => `<li>${change}</li>`).join('')}
                        </ul>
                    </div>
                `;

                container.appendChild(roadmapItem);
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des changelogs:', error);
            setProfileChangelogBadge(false);
        });

    // Événements pour le modal changelogs
    document.getElementById('changelogs-btn').addEventListener('click', () => {
        markChangelogAsSeen();
        openModal('changelogsModal');
    });

    document.getElementById('closeChangelogs').addEventListener('click', () => {
        closeModal('changelogsModal');
    });

    // Fermer modal changelogs en cliquant en dehors
    document.getElementById('changelogsModal').addEventListener('click', (e) => {
        if (e.target.id === 'changelogsModal') {
            closeModal('changelogsModal');
        }
    });
}

window.loadChangelogs = loadChangelogs;