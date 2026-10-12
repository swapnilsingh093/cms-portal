import { useState, useEffect } from 'react';
import { themeAPI } from '../services/api';

/**
 * Central Theme & Site Settings Helper
 * Applies theme colors directly to root CSS custom properties,
 * manages document title, and synchronizes site settings across all components.
 */

export const hexToRgba = (hex, alpha = 0.15) => {
  if (!hex || typeof hex !== 'string') return `rgba(59, 130, 246, ${alpha})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return `rgba(59, 130, 246, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const applyTheme = (settings) => {
  if (!settings) return;
  const root = document.documentElement;

  const primary = settings.primaryColor || "var(--g-accent, #3b82f6)";
  const secondary = settings.secondaryColor || "var(--g-accent, #10b981)";
  const accent = settings.accentColor || "var(--g-accent, #6366f1)";
  const background = settings.backgroundColor || "#0a0d14";
  const textColor = settings.textColor || "#e2e8f0";
  const headingColor = settings.headingColor || "#ffffff";
  const linkColor = settings.linkColor || primary;
  const headerBg = settings.headerBackground || "#0d131f";
  const footerBg = settings.footerBackground || "#090e18";
  const headerTextColor = settings.headerTextColor || "#ffffff";
  const footerTextColor = settings.footerTextColor || "#94a3b8";
  const btnBg = settings.buttonBackground || primary;
  const btnText = settings.buttonTextColor || "#ffffff";
  const btnRadius = settings.buttonBorderRadius || "8px";
  const btnStyle = settings.buttonStyle || "solid";
  const headerStyle = settings.headerStyle || "dark";
  const headerHeight = settings.headerHeight || "72px";

  // Standard Theme Variables
  root.style.setProperty("--theme-primary", primary);
  root.style.setProperty("--theme-secondary", secondary);
  root.style.setProperty("--theme-accent", accent);
  root.style.setProperty("--theme-background", background);
  root.style.setProperty("--theme-text", textColor);
  root.style.setProperty("--theme-heading", headingColor);
  root.style.setProperty("--theme-link", linkColor);

  // Header Variables
  root.style.setProperty("--theme-header-bg", headerBg);
  root.style.setProperty("--theme-header-height", headerHeight);
  root.style.setProperty("--theme-header-text", headerTextColor);
  if (headerStyle === "glass") {
    root.style.setProperty("--theme-header-backdrop", "blur(20px)");
    root.style.setProperty("--theme-header-surface", hexToRgba(headerBg, 0.82));
  } else if (headerStyle === "solid") {
    root.style.setProperty("--theme-header-backdrop", "none");
    root.style.setProperty("--theme-header-surface", headerBg);
  } else {
    root.style.setProperty("--theme-header-backdrop", "blur(12px)");
    root.style.setProperty("--theme-header-surface", hexToRgba(headerBg, 0.92));
  }

  // Footer Variables
  root.style.setProperty("--theme-footer-bg", footerBg);
  root.style.setProperty("--theme-footer-text", footerTextColor);
  root.style.setProperty("--theme-footer-style", settings.footerStyle || "standard");

  // Button Variables
  let computedBtnBg = btnBg;
  let computedBtnShadow = `0 2px 8px ${hexToRgba(btnBg, 0.35)}`;
  if (btnStyle === "gradient") {
    computedBtnBg = `linear-gradient(135deg, ${btnBg}, ${accent})`;
  } else if (btnStyle === "glow") {
    computedBtnShadow = `0 0 16px ${hexToRgba(btnBg, 0.55)}`;
  }
  root.style.setProperty("--theme-btn-bg", computedBtnBg);
  root.style.setProperty("--theme-btn-bg-hover", computedBtnBg);
  root.style.setProperty("--theme-btn-text", btnText);
  root.style.setProperty("--theme-btn-radius", btnRadius);
  root.style.setProperty("--theme-btn-shadow", computedBtnShadow);

  // Directly Update Global Frontend CSS Variables
  root.style.setProperty("--bg-main", background);
  root.style.setProperty("--bg-dark", background);
  root.style.setProperty("--text-primary", textColor);
  root.style.setProperty("--text-heading", headingColor);
  root.style.setProperty("--primary-color", primary);
  root.style.setProperty("--primary-hover", linkColor);
  root.style.setProperty("--border-focus", primary);
  root.style.setProperty("--primary-subtle", hexToRgba(primary, 0.14));
  root.style.setProperty("--primary-glow", hexToRgba(primary, 0.35));
  root.style.setProperty("--wp-blue", primary);
  root.style.setProperty("--wp-blue-hover", primary);
  root.style.setProperty("--site-primary", primary);
  root.style.setProperty("--site-accent", accent);
  root.style.setProperty("--radius-md", btnRadius);
  root.style.setProperty("--radius-sm", btnRadius === "9999px" ? "9999px" : "6px");
  root.style.setProperty("--radius-lg", btnRadius === "9999px" ? "9999px" : "14px");
  root.style.setProperty(
    "--accent-gradient",
    `linear-gradient(135deg, ${primary}, ${accent})`
  );

  // Update browser window / tab title
  if (settings.siteTitle) {
    const formattedTitle = settings.tagline
      ? `${settings.siteTitle} - ${settings.tagline}`
      : settings.siteTitle;
    document.title = formattedTitle;
  }

  // Font family if specified
  if (settings.fontFamily && settings.fontFamily !== "system") {
    const fontMap = {
      inter: "'Inter', sans-serif",
      roboto: "'Roboto', sans-serif",
      jakarta: "'Plus Jakarta Sans', sans-serif",
      outfit: "'Outfit', sans-serif"
    };
    if (fontMap[settings.fontFamily]) {
      root.style.setProperty("--font-main", fontMap[settings.fontFamily]);
      document.body.style.fontFamily = fontMap[settings.fontFamily];
    }
  }

  // Persist locally for instant loading and notify listeners
  try {
    const currentStr = localStorage.getItem("cms_theme_settings") || "{}";
    const current = JSON.parse(currentStr);
    const merged = { ...current, ...settings };
    const mergedStr = JSON.stringify(merged);
    localStorage.setItem("cms_theme_settings", mergedStr);
    window.dispatchEvent(new CustomEvent("cms_site_settings_changed", { detail: merged }));
  } catch (e) {
    console.warn("Could not save theme to localStorage:", e);
  }
};

let _fetchThemePromise = null;
const fetchThemeSingleton = () => {
  if (!_fetchThemePromise) {
    _fetchThemePromise = themeAPI.getSettings()
      .then((res) => {
        const data = res.settings || res;
        if (data && typeof data === "object") {
          applyTheme(data);
          return data;
        }
        return null;
      })
      .catch((err) => {
        console.warn("Theme fetch error:", err.message);
        return null;
      })
      .finally(() => {
        // Clear promise after 10s to allow fresh fetch when needed
        setTimeout(() => { _fetchThemePromise = null; }, 10000);
      });
  }
  return _fetchThemePromise;
};

export const initializeTheme = () => {
  try {
    const cached = localStorage.getItem("cms_theme_settings");
    if (cached) {
      applyTheme(JSON.parse(cached));
    }
    fetchThemeSingleton();
  } catch (e) {
    console.warn("Error hydrating theme from cache:", e);
  }
};

/**
 * React hook to reactively consume site title, tagline, and theme settings
 */
export const useSiteSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem("cms_theme_settings");
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    const handleSettingsChange = (e) => {
      if (e && e.detail) {
        setSettings(e.detail);
      }
    };

    window.addEventListener("cms_site_settings_changed", handleSettingsChange);

    fetchThemeSingleton().then((data) => {
      if (data) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    });

    return () => {
      window.removeEventListener("cms_site_settings_changed", handleSettingsChange);
    };
  }, []);

  return {
    siteTitle: settings.siteTitle || "CMS Portal",
    tagline: settings.tagline || "Videos, Galleries & Stories",
    ...settings
  };
};
