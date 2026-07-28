import { cx } from '../ui'
import { CheckIcon } from '../Icons'

export const CHECKOUT_STEPS = [
  { id: 1, label: 'Informations personnelles' },
  { id: 2, label: 'Choix & Paiement' },
  { id: 3, label: 'Confirmation' },
  { id: 4, label: 'Billet' },
]

export default function Stepper({ current }) {
  return (
    <ol className="mb-8 flex items-start justify-between gap-1 sm:gap-2">
      {CHECKOUT_STEPS.map((step, index) => {
        const isDone = step.id < current
        const isCurrent = step.id === current

        return (
          <li key={step.id} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* Trait de liaison : masqué avant la première étape. */}
              <span
                className={cx(
                  'h-0.5 flex-1',
                  index === 0 && 'invisible',
                  isDone || isCurrent ? 'bg-brand-600' : 'bg-slate-200',
                )}
              />
              <span
                className={cx(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors',
                  isDone && 'bg-brand-600 text-white',
                  isCurrent && 'bg-brand-600 text-white ring-4 ring-brand-100',
                  !isDone && !isCurrent && 'bg-white text-slate-400 ring-1 ring-slate-300',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone ? <CheckIcon className="h-5 w-5" /> : step.id}
              </span>
              <span
                className={cx(
                  'h-0.5 flex-1',
                  index === CHECKOUT_STEPS.length - 1 && 'invisible',
                  isDone ? 'bg-brand-600' : 'bg-slate-200',
                )}
              />
            </div>
            <span
              className={cx(
                'mt-2 text-center text-[11px] leading-tight sm:text-xs',
                isCurrent ? 'font-semibold text-brand-700' : 'text-slate-500',
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
