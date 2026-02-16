import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import styles from './Landing.module.css'

export function Landing() {
  const [stage, setStage] = useState('live')
  const sectionsRef = useRef([])
  const pinRef = useRef(null)
  const heroRef = useRef(null)
  const rafRef = useRef(0)
  const flowRef = useRef(null)
  const ctaRef = useRef(null)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target
          if (entry.isIntersecting) {
            el.classList.add(styles.inView)
            const s = el.getAttribute('data-stage')
            if (s) setStage(s)
          }
        })
      },
      { threshold: 0.4 }
    )
    sectionsRef.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const rect = heroRef.current.getBoundingClientRect()
        const vh = window.innerHeight || 1
        const centerOffset = (rect.top + rect.height / 2) - vh / 2
        let norm = centerOffset / vh
        if (norm > 1) norm = 1
        if (norm < -1) norm = -1
        heroRef.current.style.setProperty('--parallaxHero', String(norm))

        // Progress per feature block (0..1 around viewport center)
        const pinEl = pinRef.current
        if (pinEl) {
          const compute = (el) => {
            if (!el) return 0
            const r = el.getBoundingClientRect()
            const mid = r.top + r.height / 2
            const dist = Math.abs(mid - vh / 2)
            const p = 1 - Math.min(1, dist / (vh * 0.6))
            return Math.max(0, p)
          }
          const blocks = sectionsRef.current
          const pLive = compute(blocks[0])
          const pRoutes = compute(blocks[1])
          const pAlerts = compute(blocks[2])
          const pReplay = compute(blocks[3])
          pinEl.style.setProperty('--liveProgress', String(pLive.toFixed(3)))
          pinEl.style.setProperty('--routesProgress', String(pRoutes.toFixed(3)))
          pinEl.style.setProperty('--alertsProgress', String(pAlerts.toFixed(3)))
          pinEl.style.setProperty('--replayProgress', String(pReplay.toFixed(3)))
          const focus = Math.max(pLive, pRoutes, pAlerts, pReplay)
          pinEl.style.setProperty('--focusProgress', String(focus.toFixed(3)))
        }
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / Math.max(1, r.width)
      const y = (e.clientY - r.top) / Math.max(1, r.height)
      el.style.setProperty('--mx', String(x.toFixed(3)))
      el.style.setProperty('--my', String(y.toFixed(3)))
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className={styles.page}>
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            Aproape de cei dragi, <span className={styles.highlight}>oriunde s-ar afla</span>
          </h1>
          <p className={styles.subtitle}>
            EchoSafe îți oferă un mod fluid și intuitiv de a urmări trasee, zone și alerte —
            cu un singur click, fără aplicații suplimentare pe dispozitivul monitorizat.
          </p>
          <div className={styles.actions}>
            <Link to="/register" className="btn btn--primary btn--lg">
              Începe acum
            </Link>
            <Link to="/login" className="btn btn--ghost btn--lg">
              Am deja cont
            </Link>
          </div>
        </div>
        <div className={styles.visual}>
          <div className={styles.collage}>
            <TileImg src="/images/home/home-1.svg" alt="Moment în aer liber" />
            <TileImg src="/images/home/home-2.svg" alt="Îmbrățișare acasă" />
            <TileImg src="/images/home/home-3.svg" alt="Tehnologie pentru conectare" />
            <TileImg src="/images/home/home-4.svg" alt="Conectat de la distanță" />
          </div>
        </div>
      </section>

      <section ref={flowRef} className={styles.showcase}>
        <div ref={pinRef} className={styles.pin} data-stage={stage}>
          <DeviceMock stage={stage} />
        </div>
        <div className={styles.flow}>
          <FeatureBlock
            refFn={(el) => (sectionsRef.current[0] = el)}
            stage="live"
            title="Live Tracking"
            copy="Vezi locatia membrilor familiei tale in timp real, fara aplicatii suplimentare, pe orice device."
          />
          <FeatureBlock
            refFn={(el) => (sectionsRef.current[1] = el)}
            stage="routes"
            title="Planificator de trasee inteligent"
            copy="Calculezi rute inteligent sau desenezi liber pe hartă. Ajustezi puncte prin drag & drop și vezi distanța și ETA în timp real pentru fiecare traseu."
          />
          <FeatureBlock
            refFn={(el) => (sectionsRef.current[2] = el)}
            stage="alerts"
            title="Alerte inteligente"
            copy="Primești alerte la intrarea în zonele No‑Go, devieri de la traseu și staționare prelungită — cu excluderi în Safe Zones."
          />
          <FeatureBlock
            refFn={(el) => (sectionsRef.current[3] = el)}
            stage="replay"
            title="Time Machine & Heatmap"
            copy="Redă istoricul pe interval, exportă CSV și vizualizează densitatea deplasărilor cu heatmap."
          />
        </div>
      </section>

      <section className={styles.featuresGrid}>
        <div className={styles.cards}>
          <InfoCard
            img="/images/home/home-1.svg?v=2"
            title="Rute inteligente"
            copy="Definești rute smart pe zile și intervale; primești alerte la deviații."
            onHoverStage={() => setStage('routes')}
          />
          <InfoCard
            img="/images/home/home-2.svg?v=4"
            title="Planificator de trasee inteligent"
            copy="Calculezi rute sau desenezi liber pe hartă traseul; distanțele și ETA sunt calculate în timp real."
            onHoverStage={() => setStage('routes')}
          />
          <InfoCard
            img="/images/home/home-3.svg?v=4"
            title="No‑Go & Safe Zones"
            copy="Configurezi zone interzise și zone sigure pentru staționare."
            onHoverStage={() => setStage('alerts')}
          />
          <InfoCard
            img="/images/home/home-4.svg?v=4"
            title="Istoric & Export"
            copy="Redai parcursul și exporți punctele în CSV pentru analiză."
            onHoverStage={() => setStage('replay')}
          />
        </div>
      </section>

      <section className={styles.steps}>
        <div className={styles.stepsInner}>
          <h2 className={styles.gridTitle}>Cum funcționează</h2>
          <ol className={styles.stepList}>
            <li className={styles.stepItem}>
              <span className={styles.stepNum}>1</span>
              <div className={styles.stepBody}>
                <h3>Înregistrezi contul</h3>
                <p>Te autentifici rapid și configurezi preferințele.</p>
              </div>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepNum}>2</span>
              <div className={styles.stepBody}>
                <h3>Adaugi membru</h3>
                <p>Asociezi dispozitivul prin OTP și confirmi legătura.</p>
              </div>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepNum}>3</span>
              <div className={styles.stepBody}>
                <h3>Configurezi rute și zone</h3>
                <p>Setezi rute smart sau free‑hand și poligoane No‑Go/Safe.</p>
              </div>
            </li>
            <li className={styles.stepItem}>
              <span className={styles.stepNum}>4</span>
              <div className={styles.stepBody}>
                <h3>Primești alerte</h3>
                <p>Deviații, intrări în No‑Go și staționare prelungită — în timp util.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div ref={ctaRef} className={styles.ctaInner}>
          <h3>Începe acum cu EchoSafe</h3>
          <p>Activează modul Demo pentru a explora aplicația sau creează un cont gratuit.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn--primary btn--lg">Creează cont</Link>
            <Link to="/login" className="btn btn--ghost btn--lg">Intră în Demo</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function DeviceMock({ stage }) {
  return (
    <div className={styles.device}>
      <div className={styles.statusBar}>
        <span className={styles.dot} />
        <span className={styles.statusText}>{stage === 'live' ? 'LIVE' : 'ECHO'} SAFE</span>
        <span className={styles.time}>{stage === 'live' ? '02:37' : '12:30'}</span>
      </div>
      <div className={styles.canvas}>
        <StageBg stage={stage} />
        <LiveVisual active={stage === 'live'} />
        <RoutesVisual active={stage === 'routes'} />
        <AlertsVisual active={stage === 'alerts'} />
        <ReplayVisual active={stage === 'replay'} />
      </div>
    </div>
  )
}

