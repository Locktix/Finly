// ======================
// TOAST NOTIFICATIONS SYSTEM
// ======================
const Toast = {
    show(type, title, message, duration = 4000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = '';
        switch(type) {
            case 'success':
                icon = '<i class="fas fa-check-circle toast-icon"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle toast-icon"></i>';
                break;
            case 'info':
                icon = '<i class="fas fa-info-circle toast-icon"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-warning toast-icon"></i>';
                break;
            case 'loading':
                icon = '<div class="toast-spinner"></div>';
                break;
        }

        toast.innerHTML = `
            ${icon}
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close">&times;</button>
        `;

        container.appendChild(toast);

        // Close button listener
        toast.querySelector('.toast-close').addEventListener('click', () => {
            removeToast(toast);
        });

        // Auto-remove after duration (skip if loading)
        if (type !== 'loading' && duration > 0) {
            setTimeout(() => {
                removeToast(toast);
            }, duration);
        }

        return toast;
    },

    success(title, message = '', duration = 3000) {
        return this.show('success', title, message, duration);
    },

    error(title, message = '', duration = 4000) {
        return this.show('error', title, message, duration);
    },

    info(title, message = '', duration = 3000) {
        return this.show('info', title, message, duration);
    },

    warning(title, message = '', duration = 3500) {
        return this.show('warning', title, message, duration);
    },

    loading(title, message = '') {
        return this.show('loading', title, message, 0);
    }
};

function removeToast(toastElement) {
    toastElement.classList.add('fade-out');
    setTimeout(() => {
        toastElement.remove();
    }, 300);
}

// ======================
// LOADING SPINNERS
// ======================
function showSpinner(buttonEl, originalText = '') {
    buttonEl.disabled = true;
    buttonEl.dataset.originalText = originalText || buttonEl.innerHTML;
    buttonEl.innerHTML = '<span class="toast-spinner"></span> Chargement...';
}

function hideSpinner(buttonEl) {
    buttonEl.disabled = false;
    buttonEl.innerHTML = buttonEl.dataset.originalText || 'Soumettre';
}

// ======================
// SYNC STATUS INDICATOR
// ======================
let lastSyncTime = null;
let syncTimeout = null;

function updateSyncStatus(status = 'synced', message = '') {
    const indicator = document.getElementById('syncIndicator');
    const syncText = document.getElementById('syncText');

    if (!indicator) return;

    indicator.classList.remove('syncing', 'error');

    switch(status) {
        case 'syncing':
            indicator.classList.add('syncing');
            syncText.textContent = 'Synchronisation...';
            break;
        case 'synced':
            lastSyncTime = new Date();
            syncText.textContent = 'Synchronisé';
            indicator.classList.remove('syncing', 'error');
            break;
        case 'error':
            indicator.classList.add('error');
            syncText.textContent = message || 'Erreur de sync';
            break;
        case 'offline':
            indicator.classList.add('error');
            syncText.textContent = 'Mode hors ligne';
            break;
    }

    // Auto-reset le statut après 3s
    if (status === 'synced') {
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            syncText.textContent = 'Synchronisé';
            indicator.classList.remove('syncing', 'error');
        }, 3000);
    }
}

// ======================
// GESTION DE L'AUTHENTIFICATION
// ======================
let currentUser = null;
let currentUserRole = 'membre';
const ADMIN_UID = '6aqDFLL8obNSdUKoAmdnm9kgMEg2';
const ROLE_OPTIONS = ['Administrateur', 'testeur', 'membre'];
let adminUsersCache = [];
let testerOutputBuffer = [];

function setupAuthListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('toggleAuthBtn').addEventListener('click', toggleAuthForm);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Event listeners pour les modales d'authentification
    document.getElementById('forgotPasswordBtn').addEventListener('click', () => {
        openModal('forgotPasswordModal');
    });

    document.getElementById('closeForgotPassword').addEventListener('click', () => {
        closeModal('forgotPasswordModal');
    });

    document.getElementById('forgotPasswordForm').addEventListener('submit', handleForgotPassword);
}

function toggleAuthForm() {
    document.getElementById('loginForm').classList.toggle('active');
    document.getElementById('signupForm').classList.toggle('active');
    
    const toggleBtn = document.getElementById('toggleAuthBtn');
    const toggleText = document.getElementById('toggleText');
    
    if (document.getElementById('loginForm').classList.contains('active')) {
        toggleText.innerHTML = 'Pas encore de compte? <button type="button" id="toggleAuthBtn" class="toggle-btn">S\'inscrire</button>';
    } else {
        toggleText.innerHTML = 'Vous avez un compte? <button type="button" id="toggleAuthBtn" class="toggle-btn">Se connecter</button>';
    }
    
    document.getElementById('toggleAuthBtn').addEventListener('click', toggleAuthForm);
    clearAuthErrors();
}

function clearAuthErrors() {
    document.getElementById('loginError').textContent = '';
    document.getElementById('signupError').textContent = '';
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('signupError').classList.remove('show');
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const button = e.target.querySelector('button[type="submit"]');
    const errorEl = document.getElementById('loginError');

    showSpinner(button, button.textContent);

    try {
        errorEl.classList.remove('show');
        const result = await firebase.auth().signInWithEmailAndPassword(email, password);
        currentUser = result.user;
        Toast.success('Bienvenue !', `Heureux de vous revoir, ${currentUser.displayName || 'utilisateur'}`);
        hideSpinner(button);
        setTimeout(() => showDashboard(), 500);
    } catch (error) {
        const message = getErrorMessage(error.code);
        Toast.error('Erreur connexion', message);
        errorEl.textContent = message;
        errorEl.classList.add('show');
        hideSpinner(button);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const button = e.target.querySelector('button[type="submit"]');
    const errorEl = document.getElementById('signupError');

    try {
        errorEl.classList.remove('show');

        if (password !== confirmPassword) {
            Toast.warning('Erreur', 'Les mots de passe ne correspondent pas');
            errorEl.textContent = 'Les mots de passe ne correspondent pas';
            errorEl.classList.add('show');
            return;
        }

        if (password.length < 6) {
            Toast.warning('Mot de passe faible', 'Au moins 6 caractères requis');
            errorEl.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
            errorEl.classList.add('show');
            return;
        }

        showSpinner(button, button.textContent);

        const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
        currentUser = result.user;

        // Mettre à jour le profil avec le nom
        await currentUser.updateProfile({
            displayName: name
        });

        await ensureUserProfile(currentUser);
        await loadUserRole(currentUser);

        Toast.success('Inscription réussie !', `Bienvenue ${name} !`);
        hideSpinner(button);
        setTimeout(() => showDashboard(), 500);
    } catch (error) {
        const message = getErrorMessage(error.code);
        Toast.error('Erreur inscription', message);
        errorEl.textContent = message;
        errorEl.classList.add('show');
        if (button) hideSpinner(button);
    }
}

async function handleLogout() {
    try {
        await firebase.auth().signOut();
        currentUser = null;
        currentUserRole = 'membre';
        const adminBtn = document.getElementById('adminPanelBtn');
        const testerBtn = document.getElementById('testerPanelBtn');
        const profileAdminSection = document.getElementById('profileAdminSection');
        
        if (adminBtn) adminBtn.style.display = 'none';
        if (testerBtn) testerBtn.style.display = 'none';
        if (profileAdminSection) profileAdminSection.style.display = 'none';
        
        transactions = []; // Vider les transactions
        Toast.info('Déconnexion', 'À bientôt !');
        showAuthPage();
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
        Toast.error('Erreur', 'Impossible de se déconnecter');
    }
}

function getErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'Cet email est déjà utilisé',
        'auth/invalid-email': 'Adresse email invalide',
        'auth/operation-not-allowed': 'Opération non autorisée',
        'auth/weak-password': 'Le mot de passe est trop faible',
        'auth/user-not-found': 'Utilisateur non trouvé',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/invalid-credential': 'Email ou mot de passe incorrect',
    };
    return messages[code] || 'Une erreur est survenue. Réessayez.';
}

// ======================
// GESTION MOT DE PASSE OUBLIÉ
// ======================
async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotPasswordEmail').value;
    const errorEl = document.getElementById('forgotPasswordError');
    const successEl = document.getElementById('forgotPasswordSuccess');
    
    try {
        errorEl.textContent = '';
        successEl.style.display = 'none';
        
        await firebase.auth().sendPasswordResetEmail(email);
        
        successEl.textContent = 'Email de réinitialisation envoyé. Vérifiez votre boîte mail.';
        successEl.style.display = 'block';
        
        // Vider le formulaire
        document.getElementById('forgotPasswordEmail').value = '';
        
        // Fermer la modale après 3 secondes
        setTimeout(() => {
            closeModal('forgotPasswordModal');
            successEl.style.display = 'none';
        }, 3000);
    } catch (error) {
        errorEl.textContent = getErrorMessage(error.code);
        errorEl.classList.add('show');
    }
}

