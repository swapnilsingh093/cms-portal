import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Image as ImageIcon,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const HeroSlider = ({
  slides = [],
  enabled = true,
  height = '90vh',
  titleFontSize = '3rem',
  alignment = 'left'
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const totalSlides = slides.length;

  useEffect(() => {
    if (!enabled || totalSlides <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);

    return () => clearInterval(interval);
  }, [enabled, totalSlides, isPaused]);

  if (!enabled || totalSlides === 0) return null;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextSlide();
    } else if (touchStartX.current - touchEndX.current < -50) {
      prevSlide();
    }
  };

  const slide = slides[currentSlide] || slides[0];

  const getBadgeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Play size={13} fill="currentColor" />;
      case 'gallery':
        return <ImageIcon size={13} />;
      case 'post':
      default:
        return <BookOpen size={13} />;
    }
  };

  const getBadgeLabel = (type) => {
    switch (type) {
      case 'video':
        return 'Featured Video';
      case 'gallery':
        return 'Photo Album';
      case 'post':
      default:
        return 'Featured Story';
    }
  };

  // Determine dynamic slider height & font size
  const sliderHeight = height || '90vh';
  const effectiveFontSize = titleFontSize || '3rem';

  // Dynamic layout alignment: left, center, right
  const isCenter = alignment === 'center';
  const isRight = alignment === 'right';

  const textAlign = isCenter ? 'center' : isRight ? 'right' : 'left';
  const contentAlign = isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start';
  const marginStyle = isCenter ? '0 auto' : isRight ? '0 0 0 auto' : '0 auto 0 0';

  // Dynamic gradient based on text alignment
  const getGradientOverlay = () => {
    if (isCenter) {
      return 'linear-gradient(0deg, rgba(8, 11, 20, 0.75) 0%, rgba(8, 11, 20, 0.3) 50%, rgba(8, 11, 20, 0.5) 100%)';
    }
    if (isRight) {
      return 'linear-gradient(270deg, rgba(8, 11, 20, 0.78) 0%, rgba(8, 11, 20, 0.35) 45%, rgba(8, 11, 20, 0.05) 80%, transparent 100%)';
    }
    return 'linear-gradient(90deg, rgba(8, 11, 20, 0.78) 0%, rgba(8, 11, 20, 0.35) 45%, rgba(8, 11, 20, 0.05) 80%, transparent 100%)';
  };

  return (
    <section
      className="hero-slider-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        height: sliderHeight,
        minHeight: '520px',
        overflow: 'hidden',
        background: '#090d16',
        borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        marginBottom: '56px',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {/* Background Slides Container */}
      {slides.map((item, index) => {
        const isActive = index === currentSlide;
        const bgImage = item.image || 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1600&q=80';

        return (
          <div
            key={item.id || index}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'scale(1)' : 'scale(1.03)',
              transition: 'opacity 0.8s ease-in-out, transform 1.2s ease-out',
              pointerEvents: isActive ? 'auto' : 'none',
              zIndex: isActive ? 1 : 0
            }}
          >
            {/* Background Image - Bright, Vivid, Not heavily darkened */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${bgImage}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.96)'
              }}
            />

            {/* Soft, Transparent Vignette Gradient adapted to text alignment */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: getGradientOverlay()
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(0deg, rgba(8, 11, 20, 0.5) 0%, transparent 40%)'
              }}
            />
          </div>
        );
      })}

      {/* Active Slide Foreground Content (Aligned with 1400px Grid) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: contentAlign
        }}
      >
        <div
          style={{
            maxWidth: '820px',
            width: '100%',
            textAlign: textAlign,
            margin: marginStyle,
            display: 'flex',
            flexDirection: 'column',
            alignItems: contentAlign
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 16px',
              borderRadius: 'var(--radius-full, 9999px)',
              background: 'rgba(99, 102, 241, 0.3)',
              border: '1px solid rgba(129, 140, 248, 0.5)',
              color: '#c7d2fe',
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '20px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              alignSelf: contentAlign
            }}
          >
            {getBadgeIcon(slide.type)}
            <span>{getBadgeLabel(slide.type)}</span>
          </div>

          {/* Title with customizable font size (default 3rem) */}
          <h1
            style={{
              fontSize: `clamp(2rem, 4.5vw, ${effectiveFontSize})`,
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#ffffff',
              marginBottom: '18px',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 16px rgba(0, 0, 0, 0.85), 0 4px 30px rgba(0, 0, 0, 0.9)',
              width: '100%'
            }}
          >
            {slide.title}
          </h1>

          {/* Description */}
          {slide.description && (
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                lineHeight: 1.6,
                marginBottom: '32px',
                maxWidth: '680px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
              }}
            >
              {slide.description}
            </p>
          )}

          {/* Action Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              justifyContent: isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start',
              width: '100%'
            }}
          >
            <button
              onClick={() => {
                const targetUrl = slide.url || "/";
                if (!isAuthenticated && targetUrl !== "/") {
                  openAuthModal("login", `Sign in or register to access ${slide.title || "this content"}`, targetUrl);
                  return;
                }
                navigate(targetUrl);
              }}
              className="btn-primary"
              style={{
                padding: '14px 34px',
                fontSize: '1.05rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-full, 9999px)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.5)'
              }}
            >
              <span>{slide.buttonText || 'Discover More'}</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            style={{
              position: 'absolute',
              left: '28px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
            }}
          >
            <ChevronLeft size={24} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            style={{
              position: 'absolute',
              right: '28px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
            }}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Slide Indicators / Dots */}
      {totalSlides > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            right: isRight ? 'auto' : '48px',
            left: isRight ? '48px' : 'auto',
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full, 9999px)',
            background: 'rgba(10, 15, 25, 0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              style={{
                width: idx === currentSlide ? '28px' : '9px',
                height: '9px',
                borderRadius: '5px',
                background: idx === currentSlide ? '#6366f1' : 'rgba(255, 255, 255, 0.35)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSlider;
