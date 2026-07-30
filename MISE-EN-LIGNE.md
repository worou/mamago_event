# Passer en production

À suivre dans l'ordre : chaque étape dépend de la précédente.

## 1. Activer le compte Stripe — bloquant

Vérifié le 30/07/2026 sur `acct_1TvkoK2R2lVtQ8we` :

| Contrôle | État |
| --- | --- |
| Dossier d'activation soumis | **non** |
| Encaissements (`charges_enabled`) | **non activés** |
| Virements (`payouts_enabled`) | **non activés** |

**Tant que ce n'est pas fait, aucun paiement réel ne peut aboutir** — quelles
que soient les clés employées. Stripe refuse les transactions live d'un
compte non activé.

À compléter dans *Stripe Dashboard → Activer le compte* : forme juridique,
identité du représentant, coordonnées bancaires. Le délai de validation va
de quelques minutes à quelques jours.

La clé `pk_live_` n'a pas de sens avant cette activation.

## 2. Rendre les billets récupérables — fortement recommandé

Deux défauts serveur sont tolérables en test et problématiques dès qu'un
vrai paiement est encaissé.

**`ticket/web/book` ignore `user_id`.** Vérifié en envoyant `42` : la valeur
est écartée et `1` est enregistré. Aucune réservation n'est rattachée à un
client, même connecté. Conséquence concrète en production : un acheteur
paie, ferme son onglet, et **ne peut plus jamais retrouver son billet** —
« Mes réservations » n'affichera rien, et il n'a aucun recours.

**L'email n'est pas envoyé.** C'est la seule trace durable qu'aurait
l'acheteur. Le nécessaire est fourni dans `backend-a-ajouter/` :
`TicketBookedMail.php`, `ticket.blade.php` et `ENVOI-EMAIL.md`. La
configuration SMTP existe déjà (`is_mail_active: true`).

Mettre en ligne sans au moins l'un des deux revient à vendre des billets
que le client ne peut pas récupérer. Le téléchargement PDF immédiat est le
seul filet, et il suppose qu'il y pense avant de fermer la page.

## 3. Basculer les clés

**Côté serveur**, dans le `.env` de Laravel :

```
STRIPE_SECRET_KEY=sk_live_...
```

Puis dans l'administration MamaGo : *Payment Methods → Stripe → mode Live*,
avec la clé publiable live.

**Côté frontend**, dans `frontend/.env.local` :

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 4. Reconstruire — indispensable

```bash
cd frontend
npm run build
```

⚠️ Les variables `VITE_*` sont **figées à la compilation**. Modifier
`.env.local` sans reconstruire laisse la clé de test dans le bundle : les
paiements échoueraient silencieusement en production.

Contrôle après build :

```bash
grep -c "pk_live_" dist/assets/*.js   # doit trouver la clé live
grep -c "pk_test_" dist/assets/*.js   # doit ne rien trouver
npm run check-secrets                 # aucune clé secrète versionnée
```

## 5. Déployer

Copier le contenu de `frontend/dist/` à la racine web.

Le repli SPA est **obligatoire** : sans lui, le retour de paiement vers
`/reservation/confirmation` renvoie une 404 et l'acheteur perd son billet.
`.htaccess` (Apache) et `_redirects` (Netlify, Cloudflare) sont fournis
dans le build. Pour Nginx :

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Vérification, en demandant l'URL directement :

```bash
curl -o /dev/null -w '%{http_code}\n' \
  'https://votre-domaine/reservation/confirmation?status=success'   # 200 attendu
```

## 6. Premier paiement réel

Faites-le vous-même, avec votre propre carte et un petit montant :

1. réservez un billet de bout en bout ;
2. vérifiez que la transaction apparaît dans Stripe, **vue Live** ;
3. vérifiez que le QR code affiché correspond au `qr_code` renvoyé par
   `ticket/web/book` ;
4. remboursez-vous depuis le Dashboard.

Ce parcours vaut mieux que n'importe quel test automatisé : il traverse
Stripe, votre serveur et l'interface dans les conditions réelles.

## Passer le dépôt en privé

Le dépôt est public et expose l'URL de l'API et la cartographie de ses
routes. Sans gravité en test ; à reconsidérer avant d'encaisser réellement.
*Settings → Danger Zone → Change visibility*. Cela n'efface pas ce qui a
déjà été indexé.
