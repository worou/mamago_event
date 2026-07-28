import { useMemo } from 'react'

/**
 * Indicatifs proposés.
 *
 * La France arrive en tête car `/api/v1/config` renvoie `country: "FR"` pour
 * cette installation ; les pays suivants correspondent aux zones des
 * événements présents au catalogue.
 */
const COUNTRIES = [
  { code: 'FR', dial: '+33', flag: '🇫🇷', label: 'France' },
  { code: 'BE', dial: '+32', flag: '🇧🇪', label: 'Belgique' },
  { code: 'CH', dial: '+41', flag: '🇨🇭', label: 'Suisse' },
  { code: 'CF', dial: '+236', flag: '🇨🇫', label: 'Centrafrique' },
  { code: 'CM', dial: '+237', flag: '🇨🇲', label: 'Cameroun' },
  { code: 'CI', dial: '+225', flag: '🇨🇮', label: "Côte d'Ivoire" },
  { code: 'SN', dial: '+221', flag: '🇸🇳', label: 'Sénégal' },
  { code: 'KE', dial: '+254', flag: '🇰🇪', label: 'Kenya' },
  { code: 'CD', dial: '+243', flag: '🇨🇩', label: 'RD Congo' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', label: 'Canada' },
]

/**
 * Champ téléphone avec sélecteur d'indicatif, comme sur la maquette.
 *
 * La valeur remontée est toujours le numéro complet au format international
 * (« +33612345678 ») : c'est cette chaîne unique que l'API attend.
 */
export default function PhoneInput({ value, onChange, id, ...props }) {
  const { country, national } = useMemo(() => {
    const trimmed = (value ?? '').trim()

    // Indicatif le plus long d'abord, sans quoi +1 masquerait +225.
    const match = [...COUNTRIES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((c) => trimmed.startsWith(c.dial))

    return match
      ? { country: match, national: trimmed.slice(match.dial.length).trim() }
      : { country: COUNTRIES[0], national: trimmed.replace(/^\+/, '') }
  }, [value])

  function emit(dial, rest) {
    const digits = rest.replace(/[^\d\s.-]/g, '').trim()
    onChange(digits ? `${dial}${digits.replace(/[\s.-]/g, '')}` : '')
  }

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
      <div className="relative flex shrink-0 items-center gap-1.5 border-r border-slate-200 bg-slate-50 pr-2 pl-3">
        <span aria-hidden="true" className="text-base leading-none">
          {country.flag}
        </span>
        <span className="text-sm font-medium text-slate-700">{country.dial}</span>

        {/* Le select couvre la pastille : natif, donc accessible au clavier. */}
        <select
          aria-label="Indicatif du pays"
          value={country.code}
          onChange={(e) => {
            const next = COUNTRIES.find((c) => c.code === e.target.value)
            emit(next.dial, national)
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label} ({c.dial})
            </option>
          ))}
        </select>

        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={national}
        onChange={(e) => emit(country.dial, e.target.value)}
        placeholder="6 12 34 56 78"
        className="w-full px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none"
        {...props}
      />
    </div>
  )
}
