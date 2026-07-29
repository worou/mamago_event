<?php

namespace App\Mail;

use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Billet envoyé par email après réservation.
 *
 * Le QR code est joint en pièce jointe *inline* et référencé depuis le
 * corps HTML. Les images distantes sont bloquées par défaut dans la
 * plupart des messageries : un QR chargé depuis une URL ne s'afficherait
 * pas, ce qui rendrait le billet inutilisable.
 */
class TicketBookedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $ticket;
    public $event;
    public $buyerName;

    /** Octets PNG du QR code, intégrés par la vue via embedData(). */
    public $qrData;

    public function __construct($ticket, $event, string $buyerName)
    {
        $this->ticket = $ticket;
        $this->event = $event;
        $this->buyerName = $buyerName;
    }

    public function build()
    {
        // La charge utile du QR doit suffire au contrôle à l'entrée :
        // la référence de transaction identifie la réservation.
        $payload = $this->ticket->transaction_id ?: (string) $this->ticket->id;

        $qr = Builder::create()
            ->writer(new PngWriter())
            ->data($payload)
            ->encoding(new Encoding('UTF-8'))
            ->errorCorrectionLevel(ErrorCorrectionLevel::Medium)
            ->size(320)
            ->margin(10)
            ->build();

        $this->qrData = $qr->getString();

        return $this
            ->subject('Votre billet — ' . $this->event->title)
            ->view('emails.ticket')
            // Également joint en fichier, pour l'imprimer facilement.
            ->attachData($this->qrData, 'billet-qr-code.png', ['mime' => 'image/png']);
    }
}
