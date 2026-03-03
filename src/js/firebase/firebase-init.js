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
    // Ne pas charger les données ici, attendre checkAuthState
}