<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Billet envoyé par email après réservation.
 *
 * Les QR codes sont **intégrés au message** et non chargés depuis une URL :
 * Gmail et Outlook bloquent les images distantes par défaut, un QR distant
 * resterait invisible et le billet serait inutilisable à l'entrée.
 *
 * Une place = un QR code. Le tableau `$seats` en porte autant que la
 * réservation en compte, chacun avec son numéro de billet.
 */
class TicketBookedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $ticket;
    public $event;
    public string $buyerName;

    /** Places : [{ number, type, name, price, qr (octets PNG) }, …] */
    public array $seats;

    public function __construct($ticket, $event, string $buyerName, array $seats = [])
    {
        $this->ticket = $ticket;
        $this->event = $event;
        $this->buyerName = $buyerName;
        $this->seats = $seats;
    }

    public function build()
    {
        $mail = $this
            ->subject('Votre billet — ' . ($this->event->title ?? 'Événement'))
            ->view('emails.ticket');

        // Chaque QR est aussi joint en fichier, pour l'impression.
        foreach ($this->seats as $index => $seat) {
            if (empty($seat['qr'])) {
                continue;
            }

            $name = $seat['number'] ?: (string) ($index + 1);
            $mail->attachData($seat['qr'], "billet-{$name}.png", [
                'mime' => 'image/png',
            ]);
        }

        return $mail;
    }
}