// ======================
// GESTION PROFIL UTILISATEUR
// ======================
async function loadProfileData() {
    if (currentUser) {
        const roleField = document.getElementById('profileRole');
        if (roleField) {
            roleField.value = currentUserRole || 'membre';
        }
        document.getElementById('profileName').value = currentUser.displayName || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
        document.getElementById('profilePassword').value = '';
        document.getElementById('profileError').textContent = '';
        document.getElementById('profileSuccess').style.display = 'none';
        
        // Charger la date de création depuis Firestore
        if (db) {
            try {
                const userDoc = await db.collection('users').doc(currentUser.uid).get();
                if (userDoc.exists && userDoc.data().createdAt) {
                    const createdAt = new Date(userDoc.data().createdAt);
                    const formattedDate = createdAt.toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    document.getElementById('profileCreatedAt').value = formattedDate;
                } else {
                    document.getElementById('profileCreatedAt').value = 'Non disponible';
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la date de création:', error);
                document.getElementById('profileCreatedAt').value = 'N/A';
            }
        } else {
            document.getElementById('profileCreatedAt').value = 'N/A';
        }
    }
}

async function ensureUserProfile(user) {
    if (!db || !user) return;

    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();
    const isAdmin = user.uid === ADMIN_UID;
    const desiredRole = isAdmin ? 'Administrateur' : 'membre';
    
    // Utiliser la vraie date de création du compte Firebase
    const createdAt = user.metadata?.creationTime || new Date().toISOString();

    if (!doc.exists) {
        await userRef.set({
            email: user.email || '',
            displayName: user.displayName || '',
            role: desiredRole,
            createdAt: createdAt
        });
        return;
    }

    const data = doc.data() || {};
    const updates = {};

    if (!data.role) {
        updates.role = desiredRole;
    }

    if (isAdmin && data.role !== 'Administrateur') {
        updates.role = 'Administrateur';
    }

    if (user.email && data.email !== user.email) {
        updates.email = user.email;
    }

    if (user.displayName && data.displayName !== user.displayName) {
        updates.displayName = user.displayName;
    }
    
    // Ajouter createdAt pour les documents existants qui ne l'ont pas
    if (!data.createdAt) {
        updates.createdAt = createdAt;
    }

    if (Object.keys(updates).length > 0) {
        await userRef.update(updates);
    }
}

async function loadUserRole(user) {
    const adminBtn = document.getElementById('adminPanelBtn');
    const testerBtn = document.getElementById('testerPanelBtn');
    const profileAdminSection = document.getElementById('profileAdminSection');
    
    if (!user) {
        currentUserRole = 'membre';
        if (adminBtn) adminBtn.style.display = 'none';
        if (testerBtn) testerBtn.style.display = 'none';
        if (profileAdminSection) profileAdminSection.style.display = 'none';
        const roleField = document.getElementById('profileRole');
        if (roleField) {
            roleField.value = 'membre';
        }
        return;
    }

    if (!db) {
        currentUserRole = user.uid === ADMIN_UID ? 'Administrateur' : 'membre';
        if (adminBtn) adminBtn.style.display = currentUserRole === 'Administrateur' ? 'flex' : 'none';
        if (testerBtn) testerBtn.style.display = 'none';
        if (profileAdminSection) profileAdminSection.style.display = (currentUserRole === 'Administrateur') ? 'block' : 'none';
        const roleField = document.getElementById('profileRole');
        if (roleField) {
            roleField.value = currentUserRole || 'membre';
        }
        return;
    }

    try {
        const doc = await db.collection('users').doc(user.uid).get();
        const role = doc.exists && doc.data().role ? doc.data().role : (user.uid === ADMIN_UID ? 'Administrateur' : 'membre');
        currentUserRole = role;
        if (adminBtn) adminBtn.style.display = currentUserRole === 'Administrateur' ? 'flex' : 'none';
        if (testerBtn) testerBtn.style.display = (currentUserRole === 'Administrateur' || currentUserRole === 'testeur') ? 'flex' : 'none';
        if (profileAdminSection) profileAdminSection.style.display = (currentUserRole === 'Administrateur' || currentUserRole === 'testeur') ? 'block' : 'none';
        const roleField = document.getElementById('profileRole');
        if (roleField) {
            roleField.value = currentUserRole || 'membre';
        }
    } catch (error) {
        console.error('Erreur chargement role:', error);
        currentUserRole = user.uid === ADMIN_UID ? 'Administrateur' : 'membre';
        if (adminBtn) adminBtn.style.display = currentUserRole === 'Administrateur' ? 'flex' : 'none';
        if (testerBtn) testerBtn.style.display = 'none';
        if (profileAdminSection) profileAdminSection.style.display = (currentUserRole === 'Administrateur') ? 'block' : 'none';
        const roleField = document.getElementById('profileRole');
        if (roleField) {
            roleField.value = currentUserRole || 'membre';
        }
    }
}

async function loadAdminUsers() {
    const container = document.getElementById('adminUsersList');
    if (!container) return;

    if (!db) {
        container.innerHTML = '<p class="config-text">Firestore indisponible.</p>';
        return;
    }

    container.innerHTML = '<p class="config-text">Chargement des utilisateurs...</p>';

    try {
        const snapshot = await db.collection('users').get();
        if (snapshot.empty) {
            adminUsersCache = [];
            renderAdminUsers();
            return;
        }

        const users = [];
        snapshot.forEach(doc => {
            const data = doc.data() || {};
            const uid = doc.id;
            const name = data.displayName || 'Sans nom';
            const email = data.email || 'Sans email';
            const role = data.role || 'membre';

            users.push({ uid, name, email, role });
        });

        adminUsersCache = users;
        renderAdminUsers();

        container.querySelectorAll('.admin-role-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const target = e.target;
                const uid = target.getAttribute('data-uid');
                const newRole = target.value;

                if (!uid || !newRole) return;

                try {
                    await db.collection('users').doc(uid).update({ role: newRole });
                    if (uid === currentUser.uid) {
                        currentUserRole = newRole;
                        await loadProfileData();
                        const adminBtn = document.getElementById('adminPanelBtn');
                        const testerBtn = document.getElementById('testerPanelBtn');
                        const profileAdminSection = document.getElementById('profileAdminSection');
                        
                        if (adminBtn) {
                            adminBtn.style.display = currentUserRole === 'Administrateur' ? 'flex' : 'none';
                        }
                        if (testerBtn) {
                            testerBtn.style.display = (currentUserRole === 'Administrateur' || currentUserRole === 'testeur') ? 'flex' : 'none';
                        }
                        if (profileAdminSection) {
                            profileAdminSection.style.display = (currentUserRole === 'Administrateur' || currentUserRole === 'testeur') ? 'block' : 'none';
                        }
                    }
                    Toast.success('Rôle mis à jour', `${newRole}`);
                } catch (error) {
                    console.error('Erreur mise à jour role:', error);
                    Toast.error('Erreur', 'Impossible de mettre à jour le rôle');
                    await loadAdminUsers();
                }
            });
        });
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
        const isPermission = error && error.code === 'permission-denied';
        container.innerHTML = isPermission
            ? '<p class="config-text">Permissions insuffisantes. Mettez à jour les règles Firestore.</p>'
            : '<p class="config-text">Erreur lors du chargement.</p>';
    }
}

function renderAdminUsers() {
    const container = document.getElementById('adminUsersList');
    if (!container) return;

    const searchInput = document.getElementById('adminUserSearch');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const filtered = adminUsersCache.filter(user => {
        if (!query) return true;
        const haystack = `${user.name} ${user.email} ${user.uid} ${user.role}`.toLowerCase();
        return haystack.includes(query);
    });

    if (filtered.length === 0) {
        container.innerHTML = '<p class="admin-users-empty">Aucun utilisateur correspondant.</p>';
        return;
    }

    const rows = filtered.map(user => {
        const options = ROLE_OPTIONS
            .map(option => `<option value="${option}" ${option === user.role ? 'selected' : ''}>${option}</option>`)
            .join('');

        return `
            <div class="admin-user-row">
                <div class="admin-user-main">
                    <div class="admin-user-name">${user.name}</div>
                    <div class="admin-user-email">${user.email}</div>
                    <div class="admin-user-uid">UID: ${user.uid}</div>
                </div>
                <select class="admin-role-select" data-uid="${user.uid}">
                    ${options}
                </select>
            </div>
        `;
    });

    container.innerHTML = rows.join('');
}

function logToTester(message) {
    testerOutputBuffer.push(message);
    const output = document.getElementById('testerOutput');
    if (output) {
        output.classList.add('active');
        output.textContent = testerOutputBuffer.join('\n');
        output.scrollTop = output.scrollHeight;
    }
}

async function addFakeData() {
    const fakeTransactions = [
        // Dépenses
        { type: 'expense', description: 'Carrefour Courses', category: 'Magasins', amount: 127.50, daysAgo: 45 },
        { type: 'expense', description: 'SNCF Ticket Train', category: 'Transport', amount: 89.00, daysAgo: 42 },
        { type: 'expense', description: 'Pharmacie Prescription', category: 'Santé', amount: 34.20, daysAgo: 38 },
        { type: 'expense', description: 'Netflix Abonnement', category: 'Services', amount: 15.99, daysAgo: 35 },
        { type: 'expense', description: 'Pizza Restaurant', category: 'Restaurants', amount: 28.50, daysAgo: 32 },
        { type: 'expense', description: 'Carrefour Courses', category: 'Magasins', amount: 95.30, daysAgo: 30 },
        { type: 'expense', description: 'Cinema Tickets', category: 'Loisirs', amount: 22.00, daysAgo: 28 },
        { type: 'expense', description: 'Assurance Auto', category: 'Assurances', amount: 210.00, daysAgo: 25 },
        { type: 'expense', description: 'Essence Station', category: 'Transport', amount: 65.00, daysAgo: 22 },
        { type: 'expense', description: 'Restaurant Sushi', category: 'Restaurants', amount: 42.80, daysAgo: 20 },
        { type: 'expense', description: 'Monoprix Provisions', category: 'Magasins', amount: 58.90, daysAgo: 18 },
        { type: 'expense', description: 'Réparation Voiture', category: 'Services', amount: 350.00, daysAgo: 15 },
        { type: 'expense', description: 'Steam Jeux Video', category: 'Loisirs', amount: 19.99, daysAgo: 12 },
        { type: 'expense', description: 'Starbucks Coffee', category: 'Restaurants', amount: 6.50, daysAgo: 10 },
        { type: 'expense', description: 'Carrefour Courses', category: 'Magasins', amount: 112.45, daysAgo: 8 },
        { type: 'expense', description: 'Mutuelle Santé', category: 'Assurances', amount: 45.00, daysAgo: 5 },
        { type: 'expense', description: 'Boulangerie Pain', category: 'Restaurants', amount: 4.30, daysAgo: 3 },
        { type: 'expense', description: 'Auchan Courses', category: 'Magasins', amount: 88.70, daysAgo: 1 },

        // Revenus
        { type: 'income', description: 'Salaire Janvier', category: 'Salaire', amount: 2500.00, daysAgo: 44 },
        { type: 'income', description: 'Bonus Entreprise', category: 'Revenus', amount: 500.00, daysAgo: 40 },
        { type: 'income', description: 'Salaire Février', category: 'Salaire', amount: 2500.00, daysAgo: 18 },
        { type: 'income', description: 'Remboursement Ami', category: 'Revenus', amount: 50.00, daysAgo: 6 }
    ];

    // Ajouter les transactions avec les dates correctes
    for (const fakeData of fakeTransactions) {
        const date = new Date();
        date.setDate(date.getDate() - fakeData.daysAgo);
        const dateString = date.toISOString().split('T')[0];

        const transaction = {
            type: fakeData.type,
            description: fakeData.description,
            category: fakeData.category,
            amount: fakeData.amount,
            date: dateString,
            timestamp: date.toISOString()
        };

        transactions.push(transaction);

        if (db && currentUser) {
            try {
                await db.collection('users').doc(currentUser.uid).collection('transactions').add(transaction);
            } catch (error) {
                console.error('Erreur lors de l\'ajout de fausse donnée:', error);
            }
        }
    }

    // Sauvegarder localement si pas de Firestore
    if (!db) {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    updateDashboard();
}

async function clearAllTransactions() {
    if (!currentUser) {
        Toast.error('Erreur', 'Aucun utilisateur connecté');
        return;
    }

    if (db) {
        try {
            const snapshot = await db.collection('users').doc(currentUser.uid).collection('transactions').get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            logToTester('[Test Data] All transactions deleted from Firestore');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            Toast.error('Erreur', 'Impossible de supprimer les transactions');
        }
    } else {
        localStorage.removeItem('transactions');
        logToTester('[Test Data] All transactions deleted from localStorage');
    }

    transactions = [];
    updateDashboard();
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const name = document.getElementById('profileName').value;
    const password = document.getElementById('profilePassword').value;
    const errorEl = document.getElementById('profileError');
    const successEl = document.getElementById('profileSuccess');
    
    try {
        errorEl.textContent = '';
        successEl.style.display = 'none';
        
        let updatesMade = false;
        
        // Mettre à jour le nom si modifié
        if (name && name !== currentUser.displayName) {
            await currentUser.updateProfile({
                displayName: name
            });
            updatesMade = true;
        }
        
        // Mettre à jour le mot de passe si fourni
        if (password && password.length >= 6) {
            await currentUser.updatePassword(password);
            updatesMade = true;
        } else if (password && password.length < 6) {
            errorEl.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
            errorEl.classList.add('show');
            return;
        }
        
        if (updatesMade) {
            Toast.success('Profil mis à jour', 'Vos modifications ont été sauvegardées');
            successEl.textContent = 'Profil mis à jour avec succès';
            successEl.style.display = 'block';

            // Vider le champ mot de passe
            document.getElementById('profilePassword').value = '';

            // Fermer la modale après 2 secondes
            setTimeout(() => {
                closeModal('profileModal');
                successEl.style.display = 'none';
            }, 2000);
        } else {
            Toast.warning('Aucune modification', 'Entrez au moins un champ à modifier');
            errorEl.textContent = 'Aucune modification à appliquer';
            errorEl.classList.add('show');
        }
    } catch (error) {
        const message = getErrorMessage(error.code);
        Toast.error('Erreur', message);
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

function showAuthPage() {
    document.getElementById('authPage').style.display = 'flex';
    document.getElementById('mainHeader').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'none';
    document.getElementById('mainFooter').style.display = 'none';
    document.getElementById('chartsSection').style.display = 'none';
}

function showDashboard() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('mainHeader').style.display = 'block';
    document.getElementById('mainContainer').style.display = 'block';
    document.getElementById('mainFooter').style.display = 'block';
    document.getElementById('chartsSection').style.display = 'block';

    // Afficher le mois courant
    updateMonthDisplay();

    // Charger les transactions de l'utilisateur
    if (db) {
        loadTransactionsFromFirebase();
    } else {
        loadTransactionsFromLocal();
        updateDashboard();
    }
}

function checkAuthState() {
    return new Promise((resolve) => {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                if (db) {
                    ensureUserProfile(currentUser)
                        .then(() => loadUserRole(currentUser))
                        .then(() => {
                            showDashboard();
                            resolve();
                        })
                        .catch((error) => {
                            console.error('Erreur initialisation role:', error);
                            showDashboard();
                            resolve();
                        });
                    return;
                }
                loadUserRole(currentUser);
                showDashboard();
            } else {
                showAuthPage();
            }
            resolve();
        });
    });
}

