// ======================
// REGROUPEMENT TEMPOREL
// ======================
export function getRelativeTimeLabel(dateString) {
    const transactionDate = new Date(dateString);
    const today = new Date();

    // Réinitialiser l'heure pour comparer seulement les dates
    today.setHours(0, 0, 0, 0);
    transactionDate.setHours(0, 0, 0, 0);

    const diffTime = today - transactionDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 14) return "Il y a 1 semaine";
    if (diffDays < 21) return "Il y a 2 semaines";
    if (diffDays < 28) return "Il y a 3 semaines";
    if (diffDays < 60) return "Il y a 1 mois";

    const diffMonths = Math.floor(diffDays / 30);
    return `Il y a ${diffMonths} mois`;
}

export function groupTransactionsByTime(transactionsList) {
    const groups = {};

    transactionsList.forEach(transaction => {
        const label = getRelativeTimeLabel(transaction.date);
        if (!groups[label]) {
            groups[label] = [];
        }
        groups[label].push(transaction);
    });

    return groups;
}

window.getRelativeTimeLabel = getRelativeTimeLabel;
window.groupTransactionsByTime = groupTransactionsByTime;