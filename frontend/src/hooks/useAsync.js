import { useCallback, useEffect, useState } from 'react'

/**
 * Exécute une fonction asynchrone au montage et expose { data, error, isLoading }.
 * L'AbortController évite de mettre à jour l'état d'un composant démonté.
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, isLoading: true })
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    let isActive = true

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    Promise.resolve(fn(controller.signal))
      .then((data) => {
        if (isActive) setState({ data, error: null, isLoading: false })
      })
      .catch((error) => {
        if (error.name === 'AbortError' || !isActive) return
        setState({ data: null, error, isLoading: false })
      })

    return () => {
      isActive = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey])

  return { ...state, reload }
}
