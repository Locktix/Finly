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

function hideAppLoader() {
    const loader = document.getElementById('appLoader');
    const body = document.body;
    
    // Clear le timeout de sécurité s'il existe
    if (appLoaderTimeout) {
        clearTimeout(appLoaderTimeout);
        appLoaderTimeout = null;
    }
    
    // Toujours retirer l'état loading pour éviter tout écran bloqué
    body.classList.remove('loading');

    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.remove();
        }, 300);
    }
}

function showAuthPage() {
    hideAppLoader();
    const authPage = document.getElementById('authPage');
    const mainHeader = document.getElementById('mainHeader');
    const mainFooter = document.getElementById('mainFooter');
    const chartsSection = document.getElementById('chartsSection');
    const mainContainer = document.getElementById('mainContainer');
    const mobileNavbar = document.getElementById('mobileNavbar');

    if (authPage) authPage.style.display = 'flex';
    if (mainHeader) mainHeader.style.display = 'none';
    if (mainFooter) mainFooter.style.display = 'none';
    if (chartsSection) {
        chartsSection.style.display = 'none';
        chartsSection.classList.remove('active-page');
    }
    if (mainContainer) {
        mainContainer.style.display = 'none';
        mainContainer.classList.remove('active-page');
    }
    if (mobileNavbar) mobileNavbar.style.display = 'none';

    document.querySelectorAll('.app-page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active-page');
    });
    
    // Retirer les classes de layout pour que les pages ne soient pas affichées
    document.body.classList.remove('mobile-layout', 'desktop-layout');

    // Fermer toute modale ouverte
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

function showDashboard() {
    hideAppLoader();
    // Sécurité : fermer les overlays éventuels qui peuvent bloquer les clics
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';

    document.getElementById('authPage').style.display = 'none';
    document.getElementById('mainHeader').style.display = 'block';
    document.getElementById('mainFooter').style.display = 'block';
    document.getElementById('chartsSection').style.display = 'block';

    // Appliquer l'état responsive
    applyResponsiveLayoutState();

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




