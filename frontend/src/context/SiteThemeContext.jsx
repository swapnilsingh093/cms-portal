import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Exact Background Presets from working Gallery implementation
export const GALLERY_BG_PRESETS = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Dark',
    bg: '#0b0f17',
    surface: '#111827',
    surfaceHover: '#182238',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Teal',
    bg: '#051412',
    surface: '#09221f',
    surfaceHover: '#0f3631',
    text: '#f0fdf4',
    textMuted: '#86efac',
    border: 'rgba(16, 185, 129, 0.2)',
    shadow: '0 10px 30px rgba(5, 20, 18, 0.6)',
  },
  abyss: {
    id: 'abyss',
    name: 'Pitch Midnight',
    bg: '#020408',
    surface: '#080d16',
    surfaceHover: '#101827',
    text: '#ffffff',
    textMuted: '#64748b',
    border: 'rgba(255, 255, 255, 0.06)',
    shadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
  },
  studio: {
    id: 'studio',
    name: 'Dark Studio',
    bg: '#141210',
    surface: '#1c1917',
    surfaceHover: '#292524',
    text: '#fafaf9',
    textMuted: '#a8a29e',
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
  },
  light: {
    id: 'light',
    name: 'Museum White',
    bg: '#f8fafc',
    surface: '#ffffff',
    surfaceHover: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    border: 'rgba(15, 23, 42, 0.12)',
    shadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
  },
};

// Exact Accent Presets from working Gallery implementation (+ default blue)
export const GALLERY_ACCENTS = {
  blue: {
    id: 'blue',
    name: 'Default Sapphire',
    color: '#3b82f6',
    hover: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.45)',
    textOnAccent: '#ffffff',
  },
  emerald: {
    id: 'emerald',
    name: 'Jade Emerald',
    color: '#10b981',
    hover: '#059669',
    glow: 'rgba(16, 185, 129, 0.45)',
    textOnAccent: '#ffffff',
  },
  cyan: {
    id: 'cyan',
    name: 'Electric Cyan',
    color: '#06b6d4',
    hover: '#0891b2',
    glow: 'rgba(6, 182, 212, 0.45)',
    textOnAccent: '#ffffff',
  },
  amber: {
    id: 'amber',
    name: 'Luminous Amber',
    color: '#f59e0b',
    hover: '#d97706',
    glow: 'rgba(245, 158, 11, 0.45)',
    textOnAccent: '#090d14',
  },
  rose: {
    id: 'rose',
    name: 'Velvet Rose',
    color: '#f43f5e',
    hover: '#e11d48',
    glow: 'rgba(244, 63, 94, 0.45)',
    textOnAccent: '#ffffff',
  },
  violet: {
    id: 'violet',
    name: 'Neon Violet',
    color: '#8b5cf6',
    hover: '#7c3aed',
    glow: 'rgba(139, 92, 246, 0.45)',
    textOnAccent: '#ffffff',
  },
};

const THEME_CSS_PROPERTIES = [
  '--primary-color',
  '--primary-hover',
  '--primary-active',
  '--primary-glow',
  '--primary-subtle',
  '--accent-gradient',
  '--g-accent',
  '--g-accent-hover',
  '--g-accent-glow',
  '--g-accent-text',
  '--bg-main',
  '--bg-surface',
  '--bg-card',
  '--bg-card-hover',
  '--border-color',
  '--text-primary',
  '--text-secondary',
  '--g-bg',
  '--g-surface',
  '--g-surface-hover',
  '--g-border',
  '--g-shadow',
  '--g-text',
  '--g-text-muted',
];

const SiteThemeContext = createContext();

