import { headingFontFamily, bodyFontFamily } from '../theme/typography';

type Props = {
  onSignIn: () => void;
  onCreateAccount: () => void;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const GAMES = [
  {
    id: 'spirit-drift',
    title: 'Spirit Drift',
    tag: 'Playable now',
    available: true,
    bg: '/assets/game_bgs/spirit-drift.png',
    desc: 'Catch drifting spirits across the sky before they fade. Build combos, survive Wind Surges, and chase your best score in 60 seconds.',
  },
  {
    id: 'delivery-on-the-wind',
    title: 'Delivery on the Wind',
    tag: 'Playable now',
    available: true,
    bg: '/assets/game_bgs/delivery-on-the-wind.png',
    desc: 'Prepare cozy orders and soar across the sky to deliver them with care. Race the breeze and climb the daily ranking.',
  },
  {
    id: 'spirit-sapling',
    title: 'Spirit Sapling',
    tag: 'Playable now',
    available: true,
    bg: '/assets/game_bgs/spirit-sapling.png',
    desc: 'Tend to a small sapling with patience and balance. Water it, coax sunlight, and watch it grow into a sacred fruit tree.',
  },
];

const GUARDIANS = [
  { name: 'Deer Guardian',     role: 'Keeper of patience',    img: '/assets/backgrounds/spirit-sapling/guardians/deer-guardian.png',     color: '#c8a87a' },
  { name: 'Fox Guardian',      role: 'Trickster of the wind', img: '/assets/backgrounds/spirit-sapling/guardians/fox-guardian.png',      color: '#d4845a' },
  { name: 'Kodama Guardian',   role: 'Voice of the forest',   img: '/assets/backgrounds/spirit-sapling/guardians/kodama-guardian.png',   color: '#9fbf76' },
  { name: 'Mononoke Guardian', role: 'Spirit of wild things', img: '/assets/backgrounds/spirit-sapling/guardians/mononoke-guardian.png', color: '#8f8fba' },
];

const PILLARS = [
  { icon: '🍃', title: 'Gentle worlds',      body: 'Each game is designed to be calm, beautiful, and easy to pick up — no pressure, just presence.' },
  { icon: '⏱',  title: 'Short sessions',     body: 'Runs last 1–3 minutes. Perfect for a quiet break, a commute, or a moment between tasks.' },
  { icon: '✦',  title: 'Track your journey', body: 'Log in to save scores, climb leaderboards, and watch your progress across every world.' },
];

const COMING_SOON = [
  { icon: '🌸', title: 'Seasonal Events',       desc: 'Spring Bloom, Autumn Harvest — limited-time worlds with unique rewards and creatures.' },
  { icon: '👥', title: 'Multiplayer Groves',     desc: 'Co-op sapling tending and spirit-catching with friends in shared sessions.' },
  { icon: '🦊', title: 'Avatar Studio',          desc: 'Build a grove profile with a custom spirit avatar, chosen guardian, and earned titles.' },
  { icon: '📅', title: 'Daily Challenges',       desc: 'New quests each morning — bonus score windows, rare spirits, and special conditions.' },
  { icon: '🏆', title: 'Achievement Badges',     desc: 'Earn guardian medals, streak badges, and secret titles hidden across the worlds.' },
  { icon: '🌿', title: 'New Worlds',             desc: 'Forest Temple, Cloud Meadow, and River Crossing are growing in the grove right now.' },
];

const FLOATING_SPIRITS = [
  { src: '/assets/sprites/wind-spirit-1.png',    top: '18%', left: '8%',  size: 72, delay: '0s',    duration: '5.8s' },
  { src: '/assets/sprites/wind-spirit-2.png',    top: '32%', left: '88%', size: 64, delay: '1.4s',  duration: '7.1s' },
  { src: '/assets/sprites/wind-spirit-gold.png', top: '60%', left: '6%',  size: 58, delay: '2.6s',  duration: '6.3s' },
  { src: '/assets/sprites/wind-spirit-3.png',    top: '22%', left: '75%', size: 54, delay: '0.8s',  duration: '8.0s' },
  { src: '/assets/sprites/wind-spirit-1.png',    top: '72%', left: '82%', size: 48, delay: '3.2s',  duration: '5.4s' },
  { src: '/assets/sprites/wind-spirit-2.png',    top: '50%', left: '92%', size: 42, delay: '1.9s',  duration: '6.9s' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage({ onSignIn, onCreateAccount }: Props) {
  return (
    <div style={s.page}>

      {/* ── Fixed Nav ─────────────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navLogo}>
            <img src="/assets/grove-logo.png" alt="Whisperwind Grove logo" style={s.navLogoImg} />
            <span style={s.navTitle}>Whisperwind Grove</span>
          </div>
          <div style={s.navActions}>
            <button style={s.navSignIn} onClick={onSignIn}>Sign In</button>
            <button style={s.navJoin}   onClick={onCreateAccount}>Create Account</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={s.hero}>
        {/* Ray of light */}
        <img
          src="/assets/animation/ray-of-light-animation.gif"
          alt=""
          style={s.rayOverlay}
          aria-hidden="true"
        />

        {/* Floating spirits */}
        {FLOATING_SPIRITS.map((sp, i) => (
          <img
            key={i}
            src={sp.src}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: sp.top,
              left: sp.left,
              width: sp.size,
              height: sp.size,
              objectFit: 'contain',
              opacity: 0.72,
              animation: `float-spirit ${sp.duration} ease-in-out ${sp.delay} infinite`,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 0 12px rgba(173,193,120,0.55))',
            }}
          />
        ))}

        <div style={s.heroContent}>
          <span style={s.heroBadge}>A cozy micro-game grove</span>

          <h1 style={s.heroTitle}>
            Whisperwind<br />Grove
          </h1>

          <p style={s.heroSubtitle}>
            A quiet place to play, breathe, and grow.<br />
            Short, beautiful browser games inspired by the living forest.
          </p>

          <div style={s.heroCtas}>
            <button style={s.ctaPrimary} onClick={onCreateAccount}>
              Join the Grove
            </button>
            <button style={s.ctaGhost} onClick={onSignIn}>
              Sign In
            </button>
          </div>

          <p style={s.heroHint}>Free to play · No downloads · 3 worlds available now</p>
        </div>

        <div style={s.heroScrollHint}>
          <span style={s.scrollArrow}>↓</span>
        </div>
      </section>

      {/* ── Pillars ───────────────────────────────────────────────────────── */}
      <section style={s.pillarsSection}>
        <div style={s.sectionInner}>
          <span style={s.sectionTag}>What is the Grove?</span>
          <h2 style={s.sectionTitle}>A place made for quiet moments</h2>
          <p style={s.sectionBody}>
            Whisperwind Grove is a collection of handcrafted browser mini-games set in a nature-inspired world.
            Each world is short, calm, and complete — a breath of fresh air you can take anytime.
          </p>

          <div style={s.pillarsGrid}>
            {PILLARS.map((p) => (
              <div key={p.title} style={s.pillar}>
                <span style={s.pillarIcon}>{p.icon}</span>
                <h3 style={s.pillarTitle}>{p.title}</h3>
                <p style={s.pillarBody}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Games ─────────────────────────────────────────────────────────── */}
      <section style={s.gamesSection}>
        <div style={s.sectionInner}>
          <span style={s.sectionTagLight}>Worlds to explore</span>
          <h2 style={s.sectionTitleLight}>Three worlds, one grove</h2>

          <div style={s.gamesGrid}>
            {GAMES.map((game, i) => (
              <div
                key={game.id}
                style={{
                  ...s.gameCard,
                  backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.18) 0%, rgba(10,10,10,0.7) 100%), url('${game.bg}')`,
                  animationDelay: `${i * 0.12}s`,
                }}
              >
                <div style={s.gameCardInner}>
                  <span style={{
                    ...s.gameTag,
                    background: game.available ? 'rgba(173,193,120,0.3)' : 'rgba(255,255,255,0.12)',
                    borderColor: game.available ? 'rgba(173,193,120,0.6)' : 'rgba(255,255,255,0.3)',
                  }}>
                    {game.tag}
                  </span>
                  <h3 style={s.gameTitle}>{game.title}</h3>
                  <p style={s.gameDesc}>{game.desc}</p>
                  <button style={s.gamePlayBtn} onClick={onCreateAccount}>
                    {game.available ? 'Play Now →' : 'Notify Me'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Guardians ─────────────────────────────────────────────────────── */}
      <section style={s.guardiansSection}>
        <div style={s.sectionInner}>
          <span style={s.sectionTag}>The spirit world</span>
          <h2 style={s.sectionTitle}>Meet the Grove Guardians</h2>
          <p style={s.sectionBody}>
            Ancient spirits watch over every world in the grove.
            Each guardian carries their own wisdom — and their own secrets.
          </p>

          <div style={s.guardiansGrid}>
            {GUARDIANS.map((g) => (
              <div key={g.name} style={s.guardianCard}>
                <div style={{ ...s.guardianImgWrap, background: `radial-gradient(circle at 50% 60%, ${g.color}33, transparent 70%)` }}>
                  <img src={g.img} alt={g.name} style={s.guardianImg} />
                </div>
                <h4 style={s.guardianName}>{g.name}</h4>
                <p style={s.guardianRole}>{g.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coming Soon ───────────────────────────────────────────────────── */}
      <section style={s.comingSection}>
        <div style={s.sectionInner}>
          <div style={s.comingHeader}>
            <div>
              <span style={s.sectionTag}>What's growing</span>
              <h2 style={s.sectionTitle}>Future enhancements</h2>
              <p style={s.sectionBody}>
                The grove is always expanding. Here's a glimpse of what's taking root.
              </p>
            </div>
            <img
              src="/assets/backgrounds/spirit-sapling/sapling-growth/sapling-5.png"
              alt="A fully grown sapling"
              style={s.comingSaplingImg}
            />
          </div>

          <div style={s.comingGrid}>
            {COMING_SOON.map((f) => (
              <div key={f.title} style={s.comingCard}>
                <span style={s.comingIcon}>{f.icon}</span>
                <div>
                  <h4 style={s.comingTitle}>{f.title}</h4>
                  <p style={s.comingDesc}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section style={s.ctaSection}>
        <div style={s.ctaInner}>
          <img src="/assets/grove-logo.png" alt="" style={s.ctaLogoImg} />
          <h2 style={s.ctaTitle}>Ready to enter the grove?</h2>
          <p style={s.ctaBody}>
            Create a free account to save your scores, track progress, and climb the leaderboards.
          </p>
          <div style={s.ctaButtons}>
            <button style={s.ctaBig} onClick={onCreateAccount}>
              Create Free Account
            </button>
            <button style={s.ctaTextBtn} onClick={onSignIn}>
              Already have an account? Sign in →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerLogo}>
            <img src="/assets/grove-logo.png" alt="" style={s.navLogoImg} />
            <span style={s.footerLogoText}>Whisperwind Grove</span>
          </div>
          <p style={s.footerText}>
            A cozy browser game grove · Built with care · Always growing
          </p>
        </div>
      </footer>

    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    width: '100vw',
    overflowX: 'hidden',
    fontFamily: bodyFontFamily,
    background: '#f6f1de',
  },

  // ── Nav ────────────────────────────────────────────────────────────────
  nav: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    background: 'rgba(246,241,222,0.82)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(108,88,76,0.18)',
    animation: 'nav-in 0.5s ease both',
  },
  navInner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 28px',
    height: 62,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  navLogoImg: {
    width: 34, height: 34, objectFit: 'contain' as React.CSSProperties['objectFit'],
    flexShrink: 0,
    filter: 'drop-shadow(0 0 8px rgba(173,193,120,0.5))',
  },
  navTitle: {
    fontFamily: headingFontFamily, fontSize: 20, color: '#6C584C', lineHeight: 1,
  },
  navActions: { display: 'flex', gap: 10, alignItems: 'center' },
  navSignIn: {
    padding: '8px 18px', borderRadius: 999,
    border: '1px solid rgba(108,88,76,0.35)',
    background: 'transparent', color: '#6C584C',
    fontFamily: bodyFontFamily, fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
  },
  navJoin: {
    padding: '8px 18px', borderRadius: 999,
    border: 'none', background: '#A98467', color: '#F0EAD2',
    fontFamily: bodyFontFamily, fontSize: 14, fontWeight: 700,
    cursor: 'pointer',
  },

  // ── Hero ───────────────────────────────────────────────────────────────
  hero: {
    position: 'relative',
    minHeight: '100vh',
    paddingTop: 62,
    backgroundImage: `
      linear-gradient(180deg, rgba(10,12,8,0.48) 0%, rgba(10,15,8,0.62) 60%, rgba(6,8,5,0.78) 100%),
      url('/assets/whisperwind-grove.png')
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rayOverlay: {
    position: 'absolute',
    top: 0, left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 900,
    opacity: 0.28,
    pointerEvents: 'none',
    mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'],
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    animation: 'hero-title-in 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s both',
  },
  heroBadge: {
    display: 'inline-block',
    padding: '5px 14px',
    borderRadius: 999,
    background: 'rgba(173,193,120,0.22)',
    border: '1px solid rgba(173,193,120,0.5)',
    color: '#d4e8a4',
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as React.CSSProperties['textTransform'],
  },
  heroTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 'clamp(52px, 9vw, 110px)',
    lineHeight: 1.0,
    color: '#f5efdb',
    textShadow: '0 4px 32px rgba(0,0,0,0.5)',
    letterSpacing: 1,
  },
  heroSubtitle: {
    margin: 0,
    fontSize: 'clamp(16px, 2.2vw, 22px)',
    color: 'rgba(245,239,219,0.78)',
    lineHeight: 1.6,
    maxWidth: 520,
  },
  heroCtas: { display: 'flex', gap: 14, flexWrap: 'wrap' as React.CSSProperties['flexWrap'], justifyContent: 'center' },
  ctaPrimary: {
    padding: '14px 32px', borderRadius: 14, border: 'none',
    background: '#ADC178', color: '#2d3e0f',
    fontFamily: bodyFontFamily, fontSize: 17, fontWeight: 700,
    cursor: 'pointer', letterSpacing: 0.3,
    boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
  },
  ctaGhost: {
    padding: '14px 32px', borderRadius: 14,
    border: '1px solid rgba(245,239,219,0.45)',
    background: 'rgba(245,239,219,0.07)',
    color: 'rgba(245,239,219,0.9)',
    fontFamily: bodyFontFamily, fontSize: 17,
    cursor: 'pointer',
  },
  heroHint: {
    margin: 0, fontSize: 13,
    color: 'rgba(245,239,219,0.45)',
    letterSpacing: 0.3,
  },
  heroScrollHint: {
    position: 'absolute',
    bottom: 28, left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2,
    animation: 'float-spirit 2.4s ease-in-out infinite',
  },
  scrollArrow: { fontSize: 22, color: 'rgba(245,239,219,0.4)' },

  // ── Shared section styles ──────────────────────────────────────────────
  sectionInner: {
    maxWidth: 1180,
    margin: '0 auto',
    padding: '0 28px',
  },
  sectionTag: {
    display: 'inline-block',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as React.CSSProperties['textTransform'],
    color: '#A98467',
    fontWeight: 600,
    marginBottom: 10,
  },
  sectionTagLight: {
    display: 'inline-block',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as React.CSSProperties['textTransform'],
    color: 'rgba(240,234,210,0.6)',
    fontWeight: 600,
    marginBottom: 10,
  },
  sectionTitle: {
    margin: '0 0 14px',
    fontFamily: headingFontFamily,
    fontSize: 'clamp(28px, 4vw, 44px)',
    color: '#3d2e23',
    lineHeight: 1.1,
  },
  sectionTitleLight: {
    margin: '0 0 14px',
    fontFamily: headingFontFamily,
    fontSize: 'clamp(28px, 4vw, 44px)',
    color: '#f5efdb',
    lineHeight: 1.1,
  },
  sectionBody: {
    margin: '0 0 36px',
    fontSize: 17,
    color: '#7a5f4e',
    lineHeight: 1.65,
    maxWidth: 640,
  },

  // ── Pillars ────────────────────────────────────────────────────────────
  pillarsSection: {
    padding: '96px 0 88px',
    background: 'linear-gradient(180deg, #f6f1de 0%, #eef4e0 100%)',
  },
  pillarsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 20,
  },
  pillar: {
    padding: '28px 24px',
    borderRadius: 18,
    border: '1px solid rgba(108,88,76,0.18)',
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 28px rgba(58,45,36,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  pillarIcon: { fontSize: 32, lineHeight: 1 },
  pillarTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 22,
    color: '#5a4535',
  },
  pillarBody: { margin: 0, fontSize: 15, color: '#7a5f4e', lineHeight: 1.55 },

  // ── Games ──────────────────────────────────────────────────────────────
  gamesSection: {
    padding: '88px 0',
    background: 'linear-gradient(160deg, #2a1e14 0%, #1a1208 60%, #0d1a0a 100%)',
  },
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 18,
  },
  gameCard: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 320,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 16px 36px rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'flex-end',
    animation: 'fade-in-up 0.6s ease both',
    transition: 'transform 220ms ease, box-shadow 220ms ease',
  },
  gameCardInner: {
    width: '100%',
    padding: '20px 20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  gameTag: {
    display: 'inline-block',
    width: 'fit-content',
    padding: '3px 10px',
    borderRadius: 999,
    border: '1px solid',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as React.CSSProperties['textTransform'],
    color: '#d6edaa',
  },
  gameTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 26,
    color: '#f5efdb',
    lineHeight: 1.1,
  },
  gameDesc: {
    margin: 0,
    fontSize: 14,
    color: 'rgba(245,239,219,0.72)',
    lineHeight: 1.5,
  },
  gamePlayBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    padding: '8px 16px',
    borderRadius: 10,
    border: 'none',
    background: 'rgba(173,193,120,0.25)',
    color: '#d6edaa',
    fontFamily: bodyFontFamily,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.2,
    backdropFilter: 'blur(4px)',
    border2: '1px solid rgba(173,193,120,0.4)',
  } as React.CSSProperties,

  // ── Guardians ──────────────────────────────────────────────────────────
  guardiansSection: {
    padding: '88px 0',
    background: 'linear-gradient(180deg, #eef4e0 0%, #e5edd0 100%)',
  },
  guardiansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 24,
  },
  guardianCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '24px 16px',
    borderRadius: 18,
    border: '1px solid rgba(108,88,76,0.15)',
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 24px rgba(58,45,36,0.08)',
    textAlign: 'center' as React.CSSProperties['textAlign'],
    animation: 'fade-in-up 0.6s ease both',
  },
  guardianImgWrap: {
    width: 140,
    height: 160,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  guardianImg: {
    height: '100%',
    width: 'auto',
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
  },
  guardianName: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 18,
    color: '#5a4535',
  },
  guardianRole: {
    margin: 0,
    fontSize: 13,
    color: '#9a7a65',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },

  // ── Coming Soon ────────────────────────────────────────────────────────
  comingSection: {
    padding: '88px 0',
    background: 'linear-gradient(180deg, #2a1e14 0%, #1a1208 100%)',
  },
  comingHeader: {
    display: 'flex',
    gap: 40,
    alignItems: 'flex-start',
    marginBottom: 40,
    flexWrap: 'wrap' as React.CSSProperties['flexWrap'],
  },
  comingSaplingImg: {
    height: 180,
    width: 'auto',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 24px rgba(173,193,120,0.4))',
    flexShrink: 0,
    marginLeft: 'auto',
    animation: 'float-spirit 6s ease-in-out infinite',
  },
  comingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 14,
  },
  comingCard: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    padding: '20px 20px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(4px)',
    animation: 'fade-in-up 0.5s ease both',
  },
  comingIcon: { fontSize: 28, lineHeight: 1, flexShrink: 0, marginTop: 2 },
  comingTitle: {
    margin: '0 0 5px',
    fontFamily: headingFontFamily,
    fontSize: 18,
    color: '#f5efdb',
    lineHeight: 1.1,
  },
  comingDesc: { margin: 0, fontSize: 14, color: 'rgba(245,239,219,0.6)', lineHeight: 1.5 },

  // ── Final CTA ──────────────────────────────────────────────────────────
  ctaSection: {
    padding: '100px 28px',
    background: 'linear-gradient(160deg, #eef4e0 0%, #d9e6bf 100%)',
    textAlign: 'center' as React.CSSProperties['textAlign'],
  },
  ctaInner: {
    maxWidth: 640,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
  },
  ctaLogoImg: {
    width: 72, height: 72, objectFit: 'contain' as React.CSSProperties['objectFit'],
    filter: 'drop-shadow(0 0 16px rgba(173,193,120,0.6))',
    animation: 'glow-orb 3s ease-in-out infinite',
  },
  ctaTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 'clamp(28px, 4vw, 44px)',
    color: '#3d2e23',
    lineHeight: 1.1,
  },
  ctaBody: {
    margin: 0,
    fontSize: 17,
    color: '#7a5f4e',
    lineHeight: 1.6,
  },
  ctaButtons: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  ctaBig: {
    padding: '16px 44px',
    borderRadius: 14,
    border: 'none',
    background: '#A98467',
    color: '#F0EAD2',
    fontFamily: bodyFontFamily,
    fontSize: 19,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.4,
    boxShadow: '0 10px 28px rgba(108,88,76,0.3)',
  },
  ctaTextBtn: {
    background: 'none',
    border: 'none',
    color: '#7a5f4e',
    fontFamily: bodyFontFamily,
    fontSize: 15,
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },

  // ── Footer ─────────────────────────────────────────────────────────────
  footer: {
    background: '#1a1208',
    padding: '28px 28px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  footerInner: {
    maxWidth: 1180,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap' as React.CSSProperties['flexWrap'],
  },
  footerLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  footerLogoText: {
    fontFamily: headingFontFamily,
    fontSize: 17,
    color: 'rgba(245,239,219,0.7)',
  },
  footerText: {
    margin: 0,
    fontSize: 13,
    color: 'rgba(245,239,219,0.35)',
    letterSpacing: 0.2,
  },
};
