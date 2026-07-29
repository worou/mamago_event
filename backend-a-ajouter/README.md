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

`app/Http/Controllers/Api/V2/EventPaymentController.php` :

```php
<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Stripe\StripeClient;

class EventPaymentController extends Controller
{
    /**
     * Crée un PaymentIntent et renvoie son client_secret.
     *
     * Le montant est recalculé côté serveur à partir de l'événement et du
     * tarif : ne jamais faire confiance à un montant envoyé par le client,
     * qui pourrait payer 1 € un billet à 15 €.
     */
    public function createIntent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'event_id'    => 'required|integer|exists:events,id',
            'ticket_type' => 'required|string',
            'seat'        => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 403);
        }

        $price = \App\Models\EventPrice::where('event_id', $request->event_id)
            ->where('type', $request->ticket_type)
            ->where('status', 'active')
            ->first();

        if (! $price) {
            return response()->json([
                'errors' => [['code' => 'ticket_type', 'message' => 'Tarif introuvable.']],
            ], 404);
        }

        $amount = (int) round($price->price * $request->seat * 100); // en centimes

        $stripe = new StripeClient(config('services.stripe.secret'));

        $intent = $stripe->paymentIntents->create([
            'amount'                    => $amount,
            'currency'                  => 'eur',
            'automatic_payment_methods' => ['enabled' => true],
            'metadata'                  => [
                'event_id'    => $request->event_id,
                'ticket_type' => $request->ticket_type,
                'seat'        => $request->seat,
            ],
        ]);

        return response()->json([
            'client_secret'  => $intent->client_secret,
            'transaction_id' => $intent->id,
            'amount'         => $amount / 100,
            'currency'       => 'eur',
        ]);
    }
}
```

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
  event_id=14&ticket_type=Standart&seat=2

→ 200 { "client_secret": "pi_..._secret_...",
        "transaction_id": "pi_...",
        "amount": 30, "currency": "eur" }
```

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
