import { forwardRef } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'

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
  { onVerify, onExpire, onError },
  ref
) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

  return (
    <div className="flex justify-start">
      <Turnstile
        ref={ref}
        siteKey={siteKey}
        onSuccess={onVerify}
        onExpire={onExpire}
        onError={onError}
        options={{
          theme: 'light',
          language: 'auto',
        }}
      />
    </div>
  )
})

export default TurnstileWidget
