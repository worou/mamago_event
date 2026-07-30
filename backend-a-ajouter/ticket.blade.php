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
                {{ count($seats) > 1 ? 'Vos billets électroniques' : 'Votre billet électronique' }}
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
                Votre réservation est confirmée.
                @if(count($seats) > 1)
                  Elle comporte <strong>{{ count($seats) }} billets</strong>, chacun
                  avec son propre QR code. Présentez-les à l'entrée de l'événement.
                @else
                  Présentez le QR code ci-dessous à l'entrée de l'événement — vous
                  pouvez l'imprimer ou le montrer depuis votre téléphone.
                @endif
              </p>
            </td>
          </tr>

          {{-- Un bloc par place --}}
          @foreach($seats as $index => $seat)
            <tr>
              <td style="padding:{{ $index === 0 ? '24px' : '0 24px 24px' }} 32px;">
                @if(count($seats) > 1)
                  <p style="margin:0 0 8px; font-size:11px; font-weight:bold; letter-spacing:0.5px; color:#64748b; text-transform:uppercase;">
                    Place {{ $index + 1 }} sur {{ count($seats) }}
                  </p>
                @endif

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:12px;">
                  <tr>
                    <td align="center" style="padding:24px; border-right:1px dashed #e2e8f0;" width="45%">
                      {{-- embedData intègre l'image au message : elle s'affiche
                           même quand la messagerie bloque les images distantes. --}}
                      <img src="{{ $message->embedData($seat['qr'], 'qr-'.$seat['number'].'.png', 'image/png') }}"
                           alt="QR code du billet {{ $seat['number'] }}"
                           width="170" height="170"
                           style="display:block; width:170px; height:170px;">
                      <p style="margin:12px 0 0; font-size:11px; color:#94a3b8;">
                        À présenter à l'entrée
                      </p>
                    </td>
                    <td style="padding:24px;" valign="top">
                      <p style="margin:0; font-size:11px; color:#94a3b8;">N° de billet</p>
                      <p style="margin:2px 0 14px; font-size:15px; font-weight:bold; color:#0a7d4a;">
                        {{ $seat['number'] }}
                      </p>

                      @if($seat['name'])
                        <p style="margin:0; font-size:11px; color:#94a3b8;">Nom</p>
                        <p style="margin:2px 0 14px; font-size:14px; font-weight:bold;">
                          {{ $seat['name'] }}
                        </p>
                      @endif

                      <p style="margin:0; font-size:11px; color:#94a3b8;">Type de billet</p>
                      <p style="margin:2px 0 14px; font-size:14px; font-weight:bold;">
                        {{ $seat['type'] ?: 'Standard' }}
                      </p>

                      @if($seat['price'])
                        <p style="margin:0; font-size:11px; color:#94a3b8;">Prix</p>
                        <p style="margin:2px 0 0; font-size:14px; font-weight:bold;">
                          {{ number_format((float) $seat['price'], 2, ',', ' ') }} €
                        </p>
                      @endif
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          @endforeach

          {{-- Récapitulatif de la commande --}}
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border-radius:12px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px; color:#64748b;">N° de commande</td>
                        <td align="right" style="font-size:13px; font-weight:bold; word-break:break-all;">
                          {{ $ticket->transaction_id ?? $ticket->id }}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:8px; font-size:13px; color:#64748b;">Total payé</td>
                        <td align="right" style="padding-top:8px; font-size:15px; font-weight:bold; color:#0a7d4a;">
                          {{ number_format((float) $ticket->total, 2, ',', ' ') }} €
                        </td>
                      </tr>
                    </table>
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
                      {{ $event->date }}@if($event->time) — {{ $event->time }}@endif
                    </p>
                    @if($event->location)
                      <p style="margin:0; font-size:14px; color:#334155;">
                        {{ $event->location }}
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
                {{ count($seats) > 1 ? 'Ces billets sont uniques et non transférables.' : 'Ce billet est unique et non transférable.' }}
                Toute reproduction peut être refusée à l'entrée. Conservez ce
                message : il vous permet de retrouver votre réservation à tout
                moment.
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
