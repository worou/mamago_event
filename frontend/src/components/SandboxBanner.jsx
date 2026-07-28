import { useState } from 'react'
import { getOutcome, isSandboxEnabled, resetSandbox, setOutcome } from '../api/sandbox'
import { cx } from './ui'

/**
 * Bandeau permanent signalant le bac à sable.
 *
 * Volontairement voyant et non masquable : un simulateur qui confirme de
 * faux paiements sans le dire deviendrait un piège. Il permet aussi de
 * basculer l'issue simulée, le chemin d'échec du tunnel étant autrement
 * impossible à provoquer.
 */
export default function SandboxBanner() {
  const [outcome, setLocalOutcome] = useState(getOutcome)

  if (!isSandboxEnabled()) return null

  function choose(next) {
    setOutcome(next)
    setLocalOutcome(next)
  }

  return (
    <div className="sticky top-0 z-50 bg-amber-400 text-amber-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-xs sm:px-6 lg:px-8">
        <span className="font-bold tracking-wide uppercase">Bac à sable</span>

        <span className="min-w-0">
          Session, réservation et paiement <strong>simulés</strong>. Stripe n'est
          pas en mode test — cela se règle dans l'administration MamaGo.
        </span>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:inline">Issue du paiement :</span>
          <div className="flex overflow-hidden rounded-md ring-1 ring-amber-900/30">
            {[
              { id: 'success', label: 'Succès' },
              { id: 'failed', label: 'Échec' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => choose(option.id)}
                aria-pressed={outcome === option.id}
                className={cx(
                  'px-2.5 py-1 font-semibold transition-colors',
                  outcome === option.id
                    ? 'bg-amber-950 text-amber-50'
                    : 'bg-amber-300/60 hover:bg-amber-300',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              resetSandbox()
              window.location.href = '/'
            }}
            className="rounded-md px-2.5 py-1 font-semibold ring-1 ring-amber-900/30 hover:bg-amber-300"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  )
}
