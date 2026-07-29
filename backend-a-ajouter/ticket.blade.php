{{--
  Gabarit de l'email de billet.

  Mise en page en tableaux et styles en ligne : c'est la seule façon
  d'obtenir un rendu fiable dans Outlook et Gmail, qui ignorent flexbox,
  grid et une bonne partie des feuilles de style externes.

  À placer dans resources/views/emails/ticket.blade.php
--}}
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Votre billet</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:Arial,Helvetica,sans-serif; color:#0f172a;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:24px 12px;">
    <tr>
      <td align="center">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden;">

          {{-- Bandeau --}}
          <tr>
            <td style="background-color:#0a7d4a; padding:28px 32px;">
              <p style="margin:0; font-size:22px; font-weight:bold; color:#ffffff;">
                {{ config('app.name', 'MamaGo') }}
              </p>
              <p style="margin:6px 0 0; font-size:14px; color:#cdf2de;">
                Votre billet électronique
              </p>
            </td>
          </tr>

          {{-- Message --}}
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 16px; font-size:16px;">
                Bonjour {{ $buyerName }},
              </p>
              <p style="margin:0; font-size:15px; line-height:1.6; color:#475569;">
                Votre réservation est confirmée. Présentez le QR code ci-dessous
                à l'entrée de l'événement — vous pouvez l'imprimer ou le montrer
                depuis votre téléphone.
              </p>
            </td>
          </tr>

          {{-- Billet --}}
          <tr>
            <td style="padding:24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:12px;">
                <tr>
                  <td align="center" style="padding:24px; border-right:1px dashed #e2e8f0;" width="45%">
                    {{-- embedData intègre l'image au message : elle s'affiche
                         même quand la messagerie bloque les images distantes. --}}
                    <img src="{{ $message->embedData($qrData, 'qr-code.png', 'image/png') }}"
                         alt="QR code du billet"
                         width="180" height="180"
                         style="display:block; width:180px; height:180px;">
                    <p style="margin:12px 0 0; font-size:11px; color:#94a3b8;">
                      À présenter à l'entrée
                    </p>
                  </td>
                  <td style="padding:24px;" valign="top">
                    <p style="margin:0; font-size:11px; color:#94a3b8;">N° de commande</p>
                    <p style="margin:2px 0 14px; font-size:14px; font-weight:bold; color:#0a7d4a; word-break:break-all;">
                      {{ $ticket->transaction_id ?? $ticket->id }}
                    </p>

                    <p style="margin:0; font-size:11px; color:#94a3b8;">Type de billet</p>
                    <p style="margin:2px 0 14px; font-size:14px; font-weight:bold;">
                      {{ $ticket->ticket_type ?? 'Standard' }}
                    </p>

                    <p style="margin:0; font-size:11px; color:#94a3b8;">Quantité</p>
                    <p style="margin:2px 0 14px; font-size:14px; font-weight:bold;">
                      {{ $ticket->nb_seat }}
                    </p>

                    <p style="margin:0; font-size:11px; color:#94a3b8;">Total payé</p>
                    <p style="margin:2px 0 0; font-size:14px; font-weight:bold;">
                      {{ number_format((float) $ticket->total, 2, ',', ' ') }} €
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {{-- Événement --}}
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eafaf1; border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px; font-size:16px; font-weight:bold;">
                      {{ $event->title }}
                    </p>
                    <p style="margin:0 0 6px; font-size:14px; color:#334155;">
                      📅 {{ $event->date }}@if($event->time) — {{ $event->time }}@endif
                    </p>
                    @if($event->location)
                      <p style="margin:0; font-size:14px; color:#334155;">
                        📍 {{ $event->location }}
                      </p>
                    @endif
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {{-- Mentions --}}
          <tr>
            <td style="padding:0 32px 32px;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#94a3b8;">
                Ce billet est unique et non transférable. Toute reproduction peut
                être refusée à l'entrée. Conservez ce message : il vous permet de
                retrouver votre réservation à tout moment.
              </p>
            </td>
          </tr>

          {{-- Pied --}}
          <tr>
            <td style="background-color:#07110d; padding:20px 32px;">
              <p style="margin:0; font-size:12px; color:#94a3b8;">
                {{ config('app.name', 'MamaGo') }} — Une question ?
                Écrivez-nous à {{ config('mail.from.address') }}
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
