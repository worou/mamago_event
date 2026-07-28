/**
 * Confettis décoratifs autour de la coche de confirmation.
 * Purement visuel : positions figées, aucune animation coûteuse, et masqué
 * aux lecteurs d'écran.
 */
const PIECES = [
  { left: '12%', top: '18%', rotate: -25, color: 'bg-emerald-500', w: 'w-2', h: 'h-3' },
  { left: '22%', top: '52%', rotate: 15, color: 'bg-brand-500', w: 'w-2.5', h: 'h-2.5' },
  { left: '30%', top: '8%', rotate: 40, color: 'bg-slate-300', w: 'w-2', h: 'h-2' },
  { left: '36%', top: '72%', rotate: -10, color: 'bg-emerald-400', w: 'w-2', h: 'h-3' },
  { left: '64%', top: '10%', rotate: 30, color: 'bg-rose-500', w: 'w-2', h: 'h-3' },
  { left: '70%', top: '60%', rotate: -35, color: 'bg-amber-400', w: 'w-2.5', h: 'h-2.5' },
  { left: '78%', top: '30%', rotate: 12, color: 'bg-brand-400', w: 'w-2', h: 'h-2' },
  { left: '86%', top: '66%', rotate: -20, color: 'bg-emerald-500', w: 'w-2', h: 'h-3' },
  { left: '54%', top: '82%', rotate: 45, color: 'bg-slate-300', w: 'w-2', h: 'h-2' },
  { left: '46%', top: '4%', rotate: -15, color: 'bg-amber-300', w: 'w-2', h: 'h-2.5' },
]

export default function Confetti({ children }) {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="false">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {PIECES.map((piece, i) => (
          <span
            key={i}
            className={`absolute rounded-[2px] ${piece.color} ${piece.w} ${piece.h}`}
            style={{
              left: piece.left,
              top: piece.top,
              transform: `rotate(${piece.rotate}deg)`,
            }}
          />
        ))}
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}
