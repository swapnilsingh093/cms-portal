import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to reset password. The link may have expired.'
      );
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
        backgroundColor: 'var(--bg-main, #0b1120)'
      }}
    >
      <div
        className="cms-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.5))',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-card, #131d31)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary, #ffffff)', marginBottom: '8px' }}>
            Set New Password
          </h2>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>
            Choose a strong password with at least 6 characters for your account.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '20px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div>
            <div
              style={{
                padding: '18px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                marginBottom: '24px',
                fontSize: '14px',
                lineHeight: 1.6,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <CheckCircle2 size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#6ee7b7' }}>Password Changed!</strong>
                Your password has been successfully updated. You can now use your new credentials to sign in.
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link
                to="/login"
                className="button button-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px',
                  fontSize: '14.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                Sign In With New Password <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '8px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #64748b)'
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '40px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted, #94a3b8)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '8px' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #64748b)'
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="button button-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '14.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin" /> Updating Password...
                </>
              ) : (
                <>
                  Save New Password <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px'
          }}
        >
          <Link
            to="/login"
            style={{
              color: 'var(--text-secondary, #94a3b8)',
              textDecoration: 'none'
            }}
          >
            Remember your password? <span style={{ color: '#38bdf8', fontWeight: 600 }}>Sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
