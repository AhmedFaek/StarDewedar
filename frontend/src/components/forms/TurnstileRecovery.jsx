import { forwardRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TurnstileWidget from './TurnstileWidget'

const TurnstileRecovery = forwardRef(function TurnstileRecovery(
  { visible = true, onVerify, onExpire, onError },
  ref
) {
  const { t } = useTranslation()
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const [widgetKey, setWidgetKey] = useState(0)
  const [loadFailed, setLoadFailed] = useState(false)
  const [retryFailed, setRetryFailed] = useState(false)
  const [retried, setRetried] = useState(false)

  useEffect(() => {
    if (visible) setHasBeenVisible(true)
  }, [visible])

  const handleLoadError = () => {
    setLoadFailed(true)
    if (retried) setRetryFailed(true)
  }

  const handleVerify = (token) => {
    setLoadFailed(false)
    setRetryFailed(false)
    setRetried(false)
    onVerify(token)
  }

  const retryWidget = () => {
    setRetried(true)
    setLoadFailed(false)
    setRetryFailed(false)
    setWidgetKey((key) => key + 1)
  }

  return (
    <div className="space-y-2">
      {loadFailed && (
        <div
          role="alert"
          dir="auto"
          className="rounded border border-amber-200 bg-amber-50 p-3 text-start text-xs text-amber-800"
        >
          <p>{t(retryFailed ? 'turnstile.reloadRequired' : 'turnstile.loadFailed')}</p>
          {retryFailed ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 font-semibold underline"
            >
              {t('turnstile.reloadPage')}
            </button>
          ) : (
            <button
              type="button"
              onClick={retryWidget}
              className="mt-2 font-semibold underline"
            >
              {t('turnstile.tryAgain')}
            </button>
          )}
        </div>
      )}
      {hasBeenVisible && (
        <TurnstileWidget
          key={widgetKey}
          ref={ref}
          visible={visible}
          onVerify={handleVerify}
          onExpire={onExpire}
          onError={onError}
          onLoadError={handleLoadError}
        />
      )}
    </div>
  )
})

export default TurnstileRecovery
