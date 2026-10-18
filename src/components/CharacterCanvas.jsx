import { useEffect, useRef } from 'react'

const FRAME_COUNT = 64
const BG = '#a8151c' // sampled from the video background corners
const FACE = { x: 0.495, y: 0.4 } // face pivot, normalized source-frame coords
const RESPONSE = 0.26 // angular lerp factor (~35 ms tracking response)
const DEADZONE = 0.12 // fraction of min(viewport w/h) that triggers eye contact
const DEADZONE_EXIT = 1.3 // hysteresis so the deadzone edge never flickers

const frameSrc = (i) => `/frames/frame_${String(i).padStart(2, '0')}.webp`

// Shortest-path circular interpolation between two angles in degrees.
function lerpAngle(a, b, t) {
  let d = (b - a) % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return (a + d * t + 360) % 360
}

export default function CharacterCanvas({ onProgress }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const s = {
      frames: new Array(FRAME_COUNT),
      center: null,
      poster: null,
      loadedCount: 0,
      ready: false,
      cw: 0,
      ch: 0,
      mx: null,
      my: null,
      angle: 0,
      hasAngle: false,
      inDeadzone: true,
    }

    // ---- preload every frame before enabling tracking --------------------
    const total = FRAME_COUNT + 1
    const tick = () => {
      s.loadedCount++
      onProgress?.(s.loadedCount, total)
      if (s.loadedCount >= total) s.ready = true
    }
    for (let i = 0; i < FRAME_COUNT; i++) {
      const im = new Image()
      im.src = frameSrc(i)
      im.onload = tick
      im.onerror = tick
      s.frames[i] = im
    }
    const center = new Image()
    center.src = '/frames/center.webp'
    center.onload = tick
    center.onerror = tick
    s.center = center

    const poster = new Image()
    poster.src = '/character-image.png'
    poster.onload = () => {
      s.poster = poster
    }

    // ---- sizing: full viewport, devicePixelRatio-crisp -------------------
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      s.cw = window.innerWidth
      s.ch = window.innerHeight
      canvas.width = Math.round(s.cw * dpr)
      canvas.height = Math.round(s.ch * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e) => {
      s.mx = e.clientX
      s.my = e.clientY
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    // ---- render loop ------------------------------------------------------
    let raf
    const render = () => {
      raf = requestAnimationFrame(render)
      const { cw, ch } = s
      if (!cw || !ch) return

      // cover-fit geometry (source frames are 1920x1080)
      const fw = 1920
      const fh = 1080
      const scale = Math.max(cw / fw, ch / fh)
      const dw = fw * scale
      const dh = fh * scale
      const dx = (cw - dw) / 2
      const dy = (ch - dh) / 2

      // face pivot in screen coordinates
      const fx = dx + FACE.x * dw
      const fy = dy + FACE.y * dh

      let img = null
      if (s.ready && s.mx !== null) {
        const distX = s.mx - fx
        const distY = s.my - fy
        const dist = Math.hypot(distX, distY)
        const deadR = DEADZONE * Math.min(cw, ch)

        if (s.inDeadzone) {
          if (dist > deadR * DEADZONE_EXIT) s.inDeadzone = false
        } else if (dist < deadR) {
          s.inDeadzone = true
        }

        if (s.inDeadzone) {
          // eye contact: look straight into the user's eyes
          img = s.center
        } else {
          const target = (Math.atan2(distY, distX) * 180) / Math.PI
          const t = ((target % 360) + 360) % 360
          s.angle = s.hasAngle ? lerpAngle(s.angle, t, RESPONSE) : t
          s.hasAngle = true
          const index = Math.round((s.angle / 360) * FRAME_COUNT) % FRAME_COUNT
          img = s.frames[index]
        }
      } else if (s.ready) {
        img = s.center
      } else {
        img = s.poster && s.poster.complete ? s.poster : null
      }

      // exactly ONE frame, 100% opacity — no blending, no ghosting
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, cw, ch)
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, dx, dy, dw, dh)
      }
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [onProgress])

  return <canvas ref={canvasRef} className="character-canvas" aria-hidden="true" />
}
