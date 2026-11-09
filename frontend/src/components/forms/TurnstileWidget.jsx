import { forwardRef, useEffect, useId, useRef } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'

const SCRIPT_LOAD_CALLBACK = 'onloadTurnstileCallback'
const SCRIPT_URL = `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=${SCRIPT_LOAD_CALLBACK}&render=explicit`
const LOAD_TIMEOUT_MS = 10_000

/**
 * TurnstileWidget — thin wrapper around Cloudflare Turnstile.
 *
 * Props:
 *   onVerify(token)  — called when the user passes the challenge
 *   onExpire()       — called when the token expires (need to re-verify)
 *   onError()        — called on Turnstile widget error
 *
 * The ref is forwarded so parents can call ref.current?.reset() after
 * a successful or failed submission.
 */
const TurnstileWidget = forwardRef(function TurnstileWidget(
  { onVerify, onExpire, onError, onLoadError, visible = true },
  ref
) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
  const loadErrorEnabled = typeof onLoadError === 'function'
  const scriptId = `sdc-turnstile-${useId().replace(/:/gu, '')}`
  const onLoadErrorRef = useRef(onLoadError)
  const widgetLoadedRef = useRef(false)
  const loadTimerRef = useRef(null)
  onLoadErrorRef.current = onLoadError

  useEffect(() => {
    if (!loadErrorEnabled || !visible || widgetLoadedRef.current) return undefined

    let failed = false
    let script = document.getElementById(scriptId)
    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      if (!window.turnstile) {
        script.src = SCRIPT_URL
        script.async = true
        script.defer = true
        script.dataset.turnstileRecovery = 'true'
      }
      document.head.appendChild(script)
    }

    const reportLoadError = () => {
      if (failed || widgetLoadedRef.current) return
      failed = true
      window.clearTimeout(loadTimerRef.current)
      if (script.dataset.turnstileRecovery === 'true') script.remove()
      onLoadErrorRef.current?.()
    }

    script.addEventListener('error', reportLoadError)
    loadTimerRef.current = window.setTimeout(reportLoadError, LOAD_TIMEOUT_MS)

    return () => {
      window.clearTimeout(loadTimerRef.current)
      script.removeEventListener('error', reportLoadError)
    }
  }, [loadErrorEnabled, scriptId, visible])

  const handleWidgetLoad = () => {
    widgetLoadedRef.current = true
    window.clearTimeout(loadTimerRef.current)
  }

  return (
    <div className="flex justify-start">
      <Turnstile
        ref={ref}
        siteKey={siteKey}
        onSuccess={onVerify}
        onExpire={onExpire}
        onError={onError}
        {...(loadErrorEnabled ? {
          injectScript: false,
          scriptOptions: {
            id: scriptId,
            onLoadCallbackName: SCRIPT_LOAD_CALLBACK,
          },
          onWidgetLoad: handleWidgetLoad,
        } : {})}
        options={{
          action: 'public_request',
          theme: 'light',
          language: 'auto',
        }}
      />
    </div>
  )
})

export default TurnstileWidget
