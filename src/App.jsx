import { useCallback, useState } from 'react'
import CharacterCanvas from './components/CharacterCanvas.jsx'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import MagneticCursor from './components/MagneticCursor.jsx'

export default function App() {
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const handleProgress = useCallback((done, total) => {
    setProgress(done / total)
    if (done >= total) setLoaded(true)
  }, [])

  return (
    <>
      <CharacterCanvas onProgress={handleProgress} />
      <div className={`loader ${loaded ? 'loader--done' : ''}`} aria-hidden={loaded}>
        <span className="loader-pct">{Math.round(progress * 100)}</span>
        <span className="loader-label">loading experience</span>
      </div>
      <Nav />
      <Hero />
      <MagneticCursor />
    </>
  )
}
