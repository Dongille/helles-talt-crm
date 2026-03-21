import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate   = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) {
      setError('Fel e-post eller lösenord.');
    } else {
      navigate('/', { replace: true });
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f7f8f6',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #e8e8e8',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        padding: '40px 36px',
        width: '100%',
        maxWidth: 380,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: '#f5f5f5', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img
              src="/logo.webp"
              alt="Helles Tält"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        <h1 style={{
          textAlign: 'center', fontSize: 22, fontWeight: 700,
          color: '#1a1a1a', margin: '0 0 4px',
        }}>
          Helles Tält AB
        </h1>
        <p style={{
          textAlign: 'center', fontSize: 13, color: '#888',
          margin: '0 0 28px',
        }}>
          Logga in på bokningssystemet
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>
              E-post
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="din@email.com"
              style={{
                width: '100%', padding: '10px 12px', fontSize: 14,
                border: '1px solid #e0e0e0', borderRadius: 8,
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2d7a3a')}
              onBlur={e  => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>
              Lösenord
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 12px', fontSize: 14,
                border: '1px solid #e0e0e0', borderRadius: 8,
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2d7a3a')}
              onBlur={e  => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>

          {error && (
            <p style={{
              margin: 0, fontSize: 13, color: '#ef4444',
              background: '#fff5f5', border: '1px solid #fecaca',
              borderRadius: 8, padding: '8px 12px',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: '11px 0',
              background: loading ? '#a0c4a8' : '#2d7a3a',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>
      </div>
    </div>
  );
}
