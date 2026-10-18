export default function Hero() {
  return (
    <section className="hero">
      <p className="hero-eyebrow">Hi, I&rsquo;m</p>
      <h1 className="hero-name">Neo</h1>
      <p className="hero-bio">
        Full Stack Developer crafting seamless digital experiences &mdash; from
        resilient APIs and cloud infrastructure to pixel-perfect interfaces that
        feel alive.
      </p>
      <div className="hero-actions">
        <a href="#resume" className="pill pill-solid magnetic">
          Resume
          <svg
            className="pill-arrow"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17L17 7" />
            <path d="M8 7h9v9" />
          </svg>
        </a>
        <a href="#contact" className="pill pill-ghost magnetic">
          Let&rsquo;s Talk
        </a>
      </div>
    </section>
  )
}
