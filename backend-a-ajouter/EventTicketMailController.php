<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Services\TicketMailer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * Renvoi du billet par email — « je n'ai pas reçu mon billet ».
 *
 * L'envoi initial se fait depuis le contrôleur de réservation, pour partir
 * même si l'acheteur ferme son onglet aussitôt après avoir payé. Cette
 * route ne couvre que le second envoi, déclenché depuis l'interface.
 *
 * Requêtes en `application/x-www-form-urlencoded`, comme le reste du
 * module événementiel.
 */
class EventTicketMailController extends Controller
{
    public function resend(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|string|max:255',
            'email'          => 'required|email',
            'name'           => 'nullable|string|max:255',
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
         * Ajustez les noms de tables si les vôtres diffèrent. `event_tickets`
         * est celle qu'alimente ticket/web/book, `event_ticket_seats` celle
         * du tableau `seats` de sa réponse.
         */
        $ticket = DB::table('event_tickets')
            ->where('transaction_id', $request->transaction_id)
            ->first();

        if (! $ticket) {
            return response()->json([
                'errors' => [[
                    'code'    => 'transaction_id',
                    'message' => 'Réservation introuvable.',
                ]],
            ], 404);
        }

        $ticket->seats = DB::table('event_ticket_seats')
            ->where('ticket_id', $ticket->id)
            ->get()
            ->all();

        $event = DB::table('events')->where('id', $ticket->event_id)->first();

        if (! $event) {
            return response()->json([
                'errors' => [[
                    'code'    => 'event',
                    'message' => 'Événement introuvable.',
                ]],
            ], 404);
        }

        $sent = TicketMailer::send(
            $ticket,
            $event,
            $request->email,
            $request->name
        );

        if (! $sent) {
            return response()->json([
                'errors' => [[
                    'code'    => 'mail',
                    'message' => "L'envoi a échoué. Réessayez dans un instant.",
                ]],
            ], 500);
        }

        return response()->json([
            'message' => 'Billet renvoyé.',
            'email'   => $request->email,
            'places'  => count($ticket->seats),
        ]);
    }
}
