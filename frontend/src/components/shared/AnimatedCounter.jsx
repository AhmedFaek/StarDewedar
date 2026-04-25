import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function AnimatedCounter({
  value,
  duration = 1400,
  className = '',
}) {
  const { i18n } = useTranslation()
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [displayValue, setDisplayValue] = useState(0)

  const parsedValue = useMemo(() => {
    const numericPart = Number(String(value).replace(/[^\d.]/g, '')) || 0
    const suffix = String(value).replace(/[\d.\s]/g, '')
    return { numericPart, suffix }
  }, [value])

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return undefined

    let animationFrame
    let startTime

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(parsedValue.numericPart * easedProgress))

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate)
      }
    }

    animationFrame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [duration, isVisible, parsedValue.numericPart])

  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-EG'
  const formattedNumber = displayValue.toLocaleString(locale)

  return (
    <span ref={ref} className={className}>
      {formattedNumber}
      {parsedValue.suffix}
    </span>
  )
}
