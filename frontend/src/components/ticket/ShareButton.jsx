import { useState } from 'react'
import { Button } from '../ui'
import { CheckIcon, ShareIcon } from '../Icons'

/**
 * Partage de l'événement.
 *
 * `navigator.share` n'existe pas partout (surtout sur navigateur de bureau) :
 * on retombe alors sur la copie du lien dans le presse-papiers, avec un
 * retour visuel pour que l'action reste lisible.
 */
export default function ShareButton({ event, className, size = 'lg' }) {
  const [state, setState] = useState('idle')

  const url = `${window.location.origin}/evenements/${event.id}`
  const title = event.title
  const text = `Je participe à ${event.title} — ${event.dateLabel}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (err) {
        // L'utilisateur a annulé : rien à signaler.
        if (err?.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }
  }

  return (
    <Button variant="secondary" size={size} className={className} onClick={handleShare}>
      {state === 'copied' ? (
        <>
          <CheckIcon className="h-5 w-5 text-success-600" /> Lien copié
        </>
      ) : state === 'error' ? (
        <>
          <ShareIcon className="h-5 w-5" /> Copie impossible
        </>
      ) : (
        <>
          <ShareIcon className="h-5 w-5" /> Partager
        </>
      )}
    </Button>
  )
}
