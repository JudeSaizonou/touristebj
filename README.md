# 🌍 Le touriste.bj - Plateforme Complète de Gestion de Voyages

Application full-stack React TypeScript + Tailwind CSS avec gestion locale des données (localStorage) pour une agence de voyages moderne et professionnelle.

## ✨ Fonctionnalités Complètes

### 🎯 **Partie Publique (Client)**
- **Catalogue des Voyages**
  - Liste complète avec images, prix, durées
  - Système de notation avec étoiles
  - Filtres et tri (prix, nom, etc.)
  - Pagination fluide
  - Design responsive avec effets hover

- **Page Détails du Voyage**
  - Galerie photos interactive
  - Onglets (Description, Itinéraire, Politique)
  - Itinéraire jour par jour avec accordéons
  - Liste des inclusions/exclusions
  - Formulaire de réservation complet
  - Calcul automatique des prix (adultes + enfants)
  - Calcul d'acompte
  - Choix de méthode de paiement

### 🔐 **Partie Administration (Backoffice)**
- **Dashboard**
  - 6 cartes KPI (réservations, acomptes, utilisateurs, etc.)
  - 2 graphiques interactifs (Recharts)
  - Données dynamiques du localStorage

- **Gestion des Voyages**
  - Table complète avec tri et filtres
  - Sélection multiple
  - Statuts visuels (Pause, En cours, Complet)
  - Actions CRUD (Create, Read, Update, Delete)
  - Export CSV
  - Pagination

- **Création de Voyage**
  - Formulaire complet multi-sections
  - Upload de photos (jusqu'à 6 images)
  - Gestion dynamique des listes (inclus/non inclus)
  - Sélecteurs intelligents
  - Validation visuelle

- **Modification de Voyage** (3 onglets)
  - **Détails** : Formulaire pré-rempli
  - **Liste des voyageurs** : Table avec statuts de paiement
  - **Statistiques** : KPIs spécifiques au voyage

## 🛠️ Technologies

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build**: Vite
- **Icons**: Lucide React
- **Charts**: Recharts
- **Fonts**: Inter + Outfit
- **Storage**: LocalStorage

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build production
npm run build

# Preview
npm run preview
```

## 💾 LocalStorage

Au premier lancement, 3 voyages sont créés automatiquement. Toutes les données sont stockées localement et persistent entre les sessions.

## 🎨 Design

Fidèle aux maquettes Figma au pixel près avec :
- Couleurs orange (#F97316) comme principale
- Typographie Inter + Outfit
- Animations et transitions soignées
- Responsive mobile/desktop

## 🚀 Production Ready

- Code TypeScript typé
- Components réutilisables
- Service de données centralisé
- Validation des formulaires
- Messages de confirmation
- Gestion d'erreurs

---

**Développé avec ❤️ - Le touriste.bj**
