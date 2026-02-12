// ======================
// GESTION DU THÈME
// ======================

function initializeTheme() {
    // Charger la préférence de thème sauvegardée
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
}

// ======================
// CONFIGURATION FIREBASE
// ======================
let firebaseApp = null;
let db = null;

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBz97Do0f0cn4_-PMc8PzIODJn0S3MVDjw",
    authDomain: "finly-f82be.firebaseapp.com",
    projectId: "finly-f82be",
    storageBucket: "finly-f82be.firebasestorage.app",
    messagingSenderId: "939430426599",
    appId: "1:939430426599:web:3f79a47ab8bbaaf7e06f42",
    measurementId: "G-GTQCFFKXS1"
};

// Catégories d'icônes pour les transactions
const categoryIcons = {
    'Assurances': 'fa-shield',
    'Magasins': 'fa-shopping-bag',
    'Épargne': 'fa-piggy-bank',
    'Loisirs': 'fa-gamepad',
    'Transport': 'fa-car',
    'Santé': 'fa-hospital',
    'Restaurants': 'fa-utensils',
    'Services': 'fa-wrench',
    'Salaire': 'fa-money-bill-wave',
    'Revenus': 'fa-chart-line',
    'Autres': 'fa-ellipsis-h'
};

const expenseCategories = ['Assurances', 'Magasins', 'Épargne', 'Loisirs', 'Transport', 'Santé', 'Restaurants', 'Services', 'Autres'];
const incomeCategories = ['Salaire', 'Revenus', 'Autres'];

let currentEditingIndex = null;
let currentEditingType = null;

// Instances des graphiques
let expensesChartInstance = null;
let incomeExpenseChartInstance = null;

// ======================
// INITIALISATION FIREBASE
// ======================
async function initializeFirebase() {
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        
        // Authentification anonyme
        await firebase.auth().signInAnonymously();
        console.log('Authentification anonyme réussie');
        
        db = firebase.firestore();
        
        console.log('Firebase initialisé avec succès');
        loadTransactionsFromFirebase();
    } catch (error) {
        if (error.code === 'app/duplicate-app') {
            try {
                // Si l'app existe déjà, essayer de se connecter anonymement
                const user = firebase.auth().currentUser;
                if (!user) {
                    await firebase.auth().signInAnonymously();
                }
                db = firebase.firestore();
                console.log('Utilisation de l\'instance Firebase existante');
                loadTransactionsFromFirebase();
            } catch (authError) {
                console.error('Erreur lors de l\'authentification:', authError);
                useLocalStorage();
            }
        } else {
            console.error('Erreur lors de l\'initialisation Firebase:', error);
            useLocalStorage();
        }
    }
}

function useLocalStorage() {
    console.log('Utilisation du mode local (localStorage)');
    db = null;
    loadTransactionsFromLocal();
    updateDashboard();
}

