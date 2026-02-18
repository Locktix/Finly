# CHANGELOG - Finly

Tous les changements notables de ce projet sont documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [1.4.0] - 2026-02-18

### Titre
Card Épargne Cumulée & Support Recettes Épargne

### Ajouté
- 💜 Nouvelle card **'Épargne Cumulée'** affichant le solde uniquement des transactions catégorie Épargne
- 💜 Couleur violet distincte pour la card épargne
- 📥 Ajout de la catégorie **'Épargne'** dans 'Ajouter une Recette'

### Modifié
- 💾 Permet désormais de tracker l'épargne en tant que revenu (ex: remboursement épargne)

---

## [1.3.0] - 2026-02-18

### Titre
Dropdowns Personnalisés & Import/Export Données

### Ajouté
- 🎨 **Dropdowns de catégories avec icônes Font Awesome** intégrées
- 📤 **Export des transactions en JSON** (avec métadonnées)
- 📊 **Export des transactions en Excel** (XLSX)
- 📥 **Import de fichiers JSON ou Excel** avec validation robuste
- 🔄 Mode import : **fusion ou remplacement** des données existantes
- ⚙️ Nouvelle option **'Importer / Exporter'** dans les paramètres

### Modifié
- 🎨 Custom select triggers pour meilleur UX sur les formulaires

### Corrigé
- 🐛 Correction du décalage de layout lors de la validation des sélects

---

## [1.2.0] - 2026-02-17

### Titre
Amélioration Profil & Données de Test

### Ajouté
- 👤 Affichage de la **date de création du compte** dans le profil
- 🔐 Intégration des **métadonnées Firebase** pour la date de création
- 📊 **Outil de génération de données de test** pour la démonstration
- 🗑️ **Fonction de suppression en masse** des transactions

---

## [1.1.0] - 2026-02-17

### Titre
Amélioration UI Mobile - Cards Transactions

### Modifié
- 🎨 **Refonte complète du design** des cartes de transaction sur mobile
- 🎨 Nouveau layout avec en-tête (description + montant)
- 🎨 Badge de catégorie avec icône redesigné
- 🎨 Séparateur horizontal entre contenu et actions
- 🎨 Pied de carte avec date (icône horloge) et boutons d'action groupés
- 📱 Réduction des espacements pour afficher plus de cartes à l'écran
- 📱 Optimisation de la taille des textes et boutons pour mobile

---

## [1.0.0] - 2026-02-16

### Titre
Release Initial - Finly MVP

### Ajouté
- ✨ **Système complet de gestion de budget**
- ✨ **Notifications toast** (success, error, info, warning, loading)
- ✨ **Design responsive** (mobile, tablet, desktop)
- ✨ **Thème clair et sombre**
- ✨ **Sélecteur de mois** avec navigation
- ✨ **Graphiques responsifs** (doughnut & bar charts)
- ✨ **Filtrage et tri** des transactions
- ✨ **Cards transactions** optimisées pour mobile
- ✨ **Indicateur de synchronisation Firebase**
- ✨ **Menu de paramètres** avec profil & déconnexion
- ✨ **Favicon SVG** personnalisé

---

## [0.9.0] - 2026-02-10

### Titre
Phase 2 - Design Responsive

### Ajouté
- 🎨 Implémentation des **breakpoints** (768px, 480px, 360px, 1200px+)
- 🎨 **Layout mobile-first** avec cards pour transactions
- 🎨 **Graphiques adaptatifs** à la taille de l'écran
- 🎨 **Formulaires optimisés** pour le toucher mobile
- 🎨 **Modales responsives** sur tous les appareils

---

## [0.8.0] - 2026-02-05

### Titre
Phase 1 - Notifications & UX

### Ajouté
- 🔔 **Système de Toast Notifications** personnalisé
- ⏳ **Spinners de chargement** sur les boutons
- ⌨️ **Fermeture des modales** avec touche ESC
- 🔄 **Indicateur de synchronisation** en temps réel
- ✏️ **Feedback visuel** des opérations asynchrones

---

## Notes

- **Format**: Ce changelog suit le standard [Keep a Changelog](https://keepachangelog.com/fr/)
- **Versioning**: Ce projet suit le [Semantic Versioning](https://semver.org/lang/fr/) (MAJOR.MINOR.PATCH)
- **Dernière mise à jour**: 18 février 2026
- **Projet**: [Finly](https://finly-f82be.firebaseapp.com/) - Gestion de budget personnelle

---

**Voir aussi**: [changelogs.json](./changelogs.json) pour le format JSON des changelogs intégrés dans l'application.
