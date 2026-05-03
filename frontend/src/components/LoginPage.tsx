import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { bodyFontFamily, headingFontFamily } from '../theme/typography';

type Props = {
  onGoToRegister: () => void;
  onGoToLanding?: () => void;
};

export default function LoginPage({ onGoToRegister, onGoToLanding }: Props) {
  const { login } = useAuth();
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
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {onGoToLanding && (
        <button style={s.backBtn} onClick={onGoToLanding}>← Back to Grove</button>
      )}
      <div style={s.card}>
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
    backgroundImage: `
      radial-gradient(circle at 80% 10%, rgba(173,193,120,0.35), transparent 42%),
      linear-gradient(160deg, #f6f1de 0%, #e5edd0 55%, #d9e6bf 100%)
    `,
    fontFamily: bodyFontFamily,
    padding: 24,
    boxSizing: 'border-box',
  },
  card: {
    width: 'min(440px, 100%)',
    background: 'rgba(255,255,255,0.78)',
    backdropFilter: 'blur(14px)',
    borderRadius: 24,
    border: '1px solid rgba(108,88,76,0.22)',
    boxShadow: '0 20px 52px rgba(58,45,36,0.16)',
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
    color: '#6C584C',
    lineHeight: 1,
  },
  heading: {
    margin: '0 0 6px',
    fontFamily: headingFontFamily,
    fontSize: 30,
    color: '#3d2e23',
    lineHeight: 1.1,
  },
  sub: {
    margin: '0 0 26px',
    fontSize: 15,
    color: '#7a5f4e',
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
    color: '#5a4535',
  },
  input: {
    padding: '11px 14px',
    borderRadius: 10,
    border: '1px solid rgba(108,88,76,0.35)',
    background: 'rgba(253,248,238,0.9)',
    fontSize: 15,
    fontFamily: bodyFontFamily,
    color: '#3d2e23',
    outline: 'none',
    transition: 'border-color 150ms',
  },
  error: {
    margin: 0,
    padding: '10px 14px',
    borderRadius: 8,
    background: 'rgba(220,60,60,0.09)',
    border: '1px solid rgba(220,60,60,0.28)',
    color: '#b02222',
    fontSize: 14,
    lineHeight: 1.4,
  },
  btn: {
    marginTop: 4,
    padding: '13px 0',
    borderRadius: 12,
    border: 'none',
    background: '#A98467',
    color: '#F0EAD2',
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
    color: '#7a5f4e',
  },
  backBtn: {
    position: 'fixed' as const,
    top: 18,
    left: 22,
    background: 'none',
    border: 'none',
    color: '#7a5f4e',
    fontFamily: bodyFontFamily,
    fontSize: 14,
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: 8,
  },
  link: {
    background: 'none',
    border: 'none',
    color: '#6C584C',
    fontFamily: bodyFontFamily,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  },
};
