# MamaGo Events — Billetterie (frontend React)

Interface de billetterie en ligne consommant l'API MamaGo. React 19 + Vite +
React Router + Tailwind CSS 4.

## Démarrage

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # build de production dans dist/
npm run smoke   # contrôle des adaptateurs contre l'API réelle
```

L'URL de l'API par défaut est `https://frstore.mamagoapps.com`. Pour en viser
une autre, copiez `.env.example` en `.env` et ajustez `VITE_API_BASE_URL`.

## Architecture

Toute la connaissance de l'API est concentrée dans `src/api/` :

| Fichier | Rôle |
| --- | --- |
| `client.js` | `fetch` outillé : jeton Bearer, en-têtes plateforme, normalisation des erreurs |
| `endpoints.js` | Les routes, et ce que l'on sait de chacune |
| `adapters.js` | Réponses brutes → objets consommés par l'interface |
| `services.js` | Fonctions métier combinant les deux |

Les composants n'importent que `services.js`. Si le backend change ses champs,
seul `adapters.js` bouge.

## Ce que l'API impose

Ces points ont été établis en interrogeant directement le serveur.

**Deux versions cohabitent.** L'authentification et la configuration sont en
`/api/v1/`, le module événementiel en `/api/v2/`.

**Pas de route de détail par événement.** `/api/v2/events/{id}` et
`/api/v2/events/details/{id}` répondent 404. Comme `events/list` renvoie déjà
l'objet complet — description, galeries, organisateurs, grille tarifaire — la
fiche est résolue depuis la liste.

**Pas de filtrage serveur.** `events/list` ignore `limit`, `offset` et
`category_id`. Recherche et filtres sont appliqués côté client.

**`events/nearme` ne filtre pas par distance.** La route ne renvoie plus
d'erreur 500 depuis le 29/07/2026, mais retourne les mêmes événements pour
des coordonnées en Normandie et à Bangui. La section « près de chez vous »
reste donc non branchée : elle serait trompeuse.

**Les médias sont mal formés dans l'API.** Trois défauts, tous compensés par
`resolveMediaUrl` dans `adapters.js` :

| Défaut | Exemple | Traitement |
| --- | --- | --- |
| Préfixe erroné | `/public/storage/category/…` → 404 | Réécrit en `/storage/app/public/…` |
| URL absolue concaténée au préfixe | `…/public/storage/event/https://…webp` → 404 | Seule l'URL imbriquée est conservée |
| Répertoire sans nom de fichier | `…/public/storage/event` → 403 | Ignoré, le repli visuel s'applique |

**La position est dans `party_halls`, pas dans l'événement.** Ce champ est une
**chaîne JSON** contenant `{title, address, image, latitude, longitude}`. Sur
les entrées récentes, `latitude` et `longitude` au niveau de l'événement sont
des chaînes vides : sans lire `party_halls`, la carte resterait masquée alors
que la position est connue.

**`participants` désigne les artistes, pas le public.** Chaque entrée porte
`name`, `works` (rôle) et `bio`. Ils sont rendus dans une section « à
l'affiche », et non comptés comme des inscrits.

**Le tableau `organizer` mêle organisateurs et sponsors**, sans ordre garanti :
sur l'événement 14, le sponsor arrive en premier. L'organisateur affiché est
sélectionné sur son `role`, pas sur sa position.

**`events/today` et `events/top` renvoient des listes vides.** Les sections
correspondantes se masquent d'elles-mêmes plutôt que d'afficher un bloc creux.

**CORS est ouvert** (`Access-Control-Allow-Origin: *`) : aucun proxy n'est
nécessaire, ni en développement ni en production.

### Contrats d'authentification

```
POST /api/v1/auth/login
  { login_type: "manual", field_type: "email"|"phone",
    email_or_phone: string, password: string }

POST /api/v1/auth/sign-up
  { name: string, phone: string, password: string (≥ 8 car.), email?: string }
```

Erreurs en v1 : `{ errors: [{ code, message }] }`. En v2 : `{ message }`.
`client.js` ramène les deux à une forme unique.

### Paiement

`active_payment_method_list` de `/api/v1/config` ne contient aujourd'hui que
**Stripe**. `cash_on_delivery` et `offline_payment_status` sont désactivés.

Le sélecteur de l'étape 2 est **construit à partir de cette liste** : activer
PayPal ou une autre passerelle dans l'administration la fait apparaître sans
modification du frontend.

