import React, { useState, useRef, useEffect } from 'react';
import { bodyFontFamily, headingFontFamily } from '../theme/typography';

type Props = {
  onClose: () => void;
};

const AccountSetup: React.FC<Props> = ({ onClose }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // trap focus or other accessibility niceties could go here
  }, []);

  const styles: { [k: string]: React.CSSProperties } = {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(6,5,4,0.48)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60,
      padding: 24,
      boxSizing: 'border-box',
    },
    panel: {
      width: 'min(720px, 96vw)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,245,231,0.96))',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      color: '#3F4D26',
      fontFamily: bodyFontFamily,
      display: 'grid',
      gap: 12,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      margin: 0,
      fontFamily: headingFontFamily,
      fontSize: 22,
      color: '#6C584C',
    },
    formRow: {
      display: 'grid',
      gap: 8,
    },
    label: { fontSize: 13, color: '#6B5648', margin: 0 },
    input: { padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(108,88,76,0.18)' },
    avatarWrap: { display: 'flex', gap: 12, alignItems: 'center' },
    avatarPreview: { width: 72, height: 72, borderRadius: 12, background: '#f4efe0', objectFit: 'cover' as const, border: '1px solid rgba(108,88,76,0.18)' },
    actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 },
    btnPrimary: { background: '#ADC178', color: '#1f2b18', padding: '10px 14px', borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer' },
    btnGhost: { background: 'transparent', border: '1px solid rgba(108,88,76,0.18)', padding: '9px 12px', borderRadius: 10, cursor: 'pointer' },
  };

  const onPickAvatar = () => {
    fileRef.current?.click();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSave = () => {
    // For now, this is a local-only mock. In a real app we'd POST to the backend.
    console.log('Account save', { displayName, email, password, avatarUrl });
    onClose();
  };

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true">
      <div style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>Account Setup</h3>
          <button onClick={onClose} style={styles.btnGhost} aria-label="Close account setup">
            Close
          </button>
        </div>

        <div style={styles.formRow}>
          <div>
            <p style={styles.label}>Display name</p>
            <input style={styles.input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How should we call you?" />
          </div>

          <div>
            <p style={styles.label}>Email</p>
            <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.example" />
          </div>

          <div>
            <p style={styles.label}>Password (optional)</p>
            <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" />
          </div>

          <div style={styles.avatarWrap}>
            <div>
              <p style={styles.label}>Avatar</p>
              {avatarUrl ? (
                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                <img src={avatarUrl} alt="avatar preview" style={styles.avatarPreview} />
              ) : (
                <div style={{ ...styles.avatarPreview, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B5648' }}>No avatar</div>
              )}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
              <button type="button" onClick={onPickAvatar} style={styles.btnGhost}>Upload</button>
              <button type="button" onClick={() => setAvatarUrl(null)} style={styles.btnGhost}>Remove</button>
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={onClose} style={styles.btnGhost}>Cancel</button>
          <button onClick={handleSave} style={styles.btnPrimary}>Save account</button>
        </div>
      </div>
    </div>
  );
};

export default AccountSetup;
