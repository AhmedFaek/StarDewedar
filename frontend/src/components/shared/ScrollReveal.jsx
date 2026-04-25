import { useEffect, useRef, useState } from 'react'

/**
 * ScrollReveal component that animates its children when they enter the viewport.
 */
export default function ScrollReveal({ children, className = "", delay = 0, direction = "up" }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before it's fully in view
      }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  const getDirectionClass = () => {
    switch (direction) {
      case "up": return isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      case "down": return isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
      case "left": return isVisible ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0"
      case "right": return isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
      case "fade": return isVisible ? "opacity-100" : "opacity-0"
      default: return isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
    }
  }

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-1000 ease-out will-change-transform ${getDirectionClass()}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
