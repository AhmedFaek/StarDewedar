import { createContext, useContext, useState, useEffect } from 'react'

const CompareContext = createContext(null)

export const MAX_COMPARE = 3
const STORAGE_KEY = 'sd_compare_list'

// ── Helpers ────────────────────────────────────────────────────────────────────

const loadFromSession = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveToSession = (list) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore storage errors (private mode, full storage, etc.)
  }
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function CompareProvider({ children }) {
  // Initialise from sessionStorage so the list survives React unmount/remount
  // that happens every time isRouteLoading flips in App.jsx.
  const [compareList, setCompareList] = useState(() => loadFromSession())

  // Keep sessionStorage in sync on every change
  useEffect(() => {
    saveToSession(compareList)
  }, [compareList])

  const addToCompare = (product) => {
    if (compareList.length >= MAX_COMPARE) return { error: 'max' }
    if (compareList.some((p) => p.id === product.id)) return { error: 'duplicate' }
    // Enforce same category
    if (compareList.length > 0 && compareList[0].category_id !== product.category_id) {
      return { error: 'category' }
    }
    setCompareList((prev) => [...prev, product])
    return { ok: true }
  }

  const removeFromCompare = (productId) => {
    setCompareList((prev) => prev.filter((p) => p.id !== productId))
  }

  const clearCompare = () => {
    setCompareList([])
  }

  const isInCompare = (productId) => compareList.some((p) => p.id === productId)

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  )
}

export const useCompare = () => {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used inside CompareProvider')
  return ctx
}
