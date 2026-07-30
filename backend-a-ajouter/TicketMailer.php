<?php

namespace App\Services;

use App\Mail\TicketBookedMail;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Envoi du billet par email.
 *
 * Regroupé dans un service plutôt que dans un contrôleur, parce que deux
 * appelants en ont besoin : la réservation (envoi initial) et la route de
 * renvoi (« je n'ai pas reçu mon billet »). Dupliquer la logique aurait
 * garanti qu'un jour l'une des deux diverge.
 */
class TicketMailer
{
    /**
     * @param  object      $ticket     ligne de `event_tickets`, avec ses `seats`
     * @param  object      $event      ligne de `events`
     * @param  string      $email      adresse de réception — celle saisie par le client
     * @param  string|null $buyerName  nom affiché dans le message
     * @return bool                    true si l'envoi a abouti
     */
    public static function send($ticket, $event, string $email, ?string $buyerName = null): bool
    {
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Log::warning('Billet non envoyé : adresse invalide', [
                'ticket' => $ticket->id ?? null,
                'email'  => $email,
            ]);

            return false;
        }

        /*
         * Un QR code par place.
         *
         * Le serveur émet une place par billet, chacune avec son propre
         * `qr_code` : deux personnes ne peuvent pas entrer avec le même
         * code, l'email doit donc les porter tous.
         */
        $seats = collect($ticket->seats ?? [])->map(function ($seat) {
            $payload = is_array($seat) ? ($seat['qr_code'] ?? null) : ($seat->qr_code ?? null);
            $number  = is_array($seat) ? ($seat['ticket_number'] ?? '') : ($seat->ticket_number ?? '');
            $type    = is_array($seat) ? ($seat['ticket_type'] ?? '') : ($seat->ticket_type ?? '');
            $name    = is_array($seat) ? ($seat['name'] ?? '') : ($seat->name ?? '');
            $price   = is_array($seat) ? ($seat['price'] ?? 0) : ($seat->price ?? 0);

            return [
                'number' => $number,
                'type'   => $type,
                'name'   => $name,
                'price'  => $price,
                'qr'     => self::qrPng($payload ?: $number),
            ];
        })->all();

        try {
            Mail::to($email)->send(
                new TicketBookedMail($ticket, $event, $buyerName ?: 'Client', $seats)
            );

            Log::info('Billet envoyé', [
                'ticket' => $ticket->id ?? null,
                'email'  => $email,
                'places' => count($seats),
            ]);

            return true;
        } catch (\Throwable $e) {
            /*
             * Un serveur SMTP indisponible ne doit jamais faire échouer une
             * réservation déjà payée. On trace et on rend la main : le client
             * garde le téléchargement PDF, et la route de renvoi permettra
             * de retenter.
             */
            Log::error('Envoi du billet impossible', [
                'ticket' => $ticket->id ?? null,
                'email'  => $email,
                'erreur' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /** Octets PNG du QR code. GD suffit, Imagick n'est pas requis. */
    private static function qrPng(string $payload): string
    {
        return Builder::create()
            ->writer(new PngWriter())
            ->data($payload)
            ->encoding(new Encoding('UTF-8'))
            ->errorCorrectionLevel(ErrorCorrectionLevel::Medium)
            ->size(320)
            ->margin(10)
            ->build()
            ->getString();
    }
}