// ======================
// GESTION DU THÈME
// ======================

function initializeTheme() {
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

    const themeLabel = document.getElementById('themeLabel');
    if (themeLabel) {
        themeLabel.textContent = newTheme === 'dark' ? 'Mode Clair' : 'Mode Sombre';
    }

    // Mettre à jour le dashboard pour les couleurs dynamiques
    updateDashboard();
}

// ======================
// GESTION DU REGROUPEMENT TEMPOREL
// ======================

function initializeTimeGrouping() {
    // Charger la préférence de regroupement temporel sauvegardée
    const saved = localStorage.getItem('timeGroupingEnabled');
    timeGroupingEnabled = saved === null ? false : saved === 'true';
    updateTimeGroupingLabel();
}

function toggleTimeGrouping() {
    timeGroupingEnabled = !timeGroupingEnabled;
    localStorage.setItem('timeGroupingEnabled', timeGroupingEnabled);
    updateTimeGroupingLabel();
    updateDashboard();
}

function updateTimeGroupingLabel() {
    const label = document.getElementById('timeGroupingLabel');
    if (label) {
        label.textContent = timeGroupingEnabled ? 'Regroupement: Activé' : 'Regroupement: Désactivé';
    }
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
    'Abonnements': 'fa-file-invoice',
    'Factures': 'fa-file-invoice-dollar',
    'FastFood': 'fa-hamburger',
    'Salaire': 'fa-money-bill-wave',
    'Revenus': 'fa-chart-line',
    'Autres': 'fa-ellipsis-h'
};

const expenseCategories = ['Assurances', 'Magasins', 'Épargne', 'Loisirs', 'Transport', 'Santé', 'Restaurants', 'Services', 'Abonnements', 'Factures', 'FastFood', 'Autres'];
const incomeCategories = ['Salaire', 'Revenus', 'Épargne', 'Autres'];

let iconSelectListenersReady = false;

function getCategoryIcon(value) {
    return categoryIcons[value] || 'fa-tag';
}

function closeIconSelects(except = null) {
    document.querySelectorAll('.icon-select.open').forEach(container => {
        if (container === except) return;
        container.classList.remove('open');
        const trigger = container.querySelector('.icon-select-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}

function syncIconSelectValue(container, selectEl) {
    const valueEl = container.querySelector('.icon-select-value');
    const selectedOption = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
    if (!valueEl || !selectedOption) return;

    const iconClass = getCategoryIcon(selectedOption.value);
    valueEl.innerHTML = `<i class="fas ${iconClass}"></i><span>${selectedOption.textContent}</span>`;
    container.classList.toggle('is-placeholder', !selectedOption.value);
}

function handleIconSelectChange(event) {
    const selectEl = event.currentTarget;
    const container = selectEl.iconSelectContainer;
    if (!container) return;
    syncIconSelectValue(container, selectEl);
}

function buildIconSelect(container, selectEl) {
    if (!container || !selectEl) return;

    const existingTrigger = container.querySelector('.icon-select-trigger');
    const existingMenu = container.querySelector('.icon-select-menu');
    if (existingTrigger) existingTrigger.remove();
    if (existingMenu) existingMenu.remove();
    container.classList.remove('open');

    selectEl.iconSelectContainer = container;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'icon-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const valueEl = document.createElement('span');
    valueEl.className = 'icon-select-value';

    const caret = document.createElement('i');
    caret.className = 'fas fa-chevron-down';

    trigger.appendChild(valueEl);
    trigger.appendChild(caret);

    const menu = document.createElement('div');
    menu.className = 'icon-select-menu';
    menu.setAttribute('role', 'listbox');

    Array.from(selectEl.options).forEach(option => {
        const optionButton = document.createElement('button');
        optionButton.type = 'button';
        optionButton.className = 'icon-select-option';
        optionButton.setAttribute('role', 'option');
        optionButton.dataset.value = option.value;
        optionButton.innerHTML = `<i class="fas ${getCategoryIcon(option.value)}"></i><span>${option.textContent}</span>`;

        optionButton.addEventListener('click', (event) => {
            event.preventDefault();
            selectEl.value = option.value;
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            container.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        });

        menu.appendChild(optionButton);
    });

    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const isOpen = !container.classList.contains('open');
        closeIconSelects(container);
        container.classList.toggle('open', isOpen);
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    if (!selectEl.dataset.iconSelectBound) {
        selectEl.addEventListener('change', handleIconSelectChange);
        selectEl.dataset.iconSelectBound = 'true';
    }

    container.appendChild(trigger);
    container.appendChild(menu);

    syncIconSelectValue(container, selectEl);
}

function initializeIconSelects() {
    document.querySelectorAll('.icon-select').forEach(container => {
        const selectId = container.dataset.select;
        const selectEl = selectId ? document.getElementById(selectId) : null;
        if (!selectEl) return;
        buildIconSelect(container, selectEl);
    });

    if (!iconSelectListenersReady) {
        document.addEventListener('click', () => closeIconSelects());
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeIconSelects();
            }
        });
        iconSelectListenersReady = true;
    }
}

function refreshIconSelect(selectId) {
    const selectEl = document.getElementById(selectId);
    const container = document.querySelector(`.icon-select[data-select="${selectId}"]`);
    if (!selectEl || !container) return;
    buildIconSelect(container, selectEl);
}

function formatDateForExport(dateStr) {
    if (!dateStr) return '';
    return dateStr;
}

function formatDateToIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateValue(value) {
    if (!value) return null;

    if (value instanceof Date && !isNaN(value.getTime())) {
        return formatDateToIso(value);
    }

    if (typeof value === 'number') {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(excelEpoch.getTime() + value * 86400000);
        return formatDateToIso(date);
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
            const [day, month, year] = trimmed.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
            return formatDateToIso(parsed);
        }
    }

    return null;
}

function normalizeTransaction(row) {
    if (!row || typeof row !== 'object') return null;

    const normalized = {};
    Object.keys(row).forEach(key => {
        normalized[key.toLowerCase().trim()] = row[key];
    });

    const rawType = normalized.type || normalized['transaction type'] || normalized['type transaction'] || normalized['type de transaction'];
    const rawDescription = normalized.description || normalized.libelle || normalized['libellé'] || normalized.label;
    const rawCategory = normalized.category || normalized.categorie || normalized['catégorie'] || normalized.catégorie;
    const rawAmount = normalized.amount || normalized.montant;
    const rawDate = normalized.date || normalized['transaction date'] || normalized['date transaction'];
    const rawTimestamp = normalized.timestamp;

    const typeStr = typeof rawType === 'string' ? rawType.toLowerCase() : rawType;
    let type = null;
    if (typeStr === 'expense' || typeStr === 'depense' || typeStr === 'dépense' || typeStr === 'depenses' || typeStr === 'dépenses') {
        type = 'expense';
    } else if (typeStr === 'income' || typeStr === 'recette' || typeStr === 'revenu' || typeStr === 'revenus') {
        type = 'income';
    }

    if (!type || !rawDescription || !rawCategory || rawAmount === undefined || rawAmount === null || rawDate === undefined) {
        return null;
    }

    const amount = typeof rawAmount === 'number'
        ? rawAmount
        : parseFloat(String(rawAmount).replace(',', '.'));

    if (!Number.isFinite(amount)) return null;

    const date = parseDateValue(rawDate);
    if (!date) return null;

    const timestamp = rawTimestamp ? String(rawTimestamp) : new Date().toISOString();

    return {
        type,
        description: String(rawDescription).trim(),
        category: String(rawCategory).trim(),
        amount,
        date,
        timestamp
    };
}

function getExportRows() {
    return transactions.map(transaction => ({
        Type: transaction.type === 'expense' ? 'Depense' : 'Recette',
        Description: transaction.description,
        Categorie: transaction.category,
        Montant: transaction.amount,
        Date: formatDateForExport(transaction.date),
        Timestamp: transaction.timestamp || ''
    }));
}

function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportTransactionsJson() {
    if (!transactions.length) {
        Toast.warning('Aucune donnée', 'Rien à exporter pour le moment');
        return;
    }

    const payload = {
        exportedAt: new Date().toISOString(),
        transactions
    };

    downloadBlob(JSON.stringify(payload, null, 2), 'finly-transactions.json', 'application/json');
    Toast.success('Export JSON', 'Fichier JSON généré');
}

function exportTransactionsExcel() {
    if (!transactions.length) {
        Toast.warning('Aucune donnée', 'Rien à exporter pour le moment');
        return;
    }

    if (typeof XLSX === 'undefined') {
        Toast.error('Excel indisponible', 'La librairie XLSX n\'est pas chargée');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(getExportRows());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, 'finly-transactions.xlsx');
    Toast.success('Export Excel', 'Fichier Excel généré');
}