function StageBg({ stage }) {
  const map = {
    live: '/images/home/home-1.svg',
    routes: '/images/home/home-2.svg',
    alerts: '/images/home/home-3.svg',
    replay: '/images/home/home-4.svg',
  }
  return <img className={styles.bgImg} src={map[stage]} alt="" aria-hidden="true" />
}

function LiveVisual({ active }) {
  return (
    <div className={`${styles.scene} ${styles.pane} ${active ? styles.paneActive : ''}`}>
      <div className={styles.pathDots}>
        <span className={`${styles.dotMove} ${styles.d1}`} />
        <span className={`${styles.dotMove} ${styles.d2}`} />
        <span className={`${styles.dotMove} ${styles.d3}`} />
      </div>
      <div className={`${styles.ping} ${styles.p1}`} />
      <div className={`${styles.ping} ${styles.p2}`} />
      <div className={styles.badge}>LIVE</div>
    </div>
  )
}
function RoutesVisual({ active }) {
  return (
    <div className={`${styles.scene} ${styles.pane} ${active ? styles.paneActive : ''}`}>
      <svg className={styles.svg} viewBox="0 0 240 160" aria-hidden="true">
        <polyline className={`${styles.path} ${styles.pathDashed}`} points="10,140 60,110 100,120 150,70 200,60" />
        <circle className={styles.node} cx="10" cy="140" r="5" />
        <circle className={styles.node} cx="200" cy="60" r="6" />
        <circle className={styles.playhead} cx="10" cy="140" r="4" />
      </svg>
    </div>
  )
}
function AlertsVisual({ active }) {
  return (
    <div className={`${styles.scene} ${styles.pane} ${active ? styles.paneActive : ''}`}>
      <div className={styles.zone} />
      <div className={`${styles.marker} ${styles.markerAnim}`} />
      <div className={styles.toast}>No‑Go enter</div>
    </div>
  )
}
function ReplayVisual({ active }) {
  return (
    <div className={`${styles.scene} ${styles.pane} ${active ? styles.paneActive : ''}`}>
      <svg className={styles.svg} viewBox="0 0 240 160" aria-hidden="true">
        <circle className={styles.heat1} cx="80" cy="90" r="22" />
        <circle className={styles.heat2} cx="120" cy="70" r="16" />
        <circle className={styles.heat3} cx="160" cy="95" r="12" />
        <rect className={styles.progress} x="20" y="140" width="200" height="4" rx="2" />
        <rect className={styles.progressFill} x="20" y="140" width="200" height="4" rx="2" />
      </svg>
    </div>
  )
}