// ======================
// GESTION DES MODALES
// ======================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function setupModalListeners() {
    // Modal Dépense
    document.getElementById('addExpenseBtn').addEventListener('click', () => {
        document.getElementById('expenseDate').valueAsDate = new Date();
        openModal('expenseModal');
    });

    document.getElementById('closeExpenseBtn').addEventListener('click', () => {
        closeModal('expenseModal');
    });

    // Modal Recette
    document.getElementById('addIncomeBtn').addEventListener('click', () => {
        document.getElementById('incomeDate').valueAsDate = new Date();
        openModal('incomeModal');
    });

    document.getElementById('closeIncomeBtn').addEventListener('click', () => {
        closeModal('incomeModal');
    });

    // Modal Modifier
    document.getElementById('closeEditBtn').addEventListener('click', () => {
        closeModal('editModal');
    });

    // Toggle Thème
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Modal Configuration
    document.getElementById('configBtn').addEventListener('click', () => {
        openModal('configModal');
    });

    document.getElementById('closeConfigBtn').addEventListener('click', () => {
        closeModal('configModal');
    });

    document.getElementById('closeConfigBtn2').addEventListener('click', () => {
        closeModal('configModal');
    });

    // Fermer modales en cliquant en dehors
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// ======================
// GESTION DES FORMULAIRES
// ======================
function setupFormListeners() {
    // Formulaire Dépense
    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const transaction = {
            type: 'expense',
            description: document.getElementById('expenseName').value,
            category: document.getElementById('expenseCategory').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            date: document.getElementById('expenseDate').value,
            timestamp: new Date().toISOString()
        };
        addTransaction(transaction);
        document.getElementById('expenseForm').reset();
        closeModal('expenseModal');
    });

    // Formulaire Recette
    document.getElementById('incomeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const transaction = {
            type: 'income',
            description: document.getElementById('incomeName').value,
            category: document.getElementById('incomeCategory').value,
            amount: parseFloat(document.getElementById('incomeAmount').value),
            date: document.getElementById('incomeDate').value,
            timestamp: new Date().toISOString()
        };
        addTransaction(transaction);
        document.getElementById('incomeForm').reset();
        closeModal('incomeModal');
    });

    // Formulaire Modifier
    document.getElementById('editForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedTransaction = {
            type: currentEditingType,
            description: document.getElementById('editName').value,
            category: document.getElementById('editCategory').value,
            amount: parseFloat(document.getElementById('editAmount').value),
            date: document.getElementById('editDate').value,
            timestamp: transactions[currentEditingIndex].timestamp
        };
        
        if (transactions[currentEditingIndex].firebaseId) {
            updatedTransaction.firebaseId = transactions[currentEditingIndex].firebaseId;
        }
        
        updateTransaction(currentEditingIndex, updatedTransaction);
        document.getElementById('editForm').reset();
        closeModal('editModal');
    });
}

// ======================
// GESTION DES TRANSACTIONS
// ======================
let transactions = [];
let selectedMonth = null; // Format: "YYYY-MM"
let activeFilters = {
    search: '',
    categories: []
};

// État du tri
let currentSort = {
    field: null,
    direction: 'asc' // 'asc' ou 'desc'
};

function getSelectedMonth() {
    return selectedMonth || new Date().toISOString().slice(0, 7);
}

