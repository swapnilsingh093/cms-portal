import React from 'react';
import {
  useSiteTheme,
  GALLERY_BG_PRESETS,
  GALLERY_ACCENTS,
} from './SiteThemeContext';

export const GalleryThemeProvider = ({ children }) => {
  return <>{children}</>;
};

export const useGalleryTheme = () => {
  return useSiteTheme();
};

export { GALLERY_BG_PRESETS, GALLERY_ACCENTS };