function readJsonFile(file) {
    return file.text().then(text => JSON.parse(text));
}

function readExcelFile(file) {
    if (typeof XLSX === 'undefined') {
        return Promise.reject(new Error('XLSX indisponible'));
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                resolve(rows);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function parseSemicolonCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        const next = line[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ';' && !inQuotes) {
            values.push(current);
            current = '';
            continue;
        }

        current += char;
    }

    values.push(current);
    return values;
}

function toFlatLower(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseIngAmount(value) {
    if (value === undefined || value === null) return null;
    const cleaned = String(value)
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    const amount = parseFloat(cleaned);
    return Number.isFinite(amount) ? amount : null;
}

function inferIngDescription(row) {
    const labels = String(row.labels || '').trim();
    const details = String(row.details || '').trim();
    const primary = labels || details;
    if (!primary) return 'Transaction ING';

    const cardMatch = primary.match(/-\s*(.+?)\s+(?:\d{4}\s*-|Numero de carte|Numéro de carte)/i);
    if (cardMatch && cardMatch[1]) {
        return cardMatch[1].replace(/\s+-\s+BEL$/i, '').trim();
    }

    const transferFrom = primary.match(/de\s*:\s*([^\-;]+?)(?:\s*-\s*[A-Z]{2}\d+|\s{2,}|$)/i);
    if (transferFrom && transferFrom[1]) {
        return `Virement de ${transferFrom[1].trim()}`;
    }

    const transferTo = primary.match(/vers\s*:\s*([^\-;]+?)(?:\s*-\s*[A-Z]{2}\d+|\s{2,}|$)/i);
    if (transferTo && transferTo[1]) {
        return `Virement vers ${transferTo[1].trim()}`;
    }

    const directDebit = primary.match(/domiciliation[^\w]*(.+?)(?:avis|$)/i);
    if (directDebit && directDebit[1]) {
        return `Domiciliation ${directDebit[1].trim()}`;
    }

    return primary.length > 90 ? `${primary.slice(0, 90).trim()}...` : primary;
}

function inferIngCategory(transactionType, description, row) {
    const haystack = toFlatLower(`${description} ${row.labels || ''} ${row.details || ''}`);

    if (transactionType === 'income') {
        if (/salaire|loon|wedde|interim/.test(haystack)) return 'Salaire';
        if (/epargne|epagne|savings/.test(haystack)) return 'Épargne';
        return 'Revenus';
    }

    if (/uber\s*\*\s*eats|burger king|o\s*'?tacos|o\s*'?cheese|dunkin|khan|restaurant|snack|pizza/.test(haystack)) return 'Restaurants';
    if (/lidl|delhaize|carrefour|intermarche|action|jefar|magasin|courses/.test(haystack)) return 'Magasins';
    if (/lukoil|seety|parking|bolt|resa|carburant|essence|pony\b|transport/.test(haystack)) return 'Transport';
    if (/apple\.com|instant ink|abonnement|membership|domiciliation/.test(haystack)) return 'Abonnements';
    if (/vet|pharmacie|hopital|hopital|sante/.test(haystack)) return 'Santé';
    if (/facture|electricite|gaz|eau|internet|telecom/.test(haystack)) return 'Factures';
    if (/epargne|savings/.test(haystack)) return 'Épargne';

    return 'Autres';
}

function parseIngCsvText(text) {
    const rows = String(text || '')
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (rows.length < 2) {
        throw new Error('Fichier CSV ING vide ou incomplet');
    }

    const headers = parseSemicolonCsvLine(rows[0]).map(item => toFlatLower(item));
    const indexOf = (name) => headers.indexOf(toFlatLower(name));

    const amountIndex = indexOf('Montant');
    const bookingDateIndex = indexOf('Date comptable');
    const labelsIndex = indexOf('Libellés');
    const detailsIndex = indexOf('Détails du mouvement');
    const currencyIndex = indexOf('Devise');

    if (amountIndex < 0 || bookingDateIndex < 0 || labelsIndex < 0) {
        throw new Error('Format CSV ING non reconnu');
    }

    const parsedTransactions = [];

    for (let i = 1; i < rows.length; i += 1) {
        const values = parseSemicolonCsvLine(rows[i]);
        if (!values.length) continue;

        const amount = parseIngAmount(values[amountIndex]);
        if (!Number.isFinite(amount) || amount === 0) continue;

        const row = {
            labels: values[labelsIndex] || '',
            details: detailsIndex >= 0 ? (values[detailsIndex] || '') : '',
            currency: currencyIndex >= 0 ? (values[currencyIndex] || '') : 'EUR'
        };

        const date = parseDateValue(values[bookingDateIndex]);
        if (!date) continue;

        const type = amount < 0 ? 'expense' : 'income';
        const description = inferIngDescription(row);
        const category = inferIngCategory(type, description, row);

        parsedTransactions.push({
            type,
            description,
            category,
            amount: Math.abs(amount),
            date,
            timestamp: new Date().toISOString()
        });
    }

    if (!parsedTransactions.length) {
        throw new Error('Aucune transaction ING valide trouvée dans le CSV');
    }

    return parsedTransactions;
}

function readIngCsvFile(file) {
    return file.text().then(parseIngCsvText);
}

async function clearFirebaseTransactions() {
    if (!db || !currentUser) return;
    const snapshot = await db.collection('users')
        .doc(currentUser.uid)
        .collection('transactions')
        .get();

    if (snapshot.empty) return;

    let batch = db.batch();
    let count = 0;
    const commits = [];

    snapshot.forEach(doc => {
        batch.delete(doc.ref);
        count += 1;
        if (count >= 400) {
            commits.push(batch.commit());
            batch = db.batch();
            count = 0;
        }
    });

    if (count > 0) {
        commits.push(batch.commit());
    }

    await Promise.all(commits);
}

async function addTransactionsToFirebase(list) {
    if (!db || !currentUser || !list.length) return;
    const collectionRef = db.collection('users').doc(currentUser.uid).collection('transactions');

    let batch = db.batch();
    let count = 0;
    const commits = [];

    list.forEach(item => {
        const docRef = collectionRef.doc();
        batch.set(docRef, item);
        count += 1;
        if (count >= 400) {
            commits.push(batch.commit());
            batch = db.batch();
            count = 0;
        }
    });

    if (count > 0) {
        commits.push(batch.commit());
    }

    await Promise.all(commits);
}

async function importTransactionsData(rawData, mode = 'merge') {
    const list = Array.isArray(rawData)
        ? rawData
        : (rawData && Array.isArray(rawData.transactions) ? rawData.transactions : []);

    const cleaned = list.map(normalizeTransaction).filter(Boolean);

    if (!cleaned.length) {
        Toast.error('Import échoué', 'Aucune transaction valide trouvée');
        return { imported: 0 };
    }

    updateSyncStatus('syncing');

    if (db && currentUser) {
        if (mode === 'replace') {
            await clearFirebaseTransactions();
        }
        await addTransactionsToFirebase(cleaned);
        await loadTransactionsFromFirebase();
    } else {
        if (mode === 'replace') {
            transactions = cleaned;
        } else {
            transactions = transactions.concat(cleaned);
        }
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateDashboard();
    }

    updateSyncStatus('synced');

    return { imported: cleaned.length };
}

let currentEditingIndex = null;
let currentEditingType = null;

// Instances des graphiques
let expensesChartInstance = null;
let incomeExpenseChartInstance = null;
let balanceChartInstance = null;

// ======================
// INITIALISATION FIREBASE
// ======================
async function initializeFirebase() {
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log('Firebase initialisé avec succès');
    } catch (error) {
        if (error.code === 'app/duplicate-app') {
            try {
                db = firebase.firestore();
                console.log('Utilisation de l\'instance Firebase existante');
            } catch (authError) {
                console.error('Erreur lors de l\'initialisation:', authError);
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
// KEYBOARD SHORTCUTS
// ======================
function setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
        // Fermer les modales avec ESC
        if (e.key === 'Escape') {
            // Fermer le menu paramètres
            const settingsDropdown = document.getElementById('settingsDropdown');
            if (settingsDropdown && settingsDropdown.classList.contains('active')) {
                settingsDropdown.classList.remove('active');
                return;
            }

            // Trouver et fermer la modale active
            const activeModals = document.querySelectorAll('.modal.active');
            if (activeModals.length > 0) {
                // Fermer la dernière modale ouverte
                const lastModal = activeModals[activeModals.length - 1];
                if (lastModal.id === 'rolloverModal') {
                    return;
                }
                closeModal(lastModal.id);
            }

            // Aussi fermer le panel filtres avancés s'il est ouvert
            const advancedFilters = document.getElementById('advancedFilters');
            if (advancedFilters && advancedFilters.classList.contains('active')) {
                advancedFilters.classList.remove('active');
            }
        }
    });
}

// ======================
// SETTINGS MENU
// ======================
function setupSettingsMenu() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsDropdown = document.getElementById('settingsDropdown');

    if (!settingsBtn || !settingsDropdown) return;

    // Toggle menu on button click
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsBtn.contains(e.target) && !settingsDropdown.contains(e.target)) {
            settingsDropdown.classList.remove('active');
        }
    });

    // Close menu when clicking on a menu item (except for toggle buttons)
    const settingsItems = settingsDropdown.querySelectorAll('.settings-item');
    settingsItems.forEach(item => {
        // Ne pas fermer si c'est le thème toggle (il est cliquable)
        if (!item.id.includes('theme')) {
            item.addEventListener('click', () => {
                setTimeout(() => {
                    settingsDropdown.classList.remove('active');
                }, 100);
            });
        }
    });
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

    // Toggle Regroupement Temporel
    document.getElementById('timeGroupingToggle').addEventListener('click', toggleTimeGrouping);

    // Modal Configuration
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        configBtn.addEventListener('click', () => {
            const uidEl = document.getElementById('configUid');
            if (uidEl) {
                uidEl.textContent = (currentUser && currentUser.uid) ? currentUser.uid : 'N/A';
            }
            openModal('configModal');
        });
    }

    document.getElementById('closeConfigBtn').addEventListener('click', () => {
        closeModal('configModal');
    });

    document.getElementById('closeConfigBtn2').addEventListener('click', () => {
        closeModal('configModal');
    });

    // Modal Admin Panel
    const adminBtn = document.getElementById('adminPanelBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', async () => {
            if (currentUserRole !== 'Administrateur') {
                Toast.error('Accès refusé', 'Réservé aux administrateurs');
                return;
            }
            const searchInput = document.getElementById('adminUserSearch');
            if (searchInput) {
                searchInput.value = '';
            }
            await loadAdminUsers();
            openModal('adminPanelModal');
        });
    }

    const adminSearchInput = document.getElementById('adminUserSearch');
    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', () => {
            renderAdminUsers();
        });
    }

    document.getElementById('closeAdminPanel').addEventListener('click', () => {
        closeModal('adminPanelModal');
    });

    document.getElementById('closeAdminPanel2').addEventListener('click', () => {
        closeModal('adminPanelModal');
    });

    // Modal Data Transfer
    const dataTransferBtn = document.getElementById('dataTransferBtn');
    if (dataTransferBtn) {
        dataTransferBtn.addEventListener('click', () => {
            const importFinlyFile = document.getElementById('importFinlyFile');
            const importBankFile = document.getElementById('importBankFile');
            const importFinlyError = document.getElementById('importFinlyError');
            const importFinlySuccess = document.getElementById('importFinlySuccess');
            const importBankError = document.getElementById('importBankError');
            const importBankSuccess = document.getElementById('importBankSuccess');

            if (importFinlyFile) importFinlyFile.value = '';
            if (importBankFile) importBankFile.value = '';
            if (importFinlyError) importFinlyError.style.display = 'none';
            if (importFinlySuccess) importFinlySuccess.style.display = 'none';
            if (importBankError) importBankError.style.display = 'none';
            if (importBankSuccess) importBankSuccess.style.display = 'none';
            openModal('dataTransferModal');
        });
    }

    document.getElementById('closeDataTransfer').addEventListener('click', () => {
        closeModal('dataTransferModal');
    });

    document.getElementById('closeDataTransfer2').addEventListener('click', () => {
        closeModal('dataTransferModal');
    });

    document.getElementById('exportJsonBtn').addEventListener('click', exportTransactionsJson);
    document.getElementById('exportExcelBtn').addEventListener('click', exportTransactionsExcel);

    document.getElementById('importFinlyBtn').addEventListener('click', async () => {
        const file = document.getElementById('importFinlyFile').files[0];
        const errorEl = document.getElementById('importFinlyError');
        const successEl = document.getElementById('importFinlySuccess');
        const mode = document.querySelector('input[name="importFinlyMode"]:checked')?.value || 'merge';

        errorEl.style.display = 'none';
        successEl.style.display = 'none';

        if (!file) {
            errorEl.textContent = 'Sélectionnez un fichier Finly (JSON ou Excel)';
            errorEl.style.display = 'block';
            return;
        }

        try {
            let data = null;

            if (file.name.endsWith('.json')) {
                data = await readJsonFile(file);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                data = await readExcelFile(file);
            } else {
                errorEl.textContent = 'Format non supporté pour Finly. Utilisez JSON ou Excel.';
                errorEl.style.display = 'block';
                return;
            }

            const result = await importTransactionsData(data, mode);
            successEl.textContent = `${result.imported} transaction(s) importée(s) avec succès`;
            successEl.style.display = 'block';
            Toast.success('Import Finly réussi', `${result.imported} transaction(s) importée(s)`);

            setTimeout(() => {
                closeModal('dataTransferModal');
                successEl.style.display = 'none';
            }, 2000);
        } catch (error) {
            console.error('Erreur lors de l\'import Finly:', error);
            errorEl.textContent = `Erreur: ${error.message}`;
            errorEl.style.display = 'block';
            Toast.error('Erreur import Finly', error.message);
        }
    });

    document.getElementById('importBankBtn').addEventListener('click', async () => {
        const file = document.getElementById('importBankFile').files[0];
        const errorEl = document.getElementById('importBankError');
        const successEl = document.getElementById('importBankSuccess');
        const mode = document.querySelector('input[name="importBankMode"]:checked')?.value || 'merge';

        errorEl.style.display = 'none';
        successEl.style.display = 'none';

        if (!file) {
            errorEl.textContent = 'Sélectionnez un fichier Bank (CSV ING)';
            errorEl.style.display = 'block';
            return;
        }

        if (!file.name.endsWith('.csv')) {
            errorEl.textContent = 'Format non supporté pour Bank. Utilisez un CSV ING.';
            errorEl.style.display = 'block';
            return;
        }

        try {
            const data = await readIngCsvFile(file);
            Toast.warning('Import ING (bêta)', 'La description ou la catégorie peut être inexacte. Vérifie les transactions importées.');

            const result = await importTransactionsData(data, mode);
            successEl.textContent = `${result.imported} transaction(s) importée(s) avec succès`;
            successEl.style.display = 'block';
            Toast.success('Import Bank réussi', `${result.imported} transaction(s) importée(s)`);

            setTimeout(() => {
                closeModal('dataTransferModal');
                successEl.style.display = 'none';
            }, 2000);
        } catch (error) {
            console.error('Erreur lors de l\'import Bank:', error);
            errorEl.textContent = `Erreur: ${error.message}`;
            errorEl.style.display = 'block';
            Toast.error('Erreur import Bank', error.message);
        }
    });

    // Modal Report Solde
    const closeRolloverBtn = document.getElementById('closeRollover');
    if (closeRolloverBtn) {
        closeRolloverBtn.addEventListener('click', (event) => {
            event.preventDefault();
        });
    }

    const declineRolloverBtn = document.getElementById('declineRollover');
    if (declineRolloverBtn) {
        declineRolloverBtn.addEventListener('click', () => {
            dismissRolloverPrompt(true);
        });
    }

    const deferRolloverBtn = document.getElementById('deferRollover');
    if (deferRolloverBtn) {
        deferRolloverBtn.addEventListener('click', () => {
            dismissRolloverPrompt(false);
        });
    }

    const acceptRolloverBtn = document.getElementById('acceptRollover');
    if (acceptRolloverBtn) {
        acceptRolloverBtn.addEventListener('click', () => {
            applyRolloverTransaction();
        });
    }

    const acceptRolloverSavingsBtn = document.getElementById('acceptRolloverSavings');
    if (acceptRolloverSavingsBtn) {
        acceptRolloverSavingsBtn.addEventListener('click', () => {
            applyRolloverTransaction('savings');
        });
    }

    // Modal Tester Panel
    const testerBtn = document.getElementById('testerPanelBtn');
    if (testerBtn) {
        testerBtn.addEventListener('click', () => {
            if (currentUserRole !== 'Administrateur' && currentUserRole !== 'testeur') {
                Toast.error('Accès refusé', 'Réservé aux testeurs et admins');
                return;
            }
            testerOutputBuffer = [];
            const output = document.getElementById('testerOutput');
            if (output) {
                output.classList.remove('active');
                output.textContent = '';
            }
            openModal('testerPanelModal');
        });
    }

    document.getElementById('closeTesterPanel').addEventListener('click', () => {
        closeModal('testerPanelModal');
    });

    document.getElementById('closeTesterPanel2').addEventListener('click', () => {
        closeModal('testerPanelModal');
    });

    // Tester Panel Tests
    document.getElementById('testToastSuccess').addEventListener('click', () => {
        Toast.success('Test Success', 'Ceci est un test de notification success');
        logToTester('[Toast] Success notification triggered');
    });

    document.getElementById('testToastError').addEventListener('click', () => {
        Toast.error('Test Error', 'Ceci est un test de notification error');
        logToTester('[Toast] Error notification triggered');
    });

    document.getElementById('testToastInfo').addEventListener('click', () => {
        Toast.info('Test Info', 'Ceci est un test de notification info');
        logToTester('[Toast] Info notification triggered');
    });

    document.getElementById('testToastWarning').addEventListener('click', () => {
        Toast.warning('Test Warning', 'Ceci est un test de notification warning');
        logToTester('[Toast] Warning notification triggered');
    });

    document.getElementById('testToastLoading').addEventListener('click', () => {
        const loadingToast = Toast.loading('Test Loading', 'Chargement en cours...');
        logToTester('[Toast] Loading notification triggered');
        setTimeout(() => {
            removeToast(loadingToast);
            logToTester('[Toast] Loading notification removed after 3s');
        }, 3000);
    });

    document.getElementById('testLogUserData').addEventListener('click', () => {
        if (currentUser) {
            const info = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                role: currentUserRole,
                emailVerified: currentUser.emailVerified
            };
            logToTester(`[User] ${JSON.stringify(info, null, 2)}`);
        } else {
            logToTester('[User] Aucun utilisateur connecté');
        }
    });

    document.getElementById('testLogUsersCount').addEventListener('click', () => {
        logToTester(`[Admin] Total utilisateurs en cache: ${adminUsersCache.length}`);
        if (adminUsersCache.length > 0) {
            const roles = {};
            adminUsersCache.forEach(u => {
                roles[u.role] = (roles[u.role] || 0) + 1;
            });
            logToTester(`[Admin] Par rôle: ${JSON.stringify(roles, null, 2)}`);
        }
    });

    document.getElementById('testLogTransactions').addEventListener('click', () => {
        logToTester(`[Transactions] Total: ${transactions.length}`);
        if (transactions.length > 0) {
            const income = transactions.filter(t => t.type === 'income').length;
            const expense = transactions.filter(t => t.type === 'expense').length;
            logToTester(`[Transactions] Recettes: ${income}, Dépenses: ${expense}`);
            const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            logToTester(`[Transactions] Totaux: Recettes ${totalIncome}€, Dépenses ${totalExpense}€`);
        }
    });

    document.getElementById('testClearStorage').addEventListener('click', () => {
        localStorage.clear();
        logToTester('[Storage] localStorage cleared');
        Toast.success('Storage', 'localStorage a été vidé');
    });

    document.getElementById('testLogStorage').addEventListener('click', () => {
        const keys = Object.keys(localStorage);
        logToTester(`[Storage] ${keys.length} items in localStorage:`);
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            logToTester(`  ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
        });
    });

    document.getElementById('testReloadTransactions').addEventListener('click', async () => {
        logToTester('[Performance] Reloading transactions...');
        const start = performance.now();
        if (db) {
            await loadTransactionsFromFirebase();
        } else {
            loadTransactionsFromLocal();
        }
        const end = performance.now();
        logToTester(`[Performance] Transactions reloaded in ${(end - start).toFixed(2)}ms`);
        logToTester(`[Performance] Loaded ${transactions.length} transactions`);
    });

    document.getElementById('testUpdateDashboard').addEventListener('click', () => {
        logToTester('[Performance] Updating dashboard...');
        const start = performance.now();
        updateDashboard();
        const end = performance.now();
        logToTester(`[Performance] Dashboard updated in ${(end - start).toFixed(2)}ms`);
    });

    document.getElementById('testAddFakeData').addEventListener('click', async () => {
        logToTester('[Test Data] Generating fake data...');
        const start = performance.now();
        await addFakeData();
        const end = performance.now();
        logToTester(`[Test Data] Fake data generated in ${(end - start).toFixed(2)}ms`);
        logToTester(`[Test Data] Total transactions: ${transactions.length}`);
        Toast.success('Fausses données ajoutées', `${transactions.length} transactions au total`);
    });

    document.getElementById('testClearAllTransactions').addEventListener('click', async () => {
        const confirmed = window.confirm('Êtes-vous sûr ? Cela supprimera TOUTES les transactions.');
        if (!confirmed) return;

        logToTester('[Test Data] Clearing all transactions...');
        const start = performance.now();
        await clearAllTransactions();
        const end = performance.now();
        logToTester(`[Test Data] All transactions cleared in ${(end - start).toFixed(2)}ms`);
        Toast.success('Transactions supprimées', 'Tous les données ont été effacées');
    });

    // Modal Profil
    document.getElementById('profileBtn').addEventListener('click', async () => {
        await loadProfileData();
        openModal('profileModal');
    });

    document.getElementById('closeProfile').addEventListener('click', () => {
        closeModal('profileModal');
    });

    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);

    // Fermer modales en cliquant en dehors
    document.querySelectorAll('.modal').forEach(modal => {
        let mouseDownTarget = null;

        modal.addEventListener('mousedown', (e) => {
            mouseDownTarget = e.target;
        });

        modal.addEventListener('mouseup', (e) => {
            // Fermer seulement si mousedown et mouseup sont tous les deux sur le fond de la modale
            if (e.target === modal && mouseDownTarget === modal) {
                if (modal.id === 'rolloverModal') {
                    return;
                }
                closeModal(modal.id);
            }
            mouseDownTarget = null;
        });
    });
}

// ======================
// GESTION DES CHANGELOGS
// ======================
function loadChangelogs() {
    fetch('changelogs.json')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('changelogsContainer');
            container.innerHTML = '';

            data.versions.forEach(version => {
                const changelogItem = document.createElement('div');
                changelogItem.className = 'changelog-item';

                changelogItem.innerHTML = `
                    <div class="changelog-header">
                        <span class="changelog-version">v${version.version}</span>
                        <span class="changelog-date">${new Date(version.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <h3 class="changelog-title">${version.title}</h3>
                    <ul class="changelog-changes">
                        ${version.changes.map(change => `<li>${change}</li>`).join('')}
                    </ul>
                `;

                container.appendChild(changelogItem);
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

// ======================
// GESTION DES FORMULAIRES
// ======================
function setupFormListeners() {
    // Formulaire Dépense
    document.getElementById('expenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button[type="submit"]');
        showSpinner(button, button.textContent);

        try {
            const transaction = {
                type: 'expense',
                description: document.getElementById('expenseName').value,
                category: document.getElementById('expenseCategory').value,
                amount: parseFloat(document.getElementById('expenseAmount').value),
                date: document.getElementById('expenseDate').value,
                timestamp: new Date().toISOString()
            };
            await addTransaction(transaction);
            document.getElementById('expenseForm').reset();
            refreshIconSelect('expenseCategory');
            closeModal('expenseModal');
            hideSpinner(button);
        } catch (error) {
            console.error('Erreur lors de l\'ajout de dépense:', error);
            hideSpinner(button);
        }
    });

    // Formulaire Recette
    document.getElementById('incomeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button[type="submit"]');
        showSpinner(button, button.textContent);

        try {
            const transaction = {
                type: 'income',
                description: document.getElementById('incomeName').value,
                category: document.getElementById('incomeCategory').value,
                amount: parseFloat(document.getElementById('incomeAmount').value),
                date: document.getElementById('incomeDate').value,
                timestamp: new Date().toISOString()
            };
            await addTransaction(transaction);
            document.getElementById('incomeForm').reset();
            refreshIconSelect('incomeCategory');
            closeModal('incomeModal');
            hideSpinner(button);
        } catch (error) {
            console.error('Erreur lors de l\'ajout de recette:', error);
            hideSpinner(button);
        }
    });

    // Formulaire Modifier
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = e.target.querySelector('button[type="submit"]');
        showSpinner(button, button.textContent);

        try {
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

            if (transactions[currentEditingIndex].rollover) {
                updatedTransaction.rollover = true;
            }

            if (transactions[currentEditingIndex].rolloverMode) {
                updatedTransaction.rolloverMode = transactions[currentEditingIndex].rolloverMode;
            }

            await updateTransaction(currentEditingIndex, updatedTransaction);
            document.getElementById('editForm').reset();
            closeModal('editModal');
            hideSpinner(button);
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            hideSpinner(button);
        }
    });
}

// ======================
// GESTION DES TRANSACTIONS
// ======================
let transactions = [];
let selectedMonth = null; // Format: "YYYY-MM"
let pendingRollover = null;
const declinedRolloverMonths = new Set();
let activeFilters = {
    search: '',
    categories: []
};
let timeGroupingEnabled = false; // Désactiver le regroupement temporel par défaut
const SWIPE_TRIGGER_DISTANCE = 90;
const SWIPE_MAX_OFFSET = 120;

// État du tri
let currentSort = {
    field: null,
    direction: 'asc' // 'asc' ou 'desc'
};

function getSelectedMonth() {
    return selectedMonth || new Date().toISOString().slice(0, 7);
}

function formatMonthLabel(monthStr) {
    if (!monthStr) return '';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function getMonthBalance(monthStr) {
    const monthTransactions = getTransactionsForMonth(monthStr);
    const income = monthTransactions
        .filter(t => t.type === 'income' && !isInternalSavingsTransfer(t))
        .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions
        .filter(t => t.type === 'expense' && !isInternalSavingsTransfer(t))
        .reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
}

function isInternalSavingsTransfer(transaction) {
    if (!transaction) return false;

    if (transaction.rolloverMode === 'savings-transfer') {
        return true;
    }

    const description = typeof transaction.description === 'string' ? transaction.description.toLowerCase() : '';
    return transaction.rollover === true
        && transaction.type === 'expense'
        && transaction.category === 'Épargne'
        && description.startsWith('épargne report solde');
}

function getMonthLastDate(monthStr) {
    const [year, month] = monthStr.split('-').map(value => parseInt(value, 10));
    const lastDay = new Date(year, month, 0).getDate();
    return `${monthStr}-${String(lastDay).padStart(2, '0')}`;
}

function getPreviousMonth(monthStr) {
    const [year, month] = monthStr.split('-').map(value => parseInt(value, 10));
    const date = new Date(year, month - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function hasRolloverForMonth(monthStr) {
    return transactions.some(t => t.rollover === true && t.date && t.date.startsWith(monthStr));
}

function setRolloverModalContent(previousMonth, balance) {
    const labelEl = document.getElementById('rolloverSourceLabel');
    const amountEl = document.getElementById('rolloverAmount');
    if (labelEl) {
        labelEl.textContent = formatMonthLabel(previousMonth);
    }
    if (amountEl) {
        amountEl.textContent = formatCurrency(balance);
        amountEl.classList.toggle('positive', balance > 0);
        amountEl.classList.toggle('negative', balance < 0);
    }
}

function maybePromptRollover(previousMonth, targetMonth) {
    if (!previousMonth || !targetMonth) return;
    if (targetMonth <= previousMonth) return;
    if (declinedRolloverMonths.has(targetMonth)) return;
    if (hasRolloverForMonth(targetMonth)) return;

    const balance = getMonthBalance(previousMonth);
    if (Math.abs(balance) < 0.01) return;

    pendingRollover = { previousMonth, targetMonth, balance };
    setRolloverModalContent(previousMonth, balance);
    openModal('rolloverModal');
}

async function applyRolloverTransaction(mode = 'balance') {
    if (!pendingRollover) return;

    const { previousMonth, targetMonth, balance } = pendingRollover;
    const monthLabel = formatMonthLabel(previousMonth);

    if (mode === 'savings' && balance <= 0) {
        Toast.warning('Épargne impossible', 'Le solde à épargner doit être positif');
        return;
    }

    const openingTransaction = mode === 'savings'
        ? {
            type: 'expense',
            description: `Épargne report solde ${monthLabel}`,
            category: 'Épargne',
            amount: Math.abs(balance),
            date: `${targetMonth}-01`,
            timestamp: new Date().toISOString(),
            rollover: true,
            rolloverMode: 'savings-transfer'
        }
        : {
            type: balance >= 0 ? 'income' : 'expense',
            description: `Report solde ${monthLabel}`,
            category: 'Autres',
            amount: Math.abs(balance),
            date: `${targetMonth}-01`,
            timestamp: new Date().toISOString(),
            rollover: true
        };

    const closingTransaction = {
        type: balance >= 0 ? 'expense' : 'income',
        description: `Clôture report solde ${monthLabel}`,
        category: 'Autres',
        amount: Math.abs(balance),
        date: getMonthLastDate(previousMonth),
        timestamp: new Date().toISOString(),
        rollover: true,
        rolloverMode: 'closing-entry'
    };

    pendingRollover = null;
    await addTransaction(closingTransaction);
    await addTransaction(openingTransaction);
    closeModal('rolloverModal');
}

function dismissRolloverPrompt(markDeclined = true) {
    if (pendingRollover && markDeclined) {
        declinedRolloverMonths.add(pendingRollover.targetMonth);
    }
    pendingRollover = null;
    closeModal('rolloverModal');
}

// ======================
// NAVIGATION MOIS
// ======================
function navigateMonth(direction) {
    const currentMonth = getSelectedMonth();
    const [year, month] = currentMonth.split('-');
    let newYear = parseInt(year);
    let newMonth = parseInt(month) + direction;

    // Gérer le dépassement des mois
    if (newMonth > 12) {
        newMonth = 1;
        newYear++;
    } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
    }

    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    handleMonthChange(newMonthStr, currentMonth);
}

function handleMonthChange(newMonthStr, previousMonth = null) {
    const prevMonth = previousMonth || selectedMonth || getSelectedMonth();
    selectedMonth = newMonthStr;
    document.getElementById('monthFilter').value = newMonthStr;
    updateMonthDisplay();
    updateDashboard();
    maybePromptRollover(prevMonth, newMonthStr);
}

function updateMonthDisplay() {
    const currentMonth = getSelectedMonth();
    const [year, month] = currentMonth.split('-');

    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const monthDisplay = document.getElementById('monthDisplay');
    const monthName = monthNames[parseInt(month) - 1];
    monthDisplay.textContent = `${monthName} ${year}`;
}

async function addTransaction(transaction) {
    transactions.push(transaction);
    Toast.success('Transaction ajoutée', `${transaction.description} - ${formatCurrency(transaction.amount)}`);
    updateSyncStatus('syncing');

    if (db) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('transactions').add(transaction);
            console.log('Transaction ajoutée à Firebase');
            updateSyncStatus('synced');
        } catch (error) {
            console.error('Erreur lors de l\'ajout à Firebase:', error);
            Toast.error('Sync. échouée', 'Les données seront synchronisées quand la connexion sera rétablie');
            updateSyncStatus('error', 'Sync échouée');
        }
    } else {
        // Sauvegarde locale
        localStorage.setItem('transactions', JSON.stringify(transactions));
        Toast.warning('Mode hors ligne', 'Données stockées localement');
        updateSyncStatus('offline');
    }

    updateDashboard();
}

async function deleteTransaction(index) {
    const transaction = transactions[index];

    const confirmed = window.confirm(`Voulez-vous vraiment supprimer cette transaction : "${transaction.description}" (${formatCurrency(transaction.amount)}) ?`);
    if (!confirmed) return;

    transactions.splice(index, 1);
    Toast.success('Supprimée', transaction.description);
    updateSyncStatus('syncing');

    if (db && transaction.firebaseId) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('transactions').doc(transaction.firebaseId).delete();
            console.log('Transaction supprimée de Firebase');
            updateSyncStatus('synced');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            Toast.error('Erreur', 'La transaction n\'a pas pu être supprimée de la sauvegarde');
            updateSyncStatus('error', 'Suppression échouée');
        }
    } else {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateSyncStatus('offline');
    }

    updateDashboard();
}

async function updateTransaction(index, updatedTransaction) {
    const oldTransaction = transactions[index];
    transactions[index] = updatedTransaction;
    Toast.success('Mise à jour', updatedTransaction.description);
    updateSyncStatus('syncing');

    if (db && oldTransaction.firebaseId) {
        try {
            await db.collection('users').doc(currentUser.uid).collection('transactions').doc(oldTransaction.firebaseId).update(updatedTransaction);
            console.log('Transaction mise à jour sur Firebase');
            updateSyncStatus('synced');
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            Toast.error('Erreur', 'La modification n\'a pas pu être synchronisée');
            updateSyncStatus('error', 'Mise à jour échouée');
        }
    } else {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateSyncStatus('offline');
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

    refreshIconSelect('editCategory');
    
    openModal('editModal');
}

async function loadTransactionsFromFirebase() {
    try {
        // Charger les transactions de l'utilisateur connecté
        const querySnapshot = await db.collection('users')
            .doc(currentUser.uid)
            .collection('transactions')
            .get();
        transactions = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.firebaseId = doc.id;
            transactions.push(data);
        });
        console.log(`${transactions.length} transactions chargées depuis Firebase pour l'utilisateur ${currentUser.uid}`);
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
        .filter(t => t.type === 'income' && !isInternalSavingsTransfer(t))
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense' && !isInternalSavingsTransfer(t))
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;

    // Calculer l'épargne cumulée (dépenses catégorie "Épargne" = +montant, revenus Épargne = -montant)
    const cumulativeSavings = transactions
        .filter(t => t.category === 'Épargne')
        .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0);

    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);
    document.getElementById('totalBalance').textContent = formatCurrency(balance);
    document.getElementById('totalSavings').textContent = formatCurrency(cumulativeSavings);

    // Couleur dynamique du solde
    const balanceElement = document.getElementById('totalBalance');
    const balanceCard = balanceElement.closest('.summary-card');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (balance < 0) {
        balanceCard.style.borderLeftColor = '#ef4444';
        balanceElement.style.color = '#ef4444';
    } else if (balance > 0) {
        balanceCard.style.borderLeftColor = '#10b981';
        balanceElement.style.color = '#10b981';
    } else {
        balanceCard.style.borderLeftColor = '#3b82f6';
        balanceElement.style.color = isDark ? '#f9fafb' : '#111827';
    }

    // Couleur dynamique de l'épargne cumulée
    const savingsElement = document.getElementById('totalSavings');
    const savingsCard = savingsElement.closest('.summary-card');
    
    if (cumulativeSavings < 0) {
        savingsCard.style.borderLeftColor = '#ef4444';
        savingsElement.style.color = '#ef4444';
    } else if (cumulativeSavings > 0) {
        savingsCard.style.borderLeftColor = '#8b5cf6';
        savingsElement.style.color = '#8b5cf6';
    } else {
        savingsCard.style.borderLeftColor = '#8b5cf6';
        savingsElement.style.color = isDark ? '#f9fafb' : '#111827';
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
        countElement.textContent = '0';
        updateTransactionsList(); // Aussi vider les cartes
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

            // Si les deux sont dans l'ordre prédéfini
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;

            // Si seulement A est dans l'ordre prédéfini
            if (indexA !== -1) return -1;

            // Si seulement B est dans l'ordre prédéfini
            if (indexB !== -1) return 1;

            // Pour les groupes "Il y a X mois", trier numériquement
            const monthsA = parseInt(a.match(/(\d+) mois/)?.[1] || 999);
            const monthsB = parseInt(b.match(/(\d+) mois/)?.[1] || 999);
            return monthsA - monthsB;
        });

        sortedGroupKeys.forEach(timeLabel => {
            const groupTransactions = groups[timeLabel];

            // Ajouter le séparateur de groupe
            html += `
                <tr class="time-separator">
                    <td colspan="6">
                        <div class="time-separator-line"></div>
                        <span class="time-separator-text">${timeLabel}</span>
                        <div class="time-separator-line"></div>
                    </td>
                </tr>
            `;

            // Ajouter les transactions du groupe
            groupTransactions.forEach((transaction) => {
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
        });
    } else {
        // Affichage sans regroupement temporel
        sorted.forEach((transaction) => {
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
    }

    tableBody.innerHTML = html;
    countElement.textContent = `${filteredTransactions.length}`;
    updateTransactionsList(); // Aussi mettre à jour les cartes
}

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

// ======================
// REGROUPEMENT TEMPOREL
// ======================
function getRelativeTimeLabel(dateString) {
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

function groupTransactionsByTime(transactionsList) {
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

// ======================
// GESTION DES FILTRES
// ======================
function initializeCategoryFilter() {
    const filterContainer = document.getElementById('categoryFilter');
    const allCategories = [...expenseCategories, ...incomeCategories];
    const uniqueCategories = [...new Set(allCategories)];

    filterContainer.innerHTML = uniqueCategories.map(cat => `
        <div class="filter-chip">
            <input type="checkbox" id="cat-${cat}" value="${cat}" class="category-checkbox">
            <label for="cat-${cat}">
                <i class="fas ${categoryIcons[cat] || 'fa-tag'}"></i>
                <span>${cat}</span>
            </label>
        </div>
    `).join('');

    document.querySelectorAll('.category-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateFilters);
    });
}

function setupFilterListeners() {
    const panel = document.getElementById('filtersPanel');
    const toggleButton = document.getElementById('toggleFiltersBtn');
    const isInitiallyActive = panel.classList.contains('active');
    toggleButton.classList.toggle('active', isInitiallyActive);
    toggleButton.setAttribute('aria-expanded', isInitiallyActive ? 'true' : 'false');

    // Recherche
    document.getElementById('searchFilter').addEventListener('input', updateFilters);

    // Toggle filtres
    document.getElementById('toggleFiltersBtn').addEventListener('click', () => {
        const nextActive = panel.classList.toggle('active');
        toggleButton.classList.toggle('active', nextActive);
        toggleButton.setAttribute('aria-expanded', nextActive ? 'true' : 'false');
    });

    // Réinitialiser filtres
    document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);

    // Navigation mois
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        navigateMonth(-1);
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        navigateMonth(1);
    });

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
function getChartOptions(type = 'doughnut') {
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768;

    const baseOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: isMobile ? 'bottom' : 'bottom',
                labels: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: isMobile ? 10 : 12
                    },
                    color: '#6b7280',
                    padding: isMobile ? 8 : 15
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: { family: "'Inter', sans-serif", size: isMobile ? 10 : 12 },
                bodyFont: { family: "'Inter', sans-serif", size: isMobile ? 9 : 12 },
                callbacks: {
                    label: function(context) {
                        return formatCurrency(context.parsed);
                    }
                }
            }
        }
    };

    if (type === 'doughnut') {
        return baseOptions;
    } else if (type === 'bar') {
        return {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'x',
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: "'Inter', sans-serif",
                            size: isMobile ? 10 : 12
                        },
                        color: '#6b7280',
                        padding: isMobile ? 8 : 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { family: "'Inter', sans-serif", size: isMobile ? 10 : 12 },
                    bodyFont: { family: "'Inter', sans-serif", size: isMobile ? 9 : 12 },
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
                        font: { size: isMobile ? 8 : 12 },
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
                        font: { size: isMobile ? 8 : 12 },
                        color: '#9ca3af'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        };
    }
}

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
            options: getChartOptions('doughnut')
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
            options: getChartOptions('bar')
        });
    }
}