async function addTransaction(transaction) {
    transactions.push(transaction);
    
    if (db) {
        try {
            await db.collection('transactions').add(transaction);
            console.log('Transaction ajoutée à Firebase');
        } catch (error) {
            console.error('Erreur lors de l\'ajout à Firebase:', error);
        }
    } else {
        // Sauvegarde locale
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    updateDashboard();
}

async function deleteTransaction(index) {
    const transaction = transactions[index];

    const confirmed = window.confirm(`Voulez-vous vraiment supprimer cette transaction : "${transaction.description}" (${formatCurrency(transaction.amount)}) ?`);
    if (!confirmed) return;

    transactions.splice(index, 1);
    
    if (db && transaction.firebaseId) {
        try {
            await db.collection('transactions').doc(transaction.firebaseId).delete();
            console.log('Transaction supprimée de Firebase');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    } else {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    updateDashboard();
}

async function updateTransaction(index, updatedTransaction) {
    const oldTransaction = transactions[index];
    transactions[index] = updatedTransaction;
    
    if (db && oldTransaction.firebaseId) {
        try {
            await db.collection('transactions').doc(oldTransaction.firebaseId).update(updatedTransaction);
            console.log('Transaction mise à jour sur Firebase');
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
        }
    } else {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    updateDashboard();
}

function openEditModal(index) {
    const transaction = transactions[index];
    currentEditingIndex = index;
    currentEditingType = transaction.type;
    
    // Mettre à jour le titre et les catégories
    const titleEl = document.getElementById('editTitle');
    const categorySelect = document.getElementById('editCategory');
    
    if (transaction.type === 'expense') {
        titleEl.textContent = 'Modifier une Dépense';
        categorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>';
        expenseCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    } else {
        titleEl.textContent = 'Modifier une Recette';
        categorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>';
        incomeCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }
    
    // Pré-remplir les champs
    document.getElementById('editName').value = transaction.description;
    document.getElementById('editCategory').value = transaction.category;
    document.getElementById('editAmount').value = transaction.amount;
    document.getElementById('editDate').value = transaction.date;
    
    openModal('editModal');
}

async function loadTransactionsFromFirebase() {
    try {
        const querySnapshot = await db.collection('transactions').get();
        transactions = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.firebaseId = doc.id;
            transactions.push(data);
        });
        console.log(`${transactions.length} transactions chargées depuis Firebase`);
        updateDashboard();
    } catch (error) {
        console.error('Erreur lors de la récupération:', error);
        if (error.code === 'permission-denied') {
            console.warn('Permissions insuffisantes pour accéder à Firebase. Basculement en mode local.');
            useLocalStorage();
        }
    }
}

function loadTransactionsFromLocal() {
    const stored = localStorage.getItem('transactions');
    transactions = stored ? JSON.parse(stored) : [];
}

// ======================
// MISE À JOUR DU DASHBOARD
// ======================
function updateDashboard() {
    updateSummary();
    updateTransactionsTable();
    updateCharts();
}

function getTransactionsForMonth(month) {
    return transactions.filter(t => {
        return t.date.startsWith(month);
    });
}

function applyFilters(transactionsList) {
    return transactionsList.filter(t => {
        // Filtre recherche
        if (activeFilters.search) {
            const search = activeFilters.search.toLowerCase();
            const matchSearch = t.description.toLowerCase().includes(search) || 
                              t.category.toLowerCase().includes(search);
            if (!matchSearch) return false;
        }

        // Filtre catégories
        if (activeFilters.categories.length > 0) {
            if (!activeFilters.categories.includes(t.category)) return false;
        }

        return true;
    });
}

function updateSummary() {
    const month = getSelectedMonth();
    const monthTransactions = getTransactionsForMonth(month);
    const filteredTransactions = applyFilters(monthTransactions);
    
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;

    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);
    document.getElementById('totalBalance').textContent = formatCurrency(balance);

    // Couleur dynamique du solde
    const balanceElement = document.getElementById('totalBalance');
    const balanceCard = balanceElement.closest('.summary-card');
    
    if (balance < 0) {
        balanceCard.style.borderLeftColor = '#ef4444';
        balanceElement.style.color = '#ef4444';
    } else if (balance > 0) {
        balanceCard.style.borderLeftColor = '#10b981';
        balanceElement.style.color = '#10b981';
    } else {
        balanceCard.style.borderLeftColor = '#3b82f6';
        balanceElement.style.color = '#111827';
    }
}

function updateTransactionsTable() {
    const tableBody = document.getElementById('transactionsBody');
    const countElement = document.getElementById('transactionCount');
    const month = getSelectedMonth();
    
    const monthTransactions = getTransactionsForMonth(month);
    const filteredTransactions = applyFilters(monthTransactions);

    if (filteredTransactions.length === 0) {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="6">Aucune transaction pour ce mois.</td></tr>';
        countElement.textContent = '0 transactions';
        return;
    }

    // Appliquer le tri personnalisé
    const sorted = sortTransactions(filteredTransactions);

    let html = '';
    sorted.forEach((transaction, index) => {
        const originalIndex = transactions.indexOf(transaction);
        const icon = categoryIcons[transaction.category] || 'fa-ellipsis-h';
        const formattedDate = formatDate(transaction.date);
        const formattedAmount = formatCurrency(transaction.amount);
        const typeClass = transaction.type === 'income' ? 'income' : 'expense';
        const typeLabel = transaction.type === 'income' ? 'Recette' : 'Dépense';

        html += `
            <tr>
                <td>${formattedDate}</td>
                <td><strong>${transaction.description}</strong></td>
                <td>
                    <i class="fas ${icon}" style="margin-right: 0.5rem;"></i>
                    ${transaction.category}
                </td>
                <td class="transaction-amount ${typeClass}">${formattedAmount}</td>
                <td><span class="transaction-type ${typeClass}">${typeLabel}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="openEditModal(${originalIndex})">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="btn-delete" onclick="deleteTransaction(${originalIndex})">
                            <i class="fas fa-trash-alt"></i> Supprimer
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
    countElement.textContent = `${filteredTransactions.length} transaction${filteredTransactions.length > 1 ? 's' : ''}`;
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

// ======================
// GESTION DES FILTRES
// ======================
function initializeCategoryFilter() {
    const filterContainer = document.getElementById('categoryFilter');
    const allCategories = [...expenseCategories, ...incomeCategories];
    const uniqueCategories = [...new Set(allCategories)];

    filterContainer.innerHTML = uniqueCategories.map(cat => `
        <div class="filter-checkbox">
            <input type="checkbox" id="cat-${cat}" value="${cat}" class="category-checkbox">
            <label for="cat-${cat}">
                <i class="fas ${categoryIcons[cat] || 'fa-tag'}"></i> ${cat}
            </label>
        </div>
    `).join('');

    document.querySelectorAll('.category-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateFilters);
    });
}

function setupFilterListeners() {
    // Recherche
    document.getElementById('searchFilter').addEventListener('input', updateFilters);

    // Toggle filtres
    document.getElementById('toggleFiltersBtn').addEventListener('click', () => {
        const panel = document.getElementById('filtersPanel');
        panel.classList.toggle('active');
    });

    // Réinitialiser filtres
    document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);

    // Event listeners pour le tri
    document.querySelectorAll('.sort-header').forEach(button => {
        button.addEventListener('click', (e) => {
            const sortField = e.currentTarget.dataset.sort;
            handleSort(sortField);
        });
    });
}

function handleSort(field) {
    // Si on clique sur le même champ, inverser la direction
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // Sinon, passer au nouveau champ en order ascendant
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    
    // Mettre à jour les visuels des boutons
    updateSortButtonsUI();
    
    // Mettre à jour le tableau
    updateDashboard();
}

function updateSortButtonsUI() {
    document.querySelectorAll('.sort-header').forEach(button => {
        button.classList.remove('active-up', 'active-down');
        
        if (button.dataset.sort === currentSort.field) {
            if (currentSort.direction === 'asc') {
                button.classList.add('active-up');
            } else {
                button.classList.add('active-down');
            }
        }
    });
}

function sortTransactions(transactionsList) {
    if (!currentSort.field) return transactionsList;
    
    const sorted = [...transactionsList].sort((a, b) => {
        let valueA = a[currentSort.field];
        let valueB = b[currentSort.field];
        
        // Gestion des différents types de données
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
            return currentSort.direction === 'asc' 
                ? valueA.localeCompare(valueB)
                : valueB.localeCompare(valueA);
        } else if (typeof valueA === 'number') {
            return currentSort.direction === 'asc'
                ? valueA - valueB
                : valueB - valueA;
        }
        
        return 0;
    });
    
    return sorted;
}


function updateFilters() {
    activeFilters.search = document.getElementById('searchFilter').value;

    activeFilters.categories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
        .map(checkbox => checkbox.value);

    updateDashboard();
}

function resetFilters() {
    document.getElementById('searchFilter').value = '';
    document.querySelectorAll('.category-checkbox').forEach(cb => cb.checked = false);

    activeFilters = {
        search: '',
        categories: []
    };

    updateDashboard();
}

// ======================
// GESTION DES GRAPHIQUES
// ======================
function updateCharts() {
    updateExpensesChart();
    updateIncomeExpenseChart();
}

function updateExpensesChart() {
    const month = getSelectedMonth();
    const monthTransactions = getTransactionsForMonth(month);
    const filteredTransactions = applyFilters(monthTransactions);

    // Calculer les dépenses par catégorie
    const expensesByCategory = {};
    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);

    // Couleurs pour le pie chart
    const colors = [
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
        '#06b6d4', '#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899'
    ];

    const ctx = document.getElementById('expensesChart').getContext('2d');
    
    if (expensesChartInstance) {
        expensesChartInstance.data.labels = labels;
        expensesChartInstance.data.datasets[0].data = data;
        expensesChartInstance.data.datasets[0].backgroundColor = colors.slice(0, labels.length);
        expensesChartInstance.update();
    } else {
        expensesChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: "'Inter', sans-serif", size: 12 },
                            color: '#6b7280',
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: "'Inter', sans-serif", size: 12 },
                        bodyFont: { family: "'Inter', sans-serif", size: 12 },
                        callbacks: {
                            label: function(context) {
                                return formatCurrency(context.parsed);
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateIncomeExpenseChart() {
    // Récupérer les 12 derniers mois
    const months = [];
    const incomeData = [];
    const expenseData = [];

    const today = new Date();
    for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        // Créer monthKey au format YYYY-MM sans utiliser toISOString() pour éviter les décalages de fuseau horaire
        const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        months.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));

        const monthTransactions = transactions.filter(t => t.date.startsWith(monthKey));
        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        incomeData.push(income);
        expenseData.push(expense);
    }

    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    
    if (incomeExpenseChartInstance) {
        incomeExpenseChartInstance.data.labels = months;
        incomeExpenseChartInstance.data.datasets[0].data = incomeData;
        incomeExpenseChartInstance.data.datasets[1].data = expenseData;
        incomeExpenseChartInstance.update();
    } else {
        incomeExpenseChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Revenus',
                        data: incomeData,
                        backgroundColor: '#10b981',
                        borderRadius: 4,
                        borderSkipped: false
                    },
                    {
                        label: 'Dépenses',
                        data: expenseData,
                        backgroundColor: '#ef4444',
                        borderRadius: 4,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'x',
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: "'Inter', sans-serif", size: 12 },
                            color: '#6b7280',
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { family: "'Inter', sans-serif", size: 12 },
                        bodyFont: { family: "'Inter', sans-serif", size: 12 },
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: { family: "'Inter', sans-serif", size: 12 },
                            color: '#9ca3af',
                            callback: function(value) {
                                return '€' + (value / 1000).toFixed(0) + 'k';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            font: { family: "'Inter', sans-serif", size: 12 },
                            color: '#9ca3af'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// ======================
// INITIALISATION AU CHARGEMENT
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    // Initialiser le thème
    initializeTheme();
    
    // Charger les transactions locales d'abord
    loadTransactionsFromLocal();
    
    // Initialiser Firebase
    await initializeFirebase();
    
    // Configuration des modales et formulaires
    setupModalListeners();
    setupFormListeners();
    
    // Initialiser les filtres
    initializeCategoryFilter();
    setupFilterListeners();

    // Mise à jour initiale du dashboard
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    selectedMonth = currentMonth;
    document.getElementById('monthFilter').value = currentMonth;
    
    updateDashboard();

    // Ajouter les valeurs par défaut aux champs de date
    const todayStr = today.toISOString().split('T')[0];
    document.getElementById('expenseDate').value = todayStr;
    document.getElementById('incomeDate').value = todayStr;
    
    // Listener pour le changement de mois
    document.getElementById('monthFilter').addEventListener('change', (e) => {
        selectedMonth = e.target.value;
        updateDashboard();
    });
});

// Sauvegarder automatiquement les transactions locales quand elles changent
window.addEventListener('beforeunload', () => {
    if (!db) {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
});
