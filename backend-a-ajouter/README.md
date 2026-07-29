# La route manquante, côté backend

Ce dossier ne fait pas partie du frontend. Il contient le seul morceau
absent pour que le paiement par carte fonctionne, à ajouter dans votre
application Laravel MamaGo.

## Pourquoi c'est indispensable

Confirmer un paiement Stripe exige un `client_secret`, produit par un
PaymentIntent créé **avec la clé secrète**. Cette clé ne peut pas vivre
dans le frontend : Vite inline toute variable `VITE_*` en clair dans le
bundle JavaScript, et le dépôt est public. Elle serait donc lisible par
n'importe quel visiteur, qui pourrait alors créer des paiements et
surtout **émettre des remboursements**.

Le partage des rôles est celui prévu par Stripe :

| | Clé | Rôle |
| --- | --- | --- |
| Serveur | `sk_test_…` | Crée le PaymentIntent, renvoie le `client_secret` |
| Navigateur | `pk_test_…` | Confirme le paiement avec ce `client_secret` |

Le numéro de carte ne transite jamais par votre serveur ni par le nôtre :
il est saisi dans une iframe servie par Stripe.

## 1. Installer le SDK

```bash
composer require stripe/stripe-php
```

## 2. Déclarer les clés

Dans le `.env` de Laravel — **jamais dans le frontend** :

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 3. Le contrôleur

Le fichier est fourni tel quel : **`EventPaymentController.php`**, à placer
dans `app/Http/Controllers/Api/V2/`.

Un seul point à vérifier : le nom de la table des tarifs, supposé
`event_prices` — c'est celle qui alimente le tableau `prices` de
`/api/v2/events/list`. Ajustez-le si le vôtre diffère.

Deux garde-fous y sont intégrés :

- **le montant est relu en base**, jamais accepté depuis le client. Sinon
  n'importe qui modifie la requête et paie 1 € un billet à 15 € ;
- **le stock restant est contrôlé** avant de créer le paiement, ce qui
  évite d'encaisser pour des places qui n'existent plus.

## 4. La route

Dans `routes/api.php`, au même niveau que la réservation :

```php
Route::group(['prefix' => 'v2/events/ticket/web'], function () {
    Route::post('payment-intent', [EventPaymentController::class, 'createIntent']);
    // Route::post('book', ...) — déjà existante
});
```

## 5. La configuration

Dans `config/services.php` :

```php
'stripe' => [
    'secret' => env('STRIPE_SECRET_KEY'),
],
```

## Contrat attendu par le frontend

```
POST /api/v2/events/ticket/web/payment-intent
Content-Type: application/x-www-form-urlencoded

  event_id=14&ticket_type=Standart&seat=1
```

Réponse attendue — exemple réel, produit avec votre clé de test :

```json
{
  "client_secret": "pi_3TyXT52R2lVtQ8we1MWg7ADU_secret_gSClZO4LLiRUDyiauWkL31fxJ",
  "transaction_id": "pi_3TyXT52R2lVtQ8we1MWg7ADU",
  "amount": 15,
  "currency": "eur"
}
```

Seul `client_secret` est indispensable : c'est lui que le navigateur passe
à `stripe.confirmCardPayment()`. Les trois autres champs servent au
contrôle et à l'affichage.

Le frontend est déjà branché sur ce contrat : dès que la route répond, le
paiement par carte fonctionne sans aucune modification côté client.

## Deux corrections utiles pendant que vous y êtes

**`ticket/web/book` refuse le JSON.** Elle répond 500 sur tout corps
`application/json` et n'accepte que du `x-www-form-urlencoded`. Le
frontend s'y conforme, mais c'est un piège pour toute autre intégration.

**`ticket/web/book` ignore `user_id`.** Vérifié en envoyant `42` : la
valeur est écartée et `1` est enregistré. Aucune réservation n'est donc
rattachée à un client, y compris connecté — l'espace « Mes réservations »
ne peut rien afficher tant que ce n'est pas corrigé.
