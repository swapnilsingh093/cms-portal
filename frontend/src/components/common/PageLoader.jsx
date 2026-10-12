import React from 'react';
import { useSiteSettings } from '../../utils/themeHelper';

const PageLoader = ({ 
  text = 'Loading content...', 
  fullscreen = true, 
  minHeight = '60vh',
  accentColor = 'var(--g-accent, #6366f1)' 
}) => {
  const { siteTitle } = useSiteSettings();

  return (
    <div
      style={{
        width: '100%',
        minHeight: fullscreen ? '75vh' : minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        position: 'relative',
        zIndex: 50,
      }}
    >
      <style>{`
        @keyframes orbitSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbitSpinReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes glowBreath {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.55;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.95;
          }
        }
        @keyframes barIndeterminate {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(30%);
          }
          100% {
            transform: translateX(180%);
          }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>

      {/* Floating Center Loader (No Square Box) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Orbital Centerpiece */}
        <div style={{ position: 'relative', width: '56px', height: '56px' }}>
          {/* Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, rgba(56, 189, 248, 0.15) 50%, transparent 75%)',
              animation: 'glowBreath 2.2s ease-in-out infinite',
              filter: 'blur(8px)',
            }}
          />

          {/* Outer Spinning Ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2.5px solid transparent',
              borderTopColor: '#6366f1',
              borderRightColor: '#38bdf8',
              animation: 'orbitSpin 0.9s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite',
            }}
          />

          {/* Inner Counter Ring */}
          <div
            style={{
              position: 'absolute',
              inset: '7px',
              borderRadius: '50%',
              border: '2px solid transparent',
              borderBottomColor: '#a855f7',
              borderLeftColor: '#ec4899',
              animation: 'orbitSpinReverse 1.2s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite',
            }}
          />

          {/* Center Pulsing Spark */}
          <div
            style={{
              position: 'absolute',
              inset: '18px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
              boxShadow: '0 0 14px rgba(99, 102, 241, 0.9)',
              animation: 'pulseDot 1.4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Minimal Progress Bar Line */}
        <div
          style={{
            width: '120px',
            height: '2.5px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '99px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '60%',
              background: 'linear-gradient(90deg, #6366f1, #38bdf8, #a855f7)',
              borderRadius: '99px',
              animation: 'barIndeterminate 1.3s ease-in-out infinite',
            }}
          />
        </div>

        {/* Text Details */}
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <span>{text}</span>
          </div>
          {siteTitle && (
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(148, 163, 184, 0.6)',
                marginTop: '3px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {siteTitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