Le règlement par carte passe par la page hébergée `/payment-mobile` du
backend — la clé secrète Stripe ne peut pas transiter par le navigateur. Le
tunnel y redirige avec la commande, puis revient sur
`/reservation/confirmation`.

## Écarts assumés avec les maquettes

Les maquettes ont servi de référence écran par écran. Quatre éléments n'ont
volontairement pas été reproduits, pour des raisons de sécurité ou de données.

**Les champs carte (numéro, expiration, CVC) des maquettes de paiement.**
Confirmer un paiement exige un `client_secret` créé côté serveur, hors de
portée d'un frontend seul. Afficher ces champs donnerait un formulaire
non fonctionnel et ferait transiter un numéro de carte par le DOM sans
protection. La structure de la maquette est respectée : le bloc occupe la
même place et explique la redirection vers la page de paiement du backend.

**« Frais de service — 2,00 € ».** `additional_charge_status` vaut `0` sur
cette installation : les frais sont désactivés. La ligne est donc rendue
conditionnellement (`config.serviceFee`) plutôt que codée en dur, sans quoi le
total affiché serait faux.

**Statistiques de l'événement** (1200+ participants, 15+ intervenants). Ces
chiffres sont fictifs dans la maquette. `EventStats` ne montre que ce que
l'API fournit — participants réels, nombre de formules, places restantes — et
disparaît s'il y a moins de deux chiffres exploitables.

**Blocs App Store / Google Play.** `app_url_android` et `app_url_ios` sont
`null` : les blocs restent masqués tant qu'aucune application n'est publiée.

## Visuel de repli

`src/assets/event-banner.svg` est une illustration de scène de concert servant
de bannière quand un événement n'a pas d'image exploitable. Elle est locale
(aucun service tiers, fonctionne hors ligne), vectorielle et libre de droits
puisque générée pour ce projet — contrairement à une photo de banque d'images,
qui imposerait une licence.

Elle intervient dans deux cas, gérés par `EventImage` : `image` absente, ou
URL qui échoue au chargement. **C'est un pansement, pas un correctif** : les
images d'événements, bannières et sponsors référencées par l'API sont
introuvables sur le serveur (404 sur tous les chemins). Dès qu'elles seront
réellement téléversées, les vrais visuels reprendront la main sans aucune
modification du code.

Par ailleurs, la **cloche de notifications** n'a pas été reprise (aucun
endpoint), tandis que les **favoris** et la page **Lieux**, présents dans la
barre de navigation des maquettes, sont réalisés côté client — respectivement
en `localStorage` et par regroupement des événements sur leur `location`.

La **carte du lieu** utilise des tuiles OpenStreetMap en `<img>`. L'iframe
d'intégration officielle a été écartée : ses ressources internes sont bloquées
(`ERR_BLOCKED_BY_ORB`) et la carte restait vide. L'intégration Google que
suggère la maquette exigerait une clé d'API.

## Déploiement : le repli SPA est obligatoire

Le routage est côté client. Sans repli, toute URL demandée **directement** —
le retour de la page de paiement vers `/reservation/confirmation`, un
rafraîchissement sur `/evenements/12`, un lien partagé — renvoie une 404.

`public/.htaccess` (Apache) et `public/_redirects` (Netlify, Cloudflare Pages)
sont fournis et copiés dans `dist/` au build. Pour Nginx :

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Vérification avant mise en ligne — en demandant l'URL directement, sans
naviguer depuis l'accueil :

```bash
npm run build && npm run preview
curl -o /dev/null -w '%{http_code}\n' \
  'http://localhost:4173/reservation/confirmation?status=success'   # attendu : 200
```

## Tests de paiement

### Où placer les clés Stripe

Les deux clés se configurent dans l'**administration MamaGo**, jamais dans ce
dépôt.

| Clé | Emplacement | Pourquoi |
| --- | --- | --- |
| `sk_…` (secrète) | Admin MamaGo uniquement | Elle autorise à créer et rembourser des paiements. Elle ne doit jamais quitter le serveur. |
| `pk_…` (publiable) | Nulle part ici | Elle ne sert qu'à Stripe.js ; ce frontend n'intègre pas Stripe, le paiement passe par la page hébergée du backend. |

