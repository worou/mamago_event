import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getOutcome, isSandboxEnabled, resetSandbox, setOutcome } from '../api/sandbox'
import { cx } from './ui'

/**
 * Marqueur du bac à sable.
 *
 * Une pastille flottante plutôt qu'un bandeau pleine largeur : elle
 * n'ampute plus la page ni les captures d'écran, tout en restant visible
 * en permanence. Ce point n'est pas négociable — un simulateur qui
 * confirme de faux paiements sans le dire deviendrait un piège.
 *
 * Pour la faire disparaître complètement, retirer VITE_SANDBOX=1 de
 * .env.local : c'est le simulateur lui-même qu'on désactive alors, ce qui
 * est le comportement attendu.
 */
export default function SandboxBanner() {
  const [outcome, setLocalOutcome] = useState(getOutcome)
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    function onPointerDown(event) {
      if (!ref.current?.contains(event.target)) setIsOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  if (!isSandboxEnabled()) return null

  function choose(next) {
    setOutcome(next)
    setLocalOutcome(next)
    setIsOpen(false)
  }

  // Portail : la pastille doit flotter au-dessus de toute la page, sans
  // dépendre du contexte d'empilement de l'élément qui la déclare.
  return createPortal(
    <div ref={ref} className="fixed bottom-4 left-4 z-50 print:hidden">
      {isOpen && (
        <div className="mb-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <p className="text-sm font-bold text-slate-900">Bac à sable actif</p>
          <p className="mt-1 text-xs text-slate-600">
            Session, réservation et paiement sont simulés. Aucune commande
            réelle n'est créée, aucun montant n'est débité.
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Stripe n'est pas en mode test pour autant : cela se règle dans
            l'administration MamaGo.
          </p>

          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold text-slate-700">
              Issue simulée du paiement
            </p>
            <div className="flex overflow-hidden rounded-lg ring-1 ring-slate-300">
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
                    'flex-1 px-3 py-1.5 text-xs font-semibold transition-colors',
                    outcome === option.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {outcome === 'failed' && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                Toute réservation échouera tant que « Succès » n'est pas
                sélectionné.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              resetSandbox()
              window.location.href = '/'
            }}
            className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Réinitialiser la session
          </button>

          <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
            Pour désactiver : retirer <code className="font-mono">VITE_SANDBOX=1</code>{' '}
            de <code className="font-mono">.env.local</code>.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        title="Bac à sable actif — cliquer pour les réglages"
        className={cx(
          'flex items-center gap-2 rounded-full py-2 pr-4 pl-2.5 text-xs font-bold shadow-lg transition-colors',
          outcome === 'failed'
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'bg-amber-400 text-amber-950 hover:bg-amber-300',
        )}
      >
        <span
          className={cx(
            'h-2 w-2 rounded-full',
            outcome === 'failed' ? 'bg-white' : 'bg-amber-900',
          )}
        />
        BAC À SABLE
        {outcome === 'failed' && <span className="font-semibold">· échec simulé</span>}
      </button>
    </div>,
    document.body,
  )
}
