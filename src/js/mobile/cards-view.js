// ======================
// MOBILE CARDS VIEW
// ======================
function updateTransactionsList() {
    const listContainer = document.getElementById('transactionsList');
    const month = getSelectedMonth();

    const monthTransactions = getTransactionsForMonth(month);
    const filteredTransactions = applyFilters(monthTransactions);

    if (filteredTransactions.length === 0) {
        listContainer.innerHTML = '<div style="padding: var(--spacing-lg); text-align: center; color: var(--color-text-secondary);">Aucune transaction pour ce mois.</div>';
        return;
    }

    // Appliquer le tri personnalisé
    const sorted = sortTransactions(filteredTransactions);

    let html = '';

    if (timeGroupingEnabled) {
        // Regrouper par périodes temporelles
        const groups = groupTransactionsByTime(sorted);

        // Définir l'ordre des groupes
        const groupOrder = [
            "Aujourd'hui",
            "Hier",
            "Il y a 2 jours",
            "Il y a 3 jours",
            "Il y a 4 jours",
            "Il y a 5 jours",
            "Il y a 6 jours",
            "Il y a 1 semaine",
            "Il y a 2 semaines",
            "Il y a 3 semaines",
            "Il y a 1 mois"
        ];

        // Trier les clés des groupes selon l'ordre défini
        const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
            const indexA = groupOrder.indexOf(a);
            const indexB = groupOrder.indexOf(b);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            const monthsA = parseInt(a.match(/(\d+) mois/)?.[1] || 999);
            const monthsB = parseInt(b.match(/(\d+) mois/)?.[1] || 999);
            return monthsA - monthsB;
        });

        sortedGroupKeys.forEach(timeLabel => {
            const groupTransactions = groups[timeLabel];

            // Ajouter le séparateur de groupe
            html += `
                <div class="mobile-time-separator">
                    <div class="mobile-time-separator-line"></div>
                    <span class="mobile-time-separator-text">${timeLabel}</span>
                    <div class="mobile-time-separator-line"></div>
                </div>
            `;

            // Ajouter les transactions du groupe
            groupTransactions.forEach((transaction) => {
                const originalIndex = transactions.indexOf(transaction);
                const icon = categoryIcons[transaction.category] || 'fa-ellipsis-h';
                const formattedDate = formatDate(transaction.date);
                const formattedAmount = formatCurrency(transaction.amount);
                const typeClass = transaction.type === 'income' ? 'income' : 'expense';

                html += renderTransactionCard(transaction, {
                    originalIndex,
                    icon,
                    formattedDate,
                    formattedAmount,
                    typeClass
                });
            });
        });
    } else {
        // Affichage sans regroupement temporel
        sorted.forEach((transaction) => {
            const originalIndex = transactions.indexOf(transaction);
            const icon = categoryIcons[transaction.category] || 'fa-ellipsis-h';
            const formattedDate = formatDate(transaction.date);
            const formattedAmount = formatCurrency(transaction.amount);
            const typeClass = transaction.type === 'income' ? 'income' : 'expense';

            html += renderTransactionCard(transaction, {
                originalIndex,
                icon,
                formattedDate,
                formattedAmount,
                typeClass
            });
        });
    }

    listContainer.innerHTML = html;
    setupMobileSwipeActions();
}

