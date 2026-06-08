import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const NotificationContext = createContext(null)
const DEFAULT_DURATION = 4000
const EXIT_DURATION = 240

let idCounter = 0
const createToastId = () => `toast_${Date.now()}_${++idCounter}`

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const clearTimer = useCallback((id) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const removeToast = useCallback((id) => {
    clearTimer(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [clearTimer])

  const dismissToast = useCallback((id) => {
    clearTimer(id)
    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, closing: true } : toast))
    )
    window.setTimeout(() => removeToast(id), EXIT_DURATION)
  }, [clearTimer, removeToast])

  const showNotification = useCallback((input) => {
    const toast = {
      id: createToastId(),
      type: input?.type || 'info',
      title: input?.title || '',
      message: input?.message || '',
      closing: false,
    }

    setToasts((current) => [toast, ...current])

    const duration = typeof input?.duration === 'number' ? input.duration : DEFAULT_DURATION
    const timerId = window.setTimeout(() => dismissToast(toast.id), duration)
    timersRef.current.set(toast.id, timerId)

    return toast.id
  }, [dismissToast])

  const showSuccess = useCallback((message, options = {}) => showNotification({ ...options, type: 'success', message }), [showNotification])
  const showError = useCallback((message, options = {}) => showNotification({ ...options, type: 'error', message }), [showNotification])
  const showWarning = useCallback((message, options = {}) => showNotification({ ...options, type: 'warning', message }), [showNotification])
  const showInfo = useCallback((message, options = {}) => showNotification({ ...options, type: 'info', message }), [showNotification])

  const clearAll = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current.clear()
    setToasts([])
  }, [])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [])

  const value = useMemo(() => ({
    toasts,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    removeToast,
    clearAll,
  }), [toasts, showNotification, showSuccess, showError, showWarning, showInfo, dismissToast, removeToast, clearAll])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
