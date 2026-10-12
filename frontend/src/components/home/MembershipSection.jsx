import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

const MembershipSection = ({ config = {} }) => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  // Do not display "Join Our Community" membership section if user or superadmin is logged in
  if (isAuthenticated) return null;

  if (config.enabled === false) return null;

  const heading = config.heading || 'Unlock Unlimited Access to Exclusive Media';
  const subheading = config.subheading || 'Join Our Community';
  const content =
    config.content ||
    'Get unlimited access to high-definition video streams, full-resolution photo albums, and deep folklore stories. Support our independent creators and join our exclusive community today.';
  const buttonText = config.buttonText || 'Join Today';
  const buttonUrl = config.buttonUrl || '/page/about-us';
  const image =
    config.image ||
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80';

  const handleAction = () => {
    if (!isAuthenticated) {
      openAuthModal("register", "Create a free account to unlock unlimited access to exclusive media", buttonUrl);
      return;
    }
    if (buttonUrl.startsWith('http://') || buttonUrl.startsWith('https://')) {
      window.open(buttonUrl, '_blank', 'noreferrer');
    } else {
      navigate(buttonUrl);
    }
  };

  return (
    <section
      className="membership-banner-section"
      style={{
        marginBottom: '64px',
        position: 'relative',
        borderRadius: 'var(--radius-lg, 18px)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0e1526 0%, #151d38 50%, #0d1222 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15)'
      }}
    >
      <div
        className="membership-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'center'
        }}
      >
        {/* Left Column: Content */}
        <div style={{ padding: 'clamp(32px, 5vw, 56px)' }}>
          {subheading && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full, 9999px)',
                background: 'rgba(99, 102, 241, 0.18)',
                color: '#818cf8',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '16px'
              }}
            >
              <Sparkles size={14} /> {subheading}
            </div>
          )}

          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              lineHeight: 1.2,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '18px'
            }}
          >
            {heading}
          </h2>

          <p
            style={{
              color: 'var(--text-muted, #94a3b8)',
              fontSize: '1rem',
              lineHeight: 1.65,
              marginBottom: '32px',
              maxWidth: '520px'
            }}
          >
            {content}
          </p>

          <button
            onClick={handleAction}
            className="btn-primary"
            style={{
              padding: '14px 32px',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-full, 9999px)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)'
            }}
          >
            <span>{buttonText}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Right Column: Promotional Image */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '340px',
            overflow: 'hidden'
          }}
        >
          <img
            src={image}
            alt={heading}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
          {/* Blend Gradient */}
          <div
            className="membership-image-blend"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, #0e1526 0%, rgba(14, 21, 38, 0.4) 30%, transparent 100%)'
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default MembershipSection;
