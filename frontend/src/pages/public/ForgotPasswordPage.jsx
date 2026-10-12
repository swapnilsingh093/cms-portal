import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink
} from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [devToken, setDevToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setDevToken(null);
    setSubmitting(true);

    try {
      const res = await authAPI.forgotPassword(email);
      setSuccessMessage(
        res.data?.message || 'If an account exists with this email, a password reset link has been dispatched.'
      );
      if (res.data?.devPreviewToken) {
        setDevToken(res.data.devPreviewToken);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to submit password reset request'
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
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)'
            }}
          >
            <KeyRound size={26} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary, #ffffff)', marginBottom: '8px' }}>
            Forgot Password?
          </h2>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>
            Enter your email and we'll send you instructions with a secure link to reset your password.
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

        {/* Success Alert */}
        {successMessage ? (
          <div>
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                marginBottom: '24px',
                fontSize: '13.5px',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#6ee7b7' }}>Email Dispatched</strong>
                {successMessage}
              </div>
            </div>

            {devToken && (
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
                  DEVELOPMENT DIRECT LINK:
                </div>
                <Link
                  to={`/reset-password/${devToken}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    color: '#38bdf8',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Click to open Password Reset Form <ExternalLink size={13} />
                </Link>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link
                to="/login"
                className="button button-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          /* Request Form */
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '22px' }}>
              <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', marginBottom: '8px' }}>
                Your Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
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
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  <Loader2 size={16} className="spin" /> Sending Link...
                </>
              ) : (
                <>
                  Send Reset Link <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Back Link */}
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
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
