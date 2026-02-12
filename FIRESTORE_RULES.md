# Règles de Sécurité Firestore - Finly

## Instructions de Configuration

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet "finly-f82be"
3. Allez à **Firestore Database** → **Rules**
4. Remplacez les règles existantes par le code ci-dessous
5. Cliquez sur **Publish**

## Code des Règles de Sécurité

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Transactions collection
    match /transactions/{document=**} {
      // Lecture: seulement les transactions de l'utilisateur connecté
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      // Création: seulement pour l'utilisateur connecté
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.userId != '';
      
      // Modification: seulement les transactions de l'utilisateur
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid &&
                       request.resource.data.userId == request.auth.uid;
      
      // Suppression: seulement les transactions de l'utilisateur
      allow delete: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
    }
  }
}
```

## Explication des Règles

- **read**: L'utilisateur ne peut lire que ses propres transactions (filtre par userId)
- **create**: L'utilisateur ne peut créer que ses propres transactions avec son userId
- **update**: L'utilisateur ne peut modifier que ses propres transactions
- **delete**: L'utilisateur ne peut supprimer que ses propres transactions

## Vérification

Après avoir publié les règles:
1. Créez un compte et ajoutez une transaction
2. Créez un autre compte et vérifiez que vous ne voyez pas les transactions du premier compte
3. Testez la modification et la suppression

## Sécurité Additionnelle (Optionnel)

Si tu veux ajouter des validations supplémentaires, tu peux étendre les règles:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{document=**} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.userId != '' &&
                       request.resource.data.type in ['expense', 'income'] &&
                       request.resource.data.amount > 0 &&
                       request.resource.data.category != '' &&
                       request.resource.data.description != '';
      
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid &&
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.type in ['expense', 'income'] &&
                       request.resource.data.amount > 0;
      
      allow delete: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
    }
  }
}
```

Cette version ajoute des validations:
- Type de transaction (expense ou income)
- Montant positif
- Catégorie et description non vides
