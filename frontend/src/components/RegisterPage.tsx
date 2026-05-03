import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { bodyFontFamily, headingFontFamily } from '../theme/typography';

type Props = {
  onGoToLogin: () => void;
  onGoToLanding?: () => void;
};

export default function RegisterPage({ onGoToLogin, onGoToLanding }: Props) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, username, password);
      // register auto-logs in → AuthContext update → App shows dashboard
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

        <h1 style={s.heading}>Join the grove</h1>
        <p style={s.sub}>Create your account to track scores and climb the leaderboards</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={s.input}
              placeholder="WindWalker"
              autoComplete="username"
              minLength={2}
              maxLength={30}
              required
            />
          </label>

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
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
          </label>

          <label style={s.label}>
            Confirm password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={s.input}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </label>

          {error && <p style={s.error}>{error}</p>}

          <button
            type="submit"
            style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={s.footerText}>
          Already have an account?{' '}
          <button style={s.link} onClick={onGoToLogin}>
            Sign in
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
      radial-gradient(circle at 20% 80%, rgba(173,193,120,0.3), transparent 40%),
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
    padding: '36px 40px 30px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
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
    fontSize: 28,
    color: '#3d2e23',
    lineHeight: 1.1,
  },
  sub: {
    margin: '0 0 22px',
    fontSize: 14,
    color: '#7a5f4e',
    lineHeight: 1.4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    fontSize: 13,
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
    background: '#ADC178',
    color: '#2e3d10',
    fontFamily: bodyFontFamily,
    fontSize: 17,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.3,
  },
  footerText: {
    marginTop: 20,
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
