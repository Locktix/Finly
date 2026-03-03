// ======================
// GESTION DES CHANGELOGS
// ======================
function loadChangelogs() {
    fetch('changelogs.json')
        .then(response => response.json())
        .then(data => {
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
        .catch(error => console.error('Erreur lors du chargement des changelogs:', error));

    // Événements pour le modal changelogs
    document.getElementById('changelogs-btn').addEventListener('click', () => {
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