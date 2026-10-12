import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, ArrowLeft, Compass, Sparkles } from 'lucide-react';

const NotFoundPage = ({
  type = 'general',
  title: customTitle,
  message: customMessage
}) => {
  const navigate = useNavigate();

  const getTitle = () => {
    if (customTitle) return customTitle;
    switch (type) {
      case 'video':
        return 'Video Not Found';
      case 'post':
      case 'story':
        return 'Story Not Found';
      case 'gallery':
        return 'Gallery Not Found';
      default:
        return 'Page Not Found';
    }
  };

  const getMessage = () => {
    if (customMessage) return customMessage;
    switch (type) {
      case 'video':
        return 'The video stream you are looking for has been removed, unpublished, or does not exist.';
      case 'post':
      case 'story':
        return 'The story or article could not be located or may have been deleted.';
      case 'gallery':
        return 'The photo gallery is currently unavailable or has been relocated.';
      default:
        return 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.';
    }
  };

  return (
    <div
      style={{
        minHeight: '78vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(99, 102, 241, 0.12) 0%, rgba(11, 15, 25, 0.98) 70%, #070a12 100%)'
      }}
    >
      {/* Animated Keyframe Styles */}
      <style>{`
        @keyframes floatGlow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.12);
            opacity: 0.9;
          }
        }
        @keyframes textShimmer {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(99, 102, 241, 0.35), 0 0 60px rgba(56, 189, 248, 0.2);
            transform: translateY(0);
          }
          50% {
            box-shadow: 0 0 45px rgba(99, 102, 241, 0.6), 0 0 90px rgba(56, 189, 248, 0.35);
            transform: translateY(-4px);
          }
        }
        @keyframes floatIcon {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-6px) rotate(8deg);
          }
        }
        @keyframes radarRipple {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}</style>

      {/* Ambient Animated Glow Rings */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: '480px',
          height: '480px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(56, 189, 248, 0.1) 40%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(50px)',
          animation: 'floatGlow 6s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Ripple Animation Rings */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          animation: 'radarRipple 4s cubic-bezier(0, 0.2, 0.8, 1) infinite',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          border: '1px solid rgba(56, 189, 248, 0.15)',
          animation: 'radarRipple 4s cubic-bezier(0, 0.2, 0.8, 1) infinite',
          animationDelay: '2s',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main Clean Card Container */}
      <div
        style={{
          maxWidth: '540px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '48px 36px 42px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.08)'
        }}
      >
        {/* Animated Floating Mini Badge Icon */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(56, 189, 248, 0.2) 100%)',
            border: '1px solid rgba(129, 140, 248, 0.35)',
            color: '#a5b4fc',
            marginBottom: '16px',
            animation: 'floatIcon 3.5s ease-in-out infinite'
          }}
        >
          <Compass size={24} color="#818cf8" />
        </div>

        {/* Big Shimmering 404 Text */}
        <div
          style={{
            fontSize: 'clamp(5.5rem, 13vw, 8rem)',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            margin: '0 0 14px',
            background: 'linear-gradient(90deg, #ffffff 0%, #a5b4fc 25%, #6366f1 50%, #38bdf8 75%, #ffffff 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'textShimmer 5s linear infinite',
            textShadow: '0 15px 40px rgba(99, 102, 241, 0.3)',
            userSelect: 'none'
          }}
        >
          404
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 3.5vw, 1.95rem)',
            fontWeight: 800,
            color: '#f8fafc',
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>{getTitle()}</span>
          <Sparkles size={20} color="#818cf8" style={{ opacity: 0.8 }} />
        </h1>

        {/* Clean Message (Simple & not oversized) */}
        <p
          style={{
            fontSize: '0.96rem',
            color: '#94a3b8',
            lineHeight: 1.6,
            maxWidth: '440px',
            margin: '0 auto 34px'
          }}
        >
          {getMessage()}
        </p>

        {/* Sleek Action Buttons (Go Back & Back to Homepage) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate('/');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '42px',
              padding: '0 20px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#cbd5e1';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '42px',
              padding: '0 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #3b82f6 100%)',
              border: '1px solid rgba(129, 140, 248, 0.4)',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(99, 102, 241, 0.45)',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.65)';
              e.currentTarget.style.filter = 'brightness(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 18px rgba(99, 102, 241, 0.45)';
              e.currentTarget.style.filter = 'none';
            }}
          >
            <Home size={16} /> Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
