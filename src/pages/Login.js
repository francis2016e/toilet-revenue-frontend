import { useState, useEffect } from 'react';
import { useAuth }  from '../context/AuthContext';
import EnuguLogo    from '../assets/logo.png';

export default function Login({ onClose }) {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // Prevent background page from scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Close modal when clicking the dark overlay background
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.card}>

        {/* Close button */}
        <button style={styles.closeBtn} onClick={onClose}>✕</button>

        {/* Logo */}
        <div style={styles.logoWrapper}>
          <img src={EnuguLogo} alt="Logo" style={styles.logo} />
        </div>

        <h2 style={styles.title}>Admin Login</h2>
        <p style={styles.subtitle}>
          Sign in with your admin credentials to access the dashboard
        </p>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          Only administrators can log in here.
        </p>

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position:       'fixed',
    top:            0,
    left:           0,
    right:          0,
    bottom:         0,
    background:     'rgba(0,0,0,0.75)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         99999,
    padding:        '24px'
  },
  card: {
    background:    '#fff',
    borderRadius:  '16px',
    padding:       '40px 36px',
    width:         '100%',
    maxWidth:      '420px',
    boxShadow:     '0 20px 60px rgba(0,0,0,0.4)',
    position:      'relative',
    zIndex:        100000
  },
  closeBtn: {
    position:       'absolute',
    top:            '16px',
    right:          '16px',
    background:     '#f3f4f6',
    border:         'none',
    borderRadius:   '50%',
    width:          '32px',
    height:         '32px',
    cursor:         'pointer',
    fontSize:       '0.9rem',
    fontWeight:     700,
    color:          '#4b5563',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center'
  },
  logoWrapper: {
    display:        'flex',
    justifyContent: 'center',
    marginBottom:   '16px'
  },
  logo: {
    width:           '70px',
    height:          '70px',
    borderRadius:    '50%',
    objectFit:       'contain',
    backgroundColor: '#f0f4f1',
    padding:         '6px'
  },
  title: {
    textAlign:    'center',
    fontSize:     '1.2rem',
    fontWeight:   700,
    color:        '#0f5233',
    marginBottom: '6px'
  },
  subtitle: {
    textAlign:    'center',
    fontSize:     '0.82rem',
    color:        '#9ca3af',
    marginBottom: '20px',
    lineHeight:   '1.5'
  },
  footer: {
    textAlign:  'center',
    fontSize:   '0.78rem',
    color:      '#9ca3af',
    marginTop:  '16px'
  }
};