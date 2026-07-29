import { useState } from 'react'
import { resendTicketMail } from '../../api/services'
import { Alert, Button } from '../ui'
import { CheckIcon, MailIcon } from '../Icons'

/**
 * « Renvoyer par email ».
 *
 * L'envoi lui-même appartient au serveur — un navigateur ne peut pas
 * parler SMTP. Ce bouton ne fait que le demander. Tant que la route
 * n'existe pas, l'échec est expliqué plutôt que silencieux : l'acheteur
 * dispose de toute façon du téléchargement PDF immédiat.
 */
export default function ResendMailButton({ transactionId, email, name, className }) {
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState(null)

  if (!email) return null

  async function handleResend() {
    setState('sending')
    setMessage(null)

    try {
      await resendTicketMail({ transactionId, email, name })
      setState('sent')
    } catch (err) {
      setState('error')
      setMessage(
        err.status === 404
          ? "Le renvoi par email n'est pas encore activé sur le serveur. Téléchargez votre billet en PDF en attendant."
          : err.message,
      )
    }
  }

  if (state === 'sent') {
    return (
      <Alert tone="success" className={className}>
        <span className="inline-flex items-center gap-2">
          <CheckIcon className="h-4 w-4 shrink-0" />
          Billet renvoyé à <strong>{email}</strong>.
        </span>
      </Alert>
    )
  }

  return (
    <div className={className}>
      <Button
        variant="secondary"
        size="md"
        className="w-full"
        onClick={handleResend}
        isLoading={state === 'sending'}
      >
        <MailIcon className="h-5 w-5" />
        Renvoyer par email
      </Button>

      {message && (
        <p className="mt-2 text-xs text-amber-700">{message}</p>
      )}
    </div>
  )
}
