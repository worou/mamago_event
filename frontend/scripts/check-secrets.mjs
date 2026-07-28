/**
 * Recherche de secrets dans les fichiers versionnés.
 *
 *   npm run check-secrets
 *
 * Le dépôt étant public, une clé commitée est une clé publiée — et le
 * retrait ultérieur n'efface ni l'historique git ni les caches. À lancer
 * avant un push, ou à brancher sur un hook pre-commit.
 */
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const PATTERNS = [
  { label: 'clé secrète Stripe', re: /sk_(test|live)_[A-Za-z0-9]{20,}/ },
  { label: 'clé restreinte Stripe', re: /rk_(test|live)_[A-Za-z0-9]{20,}/ },
  { label: 'clé secrète PayPal', re: /\bE[A-Za-z0-9_-]{78,}\b/ },
  { label: 'clé AWS', re: /AKIA[0-9A-Z]{16}/ },
  { label: 'clé privée', re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: 'jeton GitHub', re: /gh[pousr]_[A-Za-z0-9]{36,}/ },
  { label: 'clé Google', re: /AIza[0-9A-Za-z_-]{35}/ },
]

// La clé publiable Stripe n'est pas un secret : elle est faite pour le
// navigateur. On la signale seulement, sans faire échouer la vérification.
const NOTICES = [{ label: 'clé publiable Stripe', re: /pk_(test|live)_[A-Za-z0-9]{20,}/ }]

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  // Le fichier d'exemple documente ces préfixes : c'est son rôle.
  .filter((f) => f !== '.env.example' && !f.endsWith('/.env.example'))
  .filter((f) => !/\.(png|jpe?g|gif|webp|ico|pdf|woff2?|ttf)$/i.test(f))

let failures = 0
let notices = 0

for (const file of files) {
  let content
  try {
    content = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  for (const { label, re } of PATTERNS) {
    if (re.test(content)) {
      console.error(`\x1b[31m✗\x1b[0m ${label} dans ${file}`)
      failures += 1
    }
  }
  for (const { label, re } of NOTICES) {
    if (re.test(content)) {
      console.warn(`\x1b[33m!\x1b[0m ${label} dans ${file} (non bloquant)`)
      notices += 1
    }
  }
}

if (failures > 0) {
  console.error(
    `\n\x1b[31m${failures} secret(s) détecté(s).\x1b[0m Retirez-les, puis faites tourner la clé : ` +
      `commitée une fois, elle doit être considérée comme divulguée.\n`,
  )
  process.exit(1)
}

console.log(
  `\x1b[32m✓\x1b[0m Aucun secret dans les ${files.length} fichiers versionnés` +
    (notices ? ` (${notices} signalement non bloquant)` : '') +
    '.',
)
