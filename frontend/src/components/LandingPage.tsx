import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../lib/api';
import { headingFontFamily, bodyFontFamily } from '../theme/typography';
import games from './gameData';

type Props = {
  onSignIn: () => void;
  onCreateAccount: () => void;
};

// ─── Data ────────────────────────────────────────────────────────────────────

const LANDING_GAME_COPY: Record<string, { tag: string; mode: string; duration: string; desc: string }> = {
  'spirit-drift': {
    tag: 'Score chase',
    mode: 'Arcade',
    duration: '~1 min',
    desc: 'Catch drifting spirits, protect your combo, and push past 200 points for the Windcatcher achievement.',
  },
  'delivery-on-the-wind': {
    tag: 'Timed route',
    mode: 'Delivery',
    duration: '~2 min',
    desc: 'Guide Kiki through a storybook village, inspect parcels, and finish under one minute to earn courier glory.',
  },
  'spirit-sapling': {
    tag: 'AI nurture',
    mode: 'Care',
    duration: '~3 min',
    desc: 'Choose a guardian, speak kind words through Gemini, grow a sacred tree, and unlock harvest achievements.',
  },
  'half-moon': {
    tag: 'Card ritual',
    mode: 'Strategy',
    duration: '~5 min',
    desc: 'Place lunar phase cards, form cycles, steal chains, and win all three levels against local or Gemini AI.',
  },
};

const GUARDIANS = [
  {
    id: 'deer',
    name: 'Deer Guardian',
    role: 'Keeper of patience',
    intro: 'Hi, I am the guardian Deer.',
    img: '/assets/backgrounds/spirit-sapling/guardians/deer-guardian.png',
    color: '#c8a87a',
  },
  {
    id: 'fox',
    name: 'Fox Guardian',
    role: 'Trickster of the wind',
    intro: 'Hi, I am the guardian Fox.',
    img: '/assets/backgrounds/spirit-sapling/guardians/fox-guardian.png',
    color: '#d4845a',
  },
  {
    id: 'kodama',
    name: 'Kodama Guardian',
    role: 'Voice of the forest',
    intro: 'Hi, I am the guardian Kodama.',
    img: '/assets/backgrounds/spirit-sapling/guardians/kodama-guardian.png',
    color: '#9fbf76',
  },
  {
    id: 'mononoke',
    name: 'Mononoke Guardian',
    role: 'Spirit of wild things',
    intro: 'Hi, I am the guardian Mononoke.',
    img: '/assets/backgrounds/spirit-sapling/guardians/mononoke-guardian.png',
    color: '#8f8fba',
  },
];

const PILLARS = [
  { icon: '🍃', title: 'Four gentle worlds', body: 'Arcade, delivery, nurturing, and lunar strategy games share one calm grove identity.' },
  { icon: '✦',  title: 'Progress that stays', body: 'MongoDB-backed sessions, scores, best runs, leaderboards, and badges remember every finished run.' },
  { icon: '🤖', title: 'AI with purpose',     body: 'Gemini powers kind-word growth and Half Moon move suggestions, while ElevenLabs gives guardians a voice.' },
];

const COMING_SOON = [
  { icon: '🛠', title: 'Stability and Recovery', desc: 'Stronger testing, state recovery, backend validation, and smoother game-session synchronization.' },
  { icon: '🌊', title: 'Elemental Spirit Drift', desc: 'Wind, water, fire, forest, and celestial spirits with distinct movement and particle behavior.' },
  { icon: '🧹', title: 'Living Delivery Town', desc: 'Village NPCs, side quests, relationship moments, and obstacle-flight delivery routes.' },
  { icon: '🌱', title: 'Evolving AI Guardians', desc: 'Persistent guardian conversations, custom personalities, and deeper sapling reactions over time.' },
  { icon: '🌙', title: 'Expanded Half Moon Maps', desc: 'More lunar board layouts, monthly recap environments, and clearer strategic feedback.' },
  { icon: '🎧', title: 'Adaptive Audio World', desc: 'More ambient layers, reactive music, accessibility controls, and richer guardian voice direction.' },
];

