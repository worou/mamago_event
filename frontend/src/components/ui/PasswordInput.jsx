import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '../Icons'
import { cx } from './index'

export default function PasswordInput({ className, ...props }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={isVisible ? 'text' : 'password'}
        className={cx('field pr-11', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setIsVisible((v) => !v)}
        aria-label={isVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
      >
        {isVisible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      </button>
    </div>
  )
}
