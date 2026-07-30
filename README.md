# MamaGo Events — Billetterie en ligne

Interface de billetterie construite en React, consommant l'API MamaGo.
L'acheteur réserve son billet en quelques clics, avec ou sans compte
préexistant, et reçoit un billet numérique muni d'un QR code.

![Étapes du tunnel](images/WhatsApp%20Image%202026-07-27%20at%2022.41.39.jpeg)

## Démarrage

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

La documentation technique complète — architecture, contraintes de l'API,
déploiement — se trouve dans **[frontend/README.md](frontend/README.md)**.

## Fonctionnalités

| Écran | Contenu |
| --- | --- |
| Accueil | Bannières, catégories, événements du jour et tendances |
| Catalogue | Recherche et filtre par catégorie |
| Fiche événement | Description, galerie, informations pratiques, carte, organisateurs, grille tarifaire |
| Tunnel (4 étapes) | Inscription ou connexion → paiement → confirmation → billet |
| Mes réservations | Historique des commandes et accès aux billets |
| Lieux, Favoris | Regroupement par lieu, mise de côté d'événements |

Le billet est généré avec un QR code, téléchargeable en PDF et ajoutable
aux calendriers Google, Apple et Outlook.

## Pile technique

React 19 · Vite 7 · React Router 7 · Tailwind CSS 4 · `qrcode` · `jsPDF`

Aucun backend dans ce dépôt : l'application consomme une API existante.

## Structure

```
frontend/
  src/
    api/         Client HTTP, routes, adaptateurs, services
    components/  Composants d'interface, par domaine
    context/     Configuration, session, réservation, favoris
    pages/       Un fichier par écran
    lib/         Formatage monétaire, QR/PDF, calendrier
  scripts/
    smoke-api.mjs   Contrôle des adaptateurs contre l'API réelle
images/          Maquettes de référence
```

## Mise en production

La procédure complète est dans **[MISE-EN-LIGNE.md](MISE-EN-LIGNE.md)**.

Un préalable bloquant : le compte Stripe n'est pas activé — dossier non
soumis, encaissements et virements désactivés. Aucun paiement réel ne peut
aboutir avant cette activation, quelles que soient les clés employées.

## Points ouverts

Le contrat de `POST /api/v2/customer/events/ticket/book` n'a pas pu être
confirmé : la route est authentifiée et renvoie 401 sans jeton, ce qui
empêche de lire ses erreurs de validation. La procédure de vérification est
décrite dans [frontend/README.md](frontend/README.md#point-ouvert--ticketbook).

Les écarts assumés avec les maquettes — champs carte, frais de service,
statistiques, blocs de téléchargement d'application — y sont également
justifiés un par un.
