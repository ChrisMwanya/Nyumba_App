# 1. Présentation du projet

Le projet consiste à développer une application mobile et une plateforme web permettant de :

- Référencer et mettre en avant les hôtels, restaurants, bars, salles de fête, maisons, appartements et Airbnb à Kinshasa (extension possible dans d’autres villes/pays).
- Permettre aux utilisateurs de rechercher, consulter et réserver ces lieux directement depuis l’application.
- Permettre aux annonceurs de publier et gérer leurs annonces via un tableau de bord.
- Fournir aux administrateurs un dashboard complet pour gérer les utilisateurs, annonces et paiements.
- Générer des revenus via un système de commissions, abonnements et services premium (ex. visites virtuelles).

# 2. Objectifs

- Offrir une solution centralisée de mise en relation entre clients et annonceurs.
- Garantir la fiabilité et la qualité des annonces grâce à une validation par les administrateurs.
- Permettre une gestion automatisée des paiements et commissions.
- Offrir une expérience fluide aux clients (recherche rapide, réservation simple, paiement sécurisé).
- Donner aux annonceurs un outil de gestion de leurs annonces et de suivi statistique.

# 3. Périmètre fonctionnel

## 3.1. Application Mobile (clients)

### Accueil
- Choix de la langue.
- Recherche par mot-clé, catégorie, localisation (à proximité via GPS).
- Filtres : prix, ville, note, disponibilité.
- Liste des annonces (hôtels, restaurants, bars, salles, maisons, appartements, Airbnb).
- Carte interactive (Google Maps API / OpenStreetMap).

### Annonce (fiche détaillée)
- Titre, description, prix, localisation.
- Galerie photos.
- Visite virtuelle 360° (si dispo).
- Informations de contact.
- Avis/notes des clients.
- Bouton Réserver.

### Réservation
- Choix des dates, options.
- Calcul automatique du prix.
- Paiement intégré (Mobile Money, carte bancaire, PayPal).
- Confirmation par notification et email.

### Compte utilisateur
- Inscription/Connexion (email, téléphone, Google, Facebook).
- Historique de réservations.
- Avis laissés.
- Profil (photo, infos personnelles).