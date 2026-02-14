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
    // Collection users avec uid comme doc ID
    match /users/{uid} {
      // L'utilisateur peut lire/modifier/supprimer ses propres données
      allow read, write: if request.auth != null && 
                           request.auth.uid == uid;
      
      // Subcollection transactions
      match /transactions/{document=**} {
        // Lecture: seulement les transactions de l'utilisateur connecté
        allow read: if request.auth != null && 
                       request.auth.uid == uid;
        
        // Création: seulement pour l'utilisateur connecté
        allow create: if request.auth != null && 
                         request.auth.uid == uid;
        
        // Modification: seulement les transactions de l'utilisateur
        allow update: if request.auth != null && 
                         request.auth.uid == uid;
        
        // Suppression: seulement les transactions de l'utilisateur
        allow delete: if request.auth != null && 
                         request.auth.uid == uid;
      }
    }
  }
}
```

## Explication des Règles

- **users/{uid}**: Chaque utilisateur a un document avec son UID (identifiant unique Firebase) comme ID
- **read/write sur user**: L'utilisateur ne peut accéder qu'à son propre document
- **transactions/{doc}**: Les transactions sont stockées dans une subcollection sous le user
- **read**: L'utilisateur ne peut lire que ses propres transactions
- **create**: L'utilisateur ne peut créer que ses propres transactions
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
    match /users/{uid} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == uid;
      
      match /transactions/{document=**} {
        allow read: if request.auth != null && 
                       request.auth.uid == uid;
        
        allow create: if request.auth != null && 
                         request.auth.uid == uid &&
                         request.resource.data.type in ['expense', 'income'] &&
                         request.resource.data.amount > 0 &&
                         request.resource.data.category != '' &&
                         request.resource.data.description != '';
        
        allow update: if request.auth != null && 
                         request.auth.uid == uid &&
                         request.resource.data.type in ['expense', 'income'] &&
                         request.resource.data.amount > 0;
        
        allow delete: if request.auth != null && 
                         request.auth.uid == uid;
      }
    }
  }
}
```

Cette version ajoute des validations:
- Type de transaction (expense ou income)
- Montant positif
- Catégorie et description non vides
