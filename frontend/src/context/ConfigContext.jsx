import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchConfig } from '../api/services'

const ConfigContext = createContext(null)

/** Valeurs de repli si /config est injoignable : l'app doit rester utilisable. */
const FALLBACK = {
  businessName: 'MamaGo',
  logo: null,
  currencySymbol: '€',
  currencyDirection: 'right',
  decimalDigits: 2,
  paymentMethods: [],
  cashOnDelivery: false,
  offlinePayment: false,
  socialLogin: [],
  serviceFee: { isEnabled: false, label: 'Frais de service', amount: 0 },
  appUrls: { android: null, ios: null },
}

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(FALLBACK)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    fetchConfig(controller.signal)
      .then(setConfig)
      .catch((err) => {
        if (err.name !== 'AbortError') setConfig(FALLBACK)
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [])

  const value = useMemo(() => ({ config, isLoading }), [config, isLoading])

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig doit être utilisé dans un ConfigProvider')
  return ctx
}