const FLOATING_ANIMS: {
  src: string; top?: string; bottom?: string; left: string; width: number;
  opacity: number; delay: string; duration: string; flip?: boolean;
}[] = [
  // Willow curtains — normal left, flipped right
  { src: '/assets/animation/willow-leaves.gif', top: '0%',    left: '-1%',  width: 210, opacity: 0.88, delay: '0s',   duration: '7.2s'             },
  { src: '/assets/animation/willow-leaves.gif', top: '0%',    left: '82%',  width: 210, opacity: 0.88, delay: '0.5s', duration: '7.2s', flip: true },
  // Ladies — bottom-pinned so feet sit on the hero edge
  { src: '/assets/animation/lady-1.gif',        bottom: '0%', left: '6%',   width: 160, opacity: 0.95, delay: '0.6s', duration: '6.4s'             },
  { src: '/assets/animation/lady-2.gif',        bottom: '0%', left: '40%',  width: 160, opacity: 0.95, delay: '1.0s', duration: '6.8s'             },
  { src: '/assets/animation/lady-3.gif',        bottom: '0%', left: '74%',  width: 145, opacity: 0.95, delay: '0.3s', duration: '6.1s'             },
  // Wind — lower-left and lower-right
  { src: '/assets/animation/wind.gif',          top: '62%',   left: '-2%',  width: 165, opacity: 0.52, delay: '1.2s', duration: '8.2s'             },
  { src: '/assets/animation/wind.gif',          top: '55%',   left: '83%',  width: 150, opacity: 0.46, delay: '3.0s', duration: '9.0s', flip: true },
  // Shines scattered across mid-field
  { src: '/assets/animation/shine-1.gif',       top: '22%',   left: '20%',  width: 74,  opacity: 0.55, delay: '0.9s', duration: '5.2s'             },
  { src: '/assets/animation/shine-2.gif',       top: '46%',   left: '66%',  width: 66,  opacity: 0.50, delay: '1.8s', duration: '6.6s'             },
  { src: '/assets/animation/shine-3.gif',       top: '34%',   left: '88%',  width: 58,  opacity: 0.45, delay: '3.1s', duration: '7.0s'             },
  { src: '/assets/animation/shine-1.gif',       top: '68%',   left: '42%',  width: 60,  opacity: 0.40, delay: '2.2s', duration: '5.8s'             },
  { src: '/assets/animation/shine-2.gif',       top: '14%',   left: '52%',  width: 55,  opacity: 0.38, delay: '4.0s', duration: '6.2s'             },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage({ onSignIn, onCreateAccount }: Props) {
  const [activeGuardianId, setActiveGuardianId] = useState(GUARDIANS[1].id);
  const [playingGuardianId, setPlayingGuardianId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const stopGuardianIntro = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setPlayingGuardianId(null);
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const playGuardianIntro = async (guardianId: string) => {
    setActiveGuardianId(guardianId);
    stopGuardianIntro();
    setPlayingGuardianId(guardianId);

    try {
      const response = await fetch(apiUrl('/spirit-sapling/guardian-intro-voice'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guardianId }),
      });

      if (!response.ok) {
        throw new Error(`Voice request failed: ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audioUrlRef.current = audioUrl;
      audio.onended = stopGuardianIntro;
      audio.onerror = stopGuardianIntro;
      await audio.play();
    } catch (error) {
      console.warn('Unable to play guardian intro voice:', error);
      stopGuardianIntro();
    }
  };

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

        {/* Floating GIF animations */}
        {FLOATING_ANIMS.map((anim, i) => (
          <img
            key={i}
            src={anim.src}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: anim.top,
              bottom: anim.bottom,
              left: anim.left,
              width: anim.width,
              height: 'auto',
              opacity: anim.opacity,
              animation: `float-spirit ${anim.duration} ease-in-out ${anim.delay} infinite`,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 4px 16px rgba(120,160,80,0.35))',
              transform: anim.flip ? 'scaleX(-1)' : undefined,
            }}
          />
        ))}

        <div style={s.heroContent}>
          <span style={s.heroBadge}>A cozy micro-game grove</span>

          <h1 style={s.heroTitle}>
            Whisperwind<br />Grove
          </h1>

          <p style={s.heroSubtitle}>
            Four handcrafted browser games with saved progress, achievements,
            leaderboards, guardian voices, and AI-powered moments of play.
          </p>

          <div style={s.heroCtas}>
            <button style={s.ctaPrimary} onClick={onCreateAccount}>
              Join the Grove
            </button>
            <button style={s.ctaGhost} onClick={onSignIn}>
              Sign In
            </button>
          </div>

          <p style={s.heroHint}>Free to play · No downloads · {games.filter((game) => game.available).length} worlds available now</p>
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
            Whisperwind Grove is a full-stack cozy game platform: short sessions,
            persistent player history, expressive AI interactions, and a dashboard
            that turns every run into part of a longer journey.
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
          <h2 style={s.sectionTitleLight}>Four playable worlds, one grove</h2>
          <p style={s.sectionBodyLight}>
            Every game saves its own kind of progress: score, time, harvest, level reached,
            personal best, and achievement unlocks.
          </p>

          <div style={s.gamesGrid}>
            {games.map((game, i) => {
              const copy = LANDING_GAME_COPY[game.id] ?? {
                tag: game.available ? 'Playable now' : 'Growing',
                mode: 'Game',
                duration: '~3 min',
                desc: game.description,
              };
              const bg = game.gameBg ?? game.thumbnail ?? '';
              return (
              <div
                key={game.id}
                style={{
                  ...s.gameCard,
                  backgroundImage: `linear-gradient(180deg, rgba(10,20,8,0.06) 0%, rgba(10,20,8,0.42) 48%, rgba(8,12,6,0.84) 100%), url('${bg}')`,
                  animationDelay: `${i * 0.12}s`,
                }}
              >
                <div style={s.gameCardInner}>
                  <div style={s.gameMetaRow}>
                    <span style={s.gameTag}>{copy.tag}</span>
                    <span style={s.gameMiniTag}>{copy.mode}</span>
                    <span style={s.gameMiniTag}>⏱ {copy.duration}</span>
                  </div>
                  <h3 style={s.gameTitle}>{game.title}</h3>
                  <p style={s.gameDesc}>{copy.desc}</p>
                  <button style={s.gamePlayBtn} onClick={onCreateAccount}>
                    {game.available ? 'Save Progress →' : 'Notify Me'}
                  </button>
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* ── Guardians ─────────────────────────────────────────────────────── */}
      <section style={s.guardiansSection}>
        <div style={s.sectionInner}>
          <span style={s.sectionTag}>The spirit world</span>
          <h2 style={s.sectionTitle}>Meet the Grove Guardians</h2>
          <p style={s.sectionBody}>
            Deer, Fox, Kodama, and Mononoke guide Spirit Sapling with distinct
            personalities and ElevenLabs-powered voices. Select a guardian to preview
            their greeting before entering the grove.
          </p>

          <div style={s.guardiansGrid}>
            {GUARDIANS.map((g) => {
              const active = activeGuardianId === g.id;
              const playing = playingGuardianId === g.id;
              return (
              <button
                key={g.name}
                type="button"
                style={{
                  ...s.guardianCard,
                  ...(active ? {
                    borderColor: `${g.color}`,
                    boxShadow: `0 14px 34px ${g.color}4d`,
                    transform: 'translateY(-4px)',
                  } : {}),
                }}
                onClick={() => setActiveGuardianId(g.id)}
              >
                <div style={{ ...s.guardianImgWrap, background: `radial-gradient(circle at 50% 60%, ${g.color}33, transparent 70%)` }}>
                  <img src={g.img} alt={g.name} style={s.guardianImg} />
                </div>
                <h4 style={s.guardianName}>{g.name}</h4>
                <p style={s.guardianRole}>{g.role}</p>
                <p style={s.guardianIntro}>{g.intro}</p>
                <span
                  style={{ ...s.guardianListenBtn, background: active ? g.color : 'rgba(108,88,76,0.1)' }}
                  onClick={(event) => {
                    event.stopPropagation();
                    void playGuardianIntro(g.id);
                  }}
                >
                  {playing ? 'Playing...' : 'Hear voice'}
                </span>
              </button>
            )})}
          </div>
        </div>
      </section>

      {/* ── Coming Soon ───────────────────────────────────────────────────── */}
      <section style={s.comingSection}>
        <div style={s.sectionInner}>
          <div style={s.comingHeader}>
            <div>
              <span style={s.sectionTagDark}>What is growing next</span>
              <h2 style={s.comingHeading}>Future enhancements</h2>
              <p style={s.comingLead}>
                The current platform is playable end to end. The next phase focuses on
                reliability, richer AI companions, expanded game worlds, and live progression.
              </p>
            </div>
            <img
              src="/assets/backgrounds/delivery-on-the-wind/kiki.png"
              alt="Kiki flying through the grove"
              style={s.comingFeatureImg}
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
            Create a free account to save scores, unlock achievements, track progress,
            and return to every world with your history intact.
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
            Four playable browser games · MongoDB progress · Gemini + ElevenLabs integrations
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
    background: 'var(--bg-page)',
  },

  // ── Nav ────────────────────────────────────────────────────────────────
  nav: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    background: 'rgba(246,241,222,0.88)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
    animation: 'nav-in 0.5s ease both',
  },
  navInner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '8px 28px',
    minHeight: 62,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
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
  navActions: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  navSignIn: {
    padding: '8px 18px', borderRadius: 999,
    border: '1px solid rgba(108,88,76,0.35)',
    background: 'transparent', color: '#6C584C',
    fontFamily: bodyFontFamily, fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
  },
  navJoin: {
    padding: '8px 18px', borderRadius: 999,
    border: 'none', background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--text-on-dark)',
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
      url('/assets/whisperwind-grove.jpg')
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
    maxWidth: 680,
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
  sectionTagDark: {
    display: 'inline-block',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as React.CSSProperties['textTransform'],
    color: '#b9987d',
    fontWeight: 700,
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
  sectionBodyLight: {
    margin: '0 0 28px',
    fontSize: 16,
    color: 'rgba(245,239,219,0.66)',
    lineHeight: 1.6,
    maxWidth: 720,
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
    background: 'linear-gradient(160deg, #223015 0%, #1a2410 48%, #0f190a 100%)',
  },
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))',
    gap: 18,
  },
  gameCard: {
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 360,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1px solid rgba(240,234,210,0.16)',
    boxShadow: 'var(--shadow-lg)',
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
  gameMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  gameTag: {
    display: 'inline-block',
    width: 'fit-content',
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid rgba(173,193,120,0.6)',
    background: 'rgba(173,193,120,0.22)',
    fontSize: 12,
    fontWeight: 700,
    color: '#d6edaa',
  },
  gameMiniTag: {
    display: 'inline-block',
    width: 'fit-content',
    padding: '4px 9px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.12)',
    fontSize: 12,
    color: 'rgba(245,239,219,0.82)',
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
    border: '1px solid rgba(245,239,219,0.22)',
    background: 'linear-gradient(135deg, rgba(173,193,120,0.94), rgba(90,144,48,0.94))',
    color: '#1f2d10',
    fontFamily: bodyFontFamily,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.2,
    backdropFilter: 'blur(4px)',
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
    fontFamily: bodyFontFamily,
    cursor: 'pointer',
    transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
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
  guardianIntro: {
    margin: '2px 0 0',
    fontSize: 13,
    color: '#6C584C',
    lineHeight: 1.35,
  },
  guardianListenBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 34,
    padding: '7px 14px',
    borderRadius: 999,
    color: '#3d2e23',
    fontSize: 13,
    fontWeight: 800,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.24)',
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
  comingHeading: {
    margin: '0 0 14px',
    fontFamily: headingFontFamily,
    fontSize: 'clamp(30px, 5vw, 52px)',
    color: '#f5efdb',
    lineHeight: 1.05,
  },
  comingLead: {
    margin: '0 0 18px',
    fontSize: 17,
    color: 'rgba(245,239,219,0.68)',
    lineHeight: 1.65,
    maxWidth: 680,
  },
  comingFeatureImg: {
    height: 220,
    width: 'auto',
    objectFit: 'contain',
    filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.42)) drop-shadow(0 0 22px rgba(240,234,210,0.22))',
    flexShrink: 0,
    marginLeft: 'auto',
    animation: 'float-spirit 5.4s ease-in-out infinite',
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
