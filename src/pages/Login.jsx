import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const contentType = res.headers.get('content-type');

      // API mevcut ve JSON dönüyorsa
      if (res.ok && contentType?.includes('application/json')) {
        const data = await res.json();
        const authData = {
          user: data.user || {
            username: username,
            name: data.name || username,
            role: data.role || 'user'
          },
          token: data.token,
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('auth', JSON.stringify(authData));
        onLogin(authData);
        navigate('/');
        return;
      }

      // API yoksa veya hata varsa - local login fallback
      if (username === 'admin' && password === 'admin') {
        const authData = {
          user: { username: 'admin', name: 'Admin', role: 'admin' },
          token: 'local-token-' + Date.now(),
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('auth', JSON.stringify(authData));
        onLogin(authData);
        navigate('/');
        return;
      }

      throw new Error('Kullanıcı adı veya şifre hatalı!');

    } catch (err) {
      // Fallback login for admin/admin
      if (username === 'admin' && password === 'admin') {
        const authData = {
          user: { username: 'admin', name: 'Admin', role: 'admin' },
          token: 'local-token-' + Date.now(),
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('auth', JSON.stringify(authData));
        onLogin(authData);
        navigate('/');
        return;
      }
      setError(err.message || 'Kullanıcı adı veya şifre hatalı!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-icon">
                <Flame size={32} />
              </div>
              <h1>Integral Bina Yazılım</h1>
            </div>
            <p className="login-subtitle">Enerji Yönetim Sistemi</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username">Kullanıcı Adı</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adınızı girin"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Şifre</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifrenizi girin"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`login-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="button-spinner"></div>
                  <span>Giriş yapılıyor...</span>
                </>
              ) : (
                <span>Giriş Yap</span>
              )}
            </button>
          </form>

          <div className="login-footer">
            <a href="https://cemal.online" target="_blank" rel="noopener noreferrer" className="footer-link">
              cemal.online
            </a>
          </div>
        </div>

        <div className="login-features">
          <div className="feature-item">
            <div className="feature-icon heat">
              <Flame size={20} />
            </div>
            <div className="feature-text">
              <h4>Isı Sayacı Takibi</h4>
              <p>Ultrasonik ısı sayaçlarını anlık izleyin</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon temp">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
              </svg>
            </div>
            <div className="feature-text">
              <h4>Sıcaklık İzleme</h4>
              <p>Giriş/çıkış sıcaklıkları ve ΔT</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon energy">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div className="feature-text">
              <h4>Enerji Analizi</h4>
              <p>Detaylı tüketim raporları ve AI tahminler</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
