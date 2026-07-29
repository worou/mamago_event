import { ApiError } from '../api/client'

/**
 * Encaissement, préalable à l'enregistrement de la réservation.
 *
 * ────────────────────────────────────────────────────────────────────────
 * ÉTAPE NON RACCORDÉE — décision serveur en attente.
 *
 * `ticket/web/book` consigne une réservation *déjà payée* : elle attend un
 * `transaction_id` et n'encaisse rien elle-même. Il faut donc que le
 * paiement aboutisse avant l'appel.
 *
 * Or aucun moyen d'y parvenir depuis le navigateur n'existe aujourd'hui :
 *
 * - confirmer un paiement Stripe exige un `client_secret` issu d'un
 *   PaymentIntent créé côté serveur. Les routes correspondantes ont été
 *   cherchées et répondent toutes 404 ;
 * - la clé publiable seule ne permet que `createPaymentMethod` ou
 *   `createToken`, qui produisent un identifiant **sans qu'aucun montant
 *   ne soit débité**. L'employer comme `transaction_id` enregistrerait des
 *   réservations impayées présentées comme réglées ;
 * - la page hébergée `/payment-mobile` exige une commande préexistante,
 *   que ce parcours ne crée pas.
 *
 * Plutôt que de simuler, la fonction échoue avec un message explicite.
 * Le paiement sur place, lui, ne passe pas par ici : il n'encaisse rien.
 * ────────────────────────────────────────────────────────────────────────
 *
 * Pour raccorder l'étape, il suffira de renvoyer ici l'identifiant de
 * transaction fourni par la passerelle retenue.
 */
export async function collectPayment({ amount, method }) {
  throw new ApiError(
    "Le paiement en ligne n'est pas encore raccordé : le serveur doit exposer " +
      'une route créant le paiement (PaymentIntent Stripe ou session de ' +
      'règlement). En attendant, seul le paiement sur place permet de finaliser ' +
      'une réservation.',
    { status: 0, code: 'payment-not-wired', context: { amount, method } },
  )
}
