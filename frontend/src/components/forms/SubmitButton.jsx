/**
 * SubmitButton — submit button with built-in loading spinner.
 *
 * When `loading` is true the button is disabled, shows a CSS spinner beside
 * the `loadingText`, and prevents any further clicks.  Keeps the existing
 * styling contracts used across the app.
 */
export default function SubmitButton({
  loading = false,
  loadingText,
  children,
  className = '',
  id,
  disabled = false,
  ...rest
}) {
  return (
    <button
      type="submit"
      id={id}
      disabled={loading || disabled}
      className={className}
      {...rest}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span
            className="submit-spinner"
            role="status"
            aria-label="Loading"
          />
          <span>{loadingText || children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