function FeatureBlock({ refFn, stage, title, copy }) {
  return (
    <article ref={refFn} data-stage={stage} className={`${styles.feature} ${styles.reveal}`}>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureCopy}>{copy}</p>
    </article>
  )
}

function TileImg({ src, alt }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      data-loaded={loaded ? 'true' : undefined}
      className={styles.tile}
    />
  )
}

function InfoCard({ img, title, copy, onHoverStage }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const handleEnter = () => {
    if (typeof onHoverStage === 'function') onHoverStage()
    const s = (title || '').toLowerCase()
    const map = { live: 0, routes: 1, alerts: 2, replay: 3 }
    // Attempt to scroll to matching section based on mapped title keyword
    let idx = -1
    if (s.includes('live')) idx = map.live
    else if (s.includes('free') || s.includes('rut') ) idx = map.routes
    else if (s.includes('go') || s.includes('alert')) idx = map.alerts
    else if (s.includes('istor') || s.includes('export')) idx = map.replay
    if (idx >= 0 && sectionsRef.current[idx]) {
      sectionsRef.current[idx].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
  return (
    <article
      ref={ref}
      className={`${styles.card} ${inView ? styles.cardIn : ''}`}
      onMouseEnter={handleEnter}
    >
      <img className={styles.cardImg} src={img} alt="" loading="lazy" decoding="async" />
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardCopy}>{copy}</p>
      </div>
    </article>
  )
}
