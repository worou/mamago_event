import { Button } from '../components/ui'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page introuvable</h1>
      <p className="mt-2 text-slate-500">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Button as="link" to="/" size="lg" className="mt-8">
        Retour à l'accueil
      </Button>
    </div>
  )
}
