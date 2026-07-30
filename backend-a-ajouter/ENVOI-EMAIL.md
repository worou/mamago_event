# Envoyer le billet par email

Le navigateur ne peut pas envoyer d'email — cela demande un serveur SMTP.
Le vôtre est déjà configuré : `/api/v1/config` renvoie
`is_mail_active: true`. Il ne manque que le message et son déclenchement.

## 1. Installer le générateur de QR code

```bash
composer require endroid/qr-code
```

Il écrit en PNG via GD, présent sur la quasi-totalité des hébergements, et
évite d'exiger Imagick — souvent absent.

## 2. Copier les quatre fichiers

| Fichier fourni | Destination |
| --- | --- |
| `TicketMailer.php` | `app/Services/TicketMailer.php` |
| `TicketBookedMail.php` | `app/Mail/TicketBookedMail.php` |
| `ticket.blade.php` | `resources/views/emails/ticket.blade.php` |
| `EventTicketMailController.php` | `app/Http/Controllers/Api/V2/EventTicketMailController.php` |

Un seul point à vérifier : les noms de tables employés par le contrôleur de
renvoi — `event_tickets`, `event_ticket_seats` et `events`. Ajustez-les si
les vôtres diffèrent.

## 3. Déclencher l'envoi à la réservation

C'est **la seule ligne à ajouter** dans votre contrôleur de
`ticket/web/book`, juste après la création du billet et de ses places :

```php
use App\Services\TicketMailer;

// … $ticket vient d'être créé, avec ses places dans $ticket->seats

TicketMailer::send(
    $ticket,
    $event,
    // L'adresse saisie par le client d'abord : le frontend la transmet
    // systématiquement, connecté ou non. Ne pas la déduire de user_id,
    // qui vaut toujours 1.
    $request->email ?: optional(\App\Models\User::find($ticket->user_id))->email,
    trim(($request->prenom ?? '') . ' ' . ($request->name ?? ''))
);
```

Si `$ticket->seats` n'est pas déjà chargé à cet endroit, rechargez-le :

```php
$ticket->seats = \DB::table('event_ticket_seats')
    ->where('ticket_id', $ticket->id)->get()->all();
```

**Pourquoi ici plutôt que depuis le frontend :** l'email part même si
l'acheteur ferme son onglet aussitôt après avoir payé — précisément le cas
où il a le plus besoin de son billet.

`TicketMailer::send()` **ne lève jamais d'exception** : un SMTP
indisponible est tracé et renvoie `false`, sans faire échouer une
réservation déjà encaissée. Vous pouvez donc l'appeler sans `try/catch`.

Pour ne pas faire attendre la réponse HTTP le temps du dialogue SMTP,
remplacez `Mail::to(...)->send(...)` par `->queue(...)` dans
`TicketMailer` — à condition qu'un worker de file tourne.

## 4. Déclarer la route de renvoi

```php
use App\Http\Controllers\Api\V2\EventTicketMailController;

Route::post('v2/events/ticket/web/resend-mail',
    [EventTicketMailController::class, 'resend']);
```

Contrat attendu par le frontend, déjà branché :

```
POST /api/v2/events/ticket/web/resend-mail
Content-Type: application/x-www-form-urlencoded

  transaction_id=pi_3Ty…&email=client@exemple.fr&name=Cedric Ngouyombo

→ 200 { "message": "Billet renvoyé.", "email": "…", "places": 2 }
→ 404 { "errors": [{ "code": "transaction_id", "message": "…" }] }
```

## 5. Activer l'affichage côté frontend

Tant que rien n'est branché, l'application **n'annonce aucun envoi** — elle
affichait auparavant « Votre billet vous est envoyé à … », ce qui était faux
et poussait l'acheteur à attendre au lieu de télécharger son billet.

Une fois l'envoi opérationnel, ajoutez dans `frontend/.env.local` :

```
VITE_TICKET_EMAIL_ENABLED=1
```

puis reconstruisez. L'avertissement « téléchargez votre billet maintenant »
disparaît, l'annonce d'envoi et le bouton « Renvoyer par email »
réapparaissent.

## 6. Vérifier

D'abord le SMTP seul — si ce message n'arrive pas, le problème est dans la
configuration mail, pas dans le Mailable :

```bash
php artisan tinker
>>> Mail::raw('Test', fn ($m) => $m->to('votre@email.com')->subject('Test'));
```

Puis le billet complet, via la route de renvoi sur une réservation
existante :

```bash
curl -X POST https://frstore.mamagoapps.com/api/v2/events/ticket/web/resend-mail \
  -d "transaction_id=VOTRE_TRANSACTION&email=votre@email.com&name=Test"
```

## Ce que le message contient

- **un QR code par place**, chacun avec son numéro de billet. Le serveur
  émet une place par billet : deux personnes ne peuvent pas entrer avec le
  même code, l'email doit donc les porter tous ;
- les QR **intégrés au message**, non chargés depuis une URL. Gmail et
  Outlook bloquent les images distantes par défaut : un QR distant resterait
  invisible et le billet inutilisable à l'entrée ;
- chaque QR **également joint en PNG**, pour l'impression ;
- le récapitulatif de commande et les informations de l'événement ;
- une mise en page **en tableaux avec styles en ligne**, seule construction
  fiable dans Outlook, qui ignore flexbox et grid.
