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
}

// ======================
// GESTION DES TRANSACTIONS
// ======================
let transactions = [];

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
}

function updateSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
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

    if (transactions.length === 0) {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="6">Aucune transaction. Commencez par ajouter une recette ou une dépense.</td></tr>';
        countElement.textContent = '0 transactions';
        return;
    }

    // Trier les transactions par date (plus récentes d'abord)
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

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
                    <button class="btn-delete" onclick="deleteTransaction(${originalIndex})">
                        <i class="fas fa-trash-alt"></i> Supprimer
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
    countElement.textContent = `${transactions.length} transaction${transactions.length > 1 ? 's' : ''}`;
}

// ======================
// FONCTIONS UTILITAIRES
// ======================
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
// INITIALISATION AU CHARGEMENT
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    // Charger les transactions locales d'abord
    loadTransactionsFromLocal();
    
    // Initialiser Firebase
    await initializeFirebase();
    
    // Configuration des modales et formulaires
    setupModalListeners();
    setupFormListeners();
    
    // Mise à jour initiale du dashboard
    updateDashboard();

    // Ajouter les valeurs par défaut aux champs de date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
    document.getElementById('incomeDate').value = today;
});

// Sauvegarder automatiquement les transactions locales quand elles changent
window.addEventListener('beforeunload', () => {
    if (!db) {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
});
