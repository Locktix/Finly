// ======================
// GESTION MOT DE PASSE OUBLIÉ
// ======================
export async function handleForgotPassword(e) {
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
// GESTION DE L'AUTHENTIFICATION
// ======================
var currentUser = null;
var currentUserRole = 'membre';
const ADMIN_UID = '6aqDFLL8obNSdUKoAmdnm9kgMEg2';
const ROLE_OPTIONS = ['Administrateur', 'testeur', 'membre'];
var adminUsersCache = [];
var adminViewUser = null;
var testerOutputBuffer = [];
var appLoaderTimeout = null;

Object.defineProperty(window, 'currentUser', {
    get: () => currentUser,
    set: (value) => { currentUser = value; },
    configurable: true
});

Object.defineProperty(window, 'currentUserRole', {
    get: () => currentUserRole,
    set: (value) => { currentUserRole = value; },
    configurable: true
});

Object.defineProperty(window, 'adminUsersCache', {
    get: () => adminUsersCache,
    set: (value) => { adminUsersCache = value; },
    configurable: true
});

Object.defineProperty(window, 'adminViewUser', {
    get: () => adminViewUser,
    set: (value) => { adminViewUser = value; },
    configurable: true
});

Object.defineProperty(window, 'testerOutputBuffer', {
    get: () => testerOutputBuffer,
    set: (value) => { testerOutputBuffer = value; },
    configurable: true
});

Object.defineProperty(window, 'appLoaderTimeout', {
    get: () => appLoaderTimeout,
    set: (value) => { appLoaderTimeout = value; },
    configurable: true
});

window.ADMIN_UID = ADMIN_UID;
window.ROLE_OPTIONS = ROLE_OPTIONS;

export function setupAuthListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('toggleAuthBtn').addEventListener('click', toggleAuthForm);
    const settingsLogoutBtn = document.getElementById('logoutBtn');
    if (settingsLogoutBtn) {
        settingsLogoutBtn.addEventListener('click', handleLogout);
    }
    
    // Event listeners pour les modales d'authentification
    document.getElementById('forgotPasswordBtn').addEventListener('click', () => {
        openModal('forgotPasswordModal');
    });

    document.getElementById('closeForgotPassword').addEventListener('click', () => {
        closeModal('forgotPasswordModal');
    });

    document.getElementById('forgotPasswordForm').addEventListener('submit', handleForgotPassword);
}

export function toggleAuthForm() {
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

export function clearAuthErrors() {
    document.getElementById('loginError').textContent = '';
    document.getElementById('signupError').textContent = '';
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('signupError').classList.remove('show');
}

export async function handleLogin(e) {
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

export async function handleSignup(e) {
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

export async function handleLogout() {
    try {
        await firebase.auth().signOut();
        currentUser = null;
        currentUserRole = 'membre';
        adminViewUser = null;
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

export function getErrorMessage(code) {
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

window.handleForgotPassword = handleForgotPassword;
window.setupAuthListeners = setupAuthListeners;
window.toggleAuthForm = toggleAuthForm;
window.clearAuthErrors = clearAuthErrors;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleLogout = handleLogout;
window.getErrorMessage = getErrorMessage;
