<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Stripe\StripeClient;

/**
 * Création de l'intention de paiement pour la billetterie web.
 *
 * Le navigateur ne peut pas créer de PaymentIntent : cela exige la clé
 * secrète, qui ne doit jamais quitter le serveur. Il reçoit en retour un
 * `client_secret`, lequel ne permet que de confirmer CE paiement précis,
 * pour CE montant.
 *
 * Requêtes en `application/x-www-form-urlencoded`, comme ticket/web/book.
 */
class EventPaymentController extends Controller
{
    public function createIntent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'event_id'    => 'required|integer',
            'ticket_type' => 'required|string',
            'seat'        => 'required|integer|min:1|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => collect($validator->errors()->messages())
                    ->map(fn ($messages, $field) => [
                        'code'    => $field,
                        'message' => $messages[0],
                    ])->values(),
            ], 403);
        }

        /*
         * Le tarif est relu en base : ne jamais faire confiance à un montant
         * transmis par le client, qui paierait sinon 1 € un billet à 15 €.
         *
         * Ajustez le nom de la table si le vôtre diffère — il s'agit de
         * celle qui alimente le tableau `prices` de /api/v2/events/list.
         */
        $price = DB::table('event_prices')
            ->where('event_id', $request->event_id)
            ->where('type', $request->ticket_type)
            ->where('status', 'active')
            ->first();

        if (! $price) {
            return response()->json([
                'errors' => [[
                    'code'    => 'ticket_type',
                    'message' => 'Tarif introuvable pour cet événement.',
                ]],
            ], 404);
        }

        // Contrôle du stock restant, tant qu'à interroger la base.
        $remaining = (int) $price->nb_ticket - (int) $price->ticket_book;
        if ($remaining < (int) $request->seat) {
            return response()->json([
                'errors' => [[
                    'code'    => 'seat',
                    'message' => "Il ne reste que {$remaining} place(s).",
                ]],
            ], 409);
        }

        // Stripe raisonne en plus petite unité monétaire : centimes pour l'euro.
        $amount = (int) round($price->price * (int) $request->seat * 100);

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