// ======================
// INITIALISATION AU CHARGEMENT
// ======================
document.addEventListener('DOMContentLoaded', async () => {
    // Initialiser le thème
    initializeTheme();

    // Initialiser le regroupement temporel
    initializeTimeGrouping();

    // Initialiser les keyboard shortcuts
    setupKeyboardListeners();

    // Initialiser Firebase
    await initializeFirebase();
    
    // Configuration des écouteurs d'authentification
    setupAuthListeners();

    // Configuration du menu paramètres
    setupSettingsMenu();

    // Charger les changelogs
    loadChangelogs();

    // Initialiser les select avec icones
    initializeIconSelects();

    // Vérifier l'état de l'authentification
    await checkAuthState();
    
    // Configuration des modales et formulaires (seulement si connecté)
    if (currentUser) {
        // Charger les transactions depuis Firebase ou localStorage
        if (db) {
            await loadTransactionsFromFirebase();
        } else {
            loadTransactionsFromLocal();
        }
        
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
        maybePromptRollover(getPreviousMonth(currentMonth), currentMonth);

        // Ajouter les valeurs par défaut aux champs de date
        const todayStr = today.toISOString().split('T')[0];
        document.getElementById('expenseDate').value = todayStr;
        document.getElementById('incomeDate').value = todayStr;
        
        // Listener pour le changement de mois
        document.getElementById('monthFilter').addEventListener('change', (e) => {
            handleMonthChange(e.target.value, selectedMonth || getSelectedMonth());
        });

        // Initialiser la navigation mobile
        initializeMobileApp();
    }
});

