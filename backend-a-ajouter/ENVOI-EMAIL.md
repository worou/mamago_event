# Envoyer le billet par email

Le navigateur ne peut pas envoyer d'email — cela demande un serveur SMTP.
Bonne nouvelle : le vôtre est déjà configuré, `/api/v1/config` renvoie
`is_mail_active: true`. Il ne manque que le message et son déclenchement.

## 1. Générer le QR code

```bash
composer require endroid/qr-code
```

Cette bibliothèque écrit en PNG via GD, présent sur la quasi-totalité des
hébergements. Elle évite d'exiger Imagick, souvent absent.

## 2. Les deux fichiers fournis

| Fichier | Destination |
| --- | --- |
| `TicketBookedMail.php` | `app/Mail/TicketBookedMail.php` |
| `ticket.blade.php` | `resources/views/emails/ticket.blade.php` |

Le gabarit est en tableaux HTML avec styles en ligne : c'est la seule mise
en page fiable dans Outlook et Gmail, qui ignorent flexbox, grid et la
plupart des feuilles de style externes. Le QR est **intégré au message**
plutôt que chargé depuis une URL, faute de quoi il resterait invisible
dans les messageries qui bloquent les images distantes — et le billet
serait inutilisable.

## 3. Déclencher l'envoi à la réservation — recommandé

Dans le contrôleur de `ticket/web/book`, juste après l'enregistrement :

```php
use App\Mail\TicketBookedMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

// … $ticket vient d'être créé

$email = $request->email
    ?: optional(\App\Models\User::find($ticket->user_id))->email;

if ($email) {
    $buyer = trim(($request->prenom ?? '') . ' ' . ($request->name ?? ''))
        ?: 'Client';

    try {
        Mail::to($email)->send(
            new TicketBookedMail($ticket, $event, $buyer)
        );
    } catch (\Throwable $e) {
        // Un serveur SMTP indisponible ne doit pas faire échouer une
        // réservation déjà payée : on trace et on laisse passer.
        Log::error('Envoi du billet impossible', [
            'ticket' => $ticket->id,
            'erreur' => $e->getMessage(),
        ]);
    }
}
```

**Pourquoi à la réservation plutôt que depuis le frontend :** l'email part
même si l'acheteur ferme son onglet aussitôt après avoir payé. Un envoi
déclenché par le navigateur se perdrait dans ce cas — précisément celui où
le client a le plus besoin de son billet.

Mettre l'envoi en file d'attente (`Mail::to(...)->queue(...)`) évite en
plus de faire attendre la réponse HTTP le temps du dialogue SMTP.

## 4. Route de renvoi — optionnelle mais utile

Pour le « je n'ai pas reçu mon billet », que le frontend appelle déjà :

```php
// routes/api.php
Route::post('v2/events/ticket/web/resend-mail', function (Request $request) {
    $request->validate([
        'transaction_id' => 'required|string',
        'email'          => 'required|email',
    ]);

    $ticket = \DB::table('event_tickets')
        ->where('transaction_id', $request->transaction_id)
        ->first();

    if (! $ticket) {
        return response()->json([
            'errors' => [['code' => 'transaction_id', 'message' => 'Réservation introuvable.']],
        ], 404);
    }

    $event = \DB::table('events')->where('id', $ticket->event_id)->first();

    Mail::to($request->email)->send(
        new TicketBookedMail($ticket, $event, $request->name ?? 'Client')
    );

    return response()->json(['message' => 'Billet renvoyé.']);
});
```

Ajustez `event_tickets` si le nom de votre table diffère.

## 5. Vérifier

```bash
php artisan tinker
>>> Mail::raw('Test', fn ($m) => $m->to('votre@email.com')->subject('Test'));
```

Si ce message arrive, le SMTP fonctionne et le billet partira aussi.

## Ce que fait le frontend en attendant

L'écran de confirmation et l'étape 4 proposent un bouton **« Renvoyer par
email »**. Tant que la route de renvoi n'existe pas, il affiche un message
explicite au lieu d'échouer en silence — et l'acheteur garde de toute
façon le téléchargement PDF immédiat.
