import { useCallback, useLayoutEffect, useRef } from 'react'

export const useFormElapsedTime = ({ visible = true } = {}) => {
  const startedAtRef = useRef(null)
  const visibleRef = useRef(visible)
  visibleRef.current = visible

  useLayoutEffect(() => {
    if (visible && startedAtRef.current === null) {
      startedAtRef.current = performance.now()
    }
  }, [visible])

  const getElapsedMs = useCallback(() => {
    if (startedAtRef.current === null) {
      startedAtRef.current = performance.now()
    }
    return Math.min(
      999999999,
      Math.max(0, Math.floor(performance.now() - startedAtRef.current))
    )
  }, [])

  const reset = useCallback(() => {
    startedAtRef.current = visibleRef.current ? performance.now() : null
  }, [])

  return { getElapsedMs, reset }
}
