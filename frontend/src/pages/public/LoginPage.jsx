import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  Lock,
  Mail,
  User as UserIcon,
  AtSign,
  ArrowRight,
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';

const LoginPage = () => {
  const { login, register, isAuthenticated, isEditor, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState(''); // Holds username or email in login mode
  const [username, setUsername] = useState(''); // Dedicated username in register mode
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Extract redirect query parameter
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/admin';

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isEditor) {
        navigate(redirectPath, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isEditor, loading, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        const userRole = res.user?.role;
        if (['admin', 'editor'].includes(userRole)) {
          navigate(redirectPath, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        const res = await register(name, username, email, password);
        if (res?.pendingApproval) {
          setMode('login');
          setNotice(res.message || 'Your registration request has been submitted and is pending administrator approval.');
          setPassword('');
          return;
        }
        const userRole = res.user?.role;
        if (['admin', 'editor'].includes(userRole)) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg-main)'
      }}
    >
      <div
        className="cms-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'var(--accent-gradient)',
              margin: '0 auto 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px var(--primary-glow)'
            }}
          >
            <Compass size={28} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {mode === 'login' ? 'Admin / User Sign In' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            {mode === 'login'
              ? 'Access CMS management, videos, posts, and settings'
              : 'Register your account to manage portal content'}
          </p>
        </div>

        {/* Notice Alert */}
        {notice && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              marginBottom: '20px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              lineHeight: 1.4
            }}
          >
            <Clock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{notice}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '20px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <AtSign
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                    autoComplete="username"
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Used for sign in. Letters, numbers, hyphens, dots & underscores only.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'login' && (
            <div className="form-group">
              <label className="form-label">Username or Email Address</label>
              <div style={{ position: 'relative' }}>
                <UserIcon
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  required
                  placeholder="Enter username or email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  autoComplete="username"
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: mode === 'login' ? '18px' : '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              {mode === 'login' && (
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: '12px',
                    color: '#38bdf8',
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="button button-primary"
            style={{ width: '100%', padding: '11px', fontSize: '14.5px' }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="spin" /> Authenticating...
              </>
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Mode Switch & Home Link */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>

          <Link to="/" style={{ color: 'var(--text-secondary)' }}>
            Return to site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