// ======================
// MOBILE APP SYSTEM
// ======================

let currentMobilePage = 'homePage';
let currentStatsPeriod = 'allTime';

function initializeMobileApp() {
    const navbar = document.getElementById('mobileNavbar');
    const navButtons = document.querySelectorAll('.navbar-btn');

    // Masquer tous les app-pages au démarrage
    document.querySelectorAll('.app-page').forEach(page => page.style.display = 'none');

    // Afficher la navbar mobile uniquement sur mobile
    if (navbar && window.innerWidth <= 768) {
        navbar.style.display = 'flex';
    }

    // Ajouter les événements de navigation
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = btn.getAttribute('data-page');
            switchMobilePage(pageId);
        });
    });

    // Initialiser les pages
    setupStatsPageListeners();
    setupProfilePageListeners();

    // Par défaut, afficher la page d'accueil
    switchMobilePage('homePage');
}

function switchMobilePage(pageId) {
    // Masquer tous les app-pages
    const pages = document.querySelectorAll('.app-page');
    pages.forEach(page => page.style.display = 'none');

    // Masquer le mainContainer
    const mainContainer = document.getElementById('mainContainer');
    if (mainContainer) {
        mainContainer.style.display = 'none';
    }

    // Afficher la page appropriée
    if (pageId === 'homePage') {
        if (mainContainer) {
            mainContainer.style.display = 'block';
        }
    } else {
        const newPage = document.getElementById(pageId);
        if (newPage) {
            newPage.style.display = 'block';
            
            // Mettre à jour les données
            if (pageId === 'statsPage') {
                refreshStatsPage();
            } else if (pageId === 'profilePage') {
                refreshProfilePage();
            }
        }
    }

    // Mettre à jour le navbar actif
    document.querySelectorAll('.navbar-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageId) {
            btn.classList.add('active');
        }
    });

    currentMobilePage = pageId;
}

