import React, { useState } from 'react';
import { autoAdjustImageFocal } from '../../utils/imageFocalHelper';

/**
 * SmartImage
 * Automatically adjusts objectPosition so faces, persons, and key objects
 * are never cut off by objectFit: cover.
 */
const SmartImage = ({
  src,
  alt = '',
  className = '',
  style = {},
  fallback = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
  onLoad,
  onError,
  loading = 'lazy',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (e) => {
    autoAdjustImageFocal(e);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    if (!hasError && fallback && imgSrc !== fallback) {
      setHasError(true);
      setImgSrc(fallback);
    }
    if (onError) onError(e);
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
      className={`smart-cover-img ${className}`.trim()}
      style={{
        objectFit: 'cover',
        objectPosition: 'center 22%', // Smart default (keeps faces & upper body in frame)
        transition: 'transform 0.4s ease, object-position 0.25s ease',
        ...style,
      }}
      {...props}
    />
  );
};

export default SmartImage;
