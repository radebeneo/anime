import { useEffect, useRef } from 'react'

const DOT_EASE = 0.55
const RING_EASE = 0.16
const MAGNET_RADIUS = 90
const MAGNET_PULL = 0.28

export default function MagneticCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return

    const dot = dotRef.current
    const ring = ringRef.current
    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let dx = mx
    let dy = my
    let rx = mx
    let ry = my
    let scale = 1
    let targetScale = 1
    let visible = false

    const magnets = [...document.querySelectorAll('.magnetic')].map((el) => ({
      el,
      tx: 0,
      ty: 0,
    }))

    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY
      if (!visible) {
        visible = true
        dot.style.opacity = '1'
        ring.style.opacity = '1'
      }
      const interactive = e.target.closest('a, button, [data-hover]')
      targetScale = interactive ? 2.1 : 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let raf
    const loop = () => {
      raf = requestAnimationFrame(loop)
      dx += (mx - dx) * DOT_EASE
      dy += (my - dy) * DOT_EASE
      rx += (mx - rx) * RING_EASE
      ry += (my - ry) * RING_EASE
      scale += (targetScale - scale) * 0.18

      dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`

      for (const m of magnets) {
        const r = m.el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const ox = mx - cx
        const oy = my - cy
        const dist = Math.hypot(ox, oy)
        const pull = dist < MAGNET_RADIUS ? MAGNET_PULL : 0
        m.tx += (ox * pull - m.tx) * 0.2
        m.ty += (oy * pull - m.ty) * 0.2
        m.el.style.transform = `translate(${m.tx.toFixed(2)}px, ${m.ty.toFixed(2)}px)`
      }
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      for (const m of magnets) m.el.style.transform = ''
    }
  }, [])

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  )
}
