import { useEffect, useRef, useState, type RefObject } from "react"

// Detecte quand un element entre dans le viewport (lazy-load des vignettes).
// Une fois visible, reste a true et arrete d'observer — pas de recharge en boucle.
export function useInView<T extends Element>(rootMargin = "200px"): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { rootMargin },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [inView, rootMargin])

  return [ref, inView]
}
