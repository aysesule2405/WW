import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { bodyFontFamily, headingFontFamily } from '../theme/typography';

type Props = {
  onGoToRegister: () => void;
  onGoToLanding?: () => void;
};

export default function LoginPage({ onGoToRegister, onGoToLanding }: Props) {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // AuthContext update triggers App re-render → dashboard shown automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    ...s.page,
    backgroundImage: isDark
      ? 'radial-gradient(circle at 80% 10%, rgba(90,120,48,0.18), transparent 42%), linear-gradient(160deg, #1A2212 0%, #111808 55%, #0E1A0A 100%)'
      : 'radial-gradient(circle at 80% 10%, rgba(173,193,120,0.35), transparent 42%), linear-gradient(160deg, #f6f1de 0%, #e5edd0 55%, #d9e6bf 100%)',
  };

  return (
    <div className="ww-auth-page" style={pageStyle}>
      {onGoToLanding && (
        <button style={s.backBtn} onClick={onGoToLanding}>← Back to Grove</button>
      )}
      <div className="ww-auth-card" style={s.card}>
        {/* Logo */}
        <div style={s.logoRow}>
          <img src="/assets/grove-logo.png" alt="Whisperwind Grove" style={s.logoImg} />
          <span style={s.logoText}>Whisperwind Grove</span>
        </div>

        <h1 style={s.heading}>Welcome back</h1>
        <p style={s.sub}>Sign in to your grove to continue</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={s.input}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label style={s.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={s.input}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p style={s.error}>{error}</p>}

          <button
            type="submit"
            style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={s.footerText}>
          New to the grove?{' '}
          <button style={s.link} onClick={onGoToRegister}>
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: bodyFontFamily,
    padding: 24,
    boxSizing: 'border-box',
  },
  card: {
    width: 'min(440px, 100%)',
    background: 'var(--bg-surface)',
    backdropFilter: 'blur(14px)',
    borderRadius: 24,
    border: '1px solid var(--border-strong)',
    boxShadow: 'var(--shadow-lg)',
    padding: '40px 40px 32px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  logoImg: {
    width: 32,
    height: 32,
    objectFit: 'contain' as const,
    flexShrink: 0,
    filter: 'drop-shadow(0 0 6px rgba(173,193,120,0.5))',
  },
  logoText: {
    fontFamily: headingFontFamily,
    fontSize: 18,
    color: 'var(--text-secondary)',
    lineHeight: 1,
  },
  heading: {
    margin: '0 0 6px',
    fontFamily: headingFontFamily,
    fontSize: 30,
    color: 'var(--text-h)',
    lineHeight: 1.1,
  },
  sub: {
    margin: '0 0 26px',
    fontSize: 15,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  input: {
    padding: '11px 14px',
    borderRadius: 10,
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-input)',
    fontSize: 15,
    fontFamily: bodyFontFamily,
    color: 'var(--text-body)',
    outline: 'none',
    transition: 'border-color 150ms',
  },
  error: {
    margin: 0,
    padding: '10px 14px',
    borderRadius: 8,
    background: 'var(--bg-danger-soft)',
    border: '1px solid rgba(220,60,60,0.28)',
    color: '#C04040',
    fontSize: 14,
    lineHeight: 1.4,
  },
  btn: {
    marginTop: 4,
    padding: '13px 0',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
    color: 'var(--text-on-dark)',
    fontFamily: bodyFontFamily,
    fontSize: 17,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.3,
    transition: 'filter 150ms, transform 100ms',
  },
  footerText: {
    marginTop: 22,
    textAlign: 'center',
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  backBtn: {
    position: 'fixed' as const,
    top: 18,
    left: 22,
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: bodyFontFamily,
    fontSize: 14,
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: 8,
  },
  link: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: bodyFontFamily,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  },
};