// ======================
// STATISTICS PAGE
// ======================

function setupStatsPageListeners() {
    const periodButtons = document.querySelectorAll('.period-btn');
    
    periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatsPeriod = btn.getAttribute('data-period');
            updateStatsDisplay();
        });
    });
}

function refreshStatsPage() {
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const stats = calculateAllStatistics(transactions, currentStatsPeriod);

    // Mettre à jour les cartes principales
    document.getElementById('statsAvgExpense').textContent = formatCurrency(stats.avgExpense);
    document.getElementById('statsAvgExpenseValue').textContent = formatCurrency(stats.avgExpense);
    document.getElementById('statsMinExpense').textContent = formatCurrency(stats.minExpense);
    document.getElementById('statsMaxExpense').textContent = formatCurrency(stats.maxExpense);

    document.getElementById('statsAvgIncome').textContent = formatCurrency(stats.avgIncome);
    document.getElementById('statsAvgIncomeValue').textContent = formatCurrency(stats.avgIncome);
    document.getElementById('statsMinIncome').textContent = formatCurrency(stats.minIncome);
    document.getElementById('statsMaxIncome').textContent = formatCurrency(stats.maxIncome);

    // Balance
    const balance = stats.totalIncome - stats.totalExpense;
    document.getElementById('statsBalance').textContent = formatCurrency(balance);
    if (balance < 0) {
        document.getElementById('statsBalance').style.color = 'var(--color-expense)';
    } else {
        document.getElementById('statsBalance').style.color = 'var(--color-income)';
    }

    // Categories
    updateStatsByCategory(stats);
    
    // Update balance chart
    updateBalanceChart(stats);
}