⚠️ **Ne jamais mettre de clé dans une variable `VITE_*`.** Vite les inline en
clair dans le bundle JavaScript : la clé serait servie à chaque visiteur.

Une vérification est disponible avant chaque push :

```bash
npm run check-secrets
```

Elle échoue si un fichier versionné contient une clé secrète Stripe, une clé
privée, un jeton GitHub ou une clé AWS. Une clé commitée doit être considérée
comme divulguée, même après retrait : ni l'historique git ni les caches ne
s'effacent. Dans ce cas, faites-la tourner depuis le tableau de bord Stripe
(*Developers → API keys → Roll key*).

### Mettre Stripe en mode test — côté serveur uniquement

**Aucun réglage du frontend ne met Stripe en mode test.** Le basculement se
fait dans l'administration MamaGo : *Payment Methods → Stripe → Test/Live*,
avec ses propres clés publiable et secrète. L'API le confirme :
`active_payment_method_list` expose le titre et le logo de la passerelle,
jamais son mode ni ses clés.

Une fois le mode test activé, le tunnel se teste de bout en bout avec les
cartes de test Stripe, sur la page de paiement hébergée par le backend :

| Carte | Résultat |
| --- | --- |
| `4242 4242 4242 4242` | Paiement accepté |
| `4000 0000 0000 0002` | Paiement refusé |
| `4000 0025 0000 3155` | Authentification 3D Secure demandée |

Date d'expiration future quelconque, CVC quelconque. Les transactions
apparaissent ensuite dans le tableau de bord Stripe, vue « mode test ».

## Point ouvert : `ticket/book`

`POST /api/v2/customer/events/ticket/book` est authentifié et répond 401 sans
jeton, ce qui a empêché de lire ses erreurs de validation et donc de confirmer
son contrat. Les champs envoyés (`event_id`, `event_price_id`, `quantity`,
`payment_method`) suivent la convention des autres routes.

Avec un compte de test, la vérification prend une minute :

```bash
TOKEN=$(curl -s -X POST https://frstore.mamagoapps.com/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"login_type":"manual","field_type":"email","email_or_phone":"...","password":"..."}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# Un corps vide révèle les champs attendus, sans créer de commande
curl -s -X POST https://frstore.mamagoapps.com/api/v2/customer/events/ticket/book \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}'
```

### Conséquence : une seule catégorie de billet par commande

`bookTicket()` n'envoie qu'un `event_price_id`. Panacher Standard + VIP dans
une même commande créerait donc **plusieurs commandes pour un seul paiement** —
l'acheteur ne réglerait que la première. La sélection est par conséquent
contrainte à une catégorie à la fois : en choisir une autre remplace la
précédente (`BookingContext.setQuantity`).

Si le contrat de `book` se révèle accepter plusieurs lignes, lever la
contrainte à ces deux endroits : `BookingContext.setQuantity` et
`EventDetailPage.setQuantity`.

Ajuster ensuite `bookTicket()` dans `src/api/services.js`, et
`adaptTicket()` dans `src/api/adapters.js` pour `ticket/list` (notamment si la
réponse porte déjà une charge utile de QR code ou une URL de PDF : le billet
serait alors servi par le serveur plutôt que généré localement).

## Parcours

```
/                          Accueil — bannières, catégories, événements
/evenements                Liste + recherche + filtre par catégorie
/evenements/:id            Fiche événement + sélection des billets
/reservation/informations  Étape 1 — inscription ou connexion
/reservation/paiement      Étape 2 — moyen de paiement, redirection
/reservation/confirmation  Étape 3 — confirmation + QR + PDF
/mes-reservations          Liste des commandes
/mes-reservations/:id      Étape 4 — billet, QR, PDF, calendrier
/connexion  /inscription   Authentification
```

L'invité crée son compte à l'étape 1 du tunnel : la réservation exige un jeton
côté API. Le formulaire d'inscription des maquettes est précisément cette
étape.

## Billet et QR code

Le QR encode la charge utile fournie par le backend si elle existe, sinon la
référence de commande. Le PDF est généré côté client avec `jsPDF`, chargé
dynamiquement au clic pour ne pas peser sur le démarrage. Si `ticket/list`
expose un jour une URL de PDF officielle, `TicketPage` la privilégie
automatiquement.

**L'envoi du billet par email est une responsabilité du backend** et ne peut
pas être assuré depuis le navigateur.
