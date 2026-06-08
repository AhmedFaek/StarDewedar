import { useEffect, useState } from 'react'
import { useNotification } from '../../hooks/useNotification'
import Toast from './Toast'

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotification()
  const [dir, setDir] = useState('ltr')

  useEffect(() => {
    const syncDirection = () => {
      setDir(document.documentElement.dir || 'ltr')
    }

    syncDirection()
    const observer = new MutationObserver(syncDirection)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    })

    return () => observer.disconnect()
  }, [])

  if (toasts.length === 0) return null

  const containerPosition = dir === 'rtl'
    ? 'md:left-4 md:right-auto md:items-start'
    : 'md:right-4 md:left-auto md:items-end'

  return (
    <div
      className={[
        'fixed top-4 left-1/2 z-[300] flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 flex-col gap-3',
        'pointer-events-none md:w-auto md:translate-x-0',
        containerPosition,
      ].join(' ')}
      dir={dir}
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          dir={dir}
          onClose={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  )
}