export const SiteThemeProvider = ({ children }) => {
  // CRITICAL REQUIREMENT: NO theme colour active by default!
  // Only active when the user explicitly selected one.
  const [isThemeActive, setIsThemeActive] = useState(() => {
    try {
      return localStorage.getItem('cms_custom_theme_active') === 'true';
    } catch {
      return false;
    }
  });

  const [bgTheme, setBgThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('gallery_bg_theme');
      return saved && GALLERY_BG_PRESETS[saved] ? saved : 'obsidian';
    } catch {
      return 'obsidian';
    }
  });

  const [accent, setAccentState] = useState(() => {
    try {
      const saved = localStorage.getItem('gallery_accent_theme');
      return saved && GALLERY_ACCENTS[saved] ? saved : 'emerald';
    } catch {
      return 'emerald';
    }
  });

  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();

  // Set Background with auto-activation
  const setBgTheme = (newBgId) => {
    if (!GALLERY_BG_PRESETS[newBgId]) return;
    setBgThemeState(newBgId);
    setIsThemeActive(true);
    try {
      localStorage.setItem('gallery_bg_theme', newBgId);
      localStorage.setItem('cms_custom_theme_active', 'true');
    } catch {}
  };

  // Set Accent with auto-activation
  const setAccent = (newAccentId) => {
    if (!GALLERY_ACCENTS[newAccentId]) return;
    setAccentState(newAccentId);
    setIsThemeActive(true);
    try {
      localStorage.setItem('gallery_accent_theme', newAccentId);
      localStorage.setItem('cms_custom_theme_active', 'true');
    } catch {}
  };

  // Reset to default - completely removes custom styling
  const resetToDefault = () => {
    setIsThemeActive(false);
    try {
      localStorage.removeItem('cms_custom_theme_active');
      localStorage.removeItem('gallery_bg_theme');
      localStorage.removeItem('gallery_accent_theme');
    } catch {}

    const style = document.documentElement.style;
    THEME_CSS_PROPERTIES.forEach((prop) => style.removeProperty(prop));
  };

  const currentBg = GALLERY_BG_PRESETS[bgTheme] || GALLERY_BG_PRESETS.obsidian;
  const currentAccent = GALLERY_ACCENTS[accent] || GALLERY_ACCENTS.emerald;

  // Global CSS variables injection effect
  useEffect(() => {
    const style = document.documentElement.style;

    const isAdmin = location.pathname.startsWith('/admin');
    if (!isThemeActive || isAdmin) {
      // Clean up all injected variables so default index.css reigns supreme!
      THEME_CSS_PROPERTIES.forEach((prop) => style.removeProperty(prop));
      return;
    }

    // Apply Accent Variables Globally
    style.setProperty('--primary-color', currentAccent.color);
    style.setProperty('--primary-hover', currentAccent.hover);
    style.setProperty('--primary-active', currentAccent.hover);
    style.setProperty('--primary-glow', currentAccent.glow);
    style.setProperty('--primary-subtle', currentAccent.glow.replace(/[\d.]+\)$/, '0.15)'));
    style.setProperty(
      '--accent-gradient',
      `linear-gradient(135deg, ${currentAccent.color}, ${currentAccent.hover})`
    );

    style.setProperty('--g-accent', currentAccent.color);
    style.setProperty('--g-accent-hover', currentAccent.hover);
    style.setProperty('--g-accent-glow', currentAccent.glow);
    style.setProperty('--g-accent-text', currentAccent.textOnAccent);

    // Apply Background & Surface Variables Globally
    if (currentBg) {
      style.setProperty('--bg-main', currentBg.bg);
      style.setProperty('--bg-surface', currentBg.surface);
      style.setProperty('--bg-card', currentBg.surface);
      style.setProperty('--bg-card-hover', currentBg.surfaceHover);
      style.setProperty('--border-color', currentBg.border);
      style.setProperty('--text-primary', currentBg.text);
      style.setProperty('--text-secondary', currentBg.textMuted);

      style.setProperty('--g-bg', currentBg.bg);
      style.setProperty('--g-surface', currentBg.surface);
      style.setProperty('--g-surface-hover', currentBg.surfaceHover);
      style.setProperty('--g-border', currentBg.border);
      style.setProperty('--g-shadow', currentBg.shadow);
      style.setProperty('--g-text', currentBg.text);
      style.setProperty('--g-text-muted', currentBg.textMuted);
    }
  }, [isThemeActive, bgTheme, accent, currentBg, currentAccent, location.pathname]);

  // Context value exposed to all components
  const value = {
    isThemeActive,
    bgTheme,
    setBgTheme,
    accent,
    setAccent,
    currentBg,
    currentAccent,
    resetToDefault,
    paletteOpen,
    setPaletteOpen,
    themeVars: isThemeActive
      ? {
          '--g-bg': currentBg.bg,
          '--g-surface': currentBg.surface,
          '--g-surface-hover': currentBg.surfaceHover,
          '--g-text': currentBg.text,
          '--g-text-muted': currentBg.textMuted,
          '--g-border': currentBg.border,
          '--g-shadow': currentBg.shadow,
          '--g-accent': currentAccent.color,
          '--g-accent-hover': currentAccent.hover,
          '--g-accent-glow': currentAccent.glow,
          '--g-accent-text': currentAccent.textOnAccent,
        }
      : {},
  };

  return <SiteThemeContext.Provider value={value}>{children}</SiteThemeContext.Provider>;
};

export const useSiteTheme = () => {
  const context = useContext(SiteThemeContext);
  if (!context) {
    return {
      isThemeActive: false,
      bgTheme: 'obsidian',
      setBgTheme: () => {},
      accent: 'emerald',
      setAccent: () => {},
      currentBg: GALLERY_BG_PRESETS.obsidian,
      currentAccent: GALLERY_ACCENTS.emerald,
      resetToDefault: () => {},
      paletteOpen: false,
      setPaletteOpen: () => {},
      themeVars: {},
    };
  }
  return context;
};