function updateBalanceChart(stats) {
    const canvas = document.getElementById('balanceChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Préparer les données pour le graphique
    const filtered = filterTransactionsByPeriod(transactions, currentStatsPeriod);
    
    // Regrouper par date et calculer le solde cumulatif
    const balanceData = [];
    const labels = [];
    let cumulativeBalance = 0;
    
    // Trier par date
    const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculer le solde jour par jour
    const dailyData = {};
    sorted.forEach(t => {
        const date = t.date;
        if (!dailyData[date]) {
            dailyData[date] = 0;
        }
        const amount = t.type === 'income' ? t.amount : -t.amount;
        dailyData[date] += amount;
    });
    
    // Créer les points pour le graphique
    const dates = Object.keys(dailyData).sort();
    dates.forEach(date => {
        cumulativeBalance += dailyData[date];
        labels.push(new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
        balanceData.push(cumulativeBalance);
    });
    
    // Si pas de données, afficher au moins le solde actuel
    if (balanceData.length === 0) {
        labels.push('Maintenant');
        balanceData.push(stats.totalIncome - stats.totalExpense);
    }
    
    if (balanceChartInstance) {
        balanceChartInstance.destroy();
    }
    
    balanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Solde',
                data: balanceData,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    callbacks: {
                        label: function(context) {
                            return 'Solde: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        font: { size: 10 },
                        color: '#9ca3af',
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: { size: 10 },
                        color: '#9ca3af',
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateStatsByCategory(stats) {
    const container = document.getElementById('categoriesStatsList');
    container.innerHTML = '';

    const sortedCategories = Object.entries(stats.byCategory)
        .sort((a, b) => b[1].total - a[1].total);

    sortedCategories.forEach(([name, data]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-item';

        const icon = getCategoryIconClass(name);
        const iconColor = data.type === 'income' ? 'income' : 'expense';

        categoryDiv.innerHTML = `
            <div class="category-left">
                <div class="category-icon ${iconColor}">
                    <i class="${icon}"></i>
                </div>
                <div class="category-text">
                    <h4>${name}</h4>
                    <p>${data.count} transaction${data.count > 1 ? 's' : ''}</p>
                </div>
            </div>
            <div>
                <div class="category-value ${iconColor}">${formatCurrency(data.avg)}</div>
                <div style="font-size: 0.75rem; color: var(--color-text-tertiary); text-align: right;">
                    ${formatCurrency(data.min)} - ${formatCurrency(data.max)}
                </div>
            </div>
        `;
        
        container.appendChild(categoryDiv);
    });
}

// ======================
// PROFILE PAGE
// ======================

function setupProfilePageListeners() {
    const themeToggle = document.getElementById('profileThemeToggle');
    const exportBtn = document.getElementById('profileExportBtn');
    const editBtn = document.getElementById('profileEditBtn');
    const changelogBtn = document.getElementById('profileChangelogBtn');
    const logoutBtn = document.getElementById('profileLogoutBtn');
    const adminBtn = document.getElementById('profileAdminBtn');
    const testerBtn = document.getElementById('profileTesterBtn');

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            document.getElementById('themeToggle').click();
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            document.getElementById('dataTransferBtn').click();
        });
    }

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            document.getElementById('profileBtn').click();
        });
    }

    if (changelogBtn) {
        changelogBtn.addEventListener('click', () => {
            document.getElementById('changelogs-btn').click();
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            document.getElementById('logoutBtn').click();
        });
    }

    if (adminBtn) {
        adminBtn.addEventListener('click', async () => {
            if (currentUserRole !== 'Administrateur') {
                Toast.error('Accès refusé', 'Réservé aux administrateurs');
                return;
            }
            const searchInput = document.getElementById('adminUserSearch');
            if (searchInput) {
                searchInput.value = '';
            }
            await loadAdminUsers();
            openModal('adminPanelModal');
        });
    }

    if (testerBtn) {
        testerBtn.addEventListener('click', () => {
            if (currentUserRole !== 'Administrateur' && currentUserRole !== 'testeur') {
                Toast.error('Accès refusé', 'Réservé aux testeurs et admins');
                return;
            }
            testerOutputBuffer = [];
            const output = document.getElementById('testerOutput');
            if (output) {
                output.classList.remove('active');
                output.textContent = '';
            }
            openModal('testerPanelModal');
        });
    }
}

function refreshProfilePage() {
    updateProfileDisplay();
}

function updateProfileDisplay() {
    const user = firebase.auth().currentUser;

    if (user) {
        document.getElementById('profileDisplayName').textContent = user.displayName || 'Utilisateur';
        document.getElementById('profileDisplayEmail').textContent = user.email || 'N/A';
        const createdDate = new Date(user.metadata?.creationTime).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long'
        });
        document.getElementById('profileMemberSince').textContent = `Membre depuis ${createdDate}`;
    }

    // Compter les transactions
    document.getElementById('profileTotalTrans').textContent = transactions.length;

    // Compter les catégories uniques
    const categories = new Set();
    const months = new Set();
    transactions.forEach(t => {
        if (t.category) categories.add(t.category);
        const month = new Date(t.date).toISOString().slice(0, 7);
        months.add(month);
    });

    document.getElementById('profileTotalCats').textContent = categories.size;
    document.getElementById('profileActiveMonths').textContent = months.size;

    // Mettre à jour le toggle du thème
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const themeToggle = document.getElementById('profileThemeToggle');
    if (themeToggle) {
        themeToggle.checked = isDark;
    }
}

// ======================
// STATISTICS CALCULATIONS
// ======================

function calculateAllStatistics(transactionsList, period = 'allTime') {
    const filtered = filterTransactionsByPeriod(transactionsList, period);
    
    const expenses = filtered.filter(t => t.type === 'expense');
    const incomes = filtered.filter(t => t.type === 'income');

    const stats = {
        avgExpense: 0,
        maxExpense: 0,
        minExpense: 0,
        totalExpense: 0,
        avgIncome: 0,
        maxIncome: 0,
        minIncome: 0,
        totalIncome: 0,
        byCategory: {}
    };

    // Dépenses
    if (expenses.length > 0) {
        const amounts = expenses.map(e => e.amount);
        stats.totalExpense = amounts.reduce((a, b) => a + b, 0);
        stats.avgExpense = stats.totalExpense / amounts.length;
        stats.maxExpense = Math.max(...amounts);
        stats.minExpense = Math.min(...amounts);
    }

    // Recettes
    if (incomes.length > 0) {
        const amounts = incomes.map(i => i.amount);
        stats.totalIncome = amounts.reduce((a, b) => a + b, 0);
        stats.avgIncome = stats.totalIncome / amounts.length;
        stats.maxIncome = Math.max(...amounts);
        stats.minIncome = Math.min(...amounts);
    }

    // Par catégorie
    filtered.forEach(transaction => {
        const cat = transaction.category || 'Non catégorisé';
        if (!stats.byCategory[cat]) {
            stats.byCategory[cat] = {
                total: 0,
                count: 0,
                amounts: [],
                type: transaction.type
            };
        }
        stats.byCategory[cat].total += transaction.amount;
        stats.byCategory[cat].count += 1;
        stats.byCategory[cat].amounts.push(transaction.amount);
    });

    // Calculer moyennes, min, max par catégorie
    Object.keys(stats.byCategory).forEach(cat => {
        const catData = stats.byCategory[cat];
        const amounts = catData.amounts;
        catData.avg = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
        catData.min = amounts.length > 0 ? Math.min(...amounts) : 0;
        catData.max = amounts.length > 0 ? Math.max(...amounts) : 0;
    });

    return stats;
}

function filterTransactionsByPeriod(transactionsList, period) {
    const today = new Date();
    const filtered = [];

    transactionsList.forEach(t => {
        const date = new Date(t.date);
        let include = false;

        switch(period) {
            case 'allTime':
                include = true;
                break;
            case 'year':
                // 12 derniers mois
                const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
                include = date >= oneYearAgo && date <= today;
                break;
            case 'month':
                // Ce mois
                include = date.getMonth() === today.getMonth() &&
                         date.getFullYear() === today.getFullYear();
                break;
            case 'week':
                // 7 derniers jours
                const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                include = date >= sevenDaysAgo && date <= today;
                break;
        }

        if (include) {
            filtered.push(t);
        }
    });

    return filtered;
}

function getCategoryIconClass(category) {
    const iconMap = {
        'Salaire': 'fas fa-briefcase',
        'Revenus': 'fas fa-coins',
        'Épargne': 'fas fa-piggy-bank',
        'Assurances': 'fas fa-shield-alt',
        'Magasins': 'fas fa-shopping-bag',
        'Loisirs': 'fas fa-gamepad',
        'Transport': 'fas fa-bus',
        'Santé': 'fas fa-heart',
        'Restaurants': 'fas fa-utensils',
        'Abonnements': 'fas fa-subscript',
        'Factures': 'fas fa-file-invoice',
        'FastFood': 'fas fa-hamburger',
        'Services': 'fas fa-tools',
        'Autres': 'fas fa-tag'
    };
    return iconMap[category] || 'fas fa-circle';
}

// Sauvegarder automatiquement les transactions locales quand elles changent
window.addEventListener('beforeunload', () => {
    if (!db) {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
});