function renderTransactionCard(transaction, {
    originalIndex,
    icon,
    formattedDate,
    formattedAmount,
    typeClass
}) {
    return `
        <div class="transaction-swipe-item" data-transaction-index="${originalIndex}">
            <div class="transaction-swipe-bg swipe-edit">
                <i class="fas fa-edit"></i>
                <span>Modifier</span>
            </div>
            <div class="transaction-swipe-bg swipe-delete">
                <i class="fas fa-trash-alt"></i>
                <span>Supprimer</span>
            </div>

            <div class="transaction-card">
                <div class="transaction-card-header">
                    <div class="transaction-card-description">${transaction.description}</div>
                    <div class="transaction-card-amount ${typeClass}">${formattedAmount}</div>
                </div>

                <div class="transaction-card-category">
                    <i class="fas ${icon}"></i> ${transaction.category}
                </div>

                <div class="transaction-card-separator"></div>

                <div class="transaction-card-footer">
                    <div class="transaction-card-date"><i class="fas fa-clock"></i> ${formattedDate}</div>
                    <div class="transaction-card-actions">
                        <button class="btn-edit" onclick="openEditModal(${originalIndex})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteTransaction(${originalIndex})" title="Supprimer">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function isMobileSwipeEnabled() {
    return window.matchMedia('(max-width: 768px)').matches && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
}

function resetSwipeItem(item, withTransition = true) {
    const card = item.querySelector('.transaction-card');
    if (!card) return;

    card.style.transition = withTransition ? 'transform 180ms ease' : 'none';
    card.style.transform = 'translateX(0px)';
    item.classList.remove('swiping-left', 'swiping-right');
}

function setupMobileSwipeActions() {
    const listContainer = document.getElementById('transactionsList');
    if (!listContainer) return;

    const swipeItems = listContainer.querySelectorAll('.transaction-swipe-item');
    if (swipeItems.length === 0) return;

    if (!isMobileSwipeEnabled()) {
        swipeItems.forEach((item) => resetSwipeItem(item));
        return;
    }

    let activeSwipeItem = null;

    swipeItems.forEach((item) => {
        const card = item.querySelector('.transaction-card');
        if (!card) return;

        let startX = 0;
        let startY = 0;
        let currentOffset = 0;
        let isHorizontalSwipe = false;
        let gestureLocked = false;

        card.addEventListener('touchstart', (event) => {
            if (event.target.closest('button')) return;

            const touch = event.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            currentOffset = 0;
            isHorizontalSwipe = false;
            gestureLocked = false;
            card.style.transition = 'none';
        }, { passive: true });

        card.addEventListener('touchmove', (event) => {
            if (startX === 0 && startY === 0) return;

            const touch = event.touches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;

            if (!gestureLocked) {
                if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
                    startX = 0;
                    startY = 0;
                    return;
                }

                if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
                    isHorizontalSwipe = true;
                    gestureLocked = true;
                } else {
                    return;
                }
            }

            if (!isHorizontalSwipe) return;
            event.preventDefault();

            if (activeSwipeItem && activeSwipeItem !== item) {
                resetSwipeItem(activeSwipeItem);
            }
            activeSwipeItem = item;

            currentOffset = Math.max(-SWIPE_MAX_OFFSET, Math.min(SWIPE_MAX_OFFSET, deltaX));
            card.style.transform = `translateX(${currentOffset}px)`;
            item.classList.toggle('swiping-right', currentOffset > 10);
            item.classList.toggle('swiping-left', currentOffset < -10);
        }, { passive: false });

        card.addEventListener('touchend', () => {
            if (!isHorizontalSwipe) {
                startX = 0;
                startY = 0;
                return;
            }

            const transactionIndex = Number(item.dataset.transactionIndex);
            const shouldEdit = currentOffset >= SWIPE_TRIGGER_DISTANCE;
            const shouldDelete = currentOffset <= -SWIPE_TRIGGER_DISTANCE;

            resetSwipeItem(item);

            if (shouldEdit) {
                openEditModal(transactionIndex);
            } else if (shouldDelete) {
                deleteTransaction(transactionIndex);
            }

            startX = 0;
            startY = 0;
            currentOffset = 0;
            isHorizontalSwipe = false;
            gestureLocked = false;
        }, { passive: true });

        card.addEventListener('touchcancel', () => {
            resetSwipeItem(item);
            startX = 0;
            startY = 0;
            currentOffset = 0;
            isHorizontalSwipe = false;
            gestureLocked = false;
        }, { passive: true });
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}